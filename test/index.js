import supertest from 'supertest'
import server from '../src/index.js'
import { sequelize } from '../src/models/index.js'
import { seedDatabase } from '../src/seeders/seed.js'
import authTests from './auth.test.js'
import driversTests from './drivers.test.js'
import addressTests from './address.test.js'
import contactsTests from './contacts.test.js'
import nomenclatureTests from './nomenclature.test.js'

const request = supertest(server)
let authToken = null
let managerToken = null

before(async () => {
  await sequelize.sync({ force: true })
  await seedDatabase()
})

after(async () => {
  await sequelize.close()
})

authTests(request, (_authToken, _managerToken) => {
  authToken = _authToken
  managerToken = _managerToken
  runTests()
})

const runTests = () => {
  addressTests(request, managerToken)
  driversTests(request, managerToken)
  contactsTests(request, managerToken)
  nomenclatureTests(request, managerToken)
}
