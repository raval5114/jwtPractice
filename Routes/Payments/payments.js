const express = require("express");
const Payment = require("./payment_contract");
const Transaction = require("../Model/transaction");
const payment = express.Router();

/**
 * PATCH /payment/
 * Handles payment transactions between two accounts.
 */
payment.patch("/payViaNumber", async (req, res) => {
  const { fromNumber, toNumber, amount } = req.query;

  // Input Validation
  if (!fromNumber || !toNumber || amount === undefined) {
    return res.status(400).json({
      message:
        "Bad Request: 'fromNumber', 'toNumber', and 'amount' are required.",
    });
  }

  // Convert to numbers since query parameters are strings by default
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
    // Set bank details for the transaction
    await Payment.setBankDetails(fromNum, toNum);

    // Perform the transaction
    const result = await Payment.payViaNumber(amt);

    // Respond with success
    res.status(200).json({ message: result });
  } catch (err) {
    // Handle specific error scenarios
    if (
      err.name === "SameNumberError" ||
      err.name === "InvalidAmountError" ||
      err.name === "InsufficientBalanceError"
    ) {
      return res.status(400).json({
        message: `Bad Request: ${err.message}`,
      });
    }

    // Handle other internal errors
    res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
});


//pay via card
payment.patch("/payViaCard", async (req, res) => {
  try {
    const { amount, fromAccountNumber, toAccountNumber } = req.query;

    // Validate the input
    if (!amount || !fromAccountNumber || !toAccountNumber) {
      return res.status(400).json({
        message:
          "Invalid request. Amount, fromAccountNumber, and toAccountNumber are required.",
      });
    }

    // Convert values to appropriate types
    const amt = Number(amount);
    const fromAcc = String(fromAccountNumber);
    const toAcc = String(toAccountNumber);

    if (isNaN(amt) || amt <= 0) {
      return res.status(400).json({
        message: "Invalid request. Amount must be a positive number.",
      });
    }

    if (fromAcc === toAcc) {
      return res.status(400).json({
        message: "From and To account numbers cannot be the same.",
      });
    }

    // Execute the payment using the `payViaCard` method
    const result = await Payment.payViaCard(amt, fromAcc, toAcc);
    res.status(200).json({
      message: result, // Success message from `payViaCard`
    });
  } catch (err) {
    if (
      err.name === "InvalidAmountError" ||
      err.name === "InsufficientBalanceError"
    ) {
      res.status(400).json({
        message: "Payment failed.",
        error: err.message,
      });
    } else {
      res.status(500).json({
        message: "Internal Server Error",
        error: err.message,
      });
    }
  }
});

module.exports = payment;
