import Sequelize, { Op } from 'sequelize'
import { validationResult } from 'express-validator'
import OrderStatus from '../enums/orderStatus.js'
import { models, sequelize } from '../models/index.js'
import costType from '../enums/costType.js'
import Roles from '../enums/roles.js'
import { sendNotification } from '../utils/send_notification.js'
import config from '../config/config.js'

const ordersSockets = {}
const geoOrderSockets = {}

/**
 * Retrieves the list of available orders.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Promise<void>} The function does not return anything.
 */
export const getAvailableOrders = async (req, res) => {
  const { limit, offset } = req.pagination

  const options = {
    where: { status: OrderStatus.CREATED },
    include: [
      {
        model: models.Truck,
        as: 'truck'
      },
      {
        model: models.LogisticsPoint,
        as: 'departure',
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
                model: models.Country,
                as: 'Country'
              },
              {
                model: models.Street,
                as: 'Street'
              },
              {
                model: models.Region,
                as: 'Region'
              }
            ]
          },
          {
            model: models.Contact,
            as: 'contacts'
          }
        ]
      },
      {
        model: models.LogisticsPoint,
        as: 'destination',
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
                model: models.Country,
                as: 'Country'
              },
              {
                model: models.Street,
                as: 'Street'
              },
              {
                model: models.Region,
                as: 'Region'
              }
            ]
          },
          {
            model: models.Contact,
            as: 'contacts'
          }
        ]
      },
      {
        model: models.Person,
        as: 'driver',
        include: { model: models.User, as: 'user', include: { model: models.Role, as: 'role' } }
      },
      {
        model: models.Person,
        as: 'manager',
        include: { model: models.User, as: 'user', include: { model: models.Role, as: 'role' } }
      },
      {
        model: models.Nomenclature,
        as: 'nomenclatures',
        include: [
          {
            model: models.Measure,
            as: 'measure'
          }
        ]
      }
    ]
  }

  try {
    const count = await models.Order.count(options)
    const orders = await models.Order.findAll({ ...options, limit, offset })

    const totalPages = Math.ceil(count / limit)
    return res.status(200).json({ totalPages, count, orders })
  } catch (error) {
    console.error(error)
    res.status(500).send()
  }
}

/**
 * Retrieves the current order for the authenticated user.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Promise} A Promise that resolves to the active order for the driver, or an error response.
 */
export const getCurrentOrder = async (req, res) => {
  try {
    const person = await models.Person.findOne({
      where: { user_id: req.user.id }
    })

    if (!person) {
      return res.status(404).send({ message: 'Driver not found' })
    }

    const activeOrder = await models.Order.findOne({
      where: {
        driver_id: person.id,
        status: {
          [Op.not]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED]
        }
      },
      include: [
        {
          model: models.Truck,
          as: 'truck'
        },
        {
          model: models.LogisticsPoint,
          as: 'departure',
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
                  model: models.Country,
                  as: 'Country'
                },
                {
                  model: models.Street,
                  as: 'Street'
                },
                {
                  model: models.Region,
                  as: 'Region'
                }
              ]
            },
            {
              model: models.Contact,
              as: 'contacts'
            }
          ]
        },
        {
          model: models.LogisticsPoint,
          as: 'destination',
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
                  model: models.Country,
                  as: 'Country'
                },
                {
                  model: models.Street,
                  as: 'Street'
                },
                {
                  model: models.Region,
                  as: 'Region'
                }
              ]
            },
            {
              model: models.Contact,
              as: 'contacts'
            }
          ]
        },
        {
          model: models.Person,
          as: 'driver',
          include: { model: models.User, as: 'user', include: { model: models.Role, as: 'role' } }
        },
        {
          model: models.Person,
          as: 'manager',
          include: { model: models.User, as: 'user', include: { model: models.Role, as: 'role' } }
        },
        {
          model: models.Nomenclature,
          as: 'nomenclatures',
          include: [
            {
              model: models.Measure,
              as: 'measure'
            }
          ]
        }
      ]
    })

    if (!activeOrder) {
      return res
        .status(404)
        .send({ message: 'No active order found for the driver' })
    }

    res.json({ order: activeOrder })
  } catch (error) {
    console.error(error)
    res.status(500).send()
  }
}

export const getOrderById = async (req, res) => {
  const { orderId } = req.params
  try {
    const order = await models.Order.findOne({
      where: { id: orderId },
      include: [
        {
          model: models.Truck,
          as: 'truck'
        },
        {
          model: models.LogisticsPoint,
          as: 'departure',
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
                  model: models.Country,
                  as: 'Country'
                },
                {
                  model: models.Street,
                  as: 'Street'
                },
                {
                  model: models.Region,
                  as: 'Region'
                }
              ]
            },
            {
              model: models.Contact,
              as: 'contacts'
            }
          ]
        },
        {
          model: models.LogisticsPoint,
          as: 'destination',
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
                  model: models.Country,
                  as: 'Country'
                },
                {
                  model: models.Street,
                  as: 'Street'
                },
                {
                  model: models.Region,
                  as: 'Region'
                }
              ]
            },
            {
              model: models.Contact,
              as: 'contacts'
            }
          ]
        },
        {
          model: models.Person,
          as: 'driver',
          include: { model: models.User, as: 'user', include: { model: models.Role, as: 'role' } }
        },
        {
          model: models.Person,
          as: 'manager',
          include: { model: models.User, as: 'user', include: { model: models.Role, as: 'role' } }
        },
        {
          model: models.Nomenclature,
          as: 'nomenclatures',
          include: [
            {
              model: models.Measure,
              as: 'measure'
            }
          ]
        }
      ]
    })

    if (!order) {
      return res.status(404).send({ message: 'Order not found' })
    }

    res.json(order)
  } catch (error) {
    console.error(error)
    res.status(500).send()
  }
}

