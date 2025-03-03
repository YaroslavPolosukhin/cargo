import express from 'express'
import nomenclatureController from '../controllers/nomenclatureController.js'
import { createNomenclatureValidator } from '../validators/nomenclature.js'
import checkRole from '../middlewares/checkRole.js'
import Roles from '../enums/roles.js'
import paginationMiddleware from '../middlewares/paginationMiddleware.js'
const router = express.Router()

router.get('/all', paginationMiddleware, nomenclatureController.getNomenclatures)
router.get('/search', paginationMiddleware, nomenclatureController.getNomenclaturesByName)
router.post(
  '/',
  checkRole([Roles.MANAGER]),
  createNomenclatureValidator,
  nomenclatureController.createNomenclature
)
router.get(
  '/:nomenclatureId',
  checkRole([Roles.MANAGER]),
  nomenclatureController.getNomenclature
)
router.put(
  '/:nomenclatureId',
  checkRole([Roles.MANAGER]),
  nomenclatureController.updateNomenclature
)
router.delete(
  '/:nomenclatureId',
  checkRole([Roles.MANAGER]),
  nomenclatureController.deleteNomenclature
)
export default router
