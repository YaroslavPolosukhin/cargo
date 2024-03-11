import { expect } from 'chai'

/**
 * @param {import('supertest').SuperTest} request - the request object
 * @param {string} authToken - the authentication token
 * @return {undefined}
 */
const nomenclatureTests = (request, authToken) => {
  describe('Nomenclature Module', () => {
    describe('POST /api/nomenclature', function () {
      it('should create a new nomenclature with valid data', async function () {
        const addressData = {
          name: 'John Nomenclature',
          measureId: 1
        }

        const res = await request.post('/api/nomenclature').set('Authorization', `Bearer ${authToken}`).send(addressData)
        expect(res.status).to.equal(201)
      })

      it('should not create an nomenclature with invalid name', async function () {
        const res = await request.post('/api/nomenclature').set('Authorization', `Bearer ${authToken}`).send({ name: ' ', measureId: 1 })
        expect(res.status).to.equal(400)
      })

      it('should not create an nomenclature with invalid measureId', async function () {
        const res = await request.post('/api/nomenclature').set('Authorization', `Bearer ${authToken}`).send({ name: 'test', measureId: 23423432 })
        expect(res.status).to.equal(404)
      })
    })

    describe('GET /api/nomenclature', function () {
      it('should retrieve all addresses', async function () {
        const res = await request.get('/api/nomenclature/all').set('Authorization', `Bearer ${authToken}`)
        expect(res.status).to.equal(200)
        expect(res.body).to.be.an('array')
      })
    })
  })
}

export default nomenclatureTests