export const getAll = async (req, res) => {
  const { limit, offset } = req.pagination
  const { status = 'all' } = req.query

  if (req.query.hasOwnProperty('search')) {
    return search(req, res)
  }

  let _status = [OrderStatus.LOADING, OrderStatus.DEPARTED, OrderStatus.CREATED, OrderStatus.CONFIRMATION, OrderStatus.COMPLETED, OrderStatus.CANCELLED]
  switch (status.toLowerCase()) {
    case 'confirmation':
      _status = [OrderStatus.CONFIRMATION]
      break
    case 'inwork':
      _status = [OrderStatus.LOADING, OrderStatus.DEPARTED]
      break
    case 'available':
      _status = [OrderStatus.CREATED]
      break
    case 'completed':
      _status = [OrderStatus.COMPLETED]
      break
    case 'cancelled':
      _status = [OrderStatus.CANCELLED]
      break
  }

  const person = await models.Person.findByUserId(req.user.id)

  const options = {
    where: { status: { [Op.in]: _status }, manager_id: person.id },
    include: [
      {
        model: models.Truck,
        as: 'truck'
      },
      {
        model: models.LogisticsPoint,
        as: 'departure',
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
                model: models.Country,
                as: 'Country'
              },
              {
                model: models.Street,
                as: 'Street'
              },
              {
                model: models.Region,
                as: 'Region'
              }
            ]
          },
          {
            model: models.Contact,
            as: 'contacts'
          }
        ]
      },
      {
        model: models.LogisticsPoint,
        as: 'destination',
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
                model: models.Country,
                as: 'Country'
              },
              {
                model: models.Street,
                as: 'Street'
              },
              {
                model: models.Region,
                as: 'Region'
              }
            ]
          },
          {
            model: models.Contact,
            as: 'contacts'
          }
        ]
      },
      {
        model: models.Person,
        as: 'driver',
        include: { model: models.User, as: 'user', include: { model: models.Role, as: 'role' } }
      },
      {
        model: models.Person,
        as: 'manager',
        include: { model: models.User, as: 'user', include: { model: models.Role, as: 'role' } }
      },
      {
        model: models.Nomenclature,
        as: 'nomenclatures',
        include: [
          {
            model: models.Measure,
            as: 'measure'
          }
        ]
      }
    ]
  }

  try {
    const orders = await models.Order.findAll({ ...options })
    const count = orders.length
    const totalPages = Math.ceil(count / limit)
    orders.slice(offset, offset + limit)
    return res.status(200).json({ totalPages, count, orders })
  } catch (error) {
    console.error(error)
    res.status(500).send()
  }
}

/**
 * Creates a new order by the manager.
 *
 * @param {Object} req - The request object, containing the order details.
 * @param {Object} res - The response object to send back the response.
 * @return {Promise} A Promise that resolves to the creation of a new order.
 */
export const createOrder = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array() })
  }
  const transaction = await sequelize.transaction()

  try {
    const {
      departureId,
      destinationId,
      nomenclatures
    } = req.body

    const person = await models.Person.findByUserId(req.user.id)
    if (!person) {
      return res.status(404).send({ message: 'Manager not found' })
    }

    // Retrieve departure and destination instances
    const departure = await models.LogisticsPoint.findByPk(departureId)
    if (!departure) {
      return res.status(404).json({ message: 'Departure not found.' })
    }

    const destination = await models.LogisticsPoint.findByPk(destinationId)
    if (!destination) {
      return res.status(404).json({ message: 'Destination not found.' })
    }

    if (!nomenclatures || !nomenclatures.length) {
      return res.status(400).json({ message: 'Nomenclatures are required' })
    }

    // Check if the cost type is valid
    if (req.body?.costType && !Object.values(costType).includes(req.body.costType)) {
      return res.status(400).json({ message: `Invalid cost type. Must be one of ${Object.values(costType).join(', ')}` })
    }

    let plannedLoadingDate = req.body?.plannedLoadingDate
    if (plannedLoadingDate != null) {
      if (plannedLoadingDate == '') {
        plannedLoadingDate = null
      } else {
        plannedLoadingDate = new Date(plannedLoadingDate)
        if (isNaN(plannedLoadingDate) || plannedLoadingDate == 'Invalid Date' || typeof plannedLoadingDate === 'string') {
          return res.status(400).json({ message: 'Invalid planned loading date.' })
        }
      }
    }

    let plannedDeliveryDate = req.body?.plannedDeliveryDate
    if (plannedDeliveryDate != null) {
      if (plannedDeliveryDate == '') {
        plannedDeliveryDate = null
      } else {
        plannedDeliveryDate = new Date(plannedDeliveryDate)
        if (isNaN(plannedDeliveryDate) || plannedDeliveryDate == 'Invalid Date' || typeof plannedDeliveryDate === 'string') {
          return res.status(400).json({ message: 'Invalid planned delivery date.' })
        }
      }
    }

    // return res.status(200).json({
    //   plannedDeliveryDate,
    //   plannedLoadingDate,
    //   "is_null_delivery": plannedDeliveryDate == null,
    //   "is_null_loading": plannedLoadingDate == null,
    //   "is_empty_delivery": plannedDeliveryDate == '',
    //   "is_empty_loading": plannedLoadingDate == '',
    // });

    // Create new order with the associated departure and destination
    const newOrder = await models.Order.create(
      {
        departure_id: departure.id,
        destination_id: destination.id,
        manager_id: person.id,
        departure_date_plan: plannedLoadingDate,
        delivery_date_plan: plannedDeliveryDate,
        cost_type: req.body?.costType,
        price_cash: req.body?.priceCash,
        price_non_cash: req.body?.priceNonCash
      },
      { transaction }
    )

    await transaction.commit()

    // Associate the order with the nomenclatures
    for (const nomenclature of nomenclatures) {
      const nomenclatureInstance = await models.Nomenclature.findByPk(nomenclature.id)
      if (!nomenclatureInstance) {
        return res.status(404).json({ message: `Nomenclature with ID ${nomenclature.id} not found` })
      }

      const nomenclatureTransaction = await sequelize.transaction()

      await models.OrderNomenclature.create(
        {
          order_id: newOrder.id,
          nomenclature_id: nomenclature.id,
          net_weight: nomenclature.netWeight
        },
        { nomenclatureTransaction }
      )

      await nomenclatureTransaction.commit()
    }

    const orderWithNomenclatures = await models.Order.findOne(
      {
        where: { id: newOrder.id },
        include: [
          {
            model: models.Truck,
            as: 'truck'
          },
          {
            model: models.LogisticsPoint,
            as: 'departure',
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
                    model: models.Country,
                    as: 'Country'
                  },
                  {
                    model: models.Street,
                    as: 'Street'
                  },
                  {
                    model: models.Region,
                    as: 'Region'
                  }
                ]
              },
              {
                model: models.Contact,
                as: 'contacts'
              }
            ]
          },
          {
            model: models.LogisticsPoint,
            as: 'destination',
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
                    model: models.Country,
                    as: 'Country'
                  },
                  {
                    model: models.Street,
                    as: 'Street'
                  },
                  {
                    model: models.Region,
                    as: 'Region'
                  }
                ]
              },
              {
                model: models.Contact,
                as: 'contacts'
              }
            ]
          },
          {
            model: models.Person,
            as: 'driver',
            include: { model: models.User, as: 'user', include: { model: models.Role, as: 'role' } }
          },
          {
            model: models.Person,
            as: 'manager',
            include: { model: models.User, as: 'user', include: { model: models.Role, as: 'role' } }
          },
          {
            model: models.Nomenclature,
            as: 'nomenclatures',
            include: [
              {
                model: models.Measure,
                as: 'measure'
              }
            ]
          }
        ]
      }
    )

    return res.status(201).json({ order: orderWithNomenclatures })
  } catch (error) {
    console.error(error)
    return res
      .status(500)
      .json({ message: 'An error occurred while creating the order.' })
  }
}

