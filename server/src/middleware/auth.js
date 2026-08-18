const jwt = require('jsonwebtoken');

/**
 * requireAuth - reads `Authorization: Bearer <token>`, verifies it, and sets
 * req.userId. Responds 401 if the header is missing or the token is invalid/expired.
 * Every protected route relies on req.userId (never a userId from the request body)
 * to scope its queries.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { requireAuth };
