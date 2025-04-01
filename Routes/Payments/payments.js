const express = require("express");
const mongoose = require("mongoose");
const Payment = require("./payment_contract");
const Transaction = require("../Model/transaction");
const Accounts = require("../Model/accountModel");
const payment = express.Router();

/**
 * PATCH /payment/
 * Handles payment transactions between two accounts.
 */
payment.patch("/payViaSpecificBank", async (req, res) => {
  const { fromNumber, toNumber, amount, fromBank, toBank } = req.body;

  console.log("From:", fromNumber);
  console.log("To:", toNumber);
  console.log("Amount:", amount);
  console.log("From Bank:", fromBank);
  console.log("To Bank:", toBank);

  if (!fromNumber || !toNumber || !fromBank || !toBank || amount === undefined) {
    return res.status(400).json({
      message: "Bad Request: Missing required fields.",
    });
  }

  const fromNum = Number(fromNumber);
  const toNum = Number(toNumber);
  const amt = Number(amount);

  if (isNaN(fromNum) || isNaN(toNum) || fromNum === toNum || isNaN(amt) || amt <= 0) {
    return res.status(400).json({ message: "Invalid input values." });
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const receiver = await Accounts.findOne({ mobileno: toNum }).session(session);
    if (!receiver) throw new Error("Transaction failed: Receiver not found");

    const result = await Payment.payViaSpecificBank(amt, fromNum, toNum, fromBank, toBank, session);

    // Ensure sender transaction document exists
    let senderTransaction = await Transaction.findOne({ mobileno: fromNum }).session(session);
    if (!senderTransaction) {
      await Transaction.create([{ mobileno: fromNum, transactionList: [] }], { session });
    }

    // Ensure receiver transaction document exists
    let receiverTransaction = await Transaction.findOne({ mobileno: toNum }).session(session);
    if (!receiverTransaction) {
      await Transaction.create([{ mobileno: toNum, transactionList: [] }], { session });
    }

    // Log transaction for sender
    await Transaction.updateOne(
      { mobileno: fromNum },
      {
        $push: {
          transactionList: {
            title: `Transfer to ${toNum}`,
            amount: amt,
            category: "Transfer",
            description: `Transferred to ${toBank}`,
            transactionType: "Expense",
            bankType: fromBank,
            time: new Date()
          }
        }
      },
      { session }
    );

    // Log transaction for receiver
    await Transaction.updateOne(
      { mobileno: toNum },
      {
        $push: {
          transactionList: {
            title: `Received from ${fromNum}`,
            amount: amt,
            category: "Transfer",
            description: `Received from ${fromBank}`,
            transactionType: "Income",
            bankType: toBank,
            time: new Date()
          }
        }
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();
    res.status(200).json({ message: "Payment Successful", transaction: result });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Payment Error:", err.message);
    res.status(500).json({ message: err.message });
  }
}); 

payment.patch("/payViaNumber", async (req, res) => {
  const { fromNumber, toNumber, amount } = req.body;

  console.log("From:", fromNumber);
  console.log("To:", toNumber);
  console.log("Amount:", amount);

  // Validate inputs
  if (!fromNumber || !toNumber || amount === undefined) {
    return res.status(400).json({
      message: "Bad Request: 'fromNumber', 'toNumber', and 'amount' are required.",
    });
  }

  const fromNum = Number(fromNumber);
  const toNum = Number(toNumber);
  const amt = Number(amount);

  if (isNaN(fromNum) || isNaN(toNum)) {
    return res.status(400).json({
      message: "Bad Request: 'fromNumber' and 'toNumber' must be valid numbers.",
    });
  }

  if (fromNum === toNum) {
    return res.status(400).json({
      message: "Bad Request: 'fromNumber' and 'toNumber' cannot be the same.",
    });
  }

  if (isNaN(amt) || amt <= 0) {
    return res.status(400).json({
      message: "Bad Request: 'amount' must be a positive number.",
    });
  }

  try {
    console.log("DEBUG: Calling setBankDetails");
    await Payment.setBankDetails(fromNum, toNum);

    console.log("DEBUG: Processing payment");
    const result = await Payment.payViaNumber(amt, fromNum, toNum);

    res.status(200).json({ message: "Payment Successful", transaction: result });
  } catch (err) {
    console.error("Payment Error:", err.message);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

module.exports = payment;
