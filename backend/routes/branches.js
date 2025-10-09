const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Branch = require('../models/Branch');
const auth = require('../middleware/auth');

// @route   GET /api/branches
// @desc    Get all branches for user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const branches = await Branch.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(branches);
  } catch (error) {
    console.error('Get branches error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/branches/:id
// @desc    Get branch by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const branch = await Branch.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }
    
    res.json(branch);
  } catch (error) {
    console.error('Get branch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/branches
// @desc    Create branch
// @access  Private
router.post('/', [
  auth,
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('location').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, location } = req.body;

    const branch = new Branch({
      name,
      location: location || '',
      userId: req.user.id
    });

    await branch.save();
    res.status(201).json(branch);
  } catch (error) {
    console.error('Create branch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/branches/:id
// @desc    Update branch
// @access  Private
router.put('/:id', [
  auth,
  body('name').optional().trim().notEmpty(),
  body('location').optional().trim()
], async (req, res) => {
  try {
    const { name, location } = req.body;

    let branch = await Branch.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    if (name) branch.name = name;
    if (location !== undefined) branch.location = location;

    await branch.save();
    res.json(branch);
  } catch (error) {
    console.error('Update branch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/branches/:id
// @desc    Delete branch
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const branch = await Branch.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    res.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('Delete branch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
