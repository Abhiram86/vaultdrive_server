import mongoose from "mongoose";
import ShareLink from "../models/ShareLink";
import UserShare from "../models/UserShare";
import type { Request, Response } from "express";
import User from "../models/User";
import MyFile from "../models/File";
import { generateShareLinkToken } from "../utils/jwt";

export async function getShareLinks(req: Request, res: Response) {
  try {
    if (req.query.type === "sent" || req.query.type === undefined) {
      const shareLinks = await ShareLink.find({
        owner: new mongoose.Types.ObjectId((req as any).userId as string),
      }).populate("file");
      return res.status(200).json({ data: shareLinks, error: null });
    } else if (req.query.type === "received") {
      const user = await User.findById((req as any).userId as string);
      if (!user) {
        return res.status(404).json({ data: null, error: "User not found" });
      }
      const shareLinks = await UserShare.find({
        userEmail: user.email,
      }).populate("file");
      return res.status(200).json({ data: shareLinks, error: null });
    }
    return res.status(400).json({ data: null, error: "Invalid type" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ data: null, error: error });
  }
}

export async function getShareLink(req: Request, res: Response) {
  try {
    const shareLink = await ShareLink.findById(req.params.id).populate("file");
    if (!shareLink) {
      return res
        .status(404)
        .json({ data: null, error: "Share link not found" });
    }
    const user = await User.findById((req as any).userId as string);
    if (!user) {
      return res.status(404).json({ data: null, error: "User not found" });
    }
    if (!shareLink.allowedEmails.includes(user.email) || !shareLink.isPublic) {
      return res
        .status(401)
        .json({ data: null, error: "You are not given access" });
    }
    return res.status(200).json({ data: shareLink, error: null });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ data: null, error: error });
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
