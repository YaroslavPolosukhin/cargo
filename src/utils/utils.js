const getFullUrl = (req, relativePath) => {
  return `${process.env.PROTOCOL || 'http'}://${req.get('host')}/${relativePath}`
}

export { getFullUrl }
