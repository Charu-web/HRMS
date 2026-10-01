import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "./prisma";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET environment variable is required in production");
    }
    return "dev_only_insecure_secret_do_not_use_in_production";
  }
  return secret;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  employeeId?: string | null;
  name?: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as TokenPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getAuthUser(req: NextRequest): Promise<TokenPayload | null> {
  // Check Authorization header
  const authHeader = req.headers.get("authorization");
  let token = "";
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else {
    // Check cookies
    const cookieToken = req.cookies.get("zenith_token")?.value;
    if (cookieToken) {
      token = cookieToken;
    }
  }

  if (!token) return null;
  return verifyToken(token);
}

export async function requireAuth(req: NextRequest, allowedRoles?: string[]) {
  const user = await getAuthUser(req);
  if (!user) {
    return {
      authorized: false,
      user: null,
      response: NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 }),
    };
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role) && user.role !== "SUPER_ADMIN") {
      return {
        authorized: false,
        user,
        response: NextResponse.json({ error: "Forbidden. Insufficient permissions." }, { status: 403 }),
      };
    }
  }

  return { authorized: true, user, response: null };
}
