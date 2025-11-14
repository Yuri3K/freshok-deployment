import { NextFunction, Response } from "express"
import { AuthRequest } from "./verify-token"

function hasAll(userPermissions: string[], required: string[]) {
  return required.every(perm => userPermissions.includes(perm))
}

function hasAny(userPermissions: string[], required: string[]) {
  return required.some(perm => userPermissions.includes(perm))
}

export const checkPermission = {
  all: (required: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
      const user = req.user

      if(!user) {
        return res.status(401).json({error: 'User not Authenticated'})
      }

      const {role, permissions = []} = user

      if(role === 'superAdmin' || hasAll(permissions, required)) {
        return next()
      }

      return res.status(403).json({error: "Access denied"})
    }
  },

  any: (required: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
      const user = req.user

      if(!user) {
        return res.status(401).json({error: 'User not Authenticated'})
      }

      const {role, permissions = []} = user

      if(role === 'superAdmin' || hasAny(permissions, required)) {
        return next()
      }

      return res.status(403).json({error: 'Access denied'})
    }
  }

} 