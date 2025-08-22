import mongoose from "mongoose";
import ShareLink from "../models/ShareLink";
import UserShare from "../models/UserShare";
import type { Request, Response } from "express";
import User from "../models/User";
import MyFile from "../models/File";
import {
  decodeShareLinkToken,
  generateShareLinkToken,
  verifyAuthToken,
} from "../utils/jwt";
import { bucketId, storage } from "../config/storage";

export async function getShareLinks(req: Request, res: Response) {
  try {
    const userId = new mongoose.Types.ObjectId((req as any).userId as string);
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ data: null, error: "User not found" });
    }

    const shareLinks = await ShareLink.find({
      owner: userId,
    }).populate("file");

    const userShares = await UserShare.find({
      userEmail: user.email,
    }).populate("file");

    return res
      .status(200)
      .json({ data: { shareLinks, userShares }, error: null });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ data: null, error: error });
  }
}

export async function getShareLink(req: Request, res: Response) {
  try {
    const decoded = await decodeShareLinkToken(req.params.id as string);
    const shareLink = await ShareLink.findById(decoded?.shareLinkId).populate(
      "file"
    );

    if (!shareLink) {
      return res
        .status(404)
        .json({ data: null, error: "Share link not found" });
    }

    const previewFile = await storage.getFileView(
      bucketId, // bucketId
      (shareLink.file as any).appwriteId // fileId
    );

    const base64file = Buffer.from(previewFile).toString("base64");

    // ✅ Case 1: Public link → always accessible
    if (shareLink.isPublic) {
      return res.json({
        data: {
          id: shareLink._id,
          fileName: (shareLink.file as any).name,
          fileType: (shareLink.file as any).type,
          previewFile: base64file,
        },
        error: null,
      });
    }

    // ✅ Case 2: Private link → requires authentication
    if (!req.cookies.accessToken) {
      return res.status(401).json({ data: null, error: "Unauthorized" });
    }

    const authToken = await verifyAuthToken(req.cookies.accessToken, "access");
    if (!authToken) {
      return res.status(401).json({ data: null, error: "Unauthorized" });
    }

    const user = await User.findById(authToken.userId);
    if (!user) {
      return res.status(404).json({ data: null, error: "User not found" });
    }

    // Only allow if email is in allowedEmails
    if (!shareLink.allowedEmails.includes(user.email)) {
      return res.status(401).json({ data: null, error: "Access denied" });
    }

    return res.status(200).json({
      data: {
        id: shareLink._id,
        fileName: (shareLink.file as any).name,
        fileType: (shareLink.file as any).type,
        previewFile: base64file,
      },
      error: null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ data: null, error: "Internal server error" });
  }
}

export async function shareLink(req: Request, res: Response) {
  try {
    const file = await MyFile.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ data: null, error: "File not found" });
    }
    const shareLink = new ShareLink({
      owner: new mongoose.Types.ObjectId((req as any).userId as string),
      file: req.params.id,
      isPublic: req.body.isPublic ?? false,
      allowedEmails: req.body.allowedEmails ?? [],
      jwt: null,
    });

    await shareLink.save();
    if (!shareLink._id) {
      return res.status(200).json({ data: shareLink, error: null });
    }
    const token = await generateShareLinkToken(shareLink._id.toString());
    shareLink.jwt = token;
    await shareLink.save();

    if (!shareLink.isPublic) {
      await UserShare.deleteMany({
        file: file._id,
        grantedBy: (req as any).userId as string,
      });
      if (shareLink.allowedEmails.length > 0) {
        const docs = shareLink.allowedEmails.map((email) => ({
          userEmail: email,
          file: file._id,
          grantedBy: new mongoose.Types.ObjectId((req as any).userId as string),
        }));
        await UserShare.insertMany(docs);
      } else {
        await UserShare.deleteMany({
          file: file._id,
          grantedBy: (req as any).userId as string,
        });
      }
    }
    return res.status(200).json({ data: shareLink, error: null });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ data: null, error: error });
  }
}

export async function revokeShareLink(req: Request, res: Response) {
  try {
    const shareLink = await ShareLink.findOne({
      file: req.params.id,
      owner: (req as any).userId as string,
    });
    if (!shareLink) {
      return res
        .status(404)
        .json({ data: null, error: "Share link not found" });
    }
    await ShareLink.findByIdAndDelete(shareLink._id);
    await UserShare.deleteMany({
      file: req.params.id,
      grantedBy: (req as any).userId as string,
    });
    return res.status(200).json({ data: null, error: null });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ data: null, error: String(error) });
  }
}
