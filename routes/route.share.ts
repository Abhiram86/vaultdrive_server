import express from "express";
import { protectRoute } from "../middleware";
import {
  getShareLinks,
  getShareLink,
  shareLink,
  revokeShareLink,
} from "../handlers/handler.share";

const shareRouter = express.Router();

shareRouter.get("/", protectRoute, getShareLinks);
shareRouter.get("/:id", getShareLink);
shareRouter.post("/:id", protectRoute, shareLink);
shareRouter.delete("/:id", protectRoute, revokeShareLink);

export default shareRouter;
