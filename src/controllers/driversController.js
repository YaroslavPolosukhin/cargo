import { validationResult } from 'express-validator'
import EmploymentType from '../enums/employmentType.js'
import { models } from '../models/index.js'
import Roles from '../enums/roles.js'
import Sequelize from 'sequelize'
import { sendNotification } from '../utils/send_notification.js'
import { getFullUrl } from '../utils/utils.js'

const driversSockets = {}

export const getUnapproved = async (req, res) => {
  try {
    const { limit, offset } = req.pagination

    if (Object.prototype.hasOwnProperty.call(req.query, 'search')) {
      return search(req, res)
    }

    const attrs = {
      where: {
        approved: false
      },
      include: [
        {
          model: models.Role,
          as: 'role',
          where: {
            name: Roles.DRIVER
          },
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
              as: 'drivingLicense'
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

export const getApproved = async (req, res) => {
  try {
    const { limit, offset } = req.pagination

    if (Object.prototype.hasOwnProperty.call(req.query, 'search')) {
      return search(req, res)
    }

    const attrs = {
      include: [
        {
          model: models.User,
          as: 'user',
          where: {
            approved: true
          },
          include: [
            {
              model: models.Role,
              as: 'role',
              where: {
                name: Roles.DRIVER
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

    const attrs = {
      where: {
        id: driverId
      },
      include: [
        {
          model: models.Role,
          as: 'role',
          where: {
            name: Roles.DRIVER
          },
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
              as: 'drivingLicense'
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

export const update = async (req, res) => {
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
    console.log('driverId', driverId)
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
      if (person.user.role.name !== Roles.DRIVER) {
        return res
          .status(404)
          .json({ error: 'You can only update the personal data of drivers' })
      }

      const { role, id } = req.user

      // если водитель, но не тот, который auth
      if (role === Roles.DRIVER && person.user.id !== id) {
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
            as: 'drivingLicense'
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

    await user.update({ responsible_user: req.user.id, approved: true })
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

    if (person.id in driversSockets) {
      driversSockets[person.id].send(JSON.stringify({ status: 'approved' }))
      driversSockets[person.id].close()
    }

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

export const getJobs = async (req, res) => {
  try {
    const jobs = await models.JobPosition.findAll({ where: { show_on_page: true } })
    return res.status(200).json({ jobs })
  } catch (error) {
    console.error(error)
    res.status(500).send()
  }
}

export const createPassport = async (req, res) => {
  try {
    const {
      passportSeries,
      passportNumber,
      passportIssuedBy,
      passportIssueDate,
      passportDepartmentCode
    } = req.body

    const [passport] = await models.Passport.findOrCreate({
      where: {
        series: passportSeries,
        number: passportNumber
      },
      defaults: {
        series: passportSeries,
        number: passportNumber,
        authority: passportIssuedBy,
        date_of_issue: new Date(passportIssueDate).setHours(0, 0, 0, 0),
        department_code: passportDepartmentCode
      }
    })

    const passportPhotos = req.files.map((file) => {
      return {
        passport_id: passport.id,
        photo_url: file.path
      }
    })

    if (passportPhotos.length > 0) {
      await models.PassportPhoto.bulkCreate(passportPhotos)
    }

    return res.status(200).json({ message: 'created', id: passport.id })
  } catch (error) {
    console.error(error)
    res.status(500).send()
  }
}

export const updatePassport = async (req, res) => {
  try {
    const { passportId } = req.params

    let passport = await models.Passport.findByPk(passportId)

    if (!passport) {
      return res.status(404).json({ error: 'Passport not found' })
    }

    const body = req.body

    if (Object.prototype.hasOwnProperty.call(body, 'passportSeries') && body.passportSeries !== null) {
      body.series = body.passportSeries
      delete body.passportSeries
    }

    if (Object.prototype.hasOwnProperty.call(body, 'passportNumber') && body.passportNumber !== null) {
      body.number = body.passportNumber
      delete body.passportNumber
    }

    if (Object.prototype.hasOwnProperty.call(body, 'passportIssuedBy') && body.passportIssuedBy !== null) {
      body.authority = body.passportIssuedBy
      delete body.passportIssuedBy
    }

    if (Object.prototype.hasOwnProperty.call(body, 'passportIssueDate') && body.passportIssueDate !== null) {
      body.date_of_issue = new Date(body.passportIssueDate).setHours(0, 0, 0, 0)
      delete body.passportIssueDate
    }

    if (Object.prototype.hasOwnProperty.call(body, 'passportDepartmentCode') && body.passportDepartmentCode !== null) {
      body.department_code = body.passportDepartmentCode
      delete body.passportDepartmentCode
    }

    await passport.update(body)

    if (req.files) {
      const passportPhotos = req.files.map((file) => {
        return {
          passport_id: passport.id,
          photo_url: file.path
        }
      })

      if (passportPhotos.length > 0) {
        await models.PassportPhoto.destroy({ where: { passport_id: passport.id } })

        await models.PassportPhoto.bulkCreate(passportPhotos)
      }
    }

    passport = await models.Passport.findByPk(passportId, {
      include: [
        {
          model: models.PassportPhoto,
          as: 'photos'
        }
      ]
    })

    return res.status(200).json({ message: 'updated', passport })
  } catch (error) {
    console.error(error)
    res.status(500).send()
  }
}

export const createContragent = async (req, res) => {
  try {
    const {
      contragentName,
      contragentINN,
      kpp,
      companyType
    } = req.body

    const [contragent] = await models.Contragent.findOrCreate({
      where: { inn: contragentINN },
      defaults: {
        name: contragentName,
        inn: contragentINN,
        kpp,
        supplier: companyType === 'supplier',
        buyer: companyType === 'buyer',
        transport_company: companyType === 'transport_company'
      }
    })

    return res.status(200).json({ message: 'created', id: contragent.id })
  } catch (error) {
    console.error(error)
    res.status(500).send()
  }
}

export const updateContraget = async (req, res) => {
  try {
    const { contragentId } = req.params

    let contragent = await models.Contragent.findByPk(contragentId)

    if (!contragent) {
      return res.status(404).json({ error: 'Contragent not found' })
    }

    const body = req.body

    if (Object.prototype.hasOwnProperty.call(body, 'companyType') && body.companyType !== null) {
      body.supplier = body.companyType === 'supplier'
      body.buyer = body.companyType === 'buyer'
      body.transport_company = body.companyType === 'transport_company'

      delete body.companyType
    }

    if (Object.prototype.hasOwnProperty.call(body, 'contragentINN') && body.contragentINN !== null) {
      body.inn = body.contragentINN
      delete body.contragentINN
    }

    if (Object.prototype.hasOwnProperty.call(body, 'contragentName') && body.contragentName !== null) {
      body.name = body.contragentName
      delete body.contragentName
    }

    await contragent.update(body)

    contragent = await models.Contragent.findByPk(contragentId)

    return res.status(200).json({ message: 'updated', contragent })
  } catch (error) {
    console.error(error)
    res.status(500).send()
  }
}

export const getManagerPhone = async (req, res) => {
  try {
    const driverUser = await models.User.findByPk(req.user.id)

    let manager = await models.Person.findOne(
      {
        where: { user_id: driverUser.responsible_user },
        include: [
          {
            model: models.User,
            as: 'user',
            include: [
              {
                model: models.Role,
                as: 'role'
              }
            ]
          },
          {
            model: models.Contragent,
            as: 'contragent'
          },
          {
            model: models.JobPosition,
            as: 'jobPosition'
          },
          {
            model: models.Passport,
            as: 'passport'
          }
        ]
      }
    )

    if (!manager) {
      const managers = await models.Person.findAll({
        include: [
          {
            model: models.User,
            as: 'user',
            include: [
              {
                model: models.Role,
                as: 'role'
              }
            ]
          },
          {
            model: models.Contragent,
            as: 'contragent'
          },
          {
            model: models.JobPosition,
            as: 'jobPosition'
          },
          {
            model: models.Passport,
            as: 'passport'
          }
        ]
      })
      manager = managers[0]
    }

    return res.status(200).json({ phone: manager.user.phone, manager })
  } catch (error) {
    console.error(error)
    res.status(500).send()
  }
}

export const search = async (req, res) => {
  try {
    const { limit, offset } = req.pagination
    const search = req.query.search

    const searchWordsLike = search.split(' ').map(word => {
      return {
        [Sequelize.Op.iLike]: `%${word}%`
      }
    })

    const attrs = {
      where: {
        [Sequelize.Op.or]: [
          {
            name: {
              [Sequelize.Op.or]: [
                {
                  [Sequelize.Op.or]: searchWordsLike
                },
                {
                  [Sequelize.Op.in]: search.split(' ')
                }
              ]
            }
          },
          {
            surname: {
              [Sequelize.Op.or]: [
                {
                  [Sequelize.Op.or]: searchWordsLike
                },
                {
                  [Sequelize.Op.in]: search.split(' ')
                }
              ]
            }
          },
          {
            patronymic: {
              [Sequelize.Op.or]: [
                {
                  [Sequelize.Op.or]: searchWordsLike
                },
                {
                  [Sequelize.Op.in]: search.split(' ')
                }
              ]
            }
          }
        ]
      },
      include: [
        {
          model: models.User,
          as: 'user',
          include: [
            {
              model: models.Role,
              as: 'role',
              where: {
                name: Roles.DRIVER
              }
            }
          ],
          where: {
            approved: true
          }
        },
        { model: models.Contragent, as: 'contragent' },
        { model: models.JobPosition, as: 'jobPosition' },
        { model: models.Passport, as: 'passport' },
        {
          model: models.DrivingLicence,
          as: 'drivingLicense'
        }
      ]
    }

    // const count = await models.Person.count(attrs)
    let users = await models.Person.findAll({ ...attrs })
    const count = users.length

    users = users.slice(offset, offset + limit)

    const totalPages = Math.ceil(count / limit)
    return res.status(200).json({ totalPages, count, users })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const updates = async (req, res) => {
  const ws = await res.accept()

  switch (req.user.role) {
    case Roles.DRIVER:
      driversSockets[req.user.id] = ws

      ws.on('close', () => {
        delete driversSockets[req.user.id]
      })

      break

    default:
      ws.send(JSON.stringify({ status: "You don't need websocket connection" }))
      ws.close()
      break
  }
}
