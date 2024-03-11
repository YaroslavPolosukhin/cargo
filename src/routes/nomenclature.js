import express from "express";
import nomenclatureController from "../controllers/nomenclatureController.js";
import { createNomenclatureValidator } from "../validators/nomenclature.js";
import checkRole from "../middlewares/checkRole.js";
import Roles from "../enums/roles.js";
const router = express.Router();

router.get("/all", nomenclatureController.getNomenclatures);
router.get("/search", nomenclatureController.getNomenclaturesByName);
router.post(
  "/",
  checkRole([Roles.MANAGER]),
  createNomenclatureValidator,
  nomenclatureController.createNomenclature
);
router.put(
  "/:nomenclatureId",
  checkRole([Roles.MANAGER]),
  nomenclatureController.updateNomenclature
);
router.delete(
  "/:nomenclatureId",
  checkRole([Roles.MANAGER]),
  nomenclatureController.deleteNomenclature
);
export default router;
