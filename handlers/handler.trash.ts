import mongoose from "mongoose";
import type { Request, Response } from "express";
import MyFile from "../models/File";
import ShareLink from "../models/ShareLink";
import UserShare from "../models/UserShare";
import { bucketId, storage } from "../config/storage";

// Fetches files that are marked as trashed
export async function getTrashFiles(req: Request, res: Response) {
  try {
    const files = await MyFile.find({
      owner: new mongoose.Types.ObjectId((req as any).userId as string),
      isTrashed: true, // Query for files in the trash
    });
    return res.status(200).json({ data: files, error: null });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ data: null, error: error });
  }
}

// Restores a file from the trash
export async function restoreFile(req: Request, res: Response) {
  try {
    const file = await MyFile.findOneAndUpdate(
      { _id: req.params.id, owner: (req as any).userId },
      { $set: { isTrashed: false }, $unset: { trashedAt: 1 } }, // Restore the file
      { new: true }
    );

    if (!file) {
      return res
        .status(404)
        .json({ data: null, error: "File not found in trash" });
    }

    return res
      .status(200)
      .json({ data: { message: "File restored successfully" }, error: null });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ data: null, error: error });
  }
}

// Moves a file to the trash
export const moveToTrash = async (req: Request, res: Response) => {
  try {
    const file = await MyFile.findOneAndUpdate(
      { _id: req.params.id, owner: (req as any).userId },
      { $set: { isTrashed: true, trashedAt: new Date() } }, // Mark as trashed
      { new: true }
    );

    if (!file) {
      return res.status(404).json({ data: null, error: "File not found" });
    }

    return res.status(200).json({
      data: { message: "File moved to trash successfully" },
      error: null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ data: null, error: error });
  }
};

// Permanently deletes a file
export const deleteFile = async (req: Request, res: Response) => {
  try {
    const file = await MyFile.findOneAndDelete({
      _id: req.params.id,
      owner: (req as any).userId,
      isTrashed: true, // Can only delete if already in trash
    });

    if (!file) {
      return res.status(404).json({ data: null, error: "File not found in trash" });
    }

    // Delete from Appwrite storage
    await storage.deleteFile(bucketId, file.appwriteId!);

    // Clean up related sharing documents
    await ShareLink.deleteMany({ file: file._id });
    await UserShare.deleteMany({ file: file._id });

    return res
      .status(200)
      .json({ data: { message: "File deleted successfully" }, error: null });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ data: null, error: error });
  }
};
