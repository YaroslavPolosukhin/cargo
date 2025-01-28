import jwt from 'jsonwebtoken'
import { models } from '../models/index.js'

export default async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      if (!req.query.authorization) {
        return res.status(401).send({ message: 'Authentication failed' })
      } else {
        req.headers.authorization = `Bearer ${req.query.authorization}`
      }
    }

    const token = req.headers.authorization.split(' ')[1]
    if (!token) {
      return res.status(401).send({ message: 'Authentication failed' })
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET)
    const user = await models.User.findOne({
      where: { id: decodedToken.id },
      include: [{
        model: models.Role,
        as: 'role'
      }]
    })

    if (!user) {
      return res.status(401).send({ message: 'Authentication failed' })
    }

    req.user = {
      id: user.id,
      role: user.role.name.trim()
    }

    next()
  } catch (error) {
    console.log(error)
    res.status(401).send({ message: 'Authentication failed' })
  }
}
