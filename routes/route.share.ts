import express from "express";
import { protectRoute } from "../middleware";
import {
  getShareLinks,
  getShareLink,
  shareLink,
} from "../handlers/handler.share";

const shareRouter = express.Router();

shareRouter.get("/", protectRoute, getShareLinks);
shareRouter.get("/:id", getShareLink);
shareRouter.post("/:id", protectRoute, shareLink);

export default shareRouter;
