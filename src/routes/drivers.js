import express from 'express'
import checkRole from '../middlewares/checkRole.js'
import paginationMiddleware from '../middlewares/paginationMiddleware.js'
import Roles from '../enums/roles.js'
import {
  confirmDriverValidator, createContragentValidator, createPassportValidator,
  updateDriverValidator
} from '../validators/drivers.js'
import { driverLicenseUpload, passportUpload } from '../config/multer.js'
import * as driversController from '../controllers/driversController.js'
import searchMiddleware from '../middlewares/searchMiddleware.js'

const router = express.Router()

router.get(
  '/getManagerPhone',
  checkRole([Roles.DRIVER]),
  driversController.getManagerPhone
)

router.get(
  '/jobs',
  checkRole([Roles.MANAGER]),
  driversController.getJobs
)

router.get(
  '/approved',
  checkRole([Roles.MANAGER]),
  paginationMiddleware,
  driversController.getApproved
)

router.get(
  '/unapproved',
  checkRole([Roles.MANAGER]),
  paginationMiddleware,
  driversController.getUnapproved
)

router.get(
  '/:driverId',
  checkRole([Roles.MANAGER]),
  driversController.getOne
)

router.get(
  '/search',
  checkRole([Roles.MANAGER]),
  paginationMiddleware,
  searchMiddleware,
  driversController.search
)

router.put(
  '/update/:driverId',
  checkRole([Roles.MANAGER, Roles.DRIVER]),
  driverLicenseUpload.array('drivingLicensePhotos', 6),
  updateDriverValidator,
  driversController.update
)

router.post(
  '/confirm',
  checkRole([Roles.MANAGER]),
  driverLicenseUpload.array('drivingLicensePhotos', 6),
  confirmDriverValidator,
  driversController.confirm
)

router.post(
  '/createPassport',
  checkRole([Roles.MANAGER]),
  passportUpload.array('photos', 6),
  createPassportValidator,
  driversController.createPassport
)

router.post(
  '/updatePassport/:passportId',
  checkRole([Roles.MANAGER]),
  passportUpload.array('photos', 6),
  createPassportValidator,
  driversController.updatePassport
)

router.post(
  '/createContragent',
  checkRole([Roles.MANAGER]),
  createContragentValidator,
  driversController.createContragent
)

router.post(
  '/updateContragent/:contragentId',
  checkRole([Roles.MANAGER]),
  driversController.updateContraget
)

export default router
