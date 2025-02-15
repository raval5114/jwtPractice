const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema({
  email: { type: String, required: true },
  accountHolderName: { type: String, required: true },
  mobileno: { type: Number, required: true },
  pin:{type:Number,required:true},
  banks: [
    {
      bankName: String,
      netBanking: Boolean,
      accountNumber: String,
      ifscCode: String,
      balance: Number
    }
  ]
});

const Accounts = mongoose.model("Accounts", accountSchema,"Accounts");

module.exports = Accounts;
