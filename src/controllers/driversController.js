import { validationResult } from "express-validator";
import EmploymentType from "../enums/employmentType.js";
import { models } from "../models/index.js";
import Roles from "../enums/roles.js";
import Sequelize from 'sequelize'
import { sendNotification } from '../utils/send_notification.js'
import {getFullUrl} from "../utils/utils.js";

const driversSockets = {};

export const getUnapproved = async (req, res) => {
  try {
    const { limit, offset } = req.pagination;

    if (req.query.hasOwnProperty("search")) {
      return search(req, res);
    }

    const attrs = {
      where: {
        approved: false,
      },
      include: [
        {
          model: models.Role,
          as: "role",
          where: {
            name: Roles.DRIVER,
          },
          attributes: ["name"],
        },
        {
          model: models.Person,
          as: "Person",
          include: [
            { model: models.Contragent, as: "contragent" },
            { model: models.JobPosition, as: "jobPosition" },
            {
              model: models.DrivingLicence,
              as: "drivingLicense",
            },
            {
              model: models.Passport,
              as: "passport",
              include: [
                {
                  model: models.PassportPhoto,
                  as: "photos"
                }
              ]
            }
          ]
        },
      ],
    };

    const count = await models.User.count(attrs);
    const users = await models.User.findAll({ ...attrs, limit, offset });

    const totalPages = Math.ceil(count / limit);
    return res.status(200).json({ totalPages, count, users });
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
};

export const getApproved = async (req, res) => {
  try {
    const { limit, offset } = req.pagination;

    if (req.query.hasOwnProperty("search")) {
      return search(req, res);
    }

    const attrs = {
      include: [
        {
          model: models.User,
          as: "user",
          where: {
            approved: true,
          },
          include: [
            {
              model: models.Role,
              as: "role",
              where: {
                name: Roles.DRIVER,
              },
            },
          ],
        },
        { model: models.Contragent, as: "contragent" },
        { model: models.JobPosition, as: "jobPosition" },
        {
          model: models.DrivingLicence,
          as: "drivingLicense",
        },
        {
          model: models.Passport,
          as: "passport",
          include: [
            {
              model: models.PassportPhoto,
              as: "photos"
            }
          ]
        }
      ],
    };

    const count = await models.Person.count(attrs);
    const users = await models.Person.findAll({ ...attrs, limit, offset });

    const userList = []
    users.forEach(user => {
      if (user.hasOwnProperty('passport') && user.passport !== null) {
        const photos = []

        if (user.passport.hasOwnProperty('photos') && user.passport.photos.length !== 0) {
          user.passport.photos.forEach(photo => {
            photos.push(getFullUrl(req, photo.photo_url))
          });
        }

        user.passport.photos = photos
      }

      userList.push(user)
    });

    const totalPages = Math.ceil(count / limit);
    return res.status(200).json({ totalPages, count, userList });
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
};

export const update = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array() });
  }

  const body = JSON.parse(JSON.stringify(req.body));

  if (!body.hasOwnProperty("personId")) {
    return res.status(400).json({ error: "Person ID is required" });
  }

  const personId = body.personId;

  try {
    let person = await models.Person.findByPk(personId, {
      include: [
        {
          model: models.User,
          as: "user",
          include: [
            {
              model: models.Role,
              as: "role",
            },
          ],
          attributes: { exclude: ["role_id"] },
        },
      ],
      attributes: { exclude: ["user_id"] },
    });

    if (person === null) {
      return res.status(404).json({ error: "Person not found" });
    }

    //если роль обновляемого пользователя не driver
    if (person.user.role.name !== Roles.DRIVER) {
      return res
        .status(404)
        .json({ error: "You can only update the personal data of drivers" });
    }

    const { role, id } = req.user;

    //если водитель, но не тот, который auth
    if (role === Roles.DRIVER && person.user.id !== id) {
      return res.status(404).json({ error: `Access denied` });
    }

    if (body.hasOwnProperty("job_position_id")) {
      const jobPositionId = body.job_position_id;

      const jobPosition = await models.JobPosition.findByPk(jobPositionId);

      if (!jobPosition) {
        return res
          .status(404)
          .json({ error: `Job position with id ${jobPositionId} not found` });
      }
    }

    if (body.hasOwnProperty("passport_id")) {
      const passportId = body.passport_id;

      const passport = await models.Passport.findByPk(passportId);

      if (!passport) {
        return res
          .status(404)
          .json({ error: `Passport with id ${passportId} not found` });
      }
    }

    if (body.hasOwnProperty("contragent_id")) {
      const contragentId = body.contragent_id;

      const contragent = await models.Contragent.findByPk(contragentId);

      if (!contragent) {
        return res
          .status(404)
          .json({ error: `Contragent with id ${contragentId} not found` });
      }
    }

    if (body.hasOwnProperty("drivingLicenseNumber") && body.hasOwnProperty("drivingLicenseSerial")) {
      const drivingLicenseNumber = body.drivingLicenseNumber
      const drivingLicenseSerial = body.drivingLicenseSerial

      delete body["drivingLicenseNumber"]
      delete body["drivingLicenseSerial"]

      const drivingLicense = await models.DrivingLicence.create({
        serial: drivingLicenseSerial,
        number: drivingLicenseNumber,
      })

      body["driving_license_id"] = drivingLicense.id
    }

    await models.Person.update(body, { where: { id: person.id } });

    person = await models.Person.findByPk(personId, {
      include: [
        {
          model: models.User,
          as: "user",
          include: [
            {
              model: models.Role,
              as: "role",
            }
          ],
          attributes: { exclude: ["role_id"] },
        },
        {
          model: models.DrivingLicence,
          as: "drivingLicense"
        }
      ],
      attributes: { exclude: ["user_id", "driving_license_id"] },
    });

    return res
      .status(200)
      .json({
        message: "The user's personal data has been updated",
        person
      });
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
};

