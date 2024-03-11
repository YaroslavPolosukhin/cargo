import { body } from "express-validator";

export const createNomenclatureValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name cannot be empty or just whitespace"),
  body("measureId").isNumeric().withMessage("Measure id is required"),
];
