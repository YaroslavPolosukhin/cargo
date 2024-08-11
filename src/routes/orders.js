import { Router } from 'websocket-express'
import ordersController from '../controllers/ordersController.js'
import checkRole from '../middlewares/checkRole.js'
import Roles from '../enums/roles.js'
import paginationMiddleware from '../middlewares/paginationMiddleware.js'
import { createOrderValidator, updateGeoValidator, updateOrderValidator } from '../validators/orders.js'
import searchMiddleware from '../middlewares/searchMiddleware.js'
const router = new Router()

router.ws('/updates', ordersController.updates)
router.ws('/location/:orderId', ordersController.location)
router.get('/available', paginationMiddleware, ordersController.getAvailableOrders)
router.get('/current', ordersController.getCurrentOrder)
router.get('/all', checkRole([Roles.MANAGER]), paginationMiddleware, ordersController.getAll)
router.get('/getManagerPhone', checkRole([Roles.DRIVER]), ordersController.getManagerPhone)
router.get('/search', checkRole([Roles.MANAGER, Roles.DRIVER]), paginationMiddleware, searchMiddleware, ordersController.search)
router.get('/:orderId/geo', checkRole([Roles.MANAGER, Roles.DRIVER]), ordersController.getGeo)
router.get('/:orderId', checkRole([Roles.MANAGER]), ordersController.getOrderById)
router.get('/drivers', checkRole([Roles.MANAGER]), ordersController.getDriversOnTrip)
router.post('/create', checkRole([Roles.MANAGER]), createOrderValidator, ordersController.createOrder)
router.put('/:orderId', checkRole([Roles.MANAGER]), updateOrderValidator, ordersController.updateOrder)
router.post('/take', checkRole([Roles.DRIVER]), ordersController.takeOrder)
router.post('/confirm', checkRole([Roles.MANAGER]), ordersController.confirmOrder)
router.post('/rejectDriver', checkRole([Roles.MANAGER]), ordersController.rejectDriver)
router.post('/depart', checkRole([Roles.DRIVER]), ordersController.markOrderAsDeparted)
router.post('/complete', checkRole([Roles.DRIVER]), ordersController.markOrderAsCompleted)
router.post('/updateGeo', checkRole([Roles.DRIVER]), updateGeoValidator, ordersController.updateGeo)
router.post('/cancel', checkRole([Roles.DRIVER]), ordersController.cancelOrder)
router.delete('/:orderId', checkRole([Roles.MANAGER]), ordersController.deleteOrder)

export default router
