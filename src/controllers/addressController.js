import { models } from "../models/index.js";
import { validationResult } from "express-validator";

export const create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array() });
  }

  const {
    name,
    city,
    street,
    house,
    building,
    floor,
    postcode,
    description,
    apartment,
  } = req.body;

  const body = JSON.parse(JSON.stringify(req.body));

  try {
    const [cityObject] = await models.City.findOrCreate({
      where: { name: city },
    });
    const [streetObject] = await models.Street.findOrCreate({
      where: { name: street },
    });

    const address = await models.Address.create(
      {
        name,
        country_id: 1,
        city_id: cityObject.id,
        street_id: streetObject.id,
        house,
        building,
        floor,
        postcode,
        ...(body.hasOwnProperty("description") && {
          description,
        }),
        ...(body.hasOwnProperty("apartment") && {
          apartment,
        }),
      },
      { include: [models.Country, models.City, models.Street] }
    );
    res.status(201).json({ address });
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
};

export const update = async (req, res) => {
  const { addressId } = req.params;
  const dataForUpdate = req.body;

  try {
    const address = await models.Address.findByPk(addressId);
    if (address === null) {
      return res.status(404).json({ error: "Address not found" });
    }
    await address.update(dataForUpdate);
    return res.status(200).json(address);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getAll = async (req, res) => {
  try {
    const addresses = await models.Address.findAll({
      include: [models.Country, models.City, models.Street],
    });
    res.json(addresses);
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
};

export default { create, getAll, update };
