const express = require("express");
const Payment = require("./payment_contract");
const Transaction = require("../Model/transaction");
const payment = express.Router();

/**
 * PATCH /payment/
 * Handles payment transactions between two accounts.
 */
payment.patch("/payViaNumber", async (req, res) => {
  const { fromNumber, toNumber, amount } = req.body;

  // Input Validation
  if (!fromNumber || !toNumber || amount === undefined) {
    return res.status(400).json({
      message:
        "Bad Request: 'fromNumber', 'toNumber', and 'amount' are required.",
    });
  }

  if (typeof fromNumber !== "number" || typeof toNumber !== "number") {
    return res.status(400).json({
      message:
        "Bad Request: 'fromNumber' and 'toNumber' must be valid numbers.",
    });
  }

  if (fromNumber === toNumber) {
    return res.status(400).json({
      message: "Bad Request: 'fromNumber' and 'toNumber' cannot be the same.",
    });
  }

  if (typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({
      message: "Bad Request: 'amount' must be a positive number.",
    });
  }

  try {
    // Set bank details for the transaction
    await Payment.setBankDetails(fromNumber, toNumber);

    // Perform the transaction
    const result = await Payment.payViaNumber(amount);

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
    const { amount, fromAccountNumber, toAccountNumber } = req.body;

    // Validate the input
    if (!amount || !fromAccountNumber || !toAccountNumber) {
      return res.status(400).json({
        message:
          "Invalid request. Amount, fromAccountNumber, and toAccountNumber are required.",
      });
    }

    if (fromAccountNumber === toAccountNumber) {
      return res.status(400).json({
        message: "From and To account numbers cannot be the same.",
      });
    }

    // Execute the payment using the `payViaCard` method
    const result = await Payment.payViaCard(
      amount,
      fromAccountNumber,
      toAccountNumber
    );
    res.status(200).json({
      message: result, // Success message from `payViaCart`
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
