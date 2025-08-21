import type { Request, Response, NextFunction } from "express";
import { verifyAuthToken } from "./utils/jwt";

export const protectRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const accessToken = req.cookies.accessToken;
  try {
    const decoded = await verifyAuthToken(accessToken, "access");
    if (!decoded)
      return res.status(401).json({
        error: "Unauthorized",
      });
    (req as any).userId = decoded.userId;
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
