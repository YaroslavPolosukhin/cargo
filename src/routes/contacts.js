import express from 'express'
import contactsController from '../controllers/contactsController.js'
import { createContactValidator, updateContactValidator } from '../validators/contacts.js'
import checkRole from '../middlewares/checkRole.js'
import Roles from '../enums/roles.js'

const router = express.Router()

router.get('/all', checkRole([Roles.MANAGER]), contactsController.getAll)
router.post('/', checkRole([Roles.MANAGER]), createContactValidator, contactsController.create)
router.put('/:contactId', checkRole([Roles.MANAGER]), updateContactValidator, contactsController.update)
export default router
