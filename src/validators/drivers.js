import { body } from "express-validator";

export const confirmDriverValidator = [
  body("userId").isNumeric().withMessage("User ID must be numeric"),
  body("name").optional(),
  body("surname").optional(),
  body("patronymic")
    .optional(),
  body("inn").optional(),
  body("employmentType")
    .optional(),
  body("jobPositionId")
    .optional(),
  body("email").optional(),
  body("telegram")
    .optional(),
  body("contragentName").optional(),
  body("contragentINN")
    .optional(),
  body("kpp").optional(),
  body("passportSeries").optional(),
  body("passportNumber").optional(),
  body("passportIssuedBy").optional(),
  body("passportIssueDate")
    .optional(),
  body("passportDepartmentCode")
    .optional(),
  body('drivingLicenseSerial')
    .optional()
    .isNumeric()
    .withMessage("Driving license serial must be numeric"),
  body('drivingLicenseNumber')
    .optional()
    .isNumeric()
    .withMessage("Driving license number must be numeric"),
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
      "individual",
      "self_employed",
      "telegram",
      "contragentId",
      "personId",
      "drivingLicenseSerial",
      "drivingLicenseNumber",
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
  body('drivingLicenseSerial')
    .optional()
    .isNumeric()
    .withMessage("Driving license serial must be numeric"),
  body('drivingLicenseNumber')
    .optional()
    .isNumeric()
    .withMessage("Driving license number must be numeric"),
];
