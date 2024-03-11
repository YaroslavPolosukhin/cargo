import { sync, sequelize } from "../models/index.js";

import { seedDatabase } from "./seed.js";

export async function seed() {
  await sync(true);
  await seedDatabase();
  await sequelize.close();
}

seed();