export const updateOrder = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array() })
  }
  const { orderId } = req.params
  const {
    // departureId,
    // destinationId,
    departure_date_plan,
    delivery_date_plan,
    nomenclatures,
    vin
  } = req.body

  try {
    let order = await models.Order.findByPk(orderId)
    if (order === null) {
      return res.status(404).json({ error: 'Order not found' })
    }
    if (departure_date_plan) {
      const date = new Date(departure_date_plan)

      if (date != 'Invalid date') {
        await order.update({
          departure_date_plan: new Date(departure_date_plan)
        })
      } else {
        return res.status(500).json({ error: 'Invalid delivery date' })
      }
    }

    if (delivery_date_plan) {
      const date = new Date(delivery_date_plan)

      if (date != 'Invalid date') {
        await order.update({
          delivery_date_plan: new Date(delivery_date_plan)
        })
      } else {
        return res.status(500).json({ error: 'Invalid delivery date' })
      }
    }

    await order.update({
      departure_id: req.body?.departureId,
      destination_id: req.body?.destinationId,
      cost_type: req.body?.costType,
      price_cash: req.body?.priceCash,
      price_non_cash: req.body?.priceNonCash
    })

    if (vin) {
      const truck = await models.Truck.findOrCreate({ where: { vin } })
      await order.setTruck(truck[0])
    }

    if (nomenclatures) {
      await models.OrderNomenclature.destroy({ where: { order_id: orderId } })
      await models.OrderNomenclature.bulkCreate(
        nomenclatures.map((nomenclature) => ({
          order_id: orderId,
          nomenclature_id: nomenclature.id,
          net_weight: nomenclature.netWeight
        }))
      )
    }

    order = await models.Order.findByPk(
      orderId,
      {
        include: [
          {
            model: models.Truck,
            as: 'truck'
          },
          {
            model: models.LogisticsPoint,
            as: 'departure',
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
                    model: models.Country,
                    as: 'Country'
                  },
                  {
                    model: models.Street,
                    as: 'Street'
                  },
                  {
                    model: models.Region,
                    as: 'Region'
                  }
                ]
              },
              {
                model: models.Contact,
                as: 'contacts'
              }
            ]
          },
          {
            model: models.LogisticsPoint,
            as: 'destination',
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
                    model: models.Country,
                    as: 'Country'
                  },
                  {
                    model: models.Street,
                    as: 'Street'
                  },
                  {
                    model: models.Region,
                    as: 'Region'
                  }
                ]
              },
              {
                model: models.Contact,
                as: 'contacts'
              }
            ]
          },
          {
            model: models.Person,
            as: 'driver',
            include: { model: models.User, as: 'user', include: { model: models.Role, as: 'role' } }
          },
          {
            model: models.Person,
            as: 'manager',
            include: { model: models.User, as: 'user', include: { model: models.Role, as: 'role' } }
          },
          {
            model: models.Nomenclature,
            as: 'nomenclatures',
            include: [
              {
                model: models.Measure,
                as: 'measure'
              }
            ]
          }
        ]
      })

    return res.status(200).json(order)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * Takes an order and marks it as "Waiting for Confirmation".
 *
 * @param {Object} req - The request object containing the order details.
 * @param {Object} res - The response object to send the result.
 * @return {Promise<void>} A promise that resolves when the order is marked as waiting for confirmation.
 */
export const takeOrder = async (req, res) => {
  const { orderId } = req.body

  try {
    const person = await models.Person.findByUserId(req.user.id)
    if (!person) {
      return res.status(404).send({ message: 'Driver not found' })
    }

    const existingOrder = await models.Order.findOne({
      where: {
        driver_id: person.id,
        status: {
          [Op.not]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED]
        }
      },
      include: [
        {
          model: models.Truck,
          as: 'truck'
        },
        {
          model: models.LogisticsPoint,
          as: 'departure',
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
                  model: models.Country,
                  as: 'Country'
                },
                {
                  model: models.Street,
                  as: 'Street'
                },
                {
                  model: models.Region,
                  as: 'Region'
                }
              ]
            },
            {
              model: models.Contact,
              as: 'contacts'
            }
          ]
        },
        {
          model: models.LogisticsPoint,
          as: 'destination',
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
                  model: models.Country,
                  as: 'Country'
                },
                {
                  model: models.Street,
                  as: 'Street'
                },
                {
                  model: models.Region,
                  as: 'Region'
                }
              ]
            },
            {
              model: models.Contact,
              as: 'contacts'
            }
          ]
        },
        {
          model: models.Person,
          as: 'driver',
          include: { model: models.User, as: 'user', include: { model: models.Role, as: 'role' } }
        },
        {
          model: models.Person,
          as: 'manager',
          include: { model: models.User, as: 'user', include: { model: models.Role, as: 'role' } }
        },
        {
          model: models.Nomenclature,
          as: 'nomenclatures',
          include: [
            {
              model: models.Measure,
              as: 'measure'
            }
          ]
        }
      ]
    })

    if (existingOrder) {
      return res
        .status(400)
        .send({ message: 'Driver already has an active order' })
    }

    // Mark the order as "Waiting for Confirmation"
    const result = await models.Order.update(
      { status: OrderStatus.CONFIRMATION, driver_id: person.id },
      {
        where: { id: orderId, status: OrderStatus.CREATED }
      }
    )

    if (result[0] === 0) {
      return res
        .status(404)
        .send({ message: 'Order not found or not available for confirmation' })
    }

    const order = await models.Order.findOne({
      where: { id: orderId },
      include: [
        {
          model: models.Truck,
          as: 'truck'
        },
        {
          model: models.LogisticsPoint,
          as: 'departure',
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
                  model: models.Country,
                  as: 'Country'
                },
                {
                  model: models.Street,
                  as: 'Street'
                },
                {
                  model: models.Region,
                  as: 'Region'
                }
              ]
            },
            {
              model: models.Contact,
              as: 'contacts'
            }
          ]
        },
        {
          model: models.LogisticsPoint,
          as: 'destination',
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
                  model: models.Country,
                  as: 'Country'
                },
                {
                  model: models.Street,
                  as: 'Street'
                },
                {
                  model: models.Region,
                  as: 'Region'
                }
              ]
            },
            {
              model: models.Contact,
              as: 'contacts'
            }
          ]
        },
        {
          model: models.Person,
          as: 'driver',
          include: { model: models.User, as: 'user', include: { model: models.Role, as: 'role' } }
        },
        {
          model: models.Person,
          as: 'manager',
          include: { model: models.User, as: 'user', include: { model: models.Role, as: 'role' } }
        },
        {
          model: models.Nomenclature,
          as: 'nomenclatures',
          include: [
            {
              model: models.Measure,
              as: 'measure'
            }
          ]
        }
      ]
    })

    try {
      const manager = await models.User.scope('withTokens').findOne({ where: { id: order.manager.user_id } })
      const driver = await models.User.findByPk(person.user_id)

      let fio = null
      if (person.surname) {
        fio = person.surname
      }
      ;
      if (person.name) {
        if (fio) {
          fio += ' ' + person.name
        } else {
          fio = person.name
        }
      }
      if (person.patronymic) {
        if (fio) {
          fio += ' ' + person.patronymic
        } else {
          fio = person.patronymic
        }
      }

      let body = 'Водитель'
      if (fio) {
        body += ' ' + fio
      }
      body += ` ${driver.phone} взял заказ`

      await sendNotification(
        'Статус рейса изменен',
        body,
        {
          title: 'Статус рейса изменен',
          body,
          url: `cargodelivery://order/${order.id}`
        },
        manager.fcm_token,
        manager.device_type
      )
    } catch (e) {
      console.log('something wrong with sending notification')
      console.error(e)
    }

    if (order.manager.user.id in ordersSockets) {
      ordersSockets[order.manager.user.id].send(JSON.stringify({ id: order.id, status: order.status, geo: order.geo }))
    }

    res
      .status(200)
      .send({
        message: 'Order marked as waiting for confirmation',
        order
      })
  } catch (error) {
    console.error(error)
    res.status(500).send()
  }
}

