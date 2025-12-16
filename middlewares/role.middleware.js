function requireRole(role) {
  return function (req, res, next) {
    if (req.session.user.role !== role) {
      return res.status(403).render("error", {
        message: "Access denied"
      });
    }
    next();
  };
}

module.exports = requireRole;
