import { NextFunction, Response } from "express"
import { AuthRequest } from "./verify-token"
import {db} from '../config/firebaseAdmin'

/**
 * Middleware для проверки роли и/или permissions пользователя
 * @param required - строка (роль или permission) или массив таких строк
 */
export const checkPermission = (required: string | string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user
  
      if(!user) {
        return res.status(401).json({error: 'Unauthorized'})
      }

      // Получаем данные пользователя из Firestore
      const userDoc = await db.collection('users').doc(user.uid).get()
      if(!userDoc.exists) {
        return res.status(404).json({errpr: 'User not found'})
      }

      const userData = userDoc.data()
      const userRole = userData?.role || 'customer'
      const userPermissions: string[] = userData?.permissions || []

      // superAdmin — полный доступ
      if(userRole == 'superAdmin') {
        return next()
      }

      // Приводим переданные данные о роли или permissions в массив
      const requiredArray = Array.isArray(required) ? required : [required]

      // Если среди required есть совпадение с ролью
      if(requiredArray.includes(userRole)) {
        return next()
      }

      // Если есть пересечение с permissions
      const hasPermission = userPermissions.some(p => requiredArray.includes(p))
      if(hasPermission) {
        return next()
      }

      // Нет доступа
      res.status(403).json({
        error: 'Forbidden: insufficient permissions'
      })

    } catch(err) {
      console.log('checkPerission error', err)
      res.status(500).json({
        error: 'Intermal server error'
      })
    }
  }
}