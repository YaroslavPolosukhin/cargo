import { expect } from 'chai'

/**
 *
 * @param {import('supertest').SuperTest} request - the request object
 * @param {string} authToken - the authentication token
 * @return {undefined}
 */
const driversTests = (request, authToken) => {
  describe('Drivers Module', () => {
    it('should return approved drivers', async () => {
      const res = await request.get('/api/drivers/approved').set('Authorization', `Bearer ${authToken}`)
      expect(res.status).to.equal(200)
      expect(res.body).to.be.an('array')
    })

    it('should return unapproved drivers', async () => {
      const res = await request.get('/api/drivers/unapproved').set('Authorization', `Bearer ${authToken}`)
      expect(res.status).to.equal(200)
      expect(res.body).to.be.an('array')
    })

    it('should confirm a user', async () => {
      const payload = {
        userId: 1,
        name: 'John',
        surname: 'Doe',
        patronymic: 'Smith',
        inn: '999999999999',
        employmentType: 'self_employed',
        jobPositionId: 1,
        email: 'john.doe@example.com',
        telegram: '@johndoe',
        contragent: {
          contragentName: 'JD Solutions',
          contragentINN: '999999999999',
          kpp: '777777777',
          companyType: 'LLC'
        },
        passport: {
          series: '1234',
          number: '567890',
          issuedBy: 'Department of Passport Services',
          issueDate: '2010-01-01',
          departmentCode: '123-456'
        }
      }

      const files = [
        { path: 'test/images/test.jpg' }
      ]

      const res = await request.post('/api/drivers/confirm')
        .set('Authorization', `Bearer ${authToken}`)
        .field('userId', payload.userId)
        .field('name', payload.name)
        .field('surname', payload.surname)
        .field('patronymic', payload.patronymic)
        .field('inn', payload.inn)
        .field('employmentType', payload.employmentType)
        .field('jobPositionId', payload.jobPositionId)
        .field('email', payload.email)
        .field('telegram', payload.telegram)
        .field('contragentName', payload.contragent.contragentName)
        .field('contragentINN', payload.contragent.contragentINN)
        .field('kpp', payload.contragent.kpp)
        .field('companyType', payload.contragent.companyType)
        .field('passportSeries', payload.passport.series)
        .field('passportNumber', payload.passport.number)
        .field('passportIssuedBy', payload.passport.issuedBy)
        .field('passportIssueDate', payload.passport.issueDate)
        .field('passportDepartmentCode', payload.passport.departmentCode)
        .attach('photos', files[0].path)

      expect(res.status).to.equal(200)
    })
  })
}

export default driversTests
