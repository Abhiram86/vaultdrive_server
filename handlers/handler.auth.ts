import type { Request, Response } from "express";
import z from "zod";
import User from "../models/User";
import { generateAuthToken, verifyAuthToken } from "../utils/jwt";

const registerSchema = z.object({
  username: z.string().min(4, "Username must be at least 4 characters long"),
  email: z.email().min(4, "Email must be not empty"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export async function register(req: Request, res: Response) {
  try {
    const { username, email, password } = registerSchema.parse(req.body);
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "Email already exists" });
    }
    const hashedPassword = await Bun.password.hash(password, {
      algorithm: "bcrypt",
      cost: 12,
    });
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    if (!user._id) {
      return res.status(500).json({ error: "Internal server error" });
    }
    const token = await generateAuthToken(user._id.toString(), "refresh", "1d");
    res.cookie("refreshToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 60 * 60 * 1000,
    });
    return res.status(200).json({
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.message });
    }
    return res
      .status(500)
      .json({ error: "Internal server error" + String(error) });
  }
}

const loginSchema = z.object({
  email: z.email().min(4, "Email must be not empty"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await User.findOne({ email });
    if (!user || !user._id) {
      return res.status(404).json({ error: "User not found" });
    }
    const passwordMatch = await Bun.password.verify(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = await generateAuthToken(user._id.toString(), "refresh", "1d");
    res.cookie("refreshToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 60 * 60 * 1000,
    });
    return res.status(200).json({
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.message });
    }
    return res
      .status(500)
      .json({ error: "Internal server error" + String(error) });
  }
}

export async function refresh(req: Request, res: Response) {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const decoded = await verifyAuthToken(refreshToken, "refresh");
    if (!decoded) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const token = await generateAuthToken(decoded.userId as string, "access");
    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 60 * 60 * 1000,
    });
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json({
      user: {
        id: user._id?.toString(),
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function user(req: Request, res: Response) {
  const accessToken = req.cookies.accessToken;
  if (!accessToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const query = req.query.include;
  try {
    const decoded = await verifyAuthToken(accessToken, "access");
    if (!decoded) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (query === "true") {
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      return res.status(200).json({
        user: {
          id: user._id?.toString(),
          username: user.username,
          email: user.email,
        },
      });
    }
    return res.status(200).json({ user: decoded });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
