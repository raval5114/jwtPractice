const mongoose = require("mongoose");

// Define the transaction schema
const transactionSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true }, // Ensures unique email and faster queries
  transactionList: [
    {
      title: { type: String, required: true, maxlength: 100 },
      amount: { type: Number, required: true, min: 0 }, // Ensure positive amounts
      category: { type: String, required: true },
      description: { type: String, maxlength: 500 },
      transactionType: {
        type: String,
        required: true,
        enum: ["credit", "debit"], // Predefined values for transaction type
      },
      bankType: {
        type: String,
        required: true,
        enum: ["savings", "current"], // Predefined values for bank type
      },
      time: { type: Date, required: true, default: Date.now }, // Default value
    },
  ],
});

// Create the model
const Transaction = mongoose.model(
  "Transactions",
  transactionSchema,
  "Transactions"
);

// Export the model
module.exports = Transaction;
