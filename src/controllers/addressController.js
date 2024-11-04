import { models } from "../models/index.js";
import { validationResult } from "express-validator";
import Sequelize from 'sequelize'

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
    region
  } = req.body;

  const body = JSON.parse(JSON.stringify(req.body));

  try {
    const [cityObject] = await models.City.findOrCreate({
      where: { name: city },
    });

    let streetId = null
    if (body.hasOwnProperty("street")) {
      const [streetObject] = await models.Street.findOrCreate({
        where: { name: street },
      });
      streetId = streetObject.id
    }

    let region = null;
    if (body.hasOwnProperty("region")) {
      region = await models.Region.findOrCreate({
        where: { name: body.region },
      });
    }

    const address = await models.Address.create(
      {
        name,
        country_id: 1,
        city_id: cityObject.id,
        street_id: streetId,
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
        ...(region && {
          region_id: region[0].id,
        }),
      },
      { include: [models.Country, models.City, models.Street, models.Region] }
    );
    res.status(201).json({ address });
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
};

export const update = async (req, res) => {
  const { addressId } = req.params;
  const { name, city, street, house, building, floor, postcode } = req.body;

  try {
    const address = await models.Address.findByPk(addressId);
    if (address === null) {
      return res.status(404).json({ error: "Address not found" });
    }
    await address.update(
      {
        name,
        house,
        building,
        floor,
        postcode,
      },
      {
        include: [
          models.Country,
          models.City,
          models.Street,
        ]
      }
    );

    const cityObject = await models.City.findOrCreate({
      where: { name: city },
    });

    const streetObject = await models.Street.findOrCreate({
      where: { name: street },
    });

    await address.setCity(cityObject[0]);
    await address.setStreet(streetObject[0]);


    return res.status(200).json(address);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getAll = async (req, res) => {
  try {
    const {
      limit,
      offset
    } = req.pagination;

    if (req.query.hasOwnProperty("search")) {
      return search(req, res);
    }

    const addresses = await models.Address.findAll({
      include: [models.Country, models.City, models.Street, models.Region],
      limit,
      offset,
    });

    res.json(addresses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal serveaddressr error" });
  }
};

export const search = async (req, res) => {
  try {
    const { limit, offset } = req.pagination;
    const search = req.query.search;

    const words = search.split(" ")
    const searchVal = { [Sequelize.Op.or]: [] }
    const findTabs = ["$Country.name$", "$City.name$", "$Street.name$", "house"]

    if (words.length === 1) {
      for (let i = 0; i < 3; i++) {
        searchVal[Sequelize.Op.or].push({
          [findTabs[i]]: {
            [Sequelize.Op.iLike]: `%${search}%`
          }
        })
      }
    } else if (words.length === 2) {
      for (const word of words) {
        for (const tab of findTabs) {
          searchVal[Sequelize.Op.or].push({
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
            searchVal[Sequelize.Op.or].push({
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
                },
              ]
            })
          }
        }
      }
    }

    const attrs = {
      where: {
        [Sequelize.Op.or]: [
          {
            name: {
              [Sequelize.Op.iLike]: `%${search}%`,
            },
          },
          searchVal
        ]
      },
      include: [models.Country, models.City, models.Street],
      attributes: ["id", "name", "house", "building", "floor", "postcode", "description", "apartment"],
      limit,
      offset,
    };

    // const count = await models.Address.count(attrs);
    const addresses = await models.Address.findAll(attrs);
    const count = addresses.length;

    const totalPages = Math.ceil(count / limit);
    return res.status(200).json({ totalPages, count, addresses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export default { create, getAll, update, search };
