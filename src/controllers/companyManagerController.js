import roles from '../enums/roles.js'
import { models } from '../models/index.js'
import { validationResult } from 'express-validator'
import EmploymentType from '../enums/employmentType.js'
import { sendNotification } from '../utils/send_notification.js'
import { search } from './managerController.js'
import { search as searchOrder } from './ordersController.js'
import OrderStatus from '../enums/orderStatus.js'
import { Op } from 'sequelize'

export const getRoles = async (req, res) => {
  const allowedRoles = [roles.COMPANY_DRIVER]

  const modelRoles = await models.Role.findAll({
    where: {
      name: allowedRoles
    }
  })

  return res.status(200).json({ roles: modelRoles })
}

export const confirm = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array() })
  }

  const {
    userId,
    name,
    surname,
    patronymic,
    inn,
    employmentType,
    jobPositionId,
    email,
    telegram,
    contragentId,
    passportId,
    drivingLicenseNumber,
    drivingLicenseSerial
  } = req.body

  try {
    let jobPosition = null
    if (jobPositionId) {
      jobPosition = await models.JobPosition.findByPk(jobPositionId)
      if (!jobPosition) {
        return res.status(400).json({ message: 'Job position not found' })
      }
    }

    let contragent = null
    if (contragentId) {
      // Get or create Contragent
      contragent = await models.Contragent.findByPk(contragentId)
      if (!contragent) {
        return res.status(400).json({ message: 'Contragent not found' })
      }
    }

    let passport = null
    if (passportId) {
      passport = await models.Passport.findByPk(passportId)
      if (!passport) {
        return res.status(400).json({ message: 'Passport not found' })
      }
    }

    let drivingLicenseId = null
    if (drivingLicenseSerial && drivingLicenseNumber) {
      const drivingLicense = await models.DrivingLicence.create({
        serial: drivingLicenseSerial,
        number: drivingLicenseNumber
      })

      drivingLicenseId = drivingLicense.id

      if (req.files) {
        const drivingLicensePhotos = req.files.map((file) => {
          return {
            driving_license_id: drivingLicenseId,
            photo_url: file.path
          }
        })

        if (drivingLicensePhotos.length > 0) {
          await models.DrivingLicencePhoto.bulkCreate(drivingLicensePhotos)
        }
      }
    }

    const person = await models.Person.findByUserId(userId)
    if (!person) {
      return res.status(400).json({ message: 'Driver not found' })
    }

    const user = await models.User.scope('withTokens').findByPk(userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    await user.update({ responsible_user: req.user.id, approved_company: true })
    await person.update({
      name,
      surname,
      patronymic,
      job_position_id: jobPosition ? jobPosition.id : null,
      inn,
      passport_id: passport ? passport.id : null,
      self_employed: employmentType === EmploymentType.SELF_EMPLOYED,
      individual: employmentType === EmploymentType.INDIVIDUAL,
      contragent_id: contragent ? contragent.id : null,
      email,
      telegram,
      driving_license_id: drivingLicenseId
    })

    try {
      const body = 'Регистрация подтверждена менеджером'

      await sendNotification('Ваш статус обновлен', body, { title: 'Ваш статус обновлен', body }, user.fcm_token, user.device_type)
    } catch (e) {
      console.log('something wrong with sending notification')
      console.error(e)
    }

    res
      .status(200)
      .json({
        message: 'Driver registration confirmed successfully',
        person
      })
  } catch (error) {
    console.error(error)
    res.status(500).send()
  }
}

export const getUnapprovedUser = async (req, res) => {
  try {
    const { limit, offset } = req.pagination

    if (!('roleId' in req.query)) {
      return res.status(400).json({ error: 'roleId query is required.' })
    }
    const { roleId } = req.query

    if (Object.prototype.hasOwnProperty.call(req.query, 'search')) {
      req.user_approved = false
      return search(req, res)
    }

    const role = await models.Role.findByPk(roleId)
    if (!role) {
      return res.status(400).json({ message: 'Role not found' })
    }

    const person = await models.Person.findByUserId(req.user.id)
    const contragentId = person.contragent_id

    const attrs = {
      where: {
        approved: false,
        role_id: parseInt(roleId)
      },
      include: [
        {
          model: models.Role,
          as: 'role',
          attributes: ['name']
        },
        {
          model: models.Person,
          as: 'Person',
          include: [
            { model: models.Contragent, as: 'contragent' },
            { model: models.JobPosition, as: 'jobPosition' },
            {
              model: models.DrivingLicence,
              as: 'drivingLicense',
              include: [
                {
                  model: models.DrivingLicencePhoto,
                  as: 'photos'
                }
              ]
            },
            {
              model: models.Passport,
              as: 'passport',
              include: [
                {
                  model: models.PassportPhoto,
                  as: 'photos'
                }
              ]
            }
          ],
          where: {
            contragent_id: contragentId
          }
        }
      ]
    }

    let users = await models.User.findAll({ ...attrs })
    const count = users.length

    users = users.slice(offset, offset + limit)

    const totalPages = Math.ceil(count / limit)
    return res.status(200).json({ totalPages, count, users })
  } catch (error) {
    console.error(error)
    res.status(500).send()
  }
}

export const getAll = async (req, res) => {
  const { limit, offset } = req.pagination
  const { status = 'all' } = req.query

  if (Object.prototype.hasOwnProperty.call(req.query, 'search')) {
    return searchOrder(req, res)
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
  const contragentId = person.contragent_id

  const options = {
    where: { status: { [Op.in]: _status } },
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
    const nsorders = await models.Order.findAll({ ...options })
    let orders = []
    if (status.toLowerCase() !== 'available') {
      for (const order of nsorders) {
        if (order.status === OrderStatus.CREATED) {
          orders.push(order)
          continue
        }

        if (order.driver.contragent_id === contragentId) {
          orders.push(order)
        }
      }
    } else {
      orders = nsorders
    }

    const count = orders.length
    const totalPages = Math.ceil(count / limit)
    orders = orders.slice(offset, offset + limit)
    return res.status(200).json({ totalPages, count, orders })
  } catch (error) {
    console.error(error)
    res.status(500).send()
  }
}
