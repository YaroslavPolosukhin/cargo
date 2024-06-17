import { body } from "express-validator";

export const createNomenclatureValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name cannot be empty or just whitespace"),
  body("measureId").optional(),
];
