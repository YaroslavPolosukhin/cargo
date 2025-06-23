const getFullUrl = (req, relativePath) => {
  return `${process.env.PROTOCOL || 'http'}://${process.env.URL || ('127.0.0.1' + (process.env.PORT || '8000'))}/${relativePath}`
}

export { getFullUrl }
