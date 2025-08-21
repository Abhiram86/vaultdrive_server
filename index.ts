import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/route.auth";
import { connectDB } from "./config/db";
import uploadRouter from "./routes/route.upload";
import trashRouter from "./routes/route.trash";
import starredRouter from "./routes/route.starred";
import shareRouter from "./routes/route.share";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

connectDB();

app.use((req, _res, next) => {
  console.log(req.method, req.url);
  next();
});

app.use("/auth", authRouter);
app.use("/upload", uploadRouter);
app.use("/starred", starredRouter);
app.use("/share", shareRouter);
app.use("/trash", trashRouter);

app.get("/", (_req, res) => {
  res.send("Hello World!");
});

app.listen(8080, () => {
  console.log("Server listening on http://localhost:8080");
});