/**
 * Confirms an order by updating its status to 'loading' if the current status is 'confirmation'.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Object} The response object with a message indicating the order has been confirmed and marked as loading.
 */
export const confirmOrder = async (req, res) => {
  try {
    const { orderId, plannedLoadingDate, plannedArrivalDate, vinCode, trailerNumber } =
      req.body
    const formattedVinCode = vinCode.replace(/\s/g, '')

    const [truck] = await models.Truck.findOrCreate({
      where: { vin: formattedVinCode },
      defaults: { vin: formattedVinCode }
    })

    if (trailerNumber) {
      await truck.update({ trailerNumber })
    }

    const data = {
      status: OrderStatus.LOADING,
      truck_id: truck.id,
      last_geo_update: new Date()
    }

    if (plannedArrivalDate) {
      data.delivery_date_plan = new Date(plannedArrivalDate)
    }
    if (plannedLoadingDate) {
      data.departure_date_plan = new Date(plannedLoadingDate)
    }

    const [updated] = await models.Order.update(
      data,
      {
        where: {
          id: orderId,
          status: OrderStatus.CONFIRMATION
        }
      }
    )

    if (updated === 0) {
      return res
        .status(400)
        .send({ message: 'Order not found or not in confirmation status' })
    }

    const order = await models.Order.findOne({
      where: { id: orderId },
      include: [
        {
          model: models.Truck,
          as: 'truck'
        },
        {
          model: models.LogisticsPoint,
          as: 'departure',
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
                  model: models.Country,
                  as: 'Country'
                },
                {
                  model: models.Street,
                  as: 'Street'
                },
                {
                  model: models.Region,
                  as: 'Region'
                }
              ]
            },
            {
              model: models.Contact,
              as: 'contacts'
            }
          ]
        },
        {
          model: models.LogisticsPoint,
          as: 'destination',
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
                  model: models.Country,
                  as: 'Country'
                },
                {
                  model: models.Street,
                  as: 'Street'
                },
                {
                  model: models.Region,
                  as: 'Region'
                }
              ]
            },
            {
              model: models.Contact,
              as: 'contacts'
            }
          ]
        },
        {
          model: models.Person,
          as: 'driver',
          include: { model: models.User, as: 'user', include: { model: models.Role, as: 'role' } }
        },
        {
          model: models.Person,
          as: 'manager',
          include: { model: models.User, as: 'user', include: { model: models.Role, as: 'role' } }
        },
        {
          model: models.Nomenclature,
          as: 'nomenclatures',
          include: [
            {
              model: models.Measure,
              as: 'measure'
            }
          ]
        }
      ]
    })

    try {
      const driver = await models.User.scope('withTokens').findByPk(order.driver.user_id)

      const body = 'Менеджер подтвердил рейс'

      await sendNotification(
        'Статус рейса изменен',
        body,
        {
          title: 'Статус рейса изменен',
          body,
          url: `cargodelivery://order/${order.id}`
        },
        driver.fcm_token,
        driver.device_type
      )
    } catch (e) {
      console.log('something wrong with sending notification')
      console.error(e)
    }

    if (order.driver.user.id in ordersSockets) {
      ordersSockets[order.driver.user.id].send(JSON.stringify({ id: order.id, status: 'Confirmed', geo: order.geo }))
    }

    return res
      .status(200)
      .send({
        message: 'Order confirmed by manager and marked as loading',
        order
      })
  } catch (error) {
    console.error(error)
    return res.status(500).send()
  }
}

/**
 * Rejects the confirmation request from a driver by resetting the order status to 'created' and clearing the driver_id.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Promise<Object>} The response object with a message indicating the order has been reset.
 */
