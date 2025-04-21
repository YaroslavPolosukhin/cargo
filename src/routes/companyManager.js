import express from 'express'
import checkRole from '../middlewares/checkRole.js'
import Roles from '../enums/roles.js'
import * as companyManagerController from '../controllers/companyManagerController.js'
import { driverLicenseUpload } from '../config/multer.js'
import { confirmDriverValidator } from '../validators/drivers.js'
import paginationMiddleware from '../middlewares/paginationMiddleware.js'
import searchMiddleware from '../middlewares/searchMiddleware.js'
import * as managerController from '../controllers/managerController.js'

const router = express.Router()

router.get(
  '/roles',
  checkRole([Roles.COMPANY_MANAGER]),
  companyManagerController.getRoles
)

router.post(
  '/confirm',
  checkRole([Roles.COMPANY_MANAGER]),
  driverLicenseUpload.array('drivingLicensePhotos', 6),
  confirmDriverValidator,
  companyManagerController.confirm
)

router.get(
  '/approved',
  checkRole([Roles.COMPANY_MANAGER]),
  paginationMiddleware,
  managerController.getApproved
)

router.get(
  '/unapproved',
  checkRole([Roles.COMPANY_MANAGER]),
  paginationMiddleware,
  companyManagerController.getUnapproved
)

router.get(
  '/search',
  checkRole([Roles.MANAGER]),
  paginationMiddleware,
  searchMiddleware,
  managerController.search
)

export default router
