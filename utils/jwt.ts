import { jwtVerify, SignJWT } from "jose";

export const generateAuthToken = async (
  userId: string,
  type: "access" | "refresh",
  expiry: string = "1h"
) => {
  const secret = new TextEncoder().encode(
    type === "access"
      ? process.env.JWT_ACCESS_SECRET
      : process.env.JWT_REFRESH_SECRET
  );
  const jwt = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiry)
    .sign(secret);
  return jwt;
};

export const verifyAuthToken = async (
  token: string,
  type: "access" | "refresh"
) => {
  try {
    const secret = new TextEncoder().encode(
      type === "access"
        ? process.env.JWT_ACCESS_SECRET
        : process.env.JWT_REFRESH_SECRET
    );
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    console.error(error);
    return null;
  }
};