export const rejectDriver = async (req, res) => {
  try {
    const { orderId } = req.body

    const _status = [OrderStatus.CONFIRMATION, OrderStatus.LOADING, OrderStatus.CREATED]

    let order = await models.Order.findOne({
      where: { id: orderId },
      include: [
        {
          model: models.Truck,
          as: 'truck'
        },
        {
          model: models.LogisticsPoint,
          as: 'departure',
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
                  model: models.Country,
                  as: 'Country'
                },
                {
                  model: models.Street,
                  as: 'Street'
                },
                {
                  model: models.Region,
                  as: 'Region'
                }
              ]
            },
            {
              model: models.Contact,
              as: 'contacts'
            }
          ]
        },
        {
          model: models.LogisticsPoint,
          as: 'destination',
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
                  model: models.Country,
                  as: 'Country'
                },
                {
                  model: models.Street,
                  as: 'Street'
                },
                {
                  model: models.Region,
                  as: 'Region'
                }
              ]
            },
            {
              model: models.Contact,
              as: 'contacts'
            }
          ]
        },
        {
          model: models.Person,
          as: 'driver',
          include: { model: models.User, as: 'user', include: { model: models.Role, as: 'role' } }
        },
        {
          model: models.Person,
          as: 'manager',
          include: { model: models.User, as: 'user', include: { model: models.Role, as: 'role' } }
        },
        {
          model: models.Nomenclature,
          as: 'nomenclatures',
          include: [
            {
              model: models.Measure,
              as: 'measure'
            }
          ]
        }
      ]
    })

    if (!order) {
      return res
        .status(400)
        .send({ message: 'Order not found' })
    }

    try {
      const driver = await models.User.scope('withTokens').findByPk(order.driver.user.id)

      const body = 'Менеджер отклонил рейс'

      await sendNotification(
        'Статус рейса изменен',
        body,
        {
          title: 'Статус рейса изменен',
          body,
          url: `cargodelivery://order/${order.id}`
        },
        driver.fcm_token,
        driver.device_type
      )
    } catch (e) {
      console.log('something wrong with sending notification')
      console.error(e)
    }

    if (order.driver.user.id in ordersSockets) {
      ordersSockets[order.driver.user.id].send(JSON.stringify({ id: order.id, status: 'Rejected', geo: order.geo }))
    }

    // Reset the order status to 'created' and clear the driver_id
    const [updated] = await models.Order.update(
      { status: OrderStatus.CREATED, driver_id: null, truck_id: null },
      {
        where: {
          id: orderId,
          status: { [Op.in]: _status }
        }
      }
    )

    order = await models.Order.findOne({
      where: { id: orderId },
      include: [
        {
          model: models.Truck,
          as: 'truck'
        },
        {
          model: models.LogisticsPoint,
          as: 'departure',
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
                  model: models.Country,
                  as: 'Country'
                },
                {
                  model: models.Street,
                  as: 'Street'
                },
                {
                  model: models.Region,
                  as: 'Region'
                }
              ]
            },
            {
              model: models.Contact,
              as: 'contacts'
            }
          ]
        },
        {
          model: models.LogisticsPoint,
          as: 'destination',
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
                  model: models.Country,
                  as: 'Country'
                },
                {
                  model: models.Street,
                  as: 'Street'
                },
                {
                  model: models.Region,
                  as: 'Region'
                }
              ]
            },
            {
              model: models.Contact,
              as: 'contacts'
            }
          ]
        },
        {
          model: models.Person,
          as: 'driver',
          include: {
            model: models.User,
            as: 'user',
            include: {
              model: models.Role,
              as: 'role'
            }
          }
        },
        {
          model: models.Person,
          as: 'manager',
          include: {
            model: models.User,
            as: 'user',
            include: {
              model: models.Role,
              as: 'role'
            }
          }
        },
        {
          model: models.Nomenclature,
          as: 'nomenclatures',
          include: [
            {
              model: models.Measure,
              as: 'measure'
            }
          ]
        }
      ]
    })

    return res.status(200).send({
      message:
        'Driver confirmation request rejected, order status reset to created',
      order
    })
  } catch (error) {
    console.error(error)
    return res.status(500).send()
  }
}

/**
 * Updates the order status to 'departed' if the current status is 'loading'.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Promise<Object>} The updated order status or an error message.
 */
export const markOrderAsDeparted = async (req, res) => {
  try {
    const { orderId } = req.body

    // Update the order status to 'departed' if the current status is 'loading'
    const [updated] = await models.Order.update(
      { status: OrderStatus.DEPARTED },
      {
        where: {
          id: orderId,
          status: OrderStatus.LOADING
        }
      }
    )

    if (updated === 0) {
      return res
        .status(404)
        .send({ message: 'Order not found or not in loading status' })
    }

    const order = await models.Order.findOne({
      where: { id: orderId },
      include: [
        {
          model: models.Truck,
          as: 'truck'
        },
        {
          model: models.LogisticsPoint,
          as: 'departure',
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
                  model: models.Country,
                  as: 'Country'
                },
                {
                  model: models.Street,
                  as: 'Street'
                },
                {
                  model: models.Region,
                  as: 'Region'
                }
              ]
            },
            {
              model: models.Contact,
              as: 'contacts'
            }
          ]
        },
        {
          model: models.LogisticsPoint,
          as: 'destination',
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
                  model: models.Country,
                  as: 'Country'
                },
                {
                  model: models.Street,
                  as: 'Street'
                },
                {
                  model: models.Region,
                  as: 'Region'
                }
              ]
            },
            {
              model: models.Contact,
              as: 'contacts'
            }
          ]
        },
        {
          model: models.Person,
          as: 'driver',
          include: { model: models.User, as: 'user', include: { model: models.Role, as: 'role' } }
        },
        {
          model: models.Person,
          as: 'manager',
          include: { model: models.User, as: 'user', include: { model: models.Role, as: 'role' } }
        },
        {
          model: models.Nomenclature,
          as: 'nomenclatures',
          include: [
            {
              model: models.Measure,
              as: 'measure'
            }
          ]
        }
      ]
    })

    try {
      const person = await models.Person.findByUserId(req.user.id)
      const manager = await models.User.scope('withTokens').findOne({ where: { id: order.manager.user_id } })
      const driver = await models.User.findByPk(person.user_id)

      let fio = null
      if (person.surname) {
        fio = person.surname
      };
      if (person.name) {
        if (fio) {
          fio += ' ' + person.name
        } else {
          fio = person.name
        }
      }
      if (person.patronymic) {
        if (fio) {
          fio += ' ' + person.patronymic
        } else {
          fio = person.patronymic
        }
      }

      let body = 'Водитель'
      if (fio) {
        body += ' ' + fio
      }
      body += ` ${driver.phone} погрузился`

      await sendNotification(
        'Статус рейса изменен',
        body,
        {
          title: 'Статус рейса изменен',
          body,
          url: `cargodelivery://order/${order.id}`
        },
        manager.fcm_token,
        manager.device_type
      )
    } catch (e) {
      console.log('something wrong with sending notification')
      console.error(e)
    }

    if (order.manager.user.id in ordersSockets) {
      ordersSockets[order.manager.user.id].send(JSON.stringify({ id: order.id, status: order.status, geo: order.geo }))
    }

    return res
      .status(200)
      .send({ message: 'Driver has departed and order status updated', order })
  } catch (error) {
    console.error(error)
    return res.status(500).send()
  }
}

/**
 * Updates the order status to 'completed' if the current status is 'departed'.
 *
 * @param {Object} req - the request object
 * @param {Object} res - the response object
 * @return {Promise} a Promise that resolves to a response object
 */
