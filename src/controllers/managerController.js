import { models } from '../models/index.js'
import { sendNotification } from '../utils/send_notification.js'

export const confirmCompanyManager = async (req, res) => {
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
      return res.status(400).send({ status: 'error', description: 'You need to fill all passport information' })
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
      return res.status(400).send({ status: 'error', description: 'You need to fill all contragent information' })
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

  await user.update({ responsible_user: req.user.id, approved: true })
  await person.update(updateQuery)

  person = await models.Person.findByUserId(userId)
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
      message: 'Company manager registration confirmed successfully',
      person
    })
}
