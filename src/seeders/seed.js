import { models } from "../models/index.js";
import Roles from "../enums/roles.js";
import bcrypt from "bcryptjs";

const seedRoles = async () => {
  const roles = [
    { id: 1, name: Roles.DRIVER },
    { id: 2, name: Roles.MANAGER },
    { id: 3, name: Roles.ADMIN },
    { id: 4, name: Roles.OWNER },
  ];

  try {
    await models.Role.bulkCreate(roles);
    console.log("Роли были успешно добавлены.");
  } catch (error) {
    console.error("Ошибка при добавлении ролей:", error);
  }
};

const seedTestUsers = async () => {
  const hashedPassword = await bcrypt.hash("SDFGSFZXCSDF", 8);

  const users = [
    { id: 1, phone: "89229642345", password: hashedPassword, role_id: 1 },
    {
      id: 2,
      phone: "89229642342",
      password: hashedPassword,
      role_id: 1,
      approved: true,
    },
    {
      id: 3,
      phone: "89229642340",
      password: hashedPassword,
      role_id: 2,
      approved: true,
    },
  ];

  try {
    await models.User.bulkCreate(users);
    await models.Person.bulkCreate(users.map((user) => ({ user_id: user.id })));
    console.log("Пользователи были успешно добавлены.");
  } catch (error) {
    console.error("Ошибка при добавлении пользователей:", error);
  }
};

const seedCountries = async () => {
  const countries = [{ id: 1, name: "Россия" }];

  try {
    await models.Country.bulkCreate(countries);
    console.log("Страны были успешно добавлены.");
  } catch (error) {
    console.error("Ошибка при добавлении стран:", error);
  }
};

export const seedJobPositions = async () => {
  const jobPositions = [{ id: 1, name: "Водители" }];

  try {
    await models.JobPosition.bulkCreate(jobPositions);
    console.log("Должности были успешно добавлены.");
  } catch (error) {
    console.error("Ошибка при добавлении должностей:", error);
  }
};

export const seedMeasures = async () => {
  const measures = [
    { id: 1, name: "кг" },
    { id: 2, name: "шт" },
    { id: 3, name: "тонн" },
  ];

  try {
    await models.Measure.bulkCreate(measures);
    console.log("Единицы измерения были успешно добавлены.");
  } catch (error) {
    console.error("Ошибка при добавлении единиц измерения:", error);
  }
};

export const seedDatabase = async () => {
  await seedRoles();
  await seedCountries();
  await seedJobPositions();
  await seedMeasures();
  await seedTestUsers();
};
