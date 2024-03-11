import Roles from '../enums/roles.js'

/**
 * Middleware to check if the user's role is allowed to access the endpoint.
 * @param {string[]} allowedRoles - An array of roles permitted to access the endpoint.
 * @returns {Function} Express middleware function.
 */
export default (allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.role
    if (userRole === Roles.ADMIN || allowedRoles.includes(userRole)) {
      next()
    } else {
      res.status(403).send({ message: 'Access denied: insufficient permissions' })
    }
  }
}
