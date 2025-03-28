import { models } from '../models/index.js'
import { validationResult } from 'express-validator'
import { Op } from 'sequelize'

export const getNomenclatures = async (req, res) => {
  try {
    if (req.query.hasOwnProperty('name')) {
      return getNomenclaturesByName(req, res)
    }

    const { limit, offset } = req.pagination

    let nomenclatures = await models.Nomenclature.findAll({
      include: {
        model: models.Measure,
        as: 'measure'
      }
    })

    const count = nomenclatures.length
    nomenclatures = nomenclatures.slice(offset, offset + limit)

    const totalPages = Math.ceil(count / limit)

    return res.status(200).json({ totalPages, count, nomenclatures })
  } catch (error) {
    console.error(error)
    return res.status(500).send({ message: 'Error retrieving nomenclatures' })
  }
}

export const getNomenclaturesByName = async (req, res) => {
  const { name } = req.query
  if (!name) {
    return res.status(400).json({ message: 'Name is required.' })
  }

  const { limit, offset } = req.pagination

  try {
    let nomenclatures = await models.Nomenclature.findAll({
      where: {
        name: {
          [Op.like]: `%${name}%`
        }
      },
      include: [
        {
          model: models.Measure,
          as: 'measure'
        }
      ]
    })

    const count = nomenclatures.length
    nomenclatures = nomenclatures.slice(offset, offset + limit)

    const totalPages = Math.ceil(count / limit)

    return res.status(200).json({ totalPages, count, nomenclatures })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Internal server error.' })
  }
}

export const createNomenclature = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array() })
  }

  try {
    let { name, measureId } = req.body
    if (!name) {
      return res.status(400).send({ message: 'Name is required' })
    }

    const measureExists = await models.Measure.findByPk(measureId)
    if (!measureExists) {
      const measure = await models.Measure.findOrCreate({ where: { name: 'т' } })
      measureId = measure[0].id
    }

    await models.Nomenclature.create({ name, measure_id: measureId })

    const nomenclatures = await models.Nomenclature.findAll({
      include: [
        {
          model: models.Measure,
          as: 'measure'
        }
      ]
    })
    return res.status(201).json(nomenclatures)
  } catch (error) {
    console.error(error)
    return res.status(500).send({ message: 'Error creating new nomenclature' })
  }
}

export const getNomenclature = async (req, res) => {
  try {
    const { nomenclatureId } = req.params
    const nomenclature = await models.Nomenclature.findByPk(nomenclatureId)
    if (nomenclature === null) {
      return res.status(404).json({ error: 'Nomenclature not found' })
    }
    const measure = await models.Measure.findByPk(nomenclature.measure_id)
    nomenclature.dataValues.measure = measure.dataValues
    delete nomenclature.dataValues.measure_id
    return res.status(200).json(nomenclature)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const updateNomenclature = async (req, res) => {
  try {
    const { nomenclatureId } = req.params
    const { name, measureId } = req.body

    if (!name && !measureId) {
      return res.status(400).json({ error: 'Validation error' })
    }

    const nomenclature = await models.Nomenclature.findByPk(nomenclatureId)
    if (nomenclature === null) {
      return res.status(404).json({ error: 'Nomenclature not found' })
    }

    if (measureId) {
      const measureExists = await models.Measure.findByPk(measureId)
      if (!measureExists) {
        return res.status(400).json({ error: 'Measure not found' })
      }

      nomenclature.measure_id = measureId
    }

    if (name) {
      nomenclature.name = name
    }

    await nomenclature.save()
    return res.status(200).json(nomenclature)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const deleteNomenclature = async (req, res) => {
  try {
    const { nomenclatureId } = req.params

    const nomenclature = await models.Nomenclature.findByPk(nomenclatureId)

    if (nomenclature === null) {
      return res.status(404).json({ error: 'Nomenclature not found' })
    }

    await nomenclature.destroy()
    return res.status(200).json({ message: 'Nomenclature has been deleted' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default {
  getNomenclatures,
  createNomenclature,
  getNomenclaturesByName,
  updateNomenclature,
  deleteNomenclature,
  getNomenclature
}
