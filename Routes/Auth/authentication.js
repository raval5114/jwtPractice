const express = require("express"); // Importing Express for routing
const bcrypt = require("bcrypt");
const crypto = require("crypto"); // Importing the crypto module

const User = require("../Model/model"); // Importing the User model for database operations
const {
  generateToken,
  authenticateToken,
  jwtVerifyToken,
} = require("../../Middlewares/jwt_auth_tkn");

const auth = express.Router(); // Creating a new router instance for authentication-related routes

function hasherInSHAser(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}
// Route to handle user Sign-In - login
auth.post("/Signin", async (req, res) => {
  const { emailOrMobile, password } = req.body;

  // Check if both email/mobile and password are provided
  if (!emailOrMobile || !password) {
    return res
      .status(400)
      .json({ message: "Email/Mobile and Password are required." });
  }

  try {
    // Find the user by email or mobile
    const user = await User.findOne({
      $or: [{ email: emailOrMobile }, { mobile: emailOrMobile }],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate the password using custom hashing
    const hashedPassword = hasherInSHAser(password); // Custom password hashing function
    if (hashedPassword !== user.password) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Generate a token if authentication is successful
    const token = generateToken({ username: user.email, password: password });

    res.status(200).json({
      message: "User logged in successfully",
      token: token,
      user: users,
    });
  } catch (err) {
    console.error("Error during sign-in:", err);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
});

// Sign out route
auth.post("/signout", (req, res) => {
  try {
    // Clear the token by setting the cookie expiration to a time in the past
    res.cookie("token", "", {
      expires: new Date(0), // Set expiration to the past to delete it
      httpOnly: true, // Make it accessible only by the server
      secure: process.env.NODE_ENV === "production", // Ensure it's secure in production
      sameSite: "strict", // Set SameSite for security
    });

    return res.status(200).json({ message: "Successfully logged out." });
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred while logging out.",
      error: error.message,
    });
  }
});

// Route to handle user Sign-Up - register

// Route to handle user Sign-Up - register
auth.post("/Signup", async (req, res) => {
  const { firstname, lastname, email, password, dob, mobile } = req.body;

  // Check if all required fields are provided
  if (!firstname || !lastname || !email || !password || !dob || !mobile) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Validate email format
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  // Validate mobile number format
  const mobileRegex = /^[0-9]{10}$/;
  if (!mobileRegex.test(mobile)) {
    return res
      .status(400)
      .json({ message: "Invalid mobile number. Must be 10 digits." });
  }

  // Validate date of birth (optional: can use libraries like `moment` for advanced validation)
  if (isNaN(Date.parse(dob))) {
    return res.status(400).json({ message: "Invalid date of birth" });
  }

  try {
    // Check if email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    // Hash the password using bcrypt
    const hashedPassword = hasherInSHAser(password);

    // Create and save the new user
    const newUser = new User({
      firstname,
      lastname,
      email,
      dob: new Date(dob), // Ensure dob is stored as a Date object
      password: hashedPassword,
      mobile,
    });
    const savedUser = await newUser.save();

    // Respond with the saved user details (excluding sensitive information)
    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: savedUser._id,
        name: `${savedUser.firstname} ${savedUser.lastname}`,
        email: savedUser.email,
        mobile: savedUser.mobile,
      },
    });
  } catch (e) {
    console.error("Error during sign-up:", e);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: e.message });
  }
});

//route to fetching user details --After Login
/**
  steps 1:
  1. user login -- for generating token 
  2. then user details for --for decoding that token
*/
//
// Exporting the router to be used in the main application
module.exports = auth;
