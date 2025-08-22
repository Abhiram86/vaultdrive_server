import express from "express";
import {
  login,
  logout,
  refresh,
  register,
  user,
} from "../handlers/handler.auth";

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/refresh", refresh);
authRouter.get("/user", user);
authRouter.post("/logout", logout);

export default authRouter;
