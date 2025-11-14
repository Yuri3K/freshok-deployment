import express from 'express'
import {getLangs} from '../controllers/langsController'

const router = express.Router()

router.get('/', getLangs)

export default router