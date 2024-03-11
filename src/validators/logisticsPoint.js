import { body } from "express-validator";

export const createLogisticsPointValidator = [
  body("name").notEmpty().withMessage("Name is required."),
  body("addressId").notEmpty().withMessage("Address ID is required."),
  body("contacts")
    .isArray()
    .withMessage("Contacts must be an array.")
    .custom((contacts) =>
      contacts.every((contact) => Number.isInteger(contact))
    )
    .withMessage("Contacts must be an array of numbers (IDs)."),
];

export const updateLogisticsPointValidator = [
  body("name").optional().notEmpty().withMessage("Name is required."),
  body("addressId")
    .optional()
    .notEmpty()
    .withMessage("Address ID is required."),
  body("contacts")
    .optional()
    .isArray()
    .withMessage("Contacts must be an array.")
    .custom((contacts) =>
      contacts.every((contact) => Number.isInteger(contact))
    )
    .withMessage("Contacts must be an array of numbers (IDs)."),
];
