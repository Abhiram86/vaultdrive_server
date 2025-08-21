import express from "express";
import { protectRoute } from "../middleware";
import { getTrashFiles, restoreFile } from "../handlers/handler.trash";

const trashRouter = express.Router();

trashRouter.get("/", protectRoute, getTrashFiles);
trashRouter.patch("/:id", protectRoute, restoreFile);

export default trashRouter;
