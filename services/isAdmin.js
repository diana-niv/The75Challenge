// middleware/isAdmin.js
function isAdmin(req, res, next) {
    if (req.user && req.user.role === "admin") {
        return next();
    }
    return res.status(403).render('error', { error: 'Forbidden: Admins only.' });
}

module.exports = isAdmin;