export const confirm = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array() });
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
    contragentName,
    contragentINN,
    kpp,
    companyType,
    passportSeries,
    passportNumber,
    passportIssuedBy,
    passportIssueDate,
    passportDepartmentCode,
    drivingLicenseNumber,
    drivingLicenseSerial
  } = req.body;

  try {
    let jobPosition = null;
    if (jobPositionId) {
      jobPosition = await models.JobPosition.findByPk(jobPositionId);
      if (!jobPosition) {
        return res.status(400).json({ message: "Job position not found" });
      }
    }

    let contragent = null;
    if (contragentName) {
      // Get or create Contragent
      [contragent] = await models.Contragent.findOrCreate({
        where: { inn: contragentINN },
        defaults: {
          name: contragentName,
          inn: contragentINN,
          kpp,
          supplier: companyType === "supplier",
          buyer: companyType === "buyer",
          transport_company: companyType === "transport_company",
        },
      });
    }

    let passport = null;
    if (passportNumber) {
      // Get or create Passport
      [passport] = await models.Passport.findOrCreate({
        where: {
          series: passportSeries,
          number: passportNumber
        },
        defaults: {
          series: passportSeries,
          number: passportNumber,
          authority: passportIssuedBy,
          date_of_issue: new Date(passportIssueDate).setHours(0, 0, 0, 0),
          department_code: passportDepartmentCode,
        },
      });

      const passportPhotos = req.files.map((file) => {
        return {
          passport_id: passport.id,
          photo_url: file.path,
        };
      });

      if (passportPhotos.length > 0) {
        await models.PassportPhoto.bulkCreate(passportPhotos);
      }
    }

    let drivingLicenseId = null;
    if (drivingLicenseSerial && drivingLicenseNumber) {
      const drivingLicense = await models.DrivingLicence.create({
        serial: drivingLicenseSerial,
        number: drivingLicenseNumber,
      })

      drivingLicenseId = drivingLicense.id
    }

    // Get Person by user_id
    const person = await models.Person.findByUserId(userId);
    if (!person) {
      return res.status(400).json({ message: "Driver not found" });
    }

    const user = await models.User.scope("withTokens").findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.update({ responsible_user: req.user.id, approved: true });
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
    });

    if (person.id in driversSockets){
      driversSockets[person.id].send(JSON.stringify({ status: "approved" }));
      driversSockets[person.id].close();
    }

    try {
      const body = 'Регистрация подтверждена менеджером'

      await sendNotification('Ваш статус обновлен', body, { title: 'Ваш статус обновлен', body }, user.fcm_token, user.device_type)
    } catch (e) {
      console.log("something wrong with sending notification")
      console.error(e)
    }

    res
      .status(200)
      .json({
        message: "Driver registration confirmed successfully",
        person
      });
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
};

export const getJobs = async (req, res) => {
  try {
    const jobs = await models.JobPosition.findAll();
    res.status(200).json({ jobs });
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
};

export const getManagerPhone = async (req, res) => {
  try {
    const driverUser = await models.User.findByPk(req.user.id);

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
      });
      manager = managers[0];
    }

    return res.status(200).json({ phone: manager.user.phone, manager})
  } catch (error) {
    console.error(error)
    res.status(500).send()
  }
};

export const search = async (req, res) => {
  try {
    const { limit, offset } = req.pagination;
    const search = req.query.search;

    const searchWordsLike = search.split(" ").map(word => {
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
                  [Sequelize.Op.in]: search.split(" ")
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
                  [Sequelize.Op.in]: search.split(" ")
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
                  [Sequelize.Op.in]: search.split(" ")
                }
              ]
            }
          },
        ]
      },
      include: [
        {
          model: models.User,
          as: "user",
          include: [
            {
              model: models.Role,
              as: "role",
              where: {
                name: Roles.DRIVER,
              },
            },
          ],
          where: {
            approved: true,
          },
        },
        { model: models.Contragent, as: "contragent" },
        { model: models.JobPosition, as: "jobPosition" },
        { model: models.Passport, as: "passport" },
        {
          model: models.DrivingLicence,
          as: "drivingLicense",
        }
      ],
    };

    const count = await models.Person.count(attrs);
    const users = await models.Person.findAll({ ...attrs, limit, offset });

    const totalPages = Math.ceil(count / limit);
    return res.status(200).json({ totalPages, count, users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updates = async (req, res) => {
  const ws = await res.accept();

  switch (req.user.role) {
    case Roles.DRIVER:
      driversSockets[req.user.id] = ws;

      ws.on('close', () => {
        delete driversSockets[req.user.id];
      });

      break;

    default:
      ws.send(JSON.stringify({ status: "You don't need websocket connection" }));
      ws.close();
      break;
  }
}
