import { body } from 'express-validator'

export const createOrderValidator = [
  body('departureId').notEmpty().withMessage('Departure ID is required.'),
  body('destinationId').notEmpty().withMessage('Destination ID is required.'),
  body('plannedLoadingDate').notEmpty().withMessage('Planned loading date is required.'),
  body('plannedDeliveryDate').notEmpty().withMessage('Planned delivery date is required.'),
  body('costType').optional().notEmpty().isString().withMessage('Cost per route must be a positive number.'),
  body('priceCash').optional().notEmpty().isFloat({ min: 0 }).withMessage('Cash price must be a positive number.'),
  body('priceNonCash').optional().notEmpty().isFloat({ min: 0 }).withMessage('Non-cash price must be a positive number.'),
  body('nomenclatures').isArray().withMessage('Nomenclatures must be an array.')
]

export const updateOrderValidator = [
  body('departure_id').optional().notEmpty().withMessage('Departure ID is required.'),
  body('destination_id').optional().notEmpty().withMessage('Destination ID is required.'),
  body('cost_per_route').optional().notEmpty().isFloat({ min: 0 }).withMessage('Cost per route must be a positive number.'),
  body('cost_per_ton').optional().notEmpty().isFloat({ min: 0 }).withMessage('Cost per ton must be a positive number.'),
  body('price_cash').optional().notEmpty().isFloat({ min: 0 }).withMessage('Cash price must be a positive number.'),
  body('price_non_cash').optional().notEmpty().isFloat({ min: 0 }).withMessage('Non-cash price must be a positive number.'),
  body('departure_date_plan').optional().notEmpty().withMessage('Planned loading date is required.'),
  body('delivery_date_plan').optional().notEmpty().withMessage('Planned delivery date is required.'),
  body('nomenclatureIds').optional().isArray().withMessage('Nomenclatures must be an array.')
]
export const updateGeoValidator = [
  body('orderId')
    .notEmpty().withMessage('Order ID is required.')
    .isInt().withMessage('Order ID must be an integer.'),
  body('latitude')
    .notEmpty().withMessage('Latitude is required.')
    .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be a float between -90 and 90.'),
  body('longitude')
    .notEmpty().withMessage('Longitude is required.')
    .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be a float between -180 and 180.')
]
