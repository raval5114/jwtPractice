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

transaction.post("/addTransaction'", authenticateToken, async (req, res) => {
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

// POST - Fetch all transaction records from the Transaction from email
transaction.post("/fetchTransactions", async (req, res) => {
  try {
    const mobileno = req.body.mobileno;
    const userTransactions = await Transaction.findOne(
        { mobileno: mobileno },
        { transactionList: 1, _id: 0 } // Only fetch transactionList
    );

    if (!userTransactions) {
        return res.status(404).json({ message: "No transactions found" });
    }
    
    res.json(userTransactions.transactionList);
  } catch (e) {
    console.error("Error fetching transactions:", e.message);
    res.status(500).json({ message: "Internal Server Error", error: e.message });
  }
});


module.exports = transaction;
