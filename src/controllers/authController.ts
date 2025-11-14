import { Request, Response } from "express"
import {admin, db} from '../config/firebaseAdmin'
import { AuthRequest } from "../middleware/verify-token"
import { RegisterUserRequest } from "../types/schemas/auth/register"
import { RegisterWithGoogleUserRequest } from "../types/schemas/auth/register-google"
import { CheckEmailExistence } from "../types/schemas/auth/check-email"

export const DEFAULT_ROLE = 'customer'

async function getPermissionsByRole(role: string) {
  const roleDoc = await db.collection('roles').doc(role).get()
  const permissions = roleDoc.exists ?
    roleDoc.data()?.permissions :
    []

    return permissions

}

const registerUser = async (req: Request<unknown, unknown, RegisterUserRequest>, res: Response) => {
  const {email, password, displayName} = req.body 

  if(!email || !password || !displayName) {
    return res.status(400).json({error: 'Missing email or password or displayNmae'})
  }

  try {
    // Создаём пользователя в Firebase Authentication -> Users
    const newUser = await admin.auth().createUser({
      email, password, displayName
    })

    const permissions = await getPermissionsByRole(DEFAULT_ROLE)

    // Устанавливаем кастомную роль (в claims)
    await admin.auth().setCustomUserClaims(newUser.uid, {
      role: DEFAULT_ROLE,
      permissions: permissions
    })

    // Добавляем в Firestore DB коллекцию users
    await db.collection('users').doc(newUser.uid).set({
      uid: newUser.uid,
      email,
      displayName,
      role: DEFAULT_ROLE,
      permissions: permissions,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    })

    res.status(201).json({result: 'ok', uid: newUser.uid})

  } catch (err: any) {
    console.log("Error registered User", err)
    res.status(500).json({error: err.message})
  }
}

const registerGoogleUser = async(req: AuthRequest<unknown, unknown, RegisterWithGoogleUserRequest>, res: Response) => {
  const user = req.user

  if(!user) {
    return res.status(400).json({error: 'Unauthorized'})
  }

  const {uid, email, name, picture} = user

  try {
    const userRef = db.collection('users').doc(uid)
    const userDoc = await userRef.get()

    if(!userDoc.exists) {
      const authUser = await admin.auth().getUser(uid)
      const displayName = authUser.displayName || name || 'No Name'
      const permissions = getPermissionsByRole(DEFAULT_ROLE)

      await userRef.set({
        uid,
        email, 
        displayName,
        role: DEFAULT_ROLE,
        permissions: permissions,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      })

      await admin.auth().setCustomUserClaims(uid, {
        role: DEFAULT_ROLE,
        permissions: permissions
      })
    }

    res.status(200).json({result: 'ok'})

  } catch (err: any) {
    console.log('Error registering Google user:', err)
    res.status(500).json({error: err.message})
  }
}

const checkEmailExists = async (req: Request<unknown, unknown, CheckEmailExistence>, res: Response) => {
  const {email} = req.body

  if(!email) return

  try {
    const usersRef = db.collection('users')
    const snapshot = await usersRef.where('email', '==', email.toLowerCase()).get()

    if(!snapshot.empty) {
      return res.json({exists: true})
    } 
    
    return res.json({exists: false})

  } catch (err: any) {
    console.error("Error checking email:", err)
    return res.status(500).json({error: err.message})
  }
}

export {
  registerUser,
  checkEmailExists,
  registerGoogleUser
}