import { models } from '../models/index.js'

export const getAll = async (req, res) => {
  const { limit, offset } = req.pagination

  const count = await models.Measure.count({})
  const measures = await models.Measure.findAll({ limit, offset })

  const totalPages = Math.ceil(count / limit)
  res.json({ totalPages, count, measures })
}

export default { getAll }
