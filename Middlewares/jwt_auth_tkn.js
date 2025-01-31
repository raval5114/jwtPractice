// Import the required modules
const jwt = require("jsonwebtoken"); // JSON Web Token library for verifying tokens
require("dotenv").config(); // To load environment variables from .env file

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
  // Extract token from the Authorization header
  const authHeader = req.headers["authorization"];
  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

  if (!token) {
    return res.status(401).json({ error: "Access denied! Token is required." });
  }

  // Verify the token
  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      console.error("Token verification error:", err.message);
      return res.status(403).json({ error: "Invalid or expired token!" });
    }

    // Attach decoded user information to the request object
    req.user = user;

    // Proceed to the next middleware or route handler
    next();
  });
};

function generateToken(payload) {
  return jwt.sign(
    { 
      ...payload, 
      iat: Math.floor(Date.now() / 1000)
    },
    secretKey
  );
}

function jwtVerifyToken(token) {
  const decoded = jwt.verify(token, secretKey);
  return decoded;
}
module.exports = { authenticateToken, generateToken, jwtVerifyToken };
