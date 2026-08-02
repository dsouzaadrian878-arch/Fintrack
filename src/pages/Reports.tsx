import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  FileText,
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Briefcase
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useStore } from '../store';
import { Card, Button, Input } from '../components/UI';

export default function Reports() {
  const { transactions, categories, settings } = useStore();

  const [reportType, setReportType] = useState<'all' | 'expense' | 'income'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all'); // "0" to "11"
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  const currencySymbol = useMemo(() => {
    if (!settings) return 'Rs';
    const c = settings.currency;
    if (c === 'EUR') return '€';
    if (c === 'GBP') return '£';
    if (c === 'INR') return 'Rs';
    if (c === 'JPY') return '¥';
    return 'Rs';
  }, [settings]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Unique years list in transactions
  const years = useMemo(() => {
    const yearsSet = new Set<string>();
    transactions.forEach(t => {
      const yr = new Date(t.date).getFullYear().toString();
      yearsSet.add(yr);
    });
    // Add current year if empty
    if (yearsSet.size === 0) {
      yearsSet.add(new Date().getFullYear().toString());
    }
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  // Filtered transactions for the report
  const filteredTxnsForReport = useMemo(() => {
    return transactions.filter(t => {
      // 1. Filter Type
      if (reportType !== 'all' && t.type !== reportType) return false;

      const dateObj = new Date(t.date);
      // 2. Filter Month
      if (selectedMonth !== 'all' && dateObj.getMonth().toString() !== selectedMonth) return false;

      // 3. Filter Year
      if (dateObj.getFullYear().toString() !== selectedYear) return false;

      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, reportType, selectedMonth, selectedYear]);

  // Core metrics for the current selection
  const metrics = useMemo(() => {
    let income = 0;
    let expense = 0;

    filteredTxnsForReport.forEach(t => {
      if (t.type === 'income') {
        income += t.amount;
      } else {
        expense += t.amount;
      }
    });

    const netSurplus = income - expense;

    return {
      income,
      expense,
      netSurplus
    };
  }, [filteredTxnsForReport]);

  // Pure CSV exporter (avoids heavy package bugs, highly reliable)
  const handleExportCSV = () => {
    const headers = ['Title', 'Type', 'Amount', 'Category', 'Payment Method', 'Date', 'Notes'];
    const rows = filteredTxnsForReport.map(t => {
      const cat = categories.find(c => c.id === t.categoryId);
      return [
        t.title.replace(/"/g, '""'), // Escape double quotes
        t.type.toUpperCase(),
        t.amount,
        cat ? cat.name : 'Uncategorized',
        t.paymentMethod,
        t.date,
        t.notes ? t.notes.replace(/"/g, '""') : ''
      ];
    });

    // Merge CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    
    const monthLabel = selectedMonth !== 'all' ? `_${months[parseInt(selectedMonth)]}` : '';
    link.setAttribute('download', `FinTrack_Audit_${selectedYear}${monthLabel}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // jsPDF Exporter
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const padding = 14;
    let currentY = 20;

    // Header styling
    doc.setFontSize(22);
    doc.setTextColor(16, 185, 129); // Emerald color
    doc.text('FinTrack Portals', padding, currentY);
    currentY += 8;

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate Gray
    const monthLabel = selectedMonth !== 'all' ? months[parseInt(selectedMonth)] : 'All Months';
    doc.text(`Financial Audit Report — ${monthLabel} ${selectedYear}`, padding, currentY);
    
    // Add current print date
    const printDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.text(`Generated: ${printDate}`, 150, currentY);
    currentY += 15;

    // Line separator
    doc.setDrawColor(241, 245, 249);
    doc.line(padding, currentY, 210 - padding, currentY);
    currentY += 10;

    // Financial summaries box
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42); // Deep Navy/Slate
    doc.text('1. PORTFOLIO LIQUIDITY SUMMARY', padding, currentY);
    currentY += 10;

    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`Total Recorded Inflow: ${currencySymbol} ${metrics.income.toLocaleString()}`, padding + 5, currentY);
    currentY += 6;
    doc.text(`Total Recorded Outflow: ${currencySymbol} ${metrics.expense.toLocaleString()}`, padding + 5, currentY);
    currentY += 6;
    doc.text(`Net Portfolio Surplus: ${currencySymbol} ${metrics.netSurplus.toLocaleString()}`, padding + 5, currentY);
    currentY += 15;

    // Table divider
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('2. AUDITED LEDGER ENTRIES', padding, currentY);
    currentY += 8;

    // Headers of table
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Title / Cashflow Name', padding, currentY);
    doc.text('Type', padding + 60, currentY);
    doc.text('Category', padding + 85, currentY);
    doc.text('Method', padding + 120, currentY);
    doc.text('Date', padding + 145, currentY);
    doc.text('Value', padding + 170, currentY);
    
    currentY += 4;
    doc.line(padding, currentY, 210 - padding, currentY);
    currentY += 8;

    // Loop entries
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8.5);

    filteredTxnsForReport.slice(0, 25).forEach(t => {
      // Check page break safety
      if (currentY > 275) {
        doc.addPage();
        currentY = 20;
        // Reprint simple header on next page
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('FinTrack Ledger Audit (Continued)', padding, currentY);
        currentY += 10;
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
      }

      const cat = categories.find(c => c.id === t.categoryId);
      const catName = cat ? cat.name : 'Uncategorized';
      
      doc.text(t.title.substring(0, 28), padding, currentY);
      doc.text(t.type.toUpperCase(), padding + 60, currentY);
      doc.text(catName.substring(0, 16), padding + 85, currentY);
      doc.text(t.paymentMethod.substring(0, 12), padding + 120, currentY);
      doc.text(t.date, padding + 145, currentY);
      
      const valStr = `${t.type === 'income' ? '+' : '-'} ${currencySymbol}${t.amount}`;
      doc.text(valStr, padding + 170, currentY);
      
      currentY += 7.5;
    });

    if (filteredTxnsForReport.length > 25) {
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`... and ${filteredTxnsForReport.length - 25} more ledger entries. Export CSV for full log files.`, padding, currentY);
    }

    doc.save(`FinTrack_Audit_${selectedYear}.pdf`);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Wealth Reports
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Aggregate cumulative liquidity summaries and download audit papers.
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          <Button onClick={handleExportCSV} variant="outline" className="text-xs">
            <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" /> Export CSV
          </Button>
          <Button onClick={handleExportPDF} className="text-xs bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700">
            <Download className="mr-1.5 h-4 w-4" /> Download PDF Report
          </Button>
        </div>
      </div>

      {/* FILTER PANEL */}
      <Card className="p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-50 dark:border-slate-800/30">
          <Filter className="h-3.5 w-3.5" /> Scope Filters
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Filter 1: Type */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Report Flow</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2.5 outline-none text-slate-900 dark:text-slate-100"
            >
              <option value="all">Complete Portfolio Cashflows</option>
              <option value="income">Inflow Stream Only</option>
              <option value="expense">Outflow Stream Only</option>
            </select>
          </div>

          {/* Filter 2: Month */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Month Cycle</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2.5 outline-none text-slate-900 dark:text-slate-100"
            >
              <option value="all">All Monthly Cycles</option>
              {months.map((m, idx) => (
                <option key={m} value={idx}>{m}</option>
              ))}
            </select>
          </div>

          {/* Filter 3: Year */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Fiscal Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2.5 outline-none text-slate-900 dark:text-slate-100"
            >
              {years.map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* CORE AGGREGATED METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card hoverEffect className="relative overflow-hidden">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 shrink-0">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Audited Total Inflows</p>
              <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
                {currencySymbol} {metrics.income.toLocaleString()}
              </h3>
            </div>
          </div>
        </Card>

        <Card hoverEffect className="relative overflow-hidden">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 shrink-0">
              <TrendingDown className="h-5 w-5 text-rose-500" />
            </div>
            <div>
              <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Audited Total Outflows</p>
              <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
                {currencySymbol} {metrics.expense.toLocaleString()}
              </h3>
            </div>
          </div>
        </Card>

        <Card hoverEffect className="relative overflow-hidden">
          <div className="flex items-center gap-3.5">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
              metrics.netSurplus >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Net Surplus</p>
              <h3 className={`text-xl font-bold tracking-tight mt-0.5 ${
                metrics.netSurplus >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600'
              }`}>
                {currencySymbol} {metrics.netSurplus.toLocaleString()}
              </h3>
            </div>
          </div>
        </Card>
      </div>

      {/* DETAILED LEDGER PREVIEW */}
      <Card className="p-5 space-y-4 shadow-2xs">
        <div className="flex justify-between items-center pb-3 border-b border-slate-50 dark:border-slate-800/30">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">Audited Ledger View ({filteredTxnsForReport.length})</h3>
          <span className="text-3xs text-slate-400 font-semibold">Pre-filtered according to current scope</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50 dark:border-slate-800/30 text-slate-400 text-3xs uppercase tracking-widest font-bold">
                <th className="py-2">Effective Date</th>
                <th className="py-2">Cashflow Item</th>
                <th className="py-2">Sector Classification</th>
                <th className="py-2">Method</th>
                <th className="py-2 text-right">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/20 text-xs font-medium text-slate-600 dark:text-slate-400">
              {filteredTxnsForReport.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-slate-500">
                    No transactions match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredTxnsForReport.slice(0, 10).map(t => {
                  const cat = categories.find(c => c.id === t.categoryId);
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/10 transition-colors">
                      <td className="py-3 font-semibold text-slate-950 dark:text-slate-400">{t.date}</td>
                      <td className="py-3 font-bold text-slate-900 dark:text-white">{t.title}</td>
                      <td className="py-3">{cat ? cat.name : 'Uncategorized'}</td>
                      <td className="py-3 font-semibold">{t.paymentMethod}</td>
                      <td className="py-3 text-right font-extrabold">
                        <span className={t.type === 'income' ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}>
                          {t.type === 'income' ? '+' : '-'} {currencySymbol} {t.amount.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredTxnsForReport.length > 10 && (
          <p className="text-3xs text-slate-400 text-center pt-2">
            Viewing first 10 entries of {filteredTxnsForReport.length} matched files. Exporter options above download full databases.
          </p>
        )}
      </Card>
    </div>
  );
}
