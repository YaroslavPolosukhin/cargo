import { body } from "express-validator";
import EmploymentType from "../enums/employmentType.js";

export const confirmDriverValidator = [
  body("userId").isNumeric().withMessage("User ID must be numeric"),
  body("name").notEmpty().withMessage("Name is required"),
  body("surname").notEmpty().withMessage("Surname is required"),
  body("patronymic")
    .optional()
    .isString()
    .withMessage("Patronymic must be a string"),
  body("inn").isNumeric().withMessage("INN must be numeric"),
  body("employmentType")
    .isIn(Object.values(EmploymentType))
    .withMessage("Invalid employment type"),
  body("jobPositionId")
    .isNumeric()
    .withMessage("Job Position ID must be numeric"),
  body("email").isEmail().withMessage("Please enter a valid email"),
  body("telegram")
    .optional()
    .isString()
    .withMessage("Telegram handle must be a string"),
  body("contragentName").notEmpty().withMessage("Contragent name is required"),
  body("contragentINN")
    .isNumeric()
    .withMessage("Contragent INN must be numeric"),
  body("kpp").optional().isNumeric().withMessage("KPP must be numeric"),
  body("companyType").notEmpty().withMessage("Company type is required"),
  body("passportSeries").notEmpty().withMessage("Passport series is required"),
  body("passportNumber").notEmpty().withMessage("Passport number is required"),
  body("passportIssuedBy").notEmpty().withMessage("Issued by is required"),
  body("passportIssueDate")
    .isISO8601()
    .withMessage("Issue date must be a valid date"),
  body("passportDepartmentCode")
    .notEmpty()
    .withMessage("Department code is required"),
];

export const updateDriverValidator = [
  body().custom((value, { req }) => {
    const allowedFields = [
      "name",
      "surname",
      "patronymic",
      "inn",
      "passportId",
      "jobPositionId",
      "email",
      "company",
      "individual",
      "self_employed",
      "telegram",
      "contragentId",
      "personId",
    ];

    const bodyFields = Object.keys(req.body);
    const missingFields = bodyFields.filter(
      (field) => !allowedFields.includes(field)
    );

    if (missingFields.length > 0) {
      throw new Error(`Missing fields: ${missingFields.join(", ")}`);
    }
    return true;
  }),
  body("personId")
    .isNumeric()
    .withMessage("Person ID must be numeric"),
  body("name")
    .optional()
    .isString()
    .withMessage("Name must be a string"),
  body("surname")
    .optional()
    .isString()
    .withMessage("Surname must be a string"),
  body("patronymic")
    .optional()
    .isString()
    .withMessage("Patronymic must be a string"),
  body("inn").optional().isString().withMessage("INN must be string"),
  body("passportId")
    .optional()
    .isNumeric()
    .withMessage("Passport ID must be numeric"),
  body("jobPositionId")
    .optional()
    .isNumeric()
    .withMessage("Job Position ID must be numeric"),
  body("email").optional().isEmail().withMessage("Please enter a valid email"),
  body("company").optional().isBoolean().withMessage("Company must be boolean"),
  body("individual")
    .optional()
    .isBoolean()
    .withMessage("Individual must be boolean"),
  body("self_employed")
    .optional()
    .isBoolean()
    .withMessage("self_employed must be boolean"),
  body("telegram")
    .optional()
    .isString()
    .withMessage("Telegram handle must be a string"),
  body("contragentId")
    .optional()
    .isNumeric()
    .withMessage("Contragent ID must be numeric"),
];
