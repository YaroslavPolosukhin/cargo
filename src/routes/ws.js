import { Router } from 'websocket-express'
import ordersController from '../controllers/ordersController.js'
import * as driversController from '../controllers/driversController.js'
import * as authController from '../controllers/authController.js'

const router = new Router()

router.ws('/orders/updates', ordersController.updates)
router.ws('/orders/location/:orderId', ordersController.location)

router.ws('/drivers/updates', driversController.updates)

router.ws('/auth/new', authController.newUsers)

export default router
