// routes/transactionRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { addTransaction, editTransaction, deleteTransaction, getTransactions } = require('../controllers/transactionController');

router.post('/', auth, addTransaction);
router.get('/', auth, getTransactions);
router.put('/:id', auth, editTransaction);
router.delete('/:id', auth, deleteTransaction);

module.exports = router;
