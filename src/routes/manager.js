import express from 'express'
import checkRole from '../middlewares/checkRole.js'
import Roles from '../enums/roles.js'
import * as managerController from '../controllers/managerController.js'
import { passportUpload } from '../config/multer.js'
import paginationMiddleware from '../middlewares/paginationMiddleware.js'
import searchMiddleware from '../middlewares/searchMiddleware.js'

const router = express.Router()

router.post(
  '/confirm/companyManager',
  checkRole([Roles.MANAGER]),
  passportUpload.array('photos', 6),
  managerController.confirmCompanyManager
)

router.get(
  '/approved',
  checkRole([Roles.MANAGER]),
  paginationMiddleware,
  managerController.getApproved
)

router.get(
  '/unapproved',
  checkRole([Roles.MANAGER]),
  paginationMiddleware,
  managerController.getUnapproved
)

router.get(
  '/search',
  checkRole([Roles.MANAGER]),
  paginationMiddleware,
  searchMiddleware,
  managerController.search
)

router.get(
  '/roles',
  checkRole([Roles.MANAGER]),
  managerController.getRoles
)

router.post(
  '/confirm/companyDriver',
  checkRole([Roles.MANAGER]),
  managerController.confirmCompanyDriver
)

export default router
