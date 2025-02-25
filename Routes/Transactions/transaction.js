const express = require("express");
const { authenticateToken } = require("../../Middlewares/jwt_auth_tkn");
const Transaction = require("../Model/transaction");
const transaction = express.Router();

// POST - Add a new transaction object to the Transaction collection
transaction.post("/", authenticateToken, async (req, res) => {
  const decodedEmail = req; // Assumes decoded email is injected by middleware
  const { email, transactionList } = req.body;

  if (!email || !transactionList) {
    return res.status(400).json({ message: "Invalid request body" });
  }

  try {
    const acc = new Transaction({ email, transactionList });
    const savedTransaction = await acc.save();
    res.status(201).json({
      message: "Transaction created successfully",
      transaction: savedTransaction,
    });
  } catch (e) {
    console.error("Error saving transaction:", e.message);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: e.message });
  }
});

transaction.post("/addTransaction", authenticateToken, async (req, res) => {
  const decodedEmail = req;
  const updates = req.body;

  try {
    const transaction = await Transaction.findOne({ email: decodedEmail });
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (!updates.bankType) {
      return res
        .status(400)
        .json({ message: "bankType is required in the update" });
    }

    transaction.transactionList.push(updates);
    const updatedTransaction = await transaction.save();

    res.status(200).json({
      message: "Transaction updated successfully",
      transaction: updatedTransaction,
    });
  } catch (e) {
    console.error("Error updating transaction:", e.message);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: e.message });
  }
});

// GET - Fetch all transaction records from the Transaction collection
transaction.get("/", authenticateToken, async (req, res) => {
  try {
    // Fetch only the transactionList field from all documents
    const transactions = await Transaction.find({}, "transactionList");

    // Combine all transactionList arrays into a single array
    const transactionsList = transactions.reduce((acc, transaction) => {
      return acc.concat(transaction.transactionList);
    }, []);

    // Respond with the consolidated transaction list
    res.status(200).json({ transactionsList });
  } catch (e) {
    console.error("Error fetching transactions:", e.message);
    res.status(500).json({ message: "Internal Server Error", error: e.message });
  }
});


module.exports = transaction;
