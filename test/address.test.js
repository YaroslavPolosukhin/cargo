import { expect } from 'chai'

/**
 * @param {import('supertest').SuperTest} request - the request object
 * @param {string} authToken - the authentication token
 * @return {undefined}
 */
const addressTests = (request, authToken) => {
  describe('Address Module', () => {
    describe('POST /api/address', function () {
      it('should create a new address with valid data', async function () {
        const addressData = {
          name: 'John Doe',
          city: 'New City',
          street: 'Main Street',
          house: '123',
          building: '1',
          floor: '2',
          postcode: '123456'
        }

        const res = await request.post('/api/address').set('Authorization', `Bearer ${authToken}`).send(addressData)
        expect(res.status).to.equal(201)
      })

      it('should not create an address with invalid data', async function () {
        const res = await request.post('/api/address').set('Authorization', `Bearer ${authToken}`).send({ name: '' })
        expect(res.status).to.equal(400)
      })
    })

    describe('GET /api/address', function () {
      it('should retrieve all addresses', async function () {
        const res = await request.get('/api/address/all').set('Authorization', `Bearer ${authToken}`)
        expect(res.status).to.equal(200)
        expect(res.body).to.be.an('array')
      })
    })
  })
}

export default addressTests
