import express from 'express'
import checkRole from '../middlewares/checkRole.js'
import Roles from '../enums/roles.js'
import * as companyManagerController from '../controllers/companyManagerController.js'
import { driverLicenseUpload } from '../config/multer.js'
import { confirmDriverValidator, updateDriverValidator } from '../validators/drivers.js'
import paginationMiddleware from '../middlewares/paginationMiddleware.js'
import searchMiddleware from '../middlewares/searchMiddleware.js'
import * as managerController from '../controllers/managerController.js'
import ordersController from '../controllers/ordersController.js'

const router = express.Router()

router.get(
  '/jobs',
  checkRole([Roles.COMPANY_MANAGER]),
  companyManagerController.getJobs
)

router.post(
  '/drivers/confirm',
  checkRole([Roles.COMPANY_MANAGER]),
  driverLicenseUpload.array('drivingLicensePhotos', 6),
  confirmDriverValidator,
  companyManagerController.confirm
)

router.get(
  '/drivers/approved',
  checkRole([Roles.COMPANY_MANAGER]),
  paginationMiddleware,
  companyManagerController.getFullApproved
)

router.get(
  '/drivers/approved_company',
  checkRole([Roles.COMPANY_MANAGER]),
  paginationMiddleware,
  companyManagerController.getCompanyApproved
)

router.get(
  '/drivers/unapproved',
  checkRole([Roles.COMPANY_MANAGER]),
  paginationMiddleware,
  companyManagerController.getUnapproved
)

router.put(
  '/drivers/update/:driverId',
  checkRole([Roles.COMPANY_MANAGER, Roles.COMPANY_DRIVER]),
  driverLicenseUpload.array('drivingLicensePhotos', 6),
  updateDriverValidator,
  companyManagerController.driverUpdate
)

router.get(
  '/drivers/:driverId',
  checkRole([Roles.COMPANY_MANAGER]),
  companyManagerController.getOne
)

router.get(
  '/search',
  checkRole([Roles.COMPANY_MANAGER]),
  paginationMiddleware,
  searchMiddleware,
  managerController.search
)

router.get(
  '/order/all',
  checkRole([Roles.COMPANY_MANAGER]),
  paginationMiddleware,
  companyManagerController.getAll
)

router.get(
  '/order/:orderId/geo',
  checkRole([Roles.COMPANY_MANAGER]),
  ordersController.getGeo
)

router.get(
  '/order/:orderId',
  checkRole([Roles.COMPANY_MANAGER]),
  ordersController.getOrderById
)

export default router
