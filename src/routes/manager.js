import express from 'express'
import checkRole from '../middlewares/checkRole.js'
import Roles from '../enums/roles.js'
import * as managerController from '../controllers/managerController.js'
import { passportUpload } from '../config/multer.js'

const router = express.Router()

router.post(
  '/confirm/companyManager',
  checkRole([Roles.MANAGER]),
  passportUpload.array('photos', 6),
  managerController.confirmCompanyManager
)

export default router
