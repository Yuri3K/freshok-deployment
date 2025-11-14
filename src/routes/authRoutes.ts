import express from 'express'
import { checkEmailExists, registerGoogleUser, registerUser } from '../controllers/authController'
import verifyToken from '../middleware/verify-token'
import validateRequest from '../middleware/validateRequest'
import { RegisterUserRequest } from '../types/schemas/auth/register'
import { CheckEmailExistence } from '../types/schemas/auth/check-email'

const router = express.Router()

router.post(
  '/',
  validateRequest<RegisterUserRequest>('auth/register.schema.json', 'body'),
  registerUser
)

router.post(
  '/check-email', 
  validateRequest<CheckEmailExistence>('auth/check-email.schema.json', 'body'),
  checkEmailExists
)

router.post(
  '/with-google',
  verifyToken,
  validateRequest({headers: 'auth/register-google.schema.json'}),
  registerGoogleUser
)

export default router