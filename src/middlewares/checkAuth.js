import jwt from 'jsonwebtoken'
import { models } from '../models/index.js'

export default async (req, res, next) => {
  try {
    let token = null

    if (req.headers.authorization) {
      token = req.headers.authorization.split(' ')[1]
    } else if (req.query.authorization) {
      token = req.query.authorization
    } else {
      return res.status(401).send({ message: 'Authentication failed' })
    }

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
