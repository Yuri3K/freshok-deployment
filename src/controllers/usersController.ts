import { Response } from "express";
import { AuthRequest } from "../middleware/verify-token";
import {db} from '../config/firebaseAdmin'

const getCurrentUser = async (req: AuthRequest, res: Response) => {
  const user = req.user

  if(!user) {
    return res.status(401).json({error: 'Unauthorized'})
  }

  const userDoc = await db.collection('users').doc(user!.uid).get()

  if(!userDoc.exists) {
    return res.status(404).json({error: "User not found"})
  }

  const userData = userDoc.data()

  res.json({
    uid: userData?.uid,
    email: userData?.email,
    displayName: userData?.displayName,
    role: userData?.role,
    permissions: userData?.permissions
  })
}

export {
  getCurrentUser
}