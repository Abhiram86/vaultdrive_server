import type { Request, Response } from "express";
import Starred from "../models/Starred";
import MyFile from "../models/File";
import mongoose from "mongoose";

export async function getStarred(req: Request, res: Response) {
  try {
    const starred = await Starred.find({
      owner: new mongoose.Types.ObjectId((req as any).userId as string),
    }).populate("file");
    return res
      .status(200)
      .json({ data: starred.map((s) => s.file), error: null });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ data: null, error: String(error) });
  }
}

export async function starFile(req: Request, res: Response) {
  try {
    const existing = await MyFile.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ data: null, error: "File not found" });
    }
    const file = await Starred.create({
      owner: new mongoose.Types.ObjectId((req as any).userId as string),
      file: req.params.id,
    });
    return res
      .status(200)
      .json({ data: { message: "File starred successfully" }, error: null });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ data: null, error: String(error) });
  }
}

export async function unStarFile(req: Request, res: Response) {
  try {
    const existing = await Starred.findOneAndDelete({
      owner: new mongoose.Types.ObjectId((req as any).userId as string),
      file: req.params.id,
    });
    if (!existing) {
      return res.status(404).json({ data: null, error: "File not found" });
    }
    return res
      .status(200)
      .json({ data: { message: "File unstarred successfully" }, error: null });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ data: null, error: String(error) });
  }
}
