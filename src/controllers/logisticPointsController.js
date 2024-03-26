import { validationResult } from "express-validator";
import { models, sequelize } from "../models/index.js";

export const create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array() });
  }

  const { name, addressId, contacts } = req.body;
  const transaction = await sequelize.transaction();

  try {
    const logisticsPoint = await models.LogisticsPoint.create(
      {
        name,
        address_id: addressId,
      },
      { transaction }
    );

    await logisticsPoint.addContacts(contacts, { transaction });
    await transaction.commit();
    res.status(201).json({ logisticsPoint });
  } catch (error) {
    console.error(error);
    await transaction.rollback();
    res.status(400).json({ message: "Error creating new logistics point" });
  }
};

export const update = async (req, res) => {
  const { pointId } = req.params;
  const dataForUpdate = req.body;

  try {
    const logisticPoint = await models.LogisticsPoint.findByPk(pointId);
    if (logisticPoint === null) {
      return res.status(404).json({ error: "Logistic point not found" });
    }
    await logisticPoint.update(dataForUpdate);
    return res.status(200).json(logisticPoint);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getAll = async (req, res) => {
  const { limit, offset } = req.pagination;

  try {
    const count = await models.LogisticsPoint.count({});
    const logisticPoints = await models.LogisticsPoint.findAll({
      include: [
        {
          model: models.Address,
          as: "Address",
          include: [
            {
              model: models.City,
              as: "City",
            },
            {
              model: models.Street,
              as: "Street",
            },
            {
              model: models.Country,
              as: "Country",
            },
          ]
        }
      ],
      limit,
      offset,
    });

    for (const point of logisticPoints) {
      const logisticPointContacts = await models.LogisticsPointContacts.findAll({
        where: {
          logistics_point_id: point.id
        },
        include: [
          {
            model: models.Contact,
            as: "contact",
          }
        ],
        attributes: [
          "contact_id",
        ]
      });
      point.dataValues.contacts = logisticPointContacts;
    }

    const totalPages = Math.ceil(count / limit);
    res.json({ totalPages, count, logisticPoints });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteLogisticsPoint = async (req, res) => {
  const { pointId } = req.params;

  try {
    const logisticPoint = await models.LogisticsPoint.findByPk(pointId);
    if (logisticPoint === null) {
      return res.status(404).json({ error: "Logistic point not found" });
    }

    await logisticPoint.destroy();

    return res.status(200).json({ message: "Logistic point has been deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export default { create, getAll, update, deleteLogisticsPoint };
