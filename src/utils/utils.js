const getFullUrl = (req, relativePath) => {
  return `${req.protocol}://${req.get('host')}/${relativePath}`;
};

export { getFullUrl };
