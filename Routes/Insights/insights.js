const express = require('express');
const { authenticateToken } = require('../../Middlewares/jwt_auth_tkn');
const User = require('../Model/model');
const Transaction = require('../Model/transaction');
const Insights = express.Router();

// Corrected Route (added `/` before "getExpense")
Insights.post('/getExpense', authenticateToken, async (req, res) => {
    try {
        const user = req.user.email;

        const transaction = await Transaction.findOne({ email: user });
        if (!transaction) {
            return res.status(404).json({ message: "No transaction found" });
        }
        const totalExpense = transaction.transactionList
            .filter(t => t.transactionType === "Expense")
            .reduce((sum, t) => sum + t.amount, 0);

        res.json({ totalExpense });
    }
    catch (e) {
        res.status(500).json({ message: "Server Error", error: e.message });

    }
});
Insights.get("/getIncome", authenticateToken, async (req, res) => {
    try {
        const user = req.user.email;
        const transactions = await Transaction.findOne({ email: user });

        if (!transactions) {
            return res.status(404).json({ message: "No transactions found." });
        }

        const totalIncome = transactions.transactionList
            .filter(t => t.transactionType === "Income")
            .reduce((sum, t) => sum + t.amount, 0);

        res.json({ totalIncome });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});
// Get total expense grouped by category
Insights.get("/getExpenseByCategory", authenticateToken, async (req, res) => {
    try {
        const userEmail = req.user.email;

        // Find the user's transactions
        const userTransaction = await Transaction.findOne({ email: userEmail });

        if (!userTransaction) {
            return res.status(404).json({ message: "No transactions found" });
        }

        let totalExpense = 0;
        const expenseByCategory = {};

        // Loop through transactions and sum amounts by category
        userTransaction.transactionList.forEach(transaction => {
            if (transaction.transactionType.toLowerCase() === "expense") {
                const category = transaction.category.trim();
                const amount = parseFloat(transaction.amount.toString().replace(",", ""));

                if (!expenseByCategory[category]) {
                    expenseByCategory[category] = 0;
                }
                expenseByCategory[category] += amount;
                totalExpense += amount; // Sum total expenses
            }
        });

        res.status(200).json({
            totalExpense,
            expenseByCategory
        });
    } catch (error) {
        console.error("Error fetching expenses by category:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

// Get total income grouped by category
Insights.get("/getIncomeByCategory", authenticateToken, async (req, res) => {
    try {
        const userEmail = req.user.email;

        // Find the user's transactions
        const userTransaction = await Transaction.findOne({ email: userEmail });

        if (!userTransaction) {
            return res.status(404).json({ message: "No transactions found" });
        }

        let totalIncome = 0;
        const incomeByCategory = {};

        // Loop through transactions and sum amounts by category
        userTransaction.transactionList.forEach(transaction => {
            if (transaction.transactionType.toLowerCase() === "income") {
                const category = transaction.category.trim();
                const amount = parseFloat(transaction.amount.toString().replace(",", ""));

                if (!incomeByCategory[category]) {
                    incomeByCategory[category] = 0;
                }
                incomeByCategory[category] += amount;
                totalIncome += amount; // Sum total income
            }
        });

        res.status(200).json({
            totalIncome,
            incomeByCategory
        });
    } catch (error) {
        console.error("Error fetching income by category:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});
module.exports = Insights;
