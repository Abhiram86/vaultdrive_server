import mongoose from "mongoose";
import ShareLink from "../models/ShareLink";
import UserShare from "../models/UserShare";
import type { Request, Response } from "express";
import User from "../models/User";
import MyFile from "../models/File";
import { decodeShareLinkToken, generateShareLinkToken } from "../utils/jwt";
import { bucketId, storage } from "../config/storage";
import { ImageFormat, ImageGravity } from "node-appwrite";

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
    if (!(req as any).userId) {
      if (!shareLink.isPublic) {
        return res.status(401).json({ data: null, error: "Unauthorized" });
      }
    }
    const user = await User.findById((req as any).userId as string);
    if (!user) {
      return res.status(404).json({ data: null, error: "User not found" });
    }
    if (!shareLink.allowedEmails.includes(user.email) || !shareLink.isPublic) {
      return res.status(401).json({ data: null, error: "Access denied" });
    }

    const previewUrl = await storage.getFilePreview(
      bucketId,
      (shareLink.file as any).appwriteId,
      0,
      0,
      ImageGravity.Center,
      100,
      0,
      "",
      5,
      100,
      0,
      "",
      ImageFormat.Webp
    );

    return res.status(200).json({
      data: {
        id: shareLink._id,
        fileName: (shareLink.file as any).name,
        fileType: (shareLink.file as any).type,
        previewUrl,
      },
      error: null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ data: null, error: "Unauthorized" });
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
