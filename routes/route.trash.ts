import express from "express";
import { protectRoute } from "../middleware";
import {
  getTrashFiles,
  restoreFile,
  moveToTrash,
  deleteFile,
} from "../handlers/handler.trash";

const trashRouter = express.Router();

trashRouter.get("/", protectRoute, getTrashFiles);

trashRouter.post("/restore/:id", protectRoute, restoreFile);

trashRouter.post("/:id", protectRoute, moveToTrash);

trashRouter.delete("/:id", protectRoute, deleteFile);

export default trashRouter;