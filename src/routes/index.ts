import express from 'express'
import langsRouter from './langsRoutes'
import authRouter from './authRoutes'
import usersRoutes from './usersRoutes'
import adminRoutes from './adminRoutes'

const router = express.Router()

router.use('/langs', langsRouter)
router.use('/register-user', authRouter)
router.use('/users', usersRoutes)
router.use('/admin', adminRoutes)

export default router