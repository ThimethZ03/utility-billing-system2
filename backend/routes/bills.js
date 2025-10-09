const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Bill = require('../models/Bill');
const Branch = require('../models/Branch');
const auth = require('../middleware/auth');

// @route   GET /api/bills
// @desc    Get all bills for user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const bills = await Bill.find({ userId: req.user.id })
      .populate('branchId', 'name location')
      .sort({ createdAt: -1 });

    // Enrich with branchName
    const enriched = bills.map(bill => ({
      _id: bill._id,
      branchId: bill.branchId?._id,
      branchName: bill.branchId?.name || 'Unknown Branch',
      branchLocation: bill.branchId?.location || '',
      type: bill.type,
      units: bill.units,
      amount: bill.amount,
      dueDate: bill.dueDate,
      status: bill.status,
      periodStart: bill.periodStart,
      periodEnd: bill.periodEnd,
      createdAt: bill.createdAt,
      updatedAt: bill.updatedAt
    }));

    res.json(enriched);
  } catch (error) {
    console.error('Get bills error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/bills/:id
// @desc    Get bill by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const bill = await Bill.findOne({ _id: req.params.id, userId: req.user.id })
      .populate('branchId', 'name location');
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    res.json(bill);
  } catch (error) {
    console.error('Get bill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/bills
// @desc    Create bill
// @access  Private
router.post('/', [
  auth,
  body('branchId').notEmpty().withMessage('Branch is required'),
  body('type').isIn(['Electricity', 'Water']).withMessage('Invalid type'),
  body('units').isNumeric().withMessage('Units must be numeric'),
  body('amount').isNumeric().withMessage('Amount must be numeric'),
  body('dueDate').isISO8601().withMessage('Invalid due date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { branchId, type, units, amount, dueDate, periodStart, status } = req.body;

    // Verify branch belongs to user
    const branch = await Branch.findOne({ _id: branchId, userId: req.user.id });
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    const bill = new Bill({
      branchId,
      userId: req.user.id,
      type,
      units: Number(units),
      amount: Number(amount),
      dueDate,
      periodStart: periodStart || new Date(),
      status: status || 'Pending'
    });

    await bill.save();
    await bill.populate('branchId', 'name location');

    res.status(201).json(bill);
  } catch (error) {
    console.error('Create bill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/bills/:id
// @desc    Update bill
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { units, amount, dueDate, status, periodStart } = req.body;

    let bill = await Bill.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    if (units !== undefined) bill.units = Number(units);
    if (amount !== undefined) bill.amount = Number(amount);
    if (dueDate) bill.dueDate = dueDate;
    if (status) bill.status = status;
    if (periodStart) bill.periodStart = periodStart;

    await bill.save();
    await bill.populate('branchId', 'name location');

    res.json(bill);
  } catch (error) {
    console.error('Update bill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/bills/:id
// @desc    Delete bill
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const bill = await Bill.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    res.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    console.error('Delete bill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/bills/summary/monthly
// @desc    Get monthly summary
// @access  Private
router.get('/summary/monthly', auth, async (req, res) => {
  try {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const bills = await Bill.find({
      userId: req.user.id,
      createdAt: {
        $gte: new Date(currentYear, currentMonth, 1),
        $lt: new Date(currentYear, currentMonth + 1, 1)
      }
    });

    const totalUnits = bills.reduce((sum, b) => sum + b.units, 0);
    const totalAmount = bills.reduce((sum, b) => sum + b.amount, 0);

    res.json({
      totalUnits,
      totalAmount,
      billCount: bills.length,
      paid: bills.filter(b => b.status === 'Paid').length,
      pending: bills.filter(b => b.status === 'Pending').length,
      overdue: bills.filter(b => b.status === 'Overdue').length
    });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
