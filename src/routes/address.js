import express from 'express'
import addressController from '../controllers/addressController.js'
import { createAddressValidator, updateAddressValidator } from '../validators/address.js'
import checkRole from '../middlewares/checkRole.js'
import Roles from '../enums/roles.js'
import paginationMiddleware from '../middlewares/paginationMiddleware.js'
import searchMiddleware from '../middlewares/searchMiddleware.js'

const router = express.Router()

router.post('/', checkRole([Roles.MANAGER]), createAddressValidator, addressController.create)
router.put('/:addressId', checkRole([Roles.MANAGER]), updateAddressValidator, addressController.update)
router.get('/all', checkRole([Roles.MANAGER]), addressController.getAll)
router.get('/search', checkRole([Roles.MANAGER]), paginationMiddleware, searchMiddleware, addressController.search)

export default router
