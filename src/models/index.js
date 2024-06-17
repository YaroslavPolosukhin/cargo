import Sequelize from "sequelize";
import UserModel from "./users/user.js";
import RoleModel from "./users/role.js";
import PassportModel from "./users/passport.js";
import JobPositionModel from "./users/jobPosition.js";
import ContragentModel from "./users/contragent.js";
import PersonModel from "./users/person.js";
import AddressModel from "./shipping/address.js";
import CityModel from "./shipping/city.js";
import StreetModel from "./shipping/street.js";
import ContactModel from "./shipping/contact.js";
import CountryModel from "./shipping/country.js";
import MeasureModel from "./shipping/measure.js";
import NomenclatureModel from "./shipping/nomenclature.js";
import OrderModel from "./shipping/order.js";
import TruckModel from "./shipping/truck.js";
import PassportPhotoModel from "./users/passportPhoto.js";
import MovingHistoryModel from "./shipping/movingHistory.js";
import LogisticsPointModel from "./shipping/logisticsPoint.js";
import logisticsPointContactsModel from "./shipping/logisticsPointContacts.js";
import OrderNomenclatureModel from "./shipping/orderNomenclature.js";
import PasswordRecoveryAttemptModel from "./users/passwordRecoveryAttempt.js";
import DrivingLicenceModel from './users/drivingLicence.js'

import config from "../config/config.js";

const dbConfig = config.database;
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

const models = {
  Role: RoleModel(sequelize, Sequelize),
  User: UserModel(sequelize, Sequelize),
  Passport: PassportModel(sequelize, Sequelize),
  PassportPhoto: PassportPhotoModel(sequelize, Sequelize),
  JobPosition: JobPositionModel(sequelize, Sequelize),
  Contragent: ContragentModel(sequelize, Sequelize),
  MovingHistory: MovingHistoryModel(sequelize, Sequelize),
  Person: PersonModel(sequelize, Sequelize),
  City: CityModel(sequelize, Sequelize),
  Street: StreetModel(sequelize, Sequelize),
  Contact: ContactModel(sequelize, Sequelize),
  Country: CountryModel(sequelize, Sequelize),
  Address: AddressModel(sequelize, Sequelize),
  LogisticsPoint: LogisticsPointModel(sequelize, Sequelize),
  LogisticsPointContacts: logisticsPointContactsModel(sequelize, Sequelize),
  Measure: MeasureModel(sequelize, Sequelize),
  Nomenclature: NomenclatureModel(sequelize, Sequelize),
  Order: OrderModel(sequelize, Sequelize),
  OrderNomenclature: OrderNomenclatureModel(sequelize, Sequelize),
  Truck: TruckModel(sequelize, Sequelize),
  PasswordRecoveryAttempt: PasswordRecoveryAttemptModel(sequelize, Sequelize),
  DrivingLicence: DrivingLicenceModel(sequelize, Sequelize)
};

Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

const sync = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log("Синхронизация с базой данных выполнена успешно.");
  } catch (error) {
    console.error("Ошибка при синхронизации с базой данных:", error);
  }
};

sync();

export { Sequelize, sequelize, models, sync };
