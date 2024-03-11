import { expect } from 'chai'

/**
 * @param {import('supertest').SuperTest} request - the request object
 * @param {string} authToken - the authentication token
 * @return {undefined}
 */
const contactsTests = (request, authToken) => {
  describe('Contacts Module', () => {
    describe('POST /api/contacts', () => {
      it('should create a new contact with valid data', async () => {
        const contactData = {
          name: 'John',
          phone: '1234567890',
          email: 'john.doe@example.com'
        }
        const res = await request.post('/api/contacts').set('Authorization', `Bearer ${authToken}`).send(contactData)
        expect(res.status).to.equal(201)
        expect(res.body).to.have.property('contact')
        expect(res.body.contact).to.include(contactData)
      })

      it('should not create a contact with invalid data', async () => {
        const contactData = {
          name: '', // Empty name which is invalid as per the validator
          phone: 'notaphone', // Invalid phone number
          email: 'john.doe@example' // Invalid email
        }
        const res = await request.post('/api/contacts').set('Authorization', `Bearer ${authToken}`).send(contactData)
        expect(res.status).to.equal(400)
        expect(res.body).to.have.property('message')
      })
    })

    describe('GET /api/contacts', () => {
      it('should get all contacts', async () => {
        const res = await request.get('/api/contacts/all').set('Authorization', `Bearer ${authToken}`)
        expect(res.status).to.equal(200)
        expect(res.body).to.be.an('array')
      })
    })
  })
}

export default contactsTests
