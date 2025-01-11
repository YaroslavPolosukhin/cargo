import express from "express";
import logisticPointsController from "../controllers/logisticPointsController.js";
import {
  createLogisticsPointValidator,
  updateLogisticsPointValidator,
} from '../validators/logisticsPoint.js'
import checkRole from "../middlewares/checkRole.js";
import paginationMiddleware from "../middlewares/paginationMiddleware.js";
import Roles from "../enums/roles.js";
import searchMiddleware from '../middlewares/searchMiddleware.js'

const router = express.Router();

router.get(
  "/all",
  checkRole([Roles.MANAGER]),
  paginationMiddleware,
  logisticPointsController.getAll
);
router.get(
  "/search",
  checkRole([Roles.MANAGER]),
  paginationMiddleware,
  searchMiddleware,
  logisticPointsController.search
)
router.post(
  "/",
  checkRole([Roles.MANAGER]),
  createLogisticsPointValidator,
  logisticPointsController.create
);
router.get(
  "/:pointId",
  checkRole([Roles.MANAGER]),
  logisticPointsController.getOne
);
router.put(
  "/:pointId",
  checkRole([Roles.MANAGER]),
  updateLogisticsPointValidator,
  logisticPointsController.update
);
router.delete(
  "/:pointId",
  checkRole([Roles.MANAGER]),
  logisticPointsController.deleteLogisticsPoint
);
export default router;
