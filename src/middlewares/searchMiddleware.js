const searchMiddleware = (req, res, next) => {
  if (!("search" in req.query)) {
    return res.status(500).json({ error: "Search query is required." })
  }

  req.search = req.query.search

  next()
}

export default searchMiddleware
