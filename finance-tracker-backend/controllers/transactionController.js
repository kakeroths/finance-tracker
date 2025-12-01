// controllers/transactionController.js
const Transaction = require('../models/Transaction');

async function addTransaction(req, res) {
  try {
    const { type, description, amount, date } = req.body;
    if (!type || !['income','expense'].includes(type)) return res.status(400).json({ message: 'Invalid type' });
    if (amount == null || isNaN(Number(amount))) return res.status(400).json({ message: 'Invalid amount' });

    const t = new Transaction({
      user: req.user._id,
      type,
      description: description || '',
      amount: Number(amount),
      date: date ? new Date(date) : Date.now()
    });
    await t.save();
    return res.status(201).json(t);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function editTransaction(req, res) {
  try {
    const { id } = req.params;
    const tx = await Transaction.findOne({ _id: id, user: req.user._id });
    if (!tx) return res.status(404).json({ message: 'Not found' });
    const { type, description, amount, date } = req.body;
    if (type && !['income','expense'].includes(type)) return res.status(400).json({ message: 'Invalid type' });
    if (amount != null && isNaN(Number(amount))) return res.status(400).json({ message: 'Invalid amount' });

    if (type) tx.type = type;
    if (description != null) tx.description = description;
    if (amount != null) tx.amount = Number(amount);
    if (date) tx.date = new Date(date);
    await tx.save();
    return res.json(tx);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function deleteTransaction(req, res) {
  try {
    const { id } = req.params;
    const tx = await Transaction.findOneAndDelete({ _id: id, user: req.user._id });
    if (!tx) return res.status(404).json({ message: 'Not found' });
    return res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

/**
 * Query params supported:
 * page, limit,
 * type (income|expense),
 * startDate, endDate (ISO),
 * minAmount, maxAmount,
 * sortBy (date|amount|type), sortDir (asc|desc)
 */
async function getTransactions(req, res) {
  try {
    const {
      page = 1, limit = 10,
      type, startDate, endDate,
      minAmount, maxAmount,
      sortBy = 'date', sortDir = 'desc'
    } = req.query;

    const query = { user: req.user._id };
    if (type) query.type = type;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (minAmount != null || maxAmount != null) {
      query.amount = {};
      if (minAmount != null) query.amount.$gte = Number(minAmount);
      if (maxAmount != null) query.amount.$lte = Number(maxAmount);
    }

    const sortObj = {};
    const dir = sortDir === 'asc' ? 1 : -1;
    if (['date','amount','type'].includes(sortBy)) sortObj[sortBy] = dir;
    else sortObj.date = -1;

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Transaction.find(query).sort(sortObj).skip(skip).limit(Number(limit)),
      Transaction.countDocuments(query)
    ]);

    return res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { addTransaction, editTransaction, deleteTransaction, getTransactions };
