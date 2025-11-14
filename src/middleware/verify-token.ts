import { NextFunction, Request, Response } from "express"
import { admin, db } from "../config/firebaseAdmin"
import { DecodedIdToken } from "firebase-admin/auth";
import { DEFAULT_ROLE } from "../controllers/authController";

export interface AuthRequest<
  TParams = Record<string, string>,  // параметры маршрута (например, { uid: string })
  TResBody = any,                    // тело ответа (опционально)
  TReqBody = any,                    // тело запроса
  TReqQuery = Record<string, any>    // query параметры
> extends Request {
  user?: DecodedIdToken & {
    role?: string
    permissions?: string[]
  }
}

export default async function verifyToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).send("Missing or invalid Authorization header")
  }

  const idToken = authHeader.split("Bearer ")[1]

  if (!idToken) {
    return res.status(401).json({ message: 'Token missing' });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(idToken)

    // ПРОВЕРКА РОЛИ И ПРАВ ИЗ DECODED ТОКЕНА (Custom Claims)
    const userRole = decoded.role
    const userPermissuins = decoded.permissions

    if (!userRole) {
      return res.status(403).send("Token is missing role. Please re-authenticate.")
    }

    req.user = {
      ...decoded,
      role: userRole ?? DEFAULT_ROLE,
      permissions: userPermissuins ?? []
    }
    next()
  } catch (err) {
    console.error("Invalid token:", err);
    return res.status(401).send("Unauthorized");
  }
}
