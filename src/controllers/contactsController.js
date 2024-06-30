import { validationResult } from "express-validator";
import { models } from "../models/index.js";
import Sequelize from 'sequelize'
import Roles from '../enums/roles.js'

export const create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array() });
  }

  const {
    name,
    surname,
    patronymic,
    jobTitle,
    phone,
    email,
    telegram,
    description,
  } = req.body;

  const body = JSON.parse(JSON.stringify(req.body));

  try {
    const newContact = await models.Contact.create({
      name,
      surname,
      patronymic,
      jobTitle,
      phone,
      email,
      telegram,
      ...(body.hasOwnProperty("description") && {
        description,
      }),
    });
    res.status(201).json({ contact: newContact });
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
};

export const update = async (req, res) => {
  const { contactId } = req.params;
  const dataForUpdate = req.body;

  try {
    const contact = await models.Contact.findByPk(contactId);
    if (contact === null) {
      return res.status(404).json({ error: "Contact not found" });
    }
    await contact.update(dataForUpdate);
    return res.status(200).json(contact);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getAll = async (req, res) => {
  const contacts = await models.Contact.findAll();
  res.json(contacts);
};

export const search = async (req, res) => {
  try {
    const { limit, offset } = req.pagination;
    const search = req.search;

    let searchWordsLike = search.split(" ").map(word => {
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
    };

    const count = await models.Contact.count(attrs);
    const users = await models.Contact.findAll({ ...attrs, limit, offset });

    const totalPages = Math.ceil(count / limit);
    return res.status(200).json({ totalPages, count, users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export default { create, getAll, update, search };
