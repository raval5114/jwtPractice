const express = require("express"); // Importing Express for creating the server
const dotenv = require("dotenv"); //importing dotenv for getting env file in index.js
const mongoose = require("mongoose"); // Importing Mongoose for database interaction
const auth = require("./Routes/Auth/authentication.js"); // Importing the router for authentication routes
const router = require("./Routes/router.js");
const accounts = require("./Routes/Accounts/accounts.js");
const transaction = require("./Routes/Transactions/transaction.js");
const payment = require("./Routes/Payments/payments.js");
//setting up global variable
dotenv.config();
// Set the port number
const PORT = process.env.PORT || 3000;

// Initialize the Express app
const app = express();

// Middleware to parse incoming JSON requests
app.use(express.json());

// MongoDB connection string
const dbURI = process.env.DATABASE_URL;
// Connect to MongoDB using Mongoose
mongoose
  .connect(dbURI) // Establish connection
  .then(() => console.log(`Connected to database`)) // Log success message
  .catch((err) => console.error("Database connection error:", err)); // Log errror

// Routes for handling authentication requests
app.use("/auth", auth);
app.use("/routes", router);
app.use("/banks", accounts);
app.use("/transactions",transaction);
app.use("/payment",payment);

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server is started on http://localhost:${PORT}`);
});
