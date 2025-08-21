import express from "express";
import { protectRoute } from "../middleware";
import { getStarred, starFile, unStarFile } from "../handlers/handler.starred";

const starredRouter = express.Router();

starredRouter.get("/", protectRoute, getStarred);
starredRouter.post("/:id", protectRoute, starFile);
starredRouter.delete("/:id", protectRoute, unStarFile);

export default starredRouter;
