import express from 'express'
import verifyToken from '../middleware/verify-token'
import { getCurrentUser } from '../controllers/usersController'

const router = express.Router()

router.get('/me', verifyToken, getCurrentUser)

export default router