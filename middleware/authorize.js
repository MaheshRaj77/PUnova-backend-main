/**
 * Authorization Middleware
 * Role-Based Access Control (RBAC)
 */

/**
 * Authorize user by role(s)
 * @param {...string} allowedRoles - Roles that can access the endpoint
 * @returns {Function} Express middleware
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    // Check if user is authenticated (middleware/auth.js sets req.user)
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized. Token required.' });
    }

    // Check if user role is allowed
    const userRole = req.user.role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `This action requires one of the following roles: ${allowedRoles.join(', ')}. Your role: ${userRole}`,
      });
    }

    next();
  };
}

/**
 * Authorize admin-only actions
 */
const requireAdmin = authorize('admin');

/**
 * Authorize admin or faculty
 */
const requireAdminOrFaculty = authorize('admin', 'faculty');

/**
 * Authorize owner or admin
 * Checks if user id matches param id or user is admin
 */
function authorizeOwnerOrAdmin() {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized. Token required.' });
    }

    const requestedUserId = req.params.userId || req.body.user_id;
    const isOwner = req.user.id === parseInt(requestedUserId);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own data or you must be an admin',
      });
    }

    next();
  };
}

module.exports = {
  authorize,
  requireAdmin,
  requireAdminOrFaculty,
  authorizeOwnerOrAdmin,
};
