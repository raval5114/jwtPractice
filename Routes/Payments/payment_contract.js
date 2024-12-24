const Accounts = require("../Model/accountModel");
const Transaction = require("../Model/transaction");

class Payments {
  #fromBank;
  #toBank;

  async setBankDetails(fromIdentifier, toIdentifier, isAccountNumber = false) {
    if (fromIdentifier === toIdentifier) {
      // Throw an error if both identifiers are the same
      const error = new Error(
        "From identifier and To identifier cannot be the same."
      );
      error.name = "SameIdentifierError";
      throw error;
    }

    // Determine whether to search by account number or mobile number
    const findBankMethod = isAccountNumber
      ? this.findBankWithAccountNumber.bind(this)
      : this.findBankWithNetBanking.bind(this);

    // Fetch bank details for both sender and receiver
    this.#fromBank = await findBankMethod(fromIdentifier);
    this.#toBank = await findBankMethod(toIdentifier);
  }

  async findBankWithNetBanking(mobileNo) {
    try {
      const BankUser = await Accounts.findOne({ mobileno: mobileNo });
      if (!BankUser) {
        throw new Error("User not found");
      }

      const BankUserNetBanking = BankUser.banks.filter(
        (bank) => bank.netBanking
      );

      if (BankUserNetBanking.length > 0) {
        return BankUserNetBanking[0];
      } else {
        throw new Error("No banks with net banking enabled found.");
      }
    } catch (error) {
      throw error;
    }
  }

  async findBankWithAccountNumber(accountNumber) {
    try {
      const BankUser = await Accounts.findOne({
        "banks.accountNumber": accountNumber,
      });
      if (!BankUser) {
        throw new Error("User not found");
      }

      const BankUserAccount = BankUser.banks.find(
        (bank) => bank.accountNumber === accountNumber
      );

      if (BankUserAccount) {
        return BankUserAccount;
      } else {
        throw new Error("No bank found with the given account number.");
      }
    } catch (error) {
      throw error;
    }
  }

  async payViaNumber(amount, fromMobileNumber, toMobileNumber) {
    if (amount <= 0) {
      const error = new Error("Amount must be greater than zero.");
      error.name = "InvalidAmountError";
      throw error;
    }

    // Ensure sender and receiver mobile numbers are not the same
    if (fromMobileNumber === toMobileNumber) {
      const error = new Error("From and To mobile numbers cannot be the same.");
      error.name = "SameMobileNumberError";
      throw error;
    }

    // Retrieve sender and receiver bank details using mobile numbers
    this.#fromBank = await this.findBankWithNetBanking(fromMobileNumber);
    this.#toBank = await this.findBankWithNetBanking(toMobileNumber);

    if (this.#fromBank.balance < amount) {
      const error = new Error("Insufficient Balance.");
      error.name = "InsufficientBalanceError";
      throw error;
    }

    // Deduct from sender and add to receiver
    this.#fromBank.balance -= amount;
    this.#toBank.balance += amount;

    try {
      // Update sender's bank balance
      await Accounts.findOneAndUpdate(
        { "banks._id": this.#fromBank._id },
        { $set: { "banks.$.balance": this.#fromBank.balance } }
      );

      // Update receiver's bank balance
      await Accounts.findOneAndUpdate(
        { "banks._id": this.#toBank._id },
        { $set: { "banks.$.balance": this.#toBank.balance } }
      );
      console.log("Amount transferred successfully via mobile number!");
      return "Amount transferred successfully via mobile number.";
    } catch (error) {
      throw new Error(
        `Failed to update balances in the database: ${error.message}`
      );
    }
  }

  async payViaCard(amount, fromAccountNumber, toAccountNumber) {
    if (amount <= 0) {
      const error = new Error("Amount must be greater than zero.");
      error.name = "InvalidAmountError";
      throw error;
    }

    // Retrieve bank details using account numbers
    this.#fromBank = await this.findBankWithAccountNumber(fromAccountNumber);
    this.#toBank = await this.findBankWithAccountNumber(toAccountNumber);

    if (fromAccountNumber === toAccountNumber) {
      const error = new Error(
        "From and To account numbers cannot be the same."
      );
      error.name = "SameAccountNumberError";
      throw error;
    }

    if (this.#fromBank.balance < amount) {
      const error = new Error("Insufficient Balance.");
      error.name = "InsufficientBalanceError";
      throw error;
    }

    // Deduct from sender and add to receiver
    this.#fromBank.balance -= amount;
    this.#toBank.balance += amount;

    try {
      await Accounts.findOneAndUpdate(
        { "banks._id": this.#fromBank._id },
        { $set: { "banks.$.balance": this.#fromBank.balance } }
      );

      await Accounts.findOneAndUpdate(
        { "banks._id": this.#toBank._id },
        { $set: { "banks.$.balance": this.#toBank.balance } }
      );

      console.log("Amount transferred successfully via card!");
      return "Amount transferred successfully via card.";
    } catch (error) {
      throw new Error(
        `Failed to update balances in the database: ${error.message}`
      );
    }
  }
}

const Payment = new Payments();
module.exports = Payment;
