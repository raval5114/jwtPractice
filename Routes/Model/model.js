// Import mongoose library
const mongoose = require("mongoose");

// Define the schema for the User model
const userSchema = new mongoose.Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, // Ensure email is unique in the collection
    match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, // Email format validation
  },
  dob: { type: String, required: true },
  password: { type: String, required: true },
  mobile: { 
    type: String, 
    required: true, 
    match: /^[0-9]{10}$/, // Enforces a 10-digit numeric mobile number
  },
});

// Create a model based on the userSchema
const User = mongoose.model("Users", userSchema, "Users");

// Export the User model to be used in other parts of the application
module.exports = User;
