import { models } from '../models/index.js'
import { sendNotification } from '../utils/send_notification.js'
import Roles from '../enums/roles.js'
import { getFullUrl } from '../utils/utils.js'
import Sequelize from 'sequelize'

export const confirmCompanyManager = async (req, res) => {
  try {
    const {
      userId,
      name,
      surname,
      patronymic,
      email,
      telegram,
      contragentName,
      contragentINN,
      contragentKPP,
      contragentType,
      passportSeries,
      passportNumber,
      passportIssuedBy,
      passportIssueDate,
      passportDepartmentCode,
      jobPositionId
    } = req.body

    const updateQuery = {
      name,
      surname,
      patronymic,
      email,
      telegram
    }

    let jobPosition = null
    if (jobPositionId) {
      jobPosition = await models.JobPosition.findByPk(jobPositionId)
      if (!jobPosition) {
        return res.status(400).json({ message: 'Job position not found' })
      }
    }
    updateQuery.job_position_id = jobPosition ? jobPosition.id : null

    if (passportSeries || passportNumber || passportIssuedBy || passportIssueDate || passportDepartmentCode) {
      if (!passportSeries || !passportNumber || !passportIssuedBy || !passportIssueDate || !passportDepartmentCode) {
        return res.status(400).send({
          status: 'error',
          description: 'You need to fill all passport information'
        })
      }

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

      updateQuery.passportId = passport.id
    }

    if (contragentName || contragentINN || contragentKPP || contragentType) {
      if (!contragentKPP || !contragentName || !contragentType || !contragentINN) {
        return res.status(400).send({
          status: 'error',
          description: 'You need to fill all contragent information'
        })
      }

      const [contragent] = await models.Contragent.findOrCreate({
        where: {
          inn: contragentINN,
          name: contragentName
        },
        defaults: {
          name: contragentName,
          inn: contragentINN,
          kpp: contragentKPP,
          supplier: contragentType === 'supplier',
          buyer: contragentType === 'buyer',
          transport_company: contragentType === 'transport_company'
        }
      })

      updateQuery.contragent_id = contragent.id
    }

    let person = await models.Person.findByUserId(userId)
    if (!person) {
      return res.status(400).json({ message: 'Company managers not found' })
    }

    const user = await models.User.scope('withTokens').findByPk(userId)
    if (!user) {
      return res.status(400).json({ message: 'User not found' })
    }

    await user.update({
      responsible_user: req.user.id,
      approved: true
    })
    await person.update(updateQuery)

    person = await models.Person.findByUserId(userId)
    try {
      const body = 'Регистрация подтверждена менеджером'

      await sendNotification('Ваш статус обновлен', body, {
        title: 'Ваш статус обновлен',
        body
      }, user.fcm_token, user.device_type)
    } catch (e) {
      console.log('something wrong with sending notification')
      console.error(e)
    }

    res
      .status(200)
      .json({
        message: 'Company manager registration confirmed successfully',
        person
      })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getUnapproved = async (req, res) => {
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

    if (!('roleId' in req.query)) {
      return res.status(400).json({ error: 'roleId query is required.' })
    }
    const { roleId } = req.query

    if (Object.prototype.hasOwnProperty.call(req.query, 'search')) {
      req.user_approved = true
      return search(req, res)
    }

    const role = models.Role.findByPk(roleId)
    if (!role) {
      return res.status(400).json({ message: 'Role not found' })
    }

    const attrs = {
      include: [
        {
          model: models.User,
          as: 'user',
          where: {
            approved: true,
            role_id: parseInt(roleId)
          },
          include: [
            {
              model: models.Role,
              as: 'role'
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

export const search = async (req, res) => {
  try {
    const { limit, offset } = req.pagination

    if (!('roleId' in req.query)) {
      return res.status(400).json({ error: 'roleId query is required.' })
    }
    if (!('user_approved' in req.query)) {
      return res.status(400).json({ error: 'user_approved query is required.' })
    }
    const { roleId } = req.query
    const search = req.query.search

    const searchWordsLike = search.split(' ').map(word => {
      return {
        [Sequelize.Op.iLike]: `%${word}%`
      }
    })

    const role = models.Role.findByPk(roleId)
    if (!role) {
      return res.status(400).json({ message: 'Role not found' })
    }

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
              as: 'role'
            }
          ],
          where: {
            approved: req.user_approved,
            role_id: parseInt(roleId)
          }
        },
        { model: models.Contragent, as: 'contragent' },
        { model: models.JobPosition, as: 'jobPosition' },
        { model: models.Passport, as: 'passport' },
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
      ]
    }

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
