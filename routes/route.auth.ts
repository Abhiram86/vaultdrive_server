import express from "express";
import { login, refresh, register, user } from "../handlers/handler.auth";

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/refresh", refresh);
authRouter.get("/user", user);

export default authRouter;
