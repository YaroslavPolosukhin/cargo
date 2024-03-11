import express from "express";
import logisticPointsController from "../controllers/logisticPointsController.js";
import {
  createLogisticsPointValidator,
  updateLogisticsPointValidator,
} from "../validators/logisticsPoint.js";
import checkRole from "../middlewares/checkRole.js";
import paginationMiddleware from "../middlewares/paginationMiddleware.js";
import Roles from "../enums/roles.js";

const router = express.Router();

router.get(
  "/all",
  checkRole([Roles.MANAGER]),
  paginationMiddleware,
  logisticPointsController.getAll
);
router.post(
  "/",
  checkRole([Roles.MANAGER]),
  createLogisticsPointValidator,
  logisticPointsController.create
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
