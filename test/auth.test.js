import { expect } from 'chai'
import { models } from '../src/models/index.js'

const userPhone = '89229648945'
const userPassword = 'testpasswordBlaBla'
const managerPhone = '89229648940'
const managerPassword = 'manager_password'

/**
 * @param {import('supertest').SuperTest} request - Test agent for HTTP assertions
 * @param {Function} setTokensCallback - Callback to pass the generated tokens
 * @return {void}
 */
const authTests = async (request, setTokensCallback) => {
  let authToken = null
  let managerToken = null

  describe('Authentication Module', () => {
    it('should register a new user', async () => {
      const res = await request
        .post('/api/auth/signUp')
        .send({
          phone: userPhone,
          password: userPassword
        })

      expect(res.status).to.equal(201)
    })

    it('should authenticate the user and get a token', async () => {
      const res = await request
        .post('/api/auth/signIn')
        .send({
          phone: userPhone,
          password: userPassword
        })

      expect(res.status).to.equal(200)
      expect(res.body).to.have.property('accessToken')
      expect(res.body).to.have.property('refreshToken')
      expect(res.body).to.have.property('user')
      authToken = res.body.accessToken
    })

    it('should get user info', async () => {
      const res = await request
        .get('/api/auth/user')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).to.equal(200)
      expect(res.body).to.have.property('person')
      expect(res.body.person).to.have.property('user')
      expect(res.body.person.user).to.have.property('phone')
    })

    it('should register manager and get a token', async () => {
      const res = await request
        .post('/api/auth/signUp')
        .send({
          phone: managerPhone,
          password: managerPassword
        })

      expect(res.status).to.equal(201)
      expect(res.body).to.have.property('accessToken')
      await models.User.update({ role_id: 2 }, { where: { phone: managerPhone } })
      managerToken = res.body.accessToken
      setTokensCallback(authToken, managerToken)
    })
  })
}

export default authTests
