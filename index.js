      const express = require("express"); // Importing Express for creating the server
const dotenv = require("dotenv"); // Importing dotenv for loading environment variables
const mongoose = require("mongoose"); // Importing Mongoose for database interaction
const cors = require("cors"); // Importing CORS middleware
const auth = require("./Routes/Auth/authentication.js"); // Importing the router for authentication routes
const router = require("./Routes/router.js");
const accounts = require("./Routes/Accounts/accounts.js");
const transaction = require("./Routes/Transactions/transaction.js");
const payment = require("./Routes/Payments/payments.js");
const testing = require("./Routes/Auth/newSessionTryingApis.js");
const session = require("express-session");

// Setting up global variables
dotenv.config();

// Set the port number
const PORT = process.env.PORT || 3000;

// Initialize the Express app
const app = express();

// Enable CORS with default options
app.use(cors());

// Middleware to parse incoming JSON requests
app.use(express.json());

// MongoDB connection string
const dbURI = process.env.DATABASE_URL;

// Connect to MongoDB using Mongoose
mongoose
  .connect(dbURI) // Establish connection
  .then(() => console.log(`Connected to database`)) // Log success message
  .catch((err) => console.error("Database connection error:", err)); // Log error

// Routes for handling various requests
app.use("/auth", auth);
app.use("/routes", router);
app.use("/banks", accounts);
app.use("/transactions", transaction);
app.use("/payment", payment);
app.use("/testing",testing);
// Start the server and listen on the specified port
app.get("/test",(req,res)=>{
  res.json({message:"Hari Raval"});
})
app.listen(PORT, () => {
  console.log(`Server is started on http://localhost:${PORT}`);
});
