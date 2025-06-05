import { validationResult } from 'express-validator'
import { models, sequelize } from '../models/index.js'
import Sequelize from 'sequelize'

export const create = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array() })
  }

  let { name, addressId, contacts, geo } = req.body
  const transaction = await sequelize.transaction()

  if (geo) { geo = `POINT (${geo.lat} ${geo.lon})` }

  try {
    const logisticsPoint = await models.LogisticsPoint.create(
      {
        name,
        address_id: addressId,
        geo
      },
      { transaction }
    )

    await logisticsPoint.addContacts(contacts, { transaction })
    await transaction.commit()

    const logisticPoints = await models.LogisticsPoint.findAll({
      include: [
        {
          model: models.Address,
          as: 'Address',
          include: [
            {
              model: models.City,
              as: 'City'
            },
            {
              model: models.Street,
              as: 'Street'
            },
            {
              model: models.Country,
              as: 'Country'
            },
            {
              model: models.Region,
              as: 'Region'
            }
          ]
        }
      ],
      order: [
        ['name', 'ASC']
      ]
    })

    for (const point of logisticPoints) {
      point.dataValues.contacts = await models.LogisticsPointContacts.findAll({
        where: {
          logistics_point_id: point.id
        },
        include: [
          {
            model: models.Contact,
            as: 'contact'
          }
        ],
        attributes: [
          'contact_id'
        ]
      })
    }
    res.status(201).json({ logisticPoints })
  } catch (error) {
    console.error(error)
    await transaction.rollback()
    res.status(400).json({ message: 'Error creating new logistics point' })
  }
}

export const getOne = async (req, res) => {
  const { pointId } = req.params

  try {
    const logisticPoint = await models.LogisticsPoint.findByPk(pointId, {
      include: [
        {
          model: models.Address,
          as: 'Address',
          include: [
            {
              model: models.City,
              as: 'City'
            },
            {
              model: models.Street,
              as: 'Street'
            },
            {
              model: models.Country,
              as: 'Country'
            },
            {
              model: models.Region,
              as: 'Region'
            }
          ]
        }
      ]
    })
    if (logisticPoint === null) {
      return res.status(404).json({ error: 'Logistic point not found' })
    }

    logisticPoint.dataValues.contacts = await models.LogisticsPointContacts.findAll({
      where: {
        logistics_point_id: logisticPoint.id
      },
      include: [
        {
          model: models.Contact,
          as: 'contact'
        }
      ],
      attributes: [
        'contact_id'
      ]
    })

    return res.status(200).json({ logisticPoint })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const update = async (req, res) => {
  const { pointId } = req.params

  let { name, address_id, contacts, geo } = req.body

  if (geo) { geo = `POINT (${geo.lat} ${geo.lon})` }

  try {
    const logisticPoint = await models.LogisticsPoint.findByPk(pointId)
    if (logisticPoint === null) {
      return res.status(404).json({ error: 'Logistic point not found' })
    }
    await logisticPoint.update({ name, address_id, geo })

    await logisticPoint.setContacts(contacts)

    return res.status(200).json(logisticPoint)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const getAll = async (req, res) => {
  const { limit, offset } = req.pagination

  try {
    if (req.query.hasOwnProperty('search')) {
      return search(req, res)
    }

    const count = await models.LogisticsPoint.count({})
    const logisticPoints = await models.LogisticsPoint.findAll({
      include: [
        {
          model: models.Address,
          as: 'Address',
          include: [
            {
              model: models.City,
              as: 'City'
            },
            {
              model: models.Street,
              as: 'Street'
            },
            {
              model: models.Country,
              as: 'Country'
            },
            {
              model: models.Region,
              as: 'Region'
            }
          ]
        }
      ],
      order: [
        ['name', 'ASC']
      ],
      limit,
      offset
    })

    for (const point of logisticPoints) {
      const logisticPointContacts = await models.LogisticsPointContacts.findAll({
        where: {
          logistics_point_id: point.id
        },
        include: [
          {
            model: models.Contact,
            as: 'contact'
          }
        ],
        attributes: [
          'contact_id'
        ]
      })
      point.dataValues.contacts = logisticPointContacts
    }

    const totalPages = Math.ceil(count / limit)
    res.json({ totalPages, count, logisticPoints })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const deleteLogisticsPoint = async (req, res) => {
  const { pointId } = req.params

  try {
    const logisticPoint = await models.LogisticsPoint.findByPk(pointId)
    if (logisticPoint === null) {
      return res.status(404).json({ error: 'Logistic point not found' })
    }

    // Check if the logistic point has any associated contacts
    const orders = await models.Order.findAll({
      where: {
        [Sequelize.Op.or]: [
          { departure_id: pointId },
          { destination_id: pointId }
        ]
      }
    })
    if (orders.length > 0) {
      return res.status(400).json({ message: 'Cannot delete logistic point with associated orders' })
    }

    await logisticPoint.destroy()

    return res.status(200).json({ message: 'Logistic point has been deleted' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const search = async (req, res) => {
  const { limit, offset } = req.pagination
  const search = req.query.search

  try {
    const count = await models.LogisticsPoint.count({
      where: {
        name: {
          [Sequelize.Op.iLike]: `%${search}%`
        }
      }
    })
    const logisticPoints = await models.LogisticsPoint.findAll({
      where: {
        name: {
          [Sequelize.Op.iLike]: `%${search}%`
        }
      },
      include: [
        {
          model: models.Address,
          as: 'Address',
          include: [
            {
              model: models.City,
              as: 'City'
            },
            {
              model: models.Street,
              as: 'Street'
            },
            {
              model: models.Country,
              as: 'Country'
            },
            {
              model: models.Region,
              as: 'Region'
            }
          ]
        }
      ],
      order: [
        ['name', 'ASC']
      ],
      limit,
      offset
    })

    for (const point of logisticPoints) {
      point.dataValues.contacts = await models.LogisticsPointContacts.findAll({
        where: {
          logistics_point_id: point.id
        },
        include: [
          {
            model: models.Contact,
            as: 'contact'
          }
        ],
        attributes: [
          'contact_id'
        ]
      })
    }

    const totalPages = Math.ceil(count / limit)
    res.json({ totalPages, count, logisticPoints })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export default { create, getAll, update, deleteLogisticsPoint, search, getOne }