export const markOrderAsCompleted = async (req, res) => {
  try {
    const { orderId } = req.body

    // Update the order status to 'completed' if the current status is 'departed'
    const [updated] = await models.Order.update(
      { status: OrderStatus.COMPLETED },
      {
        where: {
          id: orderId,
          status: OrderStatus.DEPARTED
        }
      }
    )

    if (updated === 0) {
      return res
        .status(404)
        .send({ message: 'Order not found or not in departed status' })
    }

    const order = await models.Order.findOne({
      where: { id: orderId },
      include: [
        {
          model: models.Truck,
          as: 'truck'
        },
        {
          model: models.LogisticsPoint,
          as: 'departure',
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
                  model: models.Country,
                  as: 'Country'
                },
                {
                  model: models.Street,
                  as: 'Street'
                },
                {
                  model: models.Region,
                  as: 'Region'
                }
              ]
            },
            {
              model: models.Contact,
              as: 'contacts'
            }
          ]
        },
        {
          model: models.LogisticsPoint,
          as: 'destination',
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
                  model: models.Country,
                  as: 'Country'
                },
                {
                  model: models.Street,
                  as: 'Street'
                },
                {
                  model: models.Region,
                  as: 'Region'
                }
              ]
            },
            {
              model: models.Contact,
              as: 'contacts'
            }
          ]
        },
        {
          model: models.Person,
          as: 'driver',
          include: { model: models.User, as: 'user', include: { model: models.Role, as: 'role' } }
        },
        {
          model: models.Person,
          as: 'manager',
          include: { model: models.User, as: 'user', include: { model: models.Role, as: 'role' } }
        },
        {
          model: models.Nomenclature,
          as: 'nomenclatures',
          include: [
            {
              model: models.Measure,
              as: 'measure'
            }
          ]
        }
      ]
    })

    try {
      const person = await models.Person.findByUserId(req.user.id)
      const manager = await models.User.scope('withTokens').findOne({ where: { id: order.manager.user_id } })
      const driver = await models.User.findByPk(person.user_id)

      let fio = null
      if (person.surname) {
        fio = person.surname
      };
      if (person.name) {
        if (fio) {
          fio += ' ' + person.name
        } else {
          fio = person.name
        }
      }
      if (person.patronymic) {
        if (fio) {
          fio += ' ' + person.patronymic
        } else {
          fio = person.patronymic
        }
      }

      let body = 'Водитель'
      if (fio) {
        body += ' ' + fio
      }
      body += ` ${driver.phone} завершил рейс`

      await sendNotification(
        'Статус рейса изменен',
        body,
        {
          title: 'Статус рейса изменен',
          body,
          url: `cargodelivery://order/${order.id}`
        },
        manager.fcm_token,
        manager.device_type
      )
    } catch (e) {
      console.log('something wrong with sending notification')
      console.error(e)
    }

    if (order.manager.user.id in ordersSockets) {
      ordersSockets[order.manager.user.id].send(JSON.stringify({ id: order.id, status: order.status, geo: order.geo }))
    }

    return res
      .status(200)
      .send({ message: 'Order has been completed successfully', order })
  } catch (error) {
    console.error(error)
    return res.status(500).send()
  }
}

/**
 * Retrieves the list of drivers who are currently on a trip.
 *
 * @param {Object} req - the request object
 * @param {Object} res - the response object
 * @return {Promise} a Promise that resolves to a response object
 */
export const getDriversOnTrip = async (req, res) => {
  try {
    const departedOrders = await models.Order.findAll({
      where: { status: OrderStatus.DEPARTED },
      include: [
        {
          model: models.Truck,
          as: 'truck'
        },
        {
          model: models.LogisticsPoint,
          as: 'departure',
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
                  model: models.Country,
                  as: 'Country'
                },
                {
                  model: models.Street,
                  as: 'Street'
                },
                {
                  model: models.Region,
                  as: 'Region'
                }
              ]
            },
            {
              model: models.Contact,
              as: 'contacts'
            }
          ]
        },
        {
          model: models.LogisticsPoint,
          as: 'destination',
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
                  model: models.Country,
                  as: 'Country'
                },
                {
                  model: models.Street,
                  as: 'Street'
                },
                {
                  model: models.Region,
                  as: 'Region'
                }
              ]
            },
            {
              model: models.Contact,
              as: 'contacts'
            }
          ]
        },
        {
          model: models.Person,
          as: 'driver',
          include: { model: models.User, as: 'user', include: { model: models.Role, as: 'role' } }
        },
        {
          model: models.Person,
          as: 'manager',
          include: { model: models.User, as: 'user', include: { model: models.Role, as: 'role' } }
        },
        {
          model: models.Nomenclature,
          as: 'nomenclatures',
          include: [
            {
              model: models.Measure,
              as: 'measure'
            }
          ]
        }
      ]
    })

    const drivers = departedOrders.map((order) => order.driver)

    return res.status(200).send(drivers)
  } catch (error) {
    console.error(error)
    return res
      .status(500)
      .send({ message: 'An error occurred while retrieving drivers on trip' })
  }
}

/**
 * Updates the geo location of an order.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @return {Promise} A promise that resolves to the HTTP response.
 */
export const updateGeo = async (req, res) => {
  try {
    const { orderId, latitude, longitude } = req.body
    let order = await models.Order.findOne({
      where: { id: orderId }
    })

    if (!order) {
      return res.status(404).send({ message: 'Order not found' })
    }

    order.geo = `POINT (${latitude} ${longitude})`
    order.last_geo_update = new Date()
    await order.save()

    order = await models.Order.findOne({
      where: { id: orderId },
      include: [
        {
          model: models.Truck,
          as: 'truck'
        },
        {
          model: models.LogisticsPoint,
          as: 'departure',
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
                  model: models.Country,
                  as: 'Country'
                },
                {
                  model: models.Street,
                  as: 'Street'
                },
                {
                  model: models.Region,
                  as: 'Region'
                }
              ]
            },
            {
              model: models.Contact,
              as: 'contacts'
            }
          ]
        },
        {
          model: models.LogisticsPoint,
          as: 'destination',
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
                  model: models.Country,
                  as: 'Country'
                },
                {
                  model: models.Street,
                  as: 'Street'
                },
                {
                  model: models.Region,
                  as: 'Region'
                }
              ]
            },
            {
              model: models.Contact,
              as: 'contacts'
            }
          ]
        },
        {
          model: models.Person,
          as: 'driver',
          include: { model: models.User, as: 'user', include: { model: models.Role, as: 'role' } }
        },
        {
          model: models.Person,
          as: 'manager',
          include: { model: models.User, as: 'user', include: { model: models.Role, as: 'role' } }
        },
        {
          model: models.Nomenclature,
          as: 'nomenclatures',
          include: [
            {
              model: models.Measure,
              as: 'measure'
            }
          ]
        }
      ]
    })

    if (orderId in geoOrderSockets) {
      for (const socket of geoOrderSockets[orderId]) {
        socket.send(JSON.stringify({
          latitude: order.geo.coordinates[0],
          longitude: order.geo.coordinates[1]
        }))
      }
    }

    return res.status(200).send({ message: 'Order geo updated successfully', order })
  } catch (error) {
    console.error(error)
    return res
      .status(500)
      .send({ message: 'An error occurred while updating order geo' })
  }
}

