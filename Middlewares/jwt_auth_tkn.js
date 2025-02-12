
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Retrieve the secret key
const secretKey = process.env.JWT_SECRET_KEY;

/**
 Middleware to authenticate and verify JWT tokens. 
  - Extracts the token from the Authorization header.
  - Verifies the token using the secret key.
  - Attaches decoded user information to the request object if valid.
  - Rejects the request if the token is missing or invalid.
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

  if (!token) {
    return res.status(401).json({ error: "Access denied! Token is required." });
  }

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      console.error("Token verification error:", err.message);
      return res.status(403).json({ error: "Invalid or expired token!" });
    }

    req.user = user;

    next();
  });
};

//function to generate jwt token
function generateToken(payload) {
  return jwt.sign(
    { 
      ...payload, 
      iat: Math.floor(Date.now() / 1000)
    },
    secretKey
  );
}

//function to verify it
function jwtVerifyToken(token) {
  const decoded = jwt.verify(token, secretKey);
  return decoded;
}
module.exports = { authenticateToken, generateToken, jwtVerifyToken };
