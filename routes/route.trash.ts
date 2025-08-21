import express from "express";
import { protectRoute } from "../middleware";
import { getTrashFiles } from "../handlers/handler.trash";

const trashRouter = express.Router();

trashRouter.get("/", protectRoute, getTrashFiles);

export default trashRouter;
