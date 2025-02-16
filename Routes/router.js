const express = require("express");
const User = require("./Model/model.js");
const Accounts = require("./Model/accountModel.js");

const router = express.Router();

// Create a new user
router.post("/users", async (req, res) => {
  try {
    const user = new User(req.body); // Create a new user instance from request body
    const savedUser = await user.save(); // Save user to database
    res
      .status(201)
      .json({ message: "User Created Successfully", user: savedUser });
  } 
  catch (error) {
    console.error("Error creating user:", error); // Log the error
    res
      .status(400)
      .json({ message: "Failed to create user. Please try again." });
  }
});

// Get all users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find(); // Fetch all users from the database
    res.status(200).json(users); // Send the user list in response
  } catch (error) {
    console.error("Error fetching users:", error); // Log the error
    res
      .status(500)
      .json({ message: "Failed to fetch users. Please try again." });
  }
});

// Get a user by ID
router.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id); // Fetch user by ID
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }
    res.status(200).json(user); // Return the user data
  } catch (error) {
    console.error("Error fetching user by ID:", error); // Log the error
    res
      .status(500)
      .json({ message: "Failed to fetch user. Please try again." });
  }
});
// Checking netBanking Status
router.get("/banksNetBanking", async (req, res) => {
  const { mobileNo } = req.body;
  try {
    const BankUser = await Accounts.findOne({ mobileno: mobileNo });
    if (!BankUser) {
      return res.status(200).json({ message: "User not found" });
    }

    const BankUserNetBanking = BankUser.banks.filter((bank) => bank.netBanking);
    
    if (BankUserNetBanking.length > 0) {
      const firstNetBankingBank = BankUserNetBanking[0];
      return res.status(200).json({ bank: firstNetBankingBank });
    } else {
      return res.status(200).json({ message: "No banks with netBanking enabled found" });
    }
  } catch (err) {
    console.error(`Error: ${err}`);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Update a user by ID
router.put("/users/:id", async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found!" });
    }

    res.status(200).json({
      message: "User Updated Successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error); // Log the error
    res
      .status(500)
      .json({ message: "Failed to update user. Please try again." });
  }
});

// Delete a user by ID
router.delete("/users/:id", async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id); // Delete user by ID

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found!" });
    }

    res.status(200).json({ message: "User Deleted Successfully" });
  } catch (error) {
    console.error("Error deleting user:", error); // Log the error
    res
      .status(500)
      .json({ message: "Failed to delete user. Please try again." });
  }
});

module.exports = router;
