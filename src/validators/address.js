import { body } from "express-validator";

export const createAddressValidator = [
  body("name")
    .notEmpty()
    .withMessage("Name is required.")
    .isString()
    .withMessage("Name must be a string."),
  body("city")
    .notEmpty()
    .withMessage("City is required.")
    .isString()
    .withMessage("City must be a string."),
  body("street")
    .notEmpty()
    .withMessage("Street is required.")
    .isString()
    .withMessage("Street must be a string."),
  body("region")
    .optional()
    .isString()
    .withMessage("City must be a string."),
  body("house")
    .notEmpty()
    .withMessage("House is required.")
    .isString()
    .withMessage("House must be a string."),
  body("apartment")
    .optional()
    .isString()
    .withMessage("Apartment must be a string."),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string."),
  body("building")
    .optional()
    .isString()
    .withMessage("Building must be a string."),
  body("floor")
    .optional()
    .isInt()
    .withMessage("Floor must be an integer."),
  body("postcode")
    .optional()
    .isPostalCode("any")
    .withMessage("Please enter a valid postcode."),
];

export const updateAddressValidator = [
  body("name")
    .optional()
    .isString()
    .withMessage("Name must be a string."),
  body("city")
    .optional()
    .isString()
    .withMessage("City must be a string."),
  body("street")
    .optional()
    .isString()
    .withMessage("Street must be a string."),
  body("house").optional().isString().withMessage("House must be a string."),
  body("apartment")
    .optional()
    .isString()
    .withMessage("Apartment must be a string."),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string."),
  body("building")
    .optional()
    .isString()
    .withMessage("Building must be a string."),
  body("floor").optional().isInt().withMessage("Floor must be an integer."),
  body("postcode")
    .optional()
    .isPostalCode("any")
    .withMessage("Please enter a valid postcode."),
];
