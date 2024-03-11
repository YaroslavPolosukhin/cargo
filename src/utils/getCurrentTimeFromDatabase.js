import { Sequelize } from 'sequelize';
import { sequelize} from "../models/index.js";

export const getCurrentTimeFromDatabase = async () => {
  try {
    const queryResult = await sequelize.query(
      'SELECT LOCALTIMESTAMP as current_time',
      { type: Sequelize.QueryTypes.SELECT }
    );
    return queryResult[0].current_time;
  } catch (error) {
    console.log(`Error while getting current time from the DB: ${error}`);
    throw error;
  }
}
