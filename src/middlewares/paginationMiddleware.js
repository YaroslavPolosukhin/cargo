const paginationMiddleware = (req, res, next) => {
  const defaultLimit = 10
  const defaultOffset = 0

  // Parse query parameters
  const limit = parseInt(req.query.limit, 10) || defaultLimit
  const offset = parseInt(req.query.offset, 10) || defaultOffset

  // Append pagination details to request object
  req.pagination = { limit, offset }
  next()
}

export default paginationMiddleware
