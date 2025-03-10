import { body } from 'express-validator'

export const registerValidator = [
  body('phone').isMobilePhone().withMessage('Please enter a valid phone number'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
  // body('roleId').isInt().withMessage('Role id must be an integer')
]

export const loginValidator = [
  // Поля для входа обычно такие же, как и при регистрации
  body('phone').isMobilePhone().withMessage('Please enter a valid mobile phone.'),
  body('password').notEmpty().withMessage('Password must not be empty.'),
  body('fcmToken').optional().isString().withMessage('fcmToken must not string')
]

export const refreshValidator = [
  body('refreshToken').isString().withMessage('Refresh token must be a string')
]

export const passwordRecoverValidator = [
  body('phone').isMobilePhone().withMessage('Please enter a valid mobile phone.')
]

export const passwordRecoverCodeCheckValidator = [
  body('phone').isMobilePhone().withMessage('Please enter a valid mobile phone.'),
  body('code').isString().isLength({ min: 4, max: 4 }).withMessage('Please enter a 6-digit SMS code.')
]

export const passwordResetValidator = [
  body('phone').isMobilePhone().withMessage('Please enter a valid mobile phone.'),
  body('code').isString().isLength({ min: 4, max: 4 }).withMessage('Please enter a 6-digit SMS code.'),
  body('password').notEmpty().withMessage('Password must not be empty.')
]
