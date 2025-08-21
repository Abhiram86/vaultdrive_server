import express from "express";

const shareRouter = express.Router();

shareRouter.get("/", (_req, res) => {
  res.send("Share");
});

export default shareRouter;
