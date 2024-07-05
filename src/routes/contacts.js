import express from 'express'
import contactsController from '../controllers/contactsController.js'
import { createContactValidator, updateContactValidator } from '../validators/contacts.js'
import checkRole from '../middlewares/checkRole.js'
import Roles from '../enums/roles.js'
import paginationMiddleware from '../middlewares/paginationMiddleware.js'
import searchMiddleware from '../middlewares/searchMiddleware.js'

const router = express.Router()

router.get('/all', checkRole([Roles.MANAGER]), paginationMiddleware, contactsController.getAll)
router.post('/', checkRole([Roles.MANAGER]), createContactValidator, contactsController.create)
router.put('/:contactId', checkRole([Roles.MANAGER]), updateContactValidator, contactsController.update)
router.get(
  '/search',
  checkRole([Roles.MANAGER]),
  paginationMiddleware,
  searchMiddleware,
  contactsController.search
)
export default router
