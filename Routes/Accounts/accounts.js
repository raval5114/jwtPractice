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
  const decoded = req.user; // Decoded JWT token (contains user details)

  console.log(`Adding Account Details for User: ${decoded}`);

  try {
    // Extract account details from the request body
    const {accountHolderName, mobileNo} = req.body;
      console.log("\n",accountHolderName,"\n");
    // Ensure all required fields are provided (email, accountHolderName, mobileno)
    if (!accountHolderName || !mobileNo) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Create a new account document using the Accounts model
    const newAccount = new Accounts({
      email: decoded, // From request body
      accountHolderName: accountHolderName,
      mobileno: mobileNo,
      banks:[], // Empty array if no banks provided
    });

    // Save the new account to the database
    await newAccount.save();

    res
      .status(200)
      .send({ message: "Account Details Added", user: decoded });
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
    const decoded = req.user;
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
  res.send("Accounts Details Retrieved");
});

// GET /accounts/all - Get Every Account Details
accounts.get("/accounts/all", (req, res) => {
  console.log("Get every accounts details");
  res.send("Every Account Details Retrieved");
});
accounts.patch("/banks", authenticateToken, async (req, res) => {
  const decoded = req.user; // Decoded JWT token contains user details
  const { bankName, accountNumber,netBanking,ifscCode, balance ,} = req.body;

  try {
    // Find the user account by their email or another unique identifier
    const acc_User = await Accounts.findOne({ email: decoded });

    if (!acc_User) {
      return res.status(404).json({ message: "User account not found!" });
    }

    // Add new bank details to the `banks` array
    const newBank = { bankName,netBanking,accountNumber, ifscCode, balance};
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

accounts.get("/banks",authenticateToken,async(req,res) => {
    const decoded = req.user;

    try{
         const user = await Accounts.findOne({email:decoded});   
        res.status(200).json({
          message:"Bank Details of User",
          bankDetails:user
        })
      }
    catch(e)
    {
      console.error(e);
      res.status(500).json({message:"Internal Server Error",error:e.message});
    }
});

module.exports = accounts;