export const getManagerPhone = async (req, res) => {
  const person = await models.Person.findOne({
    where: { user_id: req.user.id }
  })

  const order = await models.Order.findOne({
    where: { driver_id: person.id },
    include: [
      {
        model: models.Person,
        as: 'manager',
        include: { model: models.User, as: 'user' }
      }
    ]
  })

  if (!order) {
    return res.status(404).send({ message: 'Order not found' })
  }

  const user = await models.User.findOne({
    where: { id: order.manager.user_id }
  })

  if (!user) {
    return res.status(404).send({ message: 'User not found' })
  }

  return res.status(200).send({
    phone: user.phone,
    manager: order.manager
  })
}

export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.body

    const _status = [OrderStatus.LOADING, OrderStatus.CONFIRMATION]

    const person = await models.Person.findByUserId(req.user.id)

    // Reset the order status to 'created' and clear the driver_id
    const [updated] = await models.Order.update(
      { status: OrderStatus.CREATED, driver_id: null, truck_id: null },
      {
        where: {
          id: orderId,
          status: { [Op.in]: _status },
          driver_id: person.id
        }
      }
    )

    if (updated === 0) {
      return res
        .status(400)
        .send({ message: 'Order not found' })
    }

    const order = await models.Order.findOne({
      where: { id: orderId },
      include: [
        {
          model: models.Truck,
          as: 'truck'
        },
        {
          model: models.LogisticsPoint,
          as: 'departure',
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
                  model: models.Country,
                  as: 'Country'
                },
                {
                  model: models.Street,
                  as: 'Street'
                },
                {
                  model: models.Region,
                  as: 'Region'
                }
              ]
            },
            {
              model: models.Contact,
              as: 'contacts'
            }
          ]
        },
        {
          model: models.LogisticsPoint,
          as: 'destination',
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
                  model: models.Country,
                  as: 'Country'
                },
                {
                  model: models.Street,
                  as: 'Street'
                },
                {
                  model: models.Region,
                  as: 'Region'
                }
              ]
            },
            {
              model: models.Contact,
              as: 'contacts'
            }
          ]
        },
        {
          model: models.Person,
          as: 'driver',
          include: { model: models.User, as: 'user', include: { model: models.Role, as: 'role' } }
        },
        {
          model: models.Person,
          as: 'manager',
          include: { model: models.User, as: 'user', include: { model: models.Role, as: 'role' } }
        },
        {
          model: models.Nomenclature,
          as: 'nomenclatures',
          include: [
            {
              model: models.Measure,
              as: 'measure'
            }
          ]
        }
      ]
    })

    if (order.manager.user.id in ordersSockets) {
      ordersSockets[order.manager.user.id].send(JSON.stringify({ id: order.id, status: order.status, geo: order.geo }))
    }

    return res.status(200).send({
      message:
        'Driver confirmation request rejected, order status reset to created',
      order
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params
    const order = await models.Order.findByPk(orderId)
    if (!order) {
      return res.status(404).send({ message: 'Order not found' })
    }

    await order.destroy()
    return res.status(200).send({ message: 'Order deleted successfully' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export const search = async (req, res) => {
  try {
    const { limit, offset } = req.pagination
    const search = req.query.search

    const searchVal = { [Sequelize.Op.or]: [] }

    // by Logistic point name
    searchVal[Sequelize.Op.or].push({
      [Sequelize.Op.or]: [
        {
          '$departure.name$': {
            [Sequelize.Op.iLike]: `%${search}%`
          }
        },
        {
          '$destination.name$': {
            [Sequelize.Op.iLike]: `%${search}%`
          }
        }
      ]
    })

    // by address name
    searchVal[Sequelize.Op.or].push({
      [Sequelize.Op.or]: [
        {
          '$departure.Address.name$': {
            [Sequelize.Op.iLike]: `%${search}%`
          }
        },
        {
          '$destination.Address.name$': {
            [Sequelize.Op.iLike]: `%${search}%`
          }
        }
      ]
    })

    // by order adress
    searchVal[Sequelize.Op.or].push({
      [Sequelize.Op.or]: []
    })

    const types = ['departure', 'destination']
    const words = search.split(' ')

    for (const type of types) {
      const findTabs = [`$${type}.Address.Country.name$`, `$${type}.Address.City.name$`, `$${type}.Address.Street.name$`, `$${type}.Address.house$`]
      const sch = {
        [Sequelize.Op.or]: []
      }

      if (words.length === 1) {
        for (let i = 0; i < 3; i++) {
          sch[Sequelize.Op.or].push({
            [findTabs[i]]: {
              [Sequelize.Op.iLike]: `%${search}%`
            }
          })
        }
      } else if (words.length === 2) {
        for (const word of words) {
          for (const tab of findTabs) {
            sch[Sequelize.Op.or].push({
              [tab]: {
                [Sequelize.Op.iLike]: `%${word}%`
              }
            })
          }
        }
      } else {
        const perms = [[0, 2], [1, 2], [2, 3]]

        for (const perm of perms) {
          for (const word1 of words) {
            for (const word2 of words) {
              sch[Sequelize.Op.or].push({
                [Sequelize.Op.and]: [
                  {
                    [findTabs[perm[0]]]: {
                      [Sequelize.Op.iLike]: `%${word1}%`
                    }
                  },
                  {
                    [findTabs[perm[1]]]: {
                      [Sequelize.Op.iLike]: `%${word2}%`
                    }
                  }
                ]
              })
            }
          }
        }
      }

      searchVal[Sequelize.Op.or][2][Sequelize.Op.or].push(sch)
    }

    const attrs = {
      where: searchVal,
      attributes: [
        'id'
      ],
      separate: true,
      include: [
        {
          model: models.LogisticsPoint,
          as: 'departure',
          attributes: ['name'],
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
                  model: models.Country,
                  as: 'Country'
                },
                {
                  model: models.Street,
                  as: 'Street'
                }
              ],
              attributes: ['house', 'name']
            }
          ]
        },
        {
          model: models.LogisticsPoint,
          as: 'destination',
          attributes: ['name'],
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
                  model: models.Country,
                  as: 'Country'
                },
                {
                  model: models.Street,
                  as: 'Street'
                }
              ],
              attributes: ['house', 'name']
            }
          ]
        }
      ],
      limit,
      offset
    }

    // const count = await models.Order.count(attrs);
    const ordersIdsModel = await models.Order.findAll(attrs)

    const count = ordersIdsModel.length
    const totalPages = Math.ceil(count / limit)

    const orders = []
    for (let i = 0; i < count; i++) {
      const orderId = ordersIdsModel[i].id

      const order = await models.Order.findOne({
        where: { id: orderId },
        include: [
          {
            model: models.Truck,
            as: 'truck'
          },
          {
            model: models.LogisticsPoint,
            as: 'departure',
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
                    model: models.Country,
                    as: 'Country'
                  },
                  {
                    model: models.Street,
                    as: 'Street'
                  },
                  {
                    model: models.Region,
                    as: 'Region'
                  }
                ]
              },
              {
                model: models.Contact,
                as: 'contacts'
              }
            ]
          },
          {
            model: models.LogisticsPoint,
            as: 'destination',
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
                    model: models.Country,
                    as: 'Country'
                  },
                  {
                    model: models.Street,
                    as: 'Street'
                  },
                  {
                    model: models.Region,
                    as: 'Region'
                  }
                ]
              },
              {
                model: models.Contact,
                as: 'contacts'
              }
            ]
          },
          {
            model: models.Person,
            as: 'driver',
            include: { model: models.User, as: 'user', include: { model: models.Role, as: 'role' } }
          },
          {
            model: models.Person,
            as: 'manager',
            include: { model: models.User, as: 'user', include: { model: models.Role, as: 'role' } }
          },
          {
            model: models.Nomenclature,
            as: 'nomenclatures',
            include: [
              {
                model: models.Measure,
                as: 'measure'
              }
            ]
          }
        ]
      })

      orders.push(order)
    }

    return res.status(200).json({ totalPages, count, orders })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export const getGeo = async (req, res) => {
  try {
    const { orderId } = req.params
    const order = await models.Order.findByPk(orderId)

    if (!order) {
      return res.status(404).send({ message: 'Order not found' })
    }

    if (!order.hasOwnProperty('geo') || !order.geo) {
      return res.status(404).send({ message: "Order doen't have geolocation" })
    }

    return res.status(200).send({
      latitude: order.geo.coordinates[0],
      longitude: order.geo.coordinates[1]
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export const updates = async (req, res) => {
  try {
    const ws = await res.accept()
    ordersSockets[req.user.id] = ws

    ws.on('close', () => {
      delete ordersSockets[req.user.id]
    })
  } catch (e) {
    console.log(e)
    res.status(500).send({ message: 'Internal server error' })
  }
}

export const location = async (req, res) => {
  try {
    const ws = await res.accept()
    const { orderId } = req.params

    if (isNaN(orderId) || isNaN(parseFloat(orderId))) {
      ws.send(JSON.stringify({ status: 'Order id should be a number' }))
      ws.close()

      return
    }

    let order = await models.Order.findOne({ where: { id: orderId } })

    if (!order) {
      ws.send(JSON.stringify({ status: 'Order not found' }))
      ws.close()

      return
    }

    let interval = null

    switch (req.user.role) {
      case Roles.MANAGER:
        interval = setInterval(async () => {
          order = await models.Order.findOne({ where: { id: orderId } })

          if (Object.prototype.hasOwnProperty.call(order.dataValues, 'geo') && order.geo) {
            ws.send(JSON.stringify({
              latitude: order.geo.coordinates[0],
              longitude: order.geo.coordinates[1]
            }))
          }
        }, 15 * 60 * 1000)

        order = await models.Order.findOne({ where: { id: orderId } })

        if (Object.prototype.hasOwnProperty.call(order.dataValues, 'geo') && order.geo) {
          ws.send(JSON.stringify({
            latitude: order.geo.coordinates[0],
            longitude: order.geo.coordinates[1]
          }))
        }

        ws.on('close', function close () {
          clearInterval(interval)
          ordersSockets[orderId] = ordersSockets[orderId].filter((socket) => socket !== ws)
          if (ordersSockets[orderId].length === 0) {
            delete ordersSockets[orderId]
          }
        })

        if (orderId in ordersSockets) {
          ordersSockets[orderId].push(ws)
        } else {
          ordersSockets[orderId] = [ws]
        }

        break

      default:
        ws.send(JSON.stringify({ status: "You don't need websocket connection" }))
        ws.close()

        break
    }
  } catch (e) {
    console.log(e)
    res.status(500).send({ message: 'Internal server error' })
  }
}

async function checkLocationDisabled () {
  const orders = await models.Order.findAll({
    where: {
      status: OrderStatus.DEPARTED,
      last_geo_update: {
        [Op.lt]: new Date(new Date() - config.order_geo_update_interval)
      }
    },
    include: [
      {
        model: models.Person,
        as: 'driver',
        include: { model: models.User, as: 'user', include: { model: models.Role, as: 'role' } }
      },
      {
        model: models.Person,
        as: 'manager',
        include: { model: models.User, as: 'user', include: { model: models.Role, as: 'role' } }
      }
    ]
  })

  console.log(orders)

  if (!orders) {
    return
  }

  for (const order of orders) {
    const manager = await models.User.scope('withTokens').findOne({ where: { id: order.manager.user_id } })
    const driver = await models.User.findByPk(order.driver.user_id)

    const body = `Водитель ${driver.phone} не обновлял геолокацию в течение ${config.order_geo_update_interval / (1000 * 60)} минут`

    await sendNotification(
      'Геолокация отключена',
      body,
      {
        title: 'Геолокация отключена',
        body,
        url: `cargodelivery://order/${order.id}`
      },
      manager.fcm_token,
      manager.device_type
    )
  }
}

setInterval(checkLocationDisabled, config.order_geo_update_interval / 2)

export default {
  getAvailableOrders,
  getCurrentOrder,
  getOrderById,
  getAll,
  createOrder,
  takeOrder,
  confirmOrder,
  rejectDriver,
  markOrderAsDeparted,
  markOrderAsCompleted,
  getDriversOnTrip,
  updateGeo,
  updateOrder,
  getManagerPhone,
  cancelOrder,
  deleteOrder,
  search,
  getGeo,
  updates,
  location
}
