import roles from '../enums/roles.js'
import { models } from '../models/index.js'
import { validationResult } from 'express-validator'
import EmploymentType from '../enums/employmentType.js'
import { sendNotification } from '../utils/send_notification.js'
import { companyManagerSockets } from './managerController.js'
import { ordersSockets, search as searchOrder } from './ordersController.js'
import OrderStatus from '../enums/orderStatus.js'
import { Op } from 'sequelize'
import { getFullUrl } from '../utils/utils.js'
import { search } from './driversController.js'

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

    const updateQuery = {
      name,
      surname,
      patronymic,
      job_position_id: jobPosition ? jobPosition.id : null,
      inn,
      passport_id: passport ? passport.id : null,
      self_employed: employmentType === EmploymentType.SELF_EMPLOYED,
      individual: employmentType === EmploymentType.INDIVIDUAL,
      email,
      telegram,
      driving_license_id: drivingLicenseId
    }

    if (contragent) {
      updateQuery.contragent_id = contragent.id
    }

    await person.update(updateQuery)

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

export const getUnapproved = async (req, res) => {
  try {
    const { limit, offset } = req.pagination

    if (Object.prototype.hasOwnProperty.call(req.query, 'search')) {
      return search(req, res)
    }

    const person = await models.Person.findByUserId(req.user.id)
    const contragentId = person.contragent_id

    const attrs = {
      where: {
        approved: false,
        approved_company: false
      },
      include: [
        {
          model: models.Role,
          as: 'role',
          where: {
            name: roles.COMPANY_DRIVER
          },
          attributes: ['name']
        },
        {
          model: models.Person,
          as: 'Person',
          where: {
            contragent_id: contragentId
          },
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
          ]
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

export const getFullApproved = async (req, res) => {
  try {
    const { limit, offset } = req.pagination

    if (Object.prototype.hasOwnProperty.call(req.query, 'search')) {
      return search(req, res)
    }

    const person = await models.Person.findByUserId(req.user.id)
    const contragentId = person.contragent_id

    const attrs = {
      where: {
        contragent_id: contragentId
      },
      include: [
        {
          model: models.User,
          as: 'user',
          where: {
            approved: true,
            approved_company: true
          },
          include: [
            {
              model: models.Role,
              as: 'role',
              where: {
                name: roles.COMPANY_DRIVER
              }
            }
          ]
        },
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
      ]
    }

    // const count = await models.Person.count(attrs)
    let users = await models.Person.findAll({ ...attrs })
    const count = users.length
    users = users.slice(offset, offset + limit)

    const userList = []
    users.forEach(user => {
      const userObj = user.toJSON()

      if (Object.prototype.hasOwnProperty.call(userObj, 'passport') && userObj.passport !== null) {
        const photos = []

        if (Object.prototype.hasOwnProperty.call(userObj.passport, 'photos') && userObj.passport.photos !== null) {
          userObj.passport.photos.forEach(photo => {
            if (photo.photo_url !== 'no_url') {
              photos.push(getFullUrl(req, photo.photo_url))
            }
          })
        }

        userObj.passport.photos = photos
      }

      if (Object.prototype.hasOwnProperty.call(userObj, 'drivingLicense') && userObj.drivingLicense !== null) {
        const photos = []

        if (Object.prototype.hasOwnProperty.call(userObj.drivingLicense, 'photos') && userObj.drivingLicense.photos !== null) {
          userObj.drivingLicense.photos.forEach(photo => {
            if (photo.photo_url !== 'no_url') {
              photos.push(getFullUrl(req, photo.photo_url))
            }
          })
        }

        userObj.drivingLicense.photos = photos
      }

      userList.push(userObj)
    })

    const totalPages = Math.ceil(count / limit)
    return res.status(200).json({ totalPages, count, userList })
  } catch (error) {
    console.error(error)
    res.status(500).send()
  }
}

export const getCompanyApproved = async (req, res) => {
  try {
    const { limit, offset } = req.pagination

    if (Object.prototype.hasOwnProperty.call(req.query, 'search')) {
      return search(req, res)
    }

    const person = await models.Person.findByUserId(req.user.id)
    const contragentId = person.contragent_id

    const attrs = {
      where: {
        contragent_id: contragentId
      },
      include: [
        {
          model: models.User,
          as: 'user',
          where: {
            approved: false,
            approved_company: true
          },
          include: [
            {
              model: models.Role,
              as: 'role',
              where: {
                name: roles.COMPANY_DRIVER
              }
            }
          ]
        },
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
      ]
    }

    // const count = await models.Person.count(attrs)
    let users = await models.Person.findAll({ ...attrs })
    const count = users.length
    users = users.slice(offset, offset + limit)

    const userList = []
    users.forEach(user => {
      const userObj = user.toJSON()

      if (Object.prototype.hasOwnProperty.call(userObj, 'passport') && userObj.passport !== null) {
        const photos = []

        if (Object.prototype.hasOwnProperty.call(userObj.passport, 'photos') && userObj.passport.photos !== null) {
          userObj.passport.photos.forEach(photo => {
            if (photo.photo_url !== 'no_url') {
              photos.push(getFullUrl(req, photo.photo_url))
            }
          })
        }

        userObj.passport.photos = photos
      }

      if (Object.prototype.hasOwnProperty.call(userObj, 'drivingLicense') && userObj.drivingLicense !== null) {
        const photos = []

        if (Object.prototype.hasOwnProperty.call(userObj.drivingLicense, 'photos') && userObj.drivingLicense.photos !== null) {
          userObj.drivingLicense.photos.forEach(photo => {
            if (photo.photo_url !== 'no_url') {
              photos.push(getFullUrl(req, photo.photo_url))
            }
          })
        }

        userObj.drivingLicense.photos = photos
      }

      userList.push(userObj)
    })

    const totalPages = Math.ceil(count / limit)
    return res.status(200).json({ totalPages, count, userList })
  } catch (error) {
    console.error(error)
    res.status(500).send()
  }
}

export const getOne = async (req, res) => {
  try {
    const { driverId } = req.params

    const person = await models.Person.findByUserId(req.user.id)
    const contragentId = person.contragent_id

    const attrs = {
      where: {
        id: driverId
      },
      include: [
        {
          model: models.Role,
          as: 'role',
          where: {
            name: roles.COMPANY_DRIVER
          },
          attributes: ['name']
        },
        {
          model: models.Person,
          as: 'Person',
          where: {
            contragent_id: contragentId
          },
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
          ]
        }
      ]
    }

    const user = await models.User.findOne(attrs)

    if (user == null) {
      return res.status(404).json({ error: 'Driver not found' })
    }

    return res.status(200).json({ user })
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
        model: models.Person,
        as: 'company_manager',
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

export const updates = async (req, res) => {
  const ws = await res.accept()

  switch (req.user.role) {
    case roles.COMPANY_MANAGER:
      companyManagerSockets[req.user.id] = ws

      ws.on('close', () => {
        delete companyManagerSockets[req.user.id]
      })

      break

    default:
      ws.send(JSON.stringify({ status: "You don't need websocket connection" }))
      ws.close()
      break
  }
}

export const driverUpdate = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    if (errors.array()[0].msg != 'Missing fields: drivingLicensePhotos') { return res.status(400).json({ message: errors.array() }) }
  }

  const body = JSON.parse(JSON.stringify(req.body))

  if (!Object.prototype.hasOwnProperty.call(req.params, 'driverId')) {
    return res.status(400).json({ error: 'Person ID is required' })
  }

  let { driverId } = req.params

  if (isNaN(driverId)) {
    return res.status(400).json({ error: 'Person ID must be numeric', driverId })
  }

  driverId = Number(driverId)

  if (driverId) {
    try {
      const person = await models.Person.findByPk(driverId, {
        include: [
          {
            model: models.User,
            as: 'user',
            include: [
              {
                model: models.Role,
                as: 'role'
              }
            ],
            attributes: { exclude: ['role_id'] }
          }
        ],
        attributes: { exclude: ['user_id'] }
      })

      if (person === null) {
        return res.status(404).json({ error: 'Person not found' })
      }

      // если роль обновляемого пользователя не driver
      if (person.user.role.name !== roles.COMPANY_DRIVER) {
        return res
          .status(404)
          .json({ error: 'You can only update the personal data of drivers' })
      }

      const { role, id } = req.user

      // если водитель, но не тот, который auth
      if (role === roles.COMPANY_DRIVER && person.user.id !== id) {
        return res.status(404).json({ error: 'Access denied' })
      }

      if (Object.prototype.hasOwnProperty.call(body, 'jobPositionId') && body.jobPositionId) {
        const jobPositionId = body.jobPositionId

        const jobPosition = await models.JobPosition.findByPk(jobPositionId)

        if (!jobPosition) {
          return res
            .status(404)
            .json({ error: `Job position with id ${jobPositionId} not found` })
        }

        body.job_position_id = jobPosition.id
      }

      if (Object.prototype.hasOwnProperty.call(body, 'passportId') && body.passportId) {
        let passportId = body.passportId

        if (isNaN(passportId)) {
          return res.status(400).json({ error: 'Passport ID must be numeric' })
        }

        passportId = Number(passportId)

        const passport = await models.Passport.findByPk(passportId)

        if (!passport) {
          return res
            .status(404)
            .json({ error: `Passport with id ${passportId} not found` })
        }

        body.passport_id = passport.id
      }

      if (Object.prototype.hasOwnProperty.call(body, 'contragentId') && body.contragentId) {
        const contragentId = body.contragentId

        const contragent = await models.Contragent.findByPk(contragentId)

        if (!contragent) {
          return res
            .status(404)
            .json({ error: `Contragent with id ${contragentId} not found` })
        }

        body.contragent_id = contragent.id
      }

      if (Object.prototype.hasOwnProperty.call(body, 'drivingLicenseNumber') && Object.prototype.hasOwnProperty.call(body, 'drivingLicenseSerial') && body.drivingLicenseNumber && body.drivingLicenseSerial) {
        const drivingLicenseNumber = body.drivingLicenseNumber
        const drivingLicenseSerial = body.drivingLicenseSerial

        delete body.drivingLicenseNumber
        delete body.drivingLicenseSerial

        const drivingLicense = await models.DrivingLicence.create({
          serial: drivingLicenseSerial,
          number: drivingLicenseNumber
        })

        body.driving_license_id = drivingLicense.id

        if (req.files) {
          const drivingLicensePhotos = req.files.map((file) => {
            return {
              driving_license_id: drivingLicense.id,
              photo_url: file.path
            }
          })

          if (drivingLicensePhotos.length > 0) {
            await models.DrivingLicencePhoto.bulkCreate(drivingLicensePhotos)
          }
        }
      }

      for (const key in body) {
        if (!body[key]) {
          delete body[key]
        }
      }

      await models.Person.update(body, { where: { id: person.id } })

      const persons = await models.Person.findAll({
        include: [
          {
            model: models.User,
            as: 'user',
            include: [
              {
                model: models.Role,
                as: 'role'
              }
            ],
            attributes: { exclude: ['role_id'] }
          },
          {
            model: models.DrivingLicence,
            as: 'drivingLicense',
            include: [
              {
                model: models.DrivingLicencePhoto,
                as: 'photos'
              }
            ]
          }
        ],
        attributes: { exclude: ['user_id', 'driving_license_id'] }
      })

      return res
        .status(200)
        .json({
          message: "The user's personal data has been updated",
          persons
        })
    } catch (error) {
      console.error(error)
      res.status(500).send()
    }
  }
}

export const getJobs = async (req, res) => {
  try {
    const allowedJobs = ['Водители']

    const jobs = await models.JobPosition.findAll({ where: { show_on_page: true, name: { [Op.in]: allowedJobs } } })
    return res.status(200).json({ jobs })
  } catch (error) {
    console.error(error)
    res.status(500).send()
  }
}

export const blockDriver = async (req, res) => {
  const { driverId } = req.params

  if (!driverId) {
    return res.status(400).json({ error: 'Driver ID is required' })
  }

  try {
    const person = await models.Person.findByPk(driverId)

    if (!person) {
      return res.status(404).json({ error: 'Driver not found' })
    }

    await models.PasswordRecoveryAttempt.destroy({ where: { user_id: person.user_id } })
    await models.User.destroy({ where: { id: person.user_id } })
    await models.Person.destroy({ where: { id: driverId } })

    return res.status(200).json({ message: 'Driver blocked successfully' })
  } catch (error) {
    console.error(error)
    res.status(500).send()
  }
}

export const takeOrder = async (req, res) => {
  const {
    orderId,
    driverId,
    plannedLoadingDate,
    plannedArrivalDate,
    vinCode,
    trailerNumber
  } = req.body

  try {
    const person = await models.Person.findByUserId(driverId)
    if (!person) {
      return res.status(404).send({ message: 'Driver not found' })
    }

    const personManager = await models.Person.findByUserId(req.user.id)
    if (!personManager) {
      return res.status(404).send({ message: 'Manager not found' })
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

    const updateData = {
      status: OrderStatus.CONFIRMATION,
      driver_id: person.id,
      company_manager_id: personManager.id,
      last_geo_update: new Date()
    }

    if (plannedArrivalDate) {
      updateData.delivery_date_plan = new Date(plannedArrivalDate)
    }
    if (plannedLoadingDate) {
      updateData.departure_date_plan = new Date(plannedLoadingDate)
    }

    if (vinCode) {
      const formattedVinCode = vinCode.replace(/\s/g, '')

      const [truck] = await models.Truck.findOrCreate({
        where: { vin: formattedVinCode },
        defaults: { vin: formattedVinCode }
      })

      updateData.truck_id = truck.id

      if (trailerNumber) {
        await models.Truck.update(
          { trailer_number: trailerNumber },
          {
            where: {
              vin: formattedVinCode
            }
          }
        )
      }
    }

    // Mark the order as "Waiting for Confirmation"
    const result = await models.Order.update(
      updateData,
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
          model: models.Person,
          as: 'company_manager',
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
      const driver = await models.User.scope('withTokens').findByPk(person.user_id)

      let fio = null
      if (person.surname) {
        fio = person.surname
      }

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

      body = 'Вам выдали заказ'
      await sendNotification(
        'Новый заказ',
        body,
        {
          title: 'Новый заказ',
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

    if (order.manager.user.id in ordersSockets) {
      ordersSockets[order.manager.user.id].send(JSON.stringify({ id: order.id, status: order.status, geo: order.geo }))
    }
    if (order.driver.user.id in ordersSockets) {
      ordersSockets[order.driver.user.id].send(JSON.stringify({ id: order.id, status: 'New order', geo: order.geo }))
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
