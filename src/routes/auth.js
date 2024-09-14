import * as authController from '../controllers/authController.js'
import {
  registerValidator,
  loginValidator,
  refreshValidator,
  passwordRecoverValidator,
  passwordRecoverCodeCheckValidator,
  passwordResetValidator
} from '../validators/auth.js'
import authMiddleware from '../middlewares/checkAuth.js'
import { Router } from 'websocket-express'

const router = new Router();

router.ws('/new', authMiddleware, authController.newUsers)
router.post('/signUp', registerValidator, authController.register)
router.post('/signIn', loginValidator, authController.login)
router.post('/password/recover', passwordRecoverValidator, authController.recoverPassword)
router.post('/password/checkcode', passwordRecoverCodeCheckValidator, authController.checkCode)
router.post('/password/reset', passwordResetValidator, authController.resetPassword)
router.post('/refresh', authMiddleware, refreshValidator, authController.refreshToken)
router.post('/logout', authMiddleware, authController.logout)
router.get('/user', authMiddleware, authController.getUser)

export default router
