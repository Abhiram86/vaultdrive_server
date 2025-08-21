import mongoose from "mongoose";
import { z } from "zod";
import MyFile from "../models/File";
import { storage, bucketId } from "../config/storage";
import { InputFile } from "node-appwrite/file";
import type { Request, Response } from "express";
import Trash from "../models/Trash";

export async function getFiles(req: Request, res: Response) {
  try {
    const files = await MyFile.find({
      owner: new mongoose.Types.ObjectId((req as any).userId as string),
      parent: null,
    });
    return res.status(200).json({ data: files, error: null });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ data: null, error: error });
  }
}

export async function getFile(req: Request, res: Response) {
  try {
    const file = await MyFile.findById(req.params.id);
    return res.status(400).json({ data: file, error: null });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ data: null, error: error });
  }
}

export async function uploadFile(req: Request, res: Response) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(404).json({ data: null, error: "No file uploaded" });
    }
    const files = req.files as Express.Multer.File[];

    const docs = files.map(
      (file) =>
        new MyFile({
          name: file.originalname,
          owner: new mongoose.Types.ObjectId((req as any).userId as string),
          parent: null,
          path: file.originalname,
          fileType: "file",
          size: file.size,
          type: file.mimetype,
        })
    );

    const InputFiles = files.map((file) =>
      InputFile.fromBuffer(file.buffer, file.originalname)
    );

    const uploadResults = await Promise.all(
      InputFiles.map((file, i) =>
        storage.createFile(bucketId, String(docs[i]?._id), file)
      )
    );

    uploadResults.forEach(async (result, i) => {
      if (result) {
        docs[i]!.appwriteId = result.$id;
      }
    });

    await MyFile.insertMany(docs);

    return res
      .status(201)
      .json({ data: { message: "File uploaded successfully" }, error: null });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ data: null, error: error });
  }
}

export const deleteFile = async (req: Request, res: Response) => {
  try {
    const file = await MyFile.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ data: null, error: "File not found" });
    }
    await storage.deleteFile(bucketId, file.appwriteId!);
    await MyFile.findByIdAndDelete(file._id);
    return res
      .status(200)
      .json({ data: { message: "File deleted successfully" }, error: null });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ data: null, error: error });
  }
};

export const moveToTrash = async (req: Request, res: Response) => {
  try {
    const file = await MyFile.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ data: null, error: "File not found" });
    }
    const fileObj = file.toObject();
    delete fileObj._id;
    const newTrashFile = new Trash(fileObj);
    await newTrashFile.save();
    await MyFile.findByIdAndDelete(file._id);
    return res.status(200).json({
      data: { message: "File moved to trash successfully" },
      error: null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ data: null, error: error });
  }
};
