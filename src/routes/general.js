import express from "express";
import generalController from "../controllers/generalController.js";

const router = express.Router();

router.get("/enums/list", generalController.getListEnums);

export default router;
