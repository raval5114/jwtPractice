const express = require("express");
const {
  jwtVerifyToken,
  authenticateToken,
} = require("../../Middlewares/jwt_auth_tkn");
const Accounts = require("../Model/accountModel");
const { decode } = require("jsonwebtoken");
const accounts = express.Router();

// POST /accounts - Add Account Details
accounts.post("/accounts", authenticateToken, async (req, res) => {
  const decoded = req.user.email; // Decoded JWT token (contains user details)

  console.log(`Adding Account Details for User: ${decoded}`);

  try {
    // Extract account details from the request body
    const { accountHolderName, mobileNo } = req.body;
    // Ensure all required fields are provided (email, accountHolderName, mobileno)
    if (!accountHolderName || !mobileNo) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Create a new account document using the Accounts model
    const newAccount = new Accounts({
      email: decoded, // From request body
      accountHolderName: accountHolderName,
      mobileno: mobileNo,
      banks: [], // Empty array if no banks provided
    });

    // Save the new account to the database
    await newAccount.save();

    res.status(200).send({ message: "Account Details Added", user: decoded });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: e.message });
  }
});

// GET /accounts - Get Account Details
accounts.get("/accounts", authenticateToken, async (req, res) => {
  try {
    const decoded = req.user.email;
    const acc_User = await Accounts.findOne({ email: decoded });
    res
      .status(200)
      .send({ message: "Accound User Details found", user: acc_User });
  } catch (e) {
    return res
      .status(500)
      .json({ message: "internal server error", error: e.message });
  }
  console.log("Getting Accounts Details");
});

// GET /accounts/all - Get Every Account Details
accounts.get("/accounts/all", (req, res) => {
  console.log("Get every accounts details");
  res.send("Every Account Details Retrieved");
});
accounts.patch("/banks", authenticateToken, async (req, res) => {
  const decoded = req.user.email; // Decoded JWT token contains user details
  const { bankName, accountNumber, netBanking, ifscCode, balance } = req.body;

  try {
    // Find the user account by their email or another unique identifier
    const acc_User = await Accounts.findOne({ email: decoded });

    if (!acc_User) {
      return res.status(404).json({ message: "User account not found!" });
    }

    // Add new bank details to the `banks` array
    const newBank = { bankName, netBanking, accountNumber, ifscCode, balance };
    acc_User.banks.push(newBank);

    // Save the updated account back to the database
    await acc_User.save({ validateModifiedOnly: true });

    res.status(200).json({
      message: "Bank details updated successfully!",
      banks: acc_User.banks, // Return the updated banks array
    });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ message: "Internal server error", error: e.message });
  }
});

accounts.post("/banks", async (req, res) => {
  const { mobileno, accountNumber, ifscCode } = req.body;

  // Validate request fields
  if (!mobileno || !accountNumber || !ifscCode) {
    return res.status(400).json({
      message: "Invalid request. Mobile number, account number, and IFSC code are required.",
    });
  }

  try {
    // Query to find user and bank details
    const user = await Accounts.findOne({
      mobileno: mobileno,
      banks: {
        $elemMatch: {
          accountNumber: accountNumber,
          ifscCode: ifscCode,
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "No user found with the provided bank details.",
      });
    }

    // Extract the matched bank details
    const matchedBank = user.banks.find(
      (bank) => bank.accountNumber === accountNumber && bank.ifscCode === ifscCode
    );

    res.status(200).json({
      message: "Bank Details of User",
      bankDetails: {
        accountHolderName: user.accountHolderName,
        email: user.email,
        bank: matchedBank,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      message: "Internal Server Error",
      error: e.message,
    });
  }
});
accounts.get("/verifyPin", authenticateToken, async (req, res) => {
  const email = req.user.email;
  const { pin } = req.query; // Extract pin from query parameters

  if (!pin) {
    return res.status(400).json({ success: false, message: "Pin is required." });
  }

  try {
    const user = await Accounts.findOne({ email });

    if (!user || !user.pin) {
      return res.status(404).json({ success: false, message: "User not found or PIN not set." });
    }

    if (user.pin !== pin) {
      return res.status(401).json({ success: false, message: "Invalid PIN." });
    }

    res.status(200).json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Internal Server Error." });
  }
});


accounts.post("/setPin", authenticateToken, async (req, res) => {
  const email = req.user.email;
  const { newPin } = req.body;

  if (!newPin || newPin.length !== 4) {
    return res.status(400).json({ message: "Valid 4-digit PIN is required!" });
  }

  try {
    const user = await Accounts.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    user.pin = newPin;

    await user.save();

    res.status(200).json({ message: "PIN set successfully!" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal Server Error", error: e.message });
  }
});

accounts.post("/getBalance", authenticateToken, async (req, res) => {
  const email = req.user.email;

  try {
    const user = await Accounts.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    const totalBalance = user.banks.reduce((sum, bank) => sum + (bank.balance || 0), 0);

    res.status(200).json({
      message: "Total balance retrieved successfully!",
      totalBalance: totalBalance,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      message: "Internal Server Error",
      error: e.message,
    });
  }
});
accounts.post("/getAccountsByNumber", async (req, res) => {
  try {
    const { number } = req.body;

    if (!number) {
      return res.status(400).json({
        message: "Number is required",
        data: []
      });
    }

    const numberStr = number.toString().trim(); // Convert input number to string

    const listOfUsers = await Accounts.find(
      {
        $expr: {
          $regexMatch: { input: { $toString: "$mobileno" }, regex: numberStr, options: "i" }
        }
      },
      { mobileno: 1, accountHolderName: 1, _id: 0 } // Project only required fields
    );

    if (!listOfUsers.length) {
      return res.status(404).json({
        message: "No accounts found containing this number",
        data: []
      });
    }

    res.status(200).json({
      message: "Accounts fetched successfully",
      data: listOfUsers
    });

  } catch (e) {
    res.status(500).json({
      message: "Internal Server Error",
      error: e.message
    });
  }
});



module.exports = accounts;
