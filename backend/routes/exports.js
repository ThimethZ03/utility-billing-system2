const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const fs = require('fs');
const Bill = require('../models/Bill');
const Branch = require('../models/Branch');
const auth = require('../middleware/auth');

// Ensure exports directory exists
const exportsDir = path.join(__dirname, '../exports');
if (!fs.existsSync(exportsDir)) {
  fs.mkdirSync(exportsDir);
}

// @route   GET /api/exports/csv
// @desc    Export bills as CSV
// @access  Private
router.get('/csv', auth, async (req, res) => {
  try {
    const bills = await Bill.find({ userId: req.user.id })
      .populate('branchId', 'name location')
      .sort({ createdAt: -1 });

    const csvData = bills.map(bill => ({
      branch: bill.branchId?.name || 'Unknown',
      location: bill.branchId?.location || '',
      type: bill.type,
      units: bill.units,
      amount: bill.amount,
      dueDate: new Date(bill.dueDate).toLocaleDateString('en-LK'),
      status: bill.status,
      periodStart: new Date(bill.periodStart).toLocaleDateString('en-LK'),
      createdAt: new Date(bill.createdAt).toLocaleDateString('en-LK')
    }));

    const timestamp = Date.now();
    const filename = `utility_bills_${timestamp}.csv`;
    const filepath = path.join(exportsDir, filename);

    const csvWriter = createCsvWriter({
      path: filepath,
      header: [
        { id: 'branch', title: 'Branch' },
        { id: 'location', title: 'Location' },
        { id: 'type', title: 'Type' },
        { id: 'units', title: 'Units' },
        { id: 'amount', title: 'Amount (LKR)' },
        { id: 'dueDate', title: 'Due Date' },
        { id: 'status', title: 'Status' },
        { id: 'periodStart', title: 'Period Start' },
        { id: 'createdAt', title: 'Created At' }
      ]
    });

    await csvWriter.writeRecords(csvData);

    res.download(filepath, filename, (err) => {
      if (err) console.error('Download error:', err);
      fs.unlinkSync(filepath);
    });

  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ message: 'Export failed' });
  }
});

// @route   GET /api/exports/excel
// @desc    Export bills as Excel
// @access  Private
router.get('/excel', auth, async (req, res) => {
  try {
    const bills = await Bill.find({ userId: req.user.id })
      .populate('branchId', 'name location')
      .sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Utility Bills');

    worksheet.columns = [
      { header: 'Branch', key: 'branch', width: 25 },
      { header: 'Location', key: 'location', width: 30 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Units', key: 'units', width: 12 },
      { header: 'Amount (LKR)', key: 'amount', width: 15 },
      { header: 'Due Date', key: 'dueDate', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Period Start', key: 'periodStart', width: 15 },
      { header: 'Created At', key: 'createdAt', width: 15 }
    ];

    // Style header
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' }
    };
    worksheet.getRow(1).font.color = { argb: 'FFFFFFFF' };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Add data
    bills.forEach(bill => {
      const row = worksheet.addRow({
        branch: bill.branchId?.name || 'Unknown',
        location: bill.branchId?.location || '',
        type: bill.type,
        units: bill.units,
        amount: bill.amount,
        dueDate: new Date(bill.dueDate).toLocaleDateString('en-LK'),
        status: bill.status,
        periodStart: new Date(bill.periodStart).toLocaleDateString('en-LK'),
        createdAt: new Date(bill.createdAt).toLocaleDateString('en-LK')
      });

      const statusCell = row.getCell('status');
      if (bill.status === 'Paid') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
        statusCell.font = { color: { argb: 'FF065F46' }, bold: true };
      } else if (bill.status === 'Overdue') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        statusCell.font = { color: { argb: 'FF991B1B' }, bold: true };
      } else {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
        statusCell.font = { color: { argb: 'FF92400E' }, bold: true };
      }

      row.getCell('amount').numFmt = '#,##0.00';
    });

    // Summary row
    const summaryRow = worksheet.addRow({
      branch: 'TOTAL',
      units: bills.reduce((sum, b) => sum + b.units, 0),
      amount: bills.reduce((sum, b) => sum + b.amount, 0)
    });
    summaryRow.font = { bold: true, size: 12 };
    summaryRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };

    // Borders
    worksheet.eachRow((row) => {
      row.eachCell(cell => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    const timestamp = Date.now();
    const filename = `utility_bills_${timestamp}.xlsx`;
    const filepath = path.join(exportsDir, filename);

    await workbook.xlsx.writeFile(filepath);

    res.download(filepath, filename, (err) => {
      if (err) console.error('Download error:', err);
      fs.unlinkSync(filepath);
    });

  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({ message: 'Export failed' });
  }
});

// @route   GET /api/exports/summary-excel
// @desc    Export summary report
// @access  Private
router.get('/summary-excel', auth, async (req, res) => {
  try {
    const bills = await Bill.find({ userId: req.user.id })
      .populate('branchId', 'name location')
      .sort({ createdAt: -1 });

    const branches = await Branch.find({ userId: req.user.id });

    const workbook = new ExcelJS.Workbook();
    
    // Sheet 1: Bills
    const billsSheet = workbook.addWorksheet('Bills');
    billsSheet.columns = [
      { header: 'Branch', key: 'branch', width: 25 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Units', key: 'units', width: 12 },
      { header: 'Amount (LKR)', key: 'amount', width: 15 },
      { header: 'Status', key: 'status', width: 12 }
    ];

    bills.forEach(bill => {
      billsSheet.addRow({
        branch: bill.branchId?.name || 'Unknown',
        type: bill.type,
        units: bill.units,
        amount: bill.amount,
        status: bill.status
      });
    });

    // Sheet 2: Summary
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 }
    ];

    summarySheet.addRow({ metric: 'Total Bills', value: bills.length });
    summarySheet.addRow({ metric: 'Total Amount (LKR)', value: bills.reduce((s, b) => s + b.amount, 0) });
    summarySheet.addRow({ metric: 'Total Units', value: bills.reduce((s, b) => s + b.units, 0) });
    summarySheet.addRow({ metric: 'Paid Bills', value: bills.filter(b => b.status === 'Paid').length });
    summarySheet.addRow({ metric: 'Pending Bills', value: bills.filter(b => b.status === 'Pending').length });

    // Sheet 3: By Branch
    const branchSheet = workbook.addWorksheet('By Branch');
    branchSheet.columns = [
      { header: 'Branch', key: 'branch', width: 25 },
      { header: 'Bills Count', key: 'count', width: 15 },
      { header: 'Total Units', key: 'units', width: 15 },
      { header: 'Total Amount', key: 'amount', width: 18 }
    ];

    branches.forEach(branch => {
      const branchBills = bills.filter(b => b.branchId?._id.toString() === branch._id.toString());
      branchSheet.addRow({
        branch: branch.name,
        count: branchBills.length,
        units: branchBills.reduce((s, b) => s + b.units, 0),
        amount: branchBills.reduce((s, b) => s + b.amount, 0)
      });
    });

    const timestamp = Date.now();
    const filename = `utility_summary_${timestamp}.xlsx`;
    const filepath = path.join(exportsDir, filename);

    await workbook.xlsx.writeFile(filepath);

    res.download(filepath, filename, (err) => {
      if (err) console.error('Download error:', err);
      fs.unlinkSync(filepath);
    });

  } catch (error) {
    console.error('Summary export error:', error);
    res.status(500).json({ message: 'Export failed' });
  }
});

module.exports = router;
