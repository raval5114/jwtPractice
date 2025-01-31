const express = require("express");
const session = require("express-session");

const testing = express.Router();

// Configure session middleware
testing.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 60000 },
  })
);

testing.use(express.json()); // Middleware to parse JSON body

testing.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Dummy authentication (replace with real authentication logic)
  if (username === "Hari" && password === "Raval123") {
    req.session.user = "Hari";
    req.session.lastName = "Raval";
    return res.json({ message: "Login successful!", user: req.session.user });
  }

  res.status(401).json({ message: "Invalid credentials" });
});

// Access session data
testing.get("/dashboard", (req, res) => {
  if (req.session.user) {
    res.json({
      username: req.session.user,
      password: req.session.lastName,
    });
  } else {
    res.status(401).json({ message: "Unauthorized. Please log in." });
  }
});

// Logout and destroy session
testing.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Error logging out" });
    }
    res.json({ message: "Logged out successfully" });
  });
});

module.exports = testing;
