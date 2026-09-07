const jwt = require("jsonwebtoken");

/**
 * Requires a valid JWT. Attaches { id, phone } to req.farmer.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing Authorization header." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.farmer = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

/**
 * Attaches req.farmer if a valid token is present, but does not reject
 * the request otherwise. Used by routes (like /chat) that work for both
 * anonymous and logged-in users.
 */
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (token) {
    try {
      req.farmer = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // Ignore invalid tokens on optional routes.
    }
  }
  next();
}

module.exports = { requireAuth, optionalAuth };
