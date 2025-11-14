
import { db, admin } from "../config/firebaseAdmin";
import { AuthRequest } from "../middleware/verify-token";
import { Response } from "express"
import { DeleteUser } from "../types/schemas/admin/delete-user";

const getUsersList = async (req: AuthRequest, res: Response) => {
  try {
    const usersSnapshot = await db.collection('users')
      .orderBy('createdAt', 'desc') // Сортировка для удобства
      .get()

    const usersList = usersSnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        uid: data.uid,
        email: data.email,
        displayName: data.displayName,
        role: data.role,
        createdAt: data.createdAt
      }
    })

    res.json(usersList)
  } catch (err) {
    console.error("Error fetching users list:", err);
    res.status(500).json({ error: 'Failed to fetch users list' })
  }
}

const deleteUser = async (req: AuthRequest<DeleteUser>, res: Response) => {
  const { uid } = req.params // Получаем UID из URL-параметров
  const callingUser = req.user // Пользователь, который выполняет удаление (Super Admin)

  if (!callingUser) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // ПРОВЕРКА БЕЗОПАСНОСТИ: Запрет Super Admin удалять самого себя.
  if (uid == callingUser.uid) {
    return res.status(403).json({ error: 'Cannot delete own account' })
  }

  try {
    await admin.auth().deleteUser(uid)
    await db.collection('users').doc(uid).delete()
    res.status(200).json({ message: `User ${uid} deleted successfully.` });
  } catch (err) {
    console.error(`Error deleting user ${uid}:`, err)

    // Обработка ошибок, например, если пользователь не найден
    if (err instanceof Error && (err as any).code === 'auth/user-not-found') {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(500).json({ error: 'Failed to delete user' })
  }
}

export {
  getUsersList,
  deleteUser
}