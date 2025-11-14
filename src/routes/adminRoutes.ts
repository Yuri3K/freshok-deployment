import express from 'express'
import verifyToken from '../middleware/verify-token'
import { checkPermission } from '../middleware/checkPermission'
import {getUsersList, deleteUser} from '../controllers/adminController'
import validateRequest from '../middleware/validateRequest'
import { DeleteUser } from '../types/schemas/admin/delete-user'

const router = express.Router()

router.get('/users', verifyToken, checkPermission.any(['user.list']), getUsersList)
router.delete(
  '/users/:uid', 
  verifyToken, 
  checkPermission.all(['superAdmin']), 
  validateRequest<DeleteUser>('admin/delete-user.schema.json', 'params'),
  deleteUser)

export default router