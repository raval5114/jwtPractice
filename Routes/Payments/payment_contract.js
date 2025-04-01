const Accounts = require("../Model/accountModel");
const Transaction = require("../Model/transaction");
const mongoose = require("mongoose");

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
  async payViaSpecificBank(amount, fromMobileNumber, toMobileNumber, fromSpecificBank, toSpecificBank) {
    if (amount <= 0) {
        throw new Error("Amount must be greater than zero.");
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // Fetch sender's account
        const sender = await Accounts.findOne({ mobileno: fromMobileNumber }).session(session);
        if (!sender) throw new Error("Sender not found");

        // Find sender's specific bank
        const senderBank = sender.banks.find(bank => bank.bankName === fromSpecificBank);
        if (!senderBank) throw new Error("Sender does not have the specified bank account");

        if (senderBank.balance < amount) throw new Error("Insufficient Balance");

        // Fetch receiver's account
        const receiver = await Accounts.findOne({ mobileno: toMobileNumber }).session(session);
        if (!receiver) throw new Error("Receiver not found");

        // Find receiver's specific bank
        const receiverBank = receiver.banks.find(bank => bank.bankName === toSpecificBank);
        if (!receiverBank) throw new Error("Receiver does not have the specified bank account");

        // Deduct and add amount
        senderBank.balance -= amount;
        receiverBank.balance += amount;

        // Update sender's balance
        await Accounts.updateOne(
            { "banks._id": senderBank._id },
            { $set: { "banks.$.balance": senderBank.balance } }
        ).session(session);

        // Update receiver's balance
        await Accounts.updateOne(
            { "banks._id": receiverBank._id },
            { $set: { "banks.$.balance": receiverBank.balance } }
        ).session(session);


        // Commit transaction
        await session.commitTransaction();
        session.endSession();

        console.log("Payment successful via specific bank");
        return "Payment successful via specific bank";
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw new Error(`Transaction failed: ${error.message}`);
    }
}
static async payViaSpecificBank(amount, fromMobileNumber, toMobileNumber, fromBank, toBank, session) {
  if (amount <= 0) {
    throw new Error("Amount must be greater than zero.");
  }

  // Retrieve sender and receiver bank details using mobile numbers
  const senderAccount = await Accounts.findOne({ mobileno: fromMobileNumber }).session(session);
  const receiverAccount = await Accounts.findOne({ mobileno: toMobileNumber }).session(session);

  if (!senderAccount || !receiverAccount) {
    throw new Error("Transaction failed: One or both accounts not found.");
  }

  const senderBank = senderAccount.banks.find(bank => bank.bankName === fromBank);
  const receiverBank = receiverAccount.banks.find(bank => bank.bankName === toBank);

  if (!senderBank) {
    throw new Error("Transaction failed: Sender bank not found.");
  }

  if (!receiverBank) {
    throw new Error("Transaction failed: Receiver bank not found.");
  }

  if (senderBank.balance < amount) {
    throw new Error("Insufficient Balance.");
  }

  // Deduct from sender and add to receiver
  senderBank.balance -= amount;
  receiverBank.balance += amount;

  try {
    await Accounts.updateOne(
      { "mobileno": fromMobileNumber, "banks.bankName": fromBank },
      { $set: { "banks.$.balance": senderBank.balance } }
    ).session(session);

    await Accounts.updateOne(
      { "mobileno": toMobileNumber, "banks.bankName": toBank },
      { $set: { "banks.$.balance": receiverBank.balance } }
    ).session(session);

    console.log("Amount transferred successfully via specific bank!");
    return { message: "Amount transferred successfully via specific bank." };
  } catch (error) {
    throw new Error(`Failed to update balances in the database: ${error.message}`);
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
