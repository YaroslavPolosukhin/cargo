import express from 'express'
import measureController from '../controllers/measureController.js'
// import checkRole from '../middlewares/checkRole.js'
import paginationMiddleware from '../middlewares/paginationMiddleware.js'
// import Roles from '../enums/roles.js'

const router = express.Router()

router.get('/all', paginationMiddleware, measureController.getAll)
export default router
