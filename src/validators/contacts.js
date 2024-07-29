import { body } from "express-validator";

export const createContactValidator = [
  body("name")
    .notEmpty()
    .withMessage("Name is required.")
    .isString()
    .withMessage("Name must be a string."),
  body("surname")
    .optional()
    .isString()
    .withMessage("Surname must be a string."),
  body("description")
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage("Description must be a string."),
  body("patronymic")
    .optional()
    .isString()
    .withMessage("Patronymic must be a string."),
  body("jobTitle")
    .optional()
    .isString()
    .withMessage("Job Title must be a string."),
  body("phone")
    .isMobilePhone()
    .withMessage("Please enter a valid phone number."),
  body("email")
    .optional()
    .isString()
    .withMessage("Email must be a string."),
  body("telegram")
    .optional()
    .isString()
    .withMessage("Telegram handle must be a string."),
];

export const updateContactValidator = [
  body("surname")
    .optional()
    .isString()
    .withMessage("Surname must be a string."),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string."),
  body("patronymic")
    .optional()
    .isString()
    .withMessage("Patronymic must be a string."),
  body("jobTitle")
    .optional()
    .isString()
    .withMessage("Job Title must be a string."),
  body("phone")
    .optional()
    .isMobilePhone()
    .withMessage("Please enter a valid phone number."),
  body("email").optional().isEmail().withMessage("Please enter a valid email."),
  body("telegram")
    .optional()
    .isString()
    .withMessage("Telegram handle must be a string."),
];
