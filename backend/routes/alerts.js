const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');
const AlertSettings = require('../models/AlertSettings');
const auth = require('../middleware/auth');

// @route   GET /api/alerts/settings
// @desc    Get alert settings
// @access  Private
router.get('/settings', auth, async (req, res) => {
  try {
    let settings = await AlertSettings.findOne({ userId: req.user.id });
    
    if (!settings) {
      // Create default settings
      settings = new AlertSettings({
        userId: req.user.id,
        maxMonthlyAmount: 80000,
        maxMonthlyUnits: 1500,
        alertEmails: [],
        enableEmailAlerts: false,
        enablePushAlerts: true
      });
      await settings.save();
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/alerts/settings
// @desc    Update alert settings
// @access  Private
router.put('/settings', auth, async (req, res) => {
  try {
    const { maxMonthlyAmount, maxMonthlyUnits, alertEmails, enableEmailAlerts, enablePushAlerts } = req.body;
    
    let settings = await AlertSettings.findOne({ userId: req.user.id });
    
    if (!settings) {
      settings = new AlertSettings({ userId: req.user.id });
    }
    
    if (maxMonthlyAmount !== undefined) settings.maxMonthlyAmount = Number(maxMonthlyAmount);
    if (maxMonthlyUnits !== undefined) settings.maxMonthlyUnits = Number(maxMonthlyUnits);
    if (alertEmails !== undefined) settings.alertEmails = alertEmails;
    if (enableEmailAlerts !== undefined) settings.enableEmailAlerts = enableEmailAlerts;
    if (enablePushAlerts !== undefined) settings.enablePushAlerts = enablePushAlerts;
    
    await settings.save();
    res.json(settings);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/alerts/check
// @desc    Check current alerts
// @access  Private
router.get('/check', auth, async (req, res) => {
  try {
    const settings = await AlertSettings.findOne({ userId: req.user.id });
    
    const defaults = {
      maxMonthlyAmount: 80000,
      maxMonthlyUnits: 1500
    };
    
    const limits = {
      maxMonthlyAmount: settings?.maxMonthlyAmount || defaults.maxMonthlyAmount,
      maxMonthlyUnits: settings?.maxMonthlyUnits || defaults.maxMonthlyUnits
    };

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyBills = await Bill.find({
      userId: req.user.id,
      createdAt: {
        $gte: new Date(currentYear, currentMonth, 1),
        $lt: new Date(currentYear, currentMonth + 1, 1)
      }
    });

    const totalUnits = monthlyBills.reduce((sum, b) => sum + b.units, 0);
    const totalAmount = monthlyBills.reduce((sum, b) => sum + b.amount, 0);

    const alerts = [];

    if (totalUnits > limits.maxMonthlyUnits) {
      alerts.push({
        type: 'units',
        message: `Monthly units (${totalUnits}) exceeded limit (${limits.maxMonthlyUnits})`,
        severity: 'warning',
        current: totalUnits,
        limit: limits.maxMonthlyUnits
      });
    }

    if (totalAmount > limits.maxMonthlyAmount) {
      alerts.push({
        type: 'amount',
        message: `Monthly amount (Rs. ${totalAmount.toLocaleString('en-LK')}) exceeded limit (Rs. ${limits.maxMonthlyAmount.toLocaleString('en-LK')})`,
        severity: 'danger',
        current: totalAmount,
        limit: limits.maxMonthlyAmount
      });
    }

    res.json({ alerts, totalUnits, totalAmount });
  } catch (error) {
    console.error('Check alerts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
