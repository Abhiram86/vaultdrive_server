import express from "express";
import { protectRoute } from "../middleware";
import {
  getFile,
  getFiles,
  uploadFile,
  deleteFile,
  moveToTrash,
} from "../handlers/handler.upload";
import multer from "multer";

const uploadRouter = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

uploadRouter.get("/", protectRoute, getFiles);

uploadRouter.get("/:id", protectRoute, getFile);

uploadRouter.post("/", protectRoute, upload.array("files"), uploadFile);

uploadRouter.post("/:id", (_req, res) => {
  res.send("Upload");
});

uploadRouter.delete("/:id", protectRoute, deleteFile);
uploadRouter.delete("/trash/:id", protectRoute, moveToTrash);

export default uploadRouter;
