import jwt from "jsonwebtoken";
import type { JWTPayload } from "../middleware/auth";

export function signToken(payload: JWTPayload, expiresIn?: string): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: (expiresIn ?? process.env.JWT_EXPIRES_IN ?? "7d") as jwt.SignOptions["expiresIn"],
  });
}

export function signRefreshToken(payload: Pick<JWTPayload, "userId">): string {
  return jwt.sign(payload, process.env.REFRESH_SECRET!, {
    expiresIn: (process.env.REFRESH_EXPIRES_IN ?? "30d") as jwt.SignOptions["expiresIn"],
  });
}

export function verifyRefreshToken(token: string): Pick<JWTPayload, "userId"> {
  return jwt.verify(token, process.env.REFRESH_SECRET!) as Pick<JWTPayload, "userId">;
}
