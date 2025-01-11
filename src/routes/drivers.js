import { Router } from 'websocket-express'
import checkRole from "../middlewares/checkRole.js";
import paginationMiddleware from "../middlewares/paginationMiddleware.js";
import Roles from "../enums/roles.js";
import {
  confirmDriverValidator,
  updateDriverValidator,
} from "../validators/drivers.js";
import { passportUpload } from "../config/multer.js";
import * as driversController from '../controllers/driversController.js'
import searchMiddleware from '../middlewares/searchMiddleware.js'

const router = new Router();

router.ws("/updates", driversController.updates);
router.get(
  "/approved",
  checkRole([Roles.MANAGER]),
  paginationMiddleware,
  driversController.getApproved
);
router.get(
  "/unapproved",
  checkRole([Roles.MANAGER]),
  paginationMiddleware,
  driversController.getUnapproved
);
router.get(
  "/:driverId",
  checkRole([Roles.MANAGER]),
  driversController.getOne
)
router.put(
  "/update",
  checkRole([Roles.MANAGER, Roles.DRIVER]),
  updateDriverValidator,
  driversController.update
);
router.post(
  "/confirm",
  checkRole([Roles.MANAGER]),
  passportUpload.array("photos", 6),
  confirmDriverValidator,
  driversController.confirm
);

router.get(
  '/jobs',
  checkRole([Roles.MANAGER]),
  driversController.getJobs
)

router.get(
  '/getManagerPhone',
  checkRole([Roles.DRIVER]),
  driversController.getManagerPhone
)

router.get(
  '/search',
  checkRole([Roles.MANAGER]),
  paginationMiddleware,
  searchMiddleware,
  driversController.search
)

export default router;
