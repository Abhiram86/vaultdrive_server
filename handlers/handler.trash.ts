import mongoose from "mongoose";

import Trash from "../models/Trash";
import type { Request, Response } from "express";
import MyFile from "../models/File";

export async function getTrashFiles(req: Request, res: Response) {
  try {
    const files = await Trash.find({
      owner: new mongoose.Types.ObjectId((req as any).userId as string),
    });
    return res.status(200).json({ data: files, error: null });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ data: null, error: error });
  }
}

export async function restoreFile(req: Request, res: Response) {
  try {
    const fileId = req.params.id;
    const userId = (req as any).userId;

    const trashedFile = await Trash.findOneAndDelete({ _id: fileId, owner: userId });

    if (!trashedFile) {
      return res.status(404).json({ data: null, error: "File not found in trash" });
    }

    const { _id, ...fileData } = trashedFile.toObject();

    const restoredFile = new MyFile(fileData);
    await restoredFile.save();

    return res.status(200).json({ data: { message: "File restored successfully" }, error: null });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ data: null, error: error });
  }
}
