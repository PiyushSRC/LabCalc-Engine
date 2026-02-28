/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Beaker, FileText, Trash2, ArrowRight, Settings2, Download, RefreshCw, Printer, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateMarkdown } from './utils/generateMarkdown';
import { generatePDF, printPDF } from './utils/generatePDF';
import type { LabReportData } from './utils/generateMarkdown';

type Mode = 'NORMAL' | 'POST';

interface SampleRow {
  id: number;
  normalOD: number | null;
  normalCalc: number | null;
  postOD: number | null;
  postCalc: number | null;
}

export default function App() {
  const [stdOD, setStdOD] = useState<number | null>(null);
  const [concentration, setConcentration] = useState<number | null>(null);
  const [solvent, setSolvent] = useState<string>('');
  const [normalDate, setNormalDate] = useState<string>('');
  const [srcDate, setSrcDate] = useState<string>('');
  const logo = '/src-logo.png';
  const [rows, setRows] = useState<SampleRow[]>([]);
  const [mode, setMode] = useState<Mode>('NORMAL');
  const [currentId, setCurrentId] = useState<number>(1);
  const [postIndex, setPostIndex] = useState<number>(0);
  const [inputValue, setInputValue] = useState('');
  const [setupComplete, setSetupComplete] = useState(false);
  const [lastAction, setLastAction] = useState<string>('');
  const [showExport, setShowExport] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (setupComplete) {
      inputRef.current?.focus();
    }
  }, [setupComplete, mode]);

  const calculateValue = (sampleOD: number) => {
    if (!stdOD || stdOD === 0 || !concentration) return 0;
    // Formula: (O.D. of Sample / O.D. of Standard) * Concentration
    const result = (sampleOD / stdOD) * concentration;
    return Math.round(result * 100) / 100;
  };

  const handleCommand = (cmd: string) => {
    const upperCmd = cmd.trim().toUpperCase();

    if (upperCmd === 'POST') {
      setMode('POST');
      setPostIndex(0);
      setLastAction('MODE: SRC (24HR)');
      return;
    }

    if (upperCmd === 'NORMAL') {
      setMode('NORMAL');
      setLastAction('MODE: NORMAL');
      return;
    }

    if (upperCmd.startsWith('SET ID ')) {
      const newId = parseInt(upperCmd.replace('SET ID ', ''));
      if (!isNaN(newId)) {
        setCurrentId(newId);
        setLastAction(`ID SET TO: ${newId}`);
      }
      return;
    }

    if (upperCmd === 'EXPORT PDF') {
      setShowExport(true);
      setLastAction('EXPORTING PDF...');
      return;
    }

    if (upperCmd === 'DELETE ALL') {
      setRows([]);
      setStdOD(null);
      setConcentration(null);
      setSolvent('');
      setNormalDate('');
      setSrcDate('');
      setMode('NORMAL');
      setCurrentId(1);
      setPostIndex(0);
      setSetupComplete(false);
      setLastAction('RESET TO SETUP');
      return;
    }

    if (upperCmd === 'DELETE') {
      if (mode === 'NORMAL') {
        if (rows.length > 0) {
          setRows(prev => prev.slice(0, -1));
          setCurrentId(prev => Math.max(1, prev - 1));
          setLastAction('LAST ENTRY DELETED');
        }
      } else {
        if (postIndex > 0) {
          const newRows = [...rows];
          newRows[postIndex - 1].postOD = null;
          newRows[postIndex - 1].postCalc = null;
          setRows(newRows);
          setPostIndex(prev => prev - 1);
          setLastAction('LAST SRC ENTRY CLEARED');
        }
      }
      return;
    }

    // Handle O.D. entry
    const rawOd = parseFloat(cmd);
    if (!isNaN(rawOd)) {
      const od = Math.round(rawOd * 100) / 100;
      const calc = calculateValue(od);
      
      if (mode === 'NORMAL') {
        const newRow: SampleRow = {
          id: currentId,
          normalOD: od,
          normalCalc: calc,
          postOD: null,
          postCalc: null
        };
        setRows(prev => [...prev, newRow]);
        setCurrentId(prev => prev + 1);
        setLastAction(`ADDED ID ${currentId}`);
      } else {
        if (postIndex < rows.length) {
          const newRows = [...rows];
          newRows[postIndex].postOD = od;
          newRows[postIndex].postCalc = calc;
          setRows(newRows);
          setPostIndex(prev => prev + 1);
          setLastAction(`UPDATED ID ${rows[postIndex].id} (POST)`);
        } else {
          setLastAction('ERROR: NO MORE NORMAL ROWS TO UPDATE');
        }
      }
    }
  };

  const handleSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (stdOD !== null && concentration !== null) {
      setSetupComplete(true);
    }
  };


  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      handleCommand(inputValue);
      setInputValue('');
    }
  };

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    setToast({ message, type });
    toastTimeout.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const getReportData = useCallback((): LabReportData => ({
    concentration,
    stdOD,
    solvent,
    normalDate,
    srcDate,
    rows,
  }), [concentration, stdOD, solvent, normalDate, srcDate, rows]);

  const handleCopyMarkdown = useCallback(async () => {
    try {
      const md = generateMarkdown(getReportData());
      await navigator.clipboard.writeText(md);
      showToast('Markdown copied to clipboard', 'success');
      setLastAction('COPIED MARKDOWN');
    } catch (err) {
      console.error('Clipboard error:', err);
      showToast('Failed to copy — clipboard permission denied', 'error');
      setLastAction('COPY FAILED');
    }
  }, [getReportData, showToast]);

  const handleDownloadPdf = useCallback(async () => {
    setIsDownloading(true);
    setLastAction('GENERATING PDF...');
    try {
      await generatePDF(getReportData());
      showToast('PDF downloaded successfully', 'success');
      setLastAction('PDF DOWNLOADED');
    } catch (err) {
      console.error('PDF Error:', err);
      showToast('PDF generation failed', 'error');
      setLastAction('PDF ERROR');
    } finally {
      setIsDownloading(false);
    }
  }, [getReportData, showToast]);

  const handlePrint = useCallback(async () => {
    try {
      await printPDF(getReportData());
    } catch (err) {
      console.error('Print error:', err);
      showToast('Print failed', 'error');
    }
  }, [getReportData, showToast]);

  if (!setupComplete) {
    return (
      <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl shadow-xl border border-[#141414]/10 w-full max-w-md"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-[#141414] p-2 rounded-lg">
              <Beaker className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#141414]">LabCalc Engine</h1>
          </div>

          <form onSubmit={handleSetup} className="space-y-4">
            <div className="flex justify-center mb-2">
              <img src={logo} alt="SRC Logo" className="h-12 object-contain" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#141414]/50 mb-1">
                  O.D. of Standard
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  autoFocus
                  className="w-full bg-[#E4E3E0]/30 border-b-2 border-[#141414] p-2 focus:outline-none focus:bg-[#E4E3E0]/50 transition-colors text-sm font-mono"
                  placeholder="0.50"
                  onChange={(e) => setStdOD(Math.round(parseFloat(e.target.value) * 100) / 100)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#141414]/50 mb-1">
                  Concentration
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="w-full bg-[#E4E3E0]/30 border-b-2 border-[#141414] p-2 focus:outline-none focus:bg-[#E4E3E0]/50 transition-colors text-sm font-mono"
                  placeholder="100"
                  onChange={(e) => setConcentration(parseFloat(e.target.value))}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#141414]/50 mb-1">
                Solvent Name
              </label>
              <input
                type="text"
                required
                className="w-full bg-[#E4E3E0]/30 border-b-2 border-[#141414] p-2 focus:outline-none focus:bg-[#E4E3E0]/50 transition-colors text-sm font-mono"
                placeholder="e.g. Insulin"
                onChange={(e) => setSolvent(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#141414]/50 mb-1">
                  Normal Date
                </label>
                <input
                  type="date"
                  required
                  className="w-full bg-[#E4E3E0]/30 border-b-2 border-[#141414] p-2 focus:outline-none focus:bg-[#E4E3E0]/50 transition-colors text-sm font-mono"
                  onChange={(e) => setNormalDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#141414]/50 mb-1">
                  SRC Date
                </label>
                <input
                  type="date"
                  required
                  className="w-full bg-[#E4E3E0]/30 border-b-2 border-[#141414] p-2 focus:outline-none focus:bg-[#E4E3E0]/50 transition-colors text-sm font-mono"
                  onChange={(e) => setSrcDate(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#141414] text-white py-3 rounded-xl font-bold hover:bg-[#141414]/90 transition-all flex items-center justify-center gap-2 group mt-4"
            >
              Initialize Engine
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-white">
      {/* Header */}
      <header className="border-b border-[#141414] bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="bg-[#141414] p-1.5 rounded">
            <Beaker className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-tighter">LabCalc Engine v1.0</h1>
            <div className="flex gap-4 text-[10px] font-mono opacity-60">
              <span>STD: {stdOD?.toFixed(2)}</span>
              <span>CONC: {concentration?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Status:</span>
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${mode === 'NORMAL' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {mode} MODE
            </span>
          </div>
          <div className="h-8 w-px bg-[#141414]/10" />
          <button 
            onClick={() => setShowExport(true)}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:opacity-60 transition-opacity bg-[#141414] text-white px-4 py-2 rounded-lg"
          >
            <Download className="w-3 h-3" />
            Export PDF
          </button>
        </div>
      </header>

      <main className="p-6 max-w-6xl mx-auto">
        {/* Command Bar */}
        <div className="mb-8">
          <form onSubmit={handleInputSubmit} className="relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter O.D. or command (POST, NORMAL, SET ID [X], DELETE)..."
              className="w-full bg-white border-2 border-[#141414] p-5 rounded-2xl text-xl font-mono focus:outline-none shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] focus:shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] focus:translate-x-[2px] focus:translate-y-[2px] transition-all"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
              <AnimatePresence mode="wait">
                {lastAction && (
                  <motion.span
                    key={lastAction}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded"
                  >
                    {lastAction}
                  </motion.span>
                )}
              </AnimatePresence>
              <div className="bg-[#141414]/5 px-2 py-1 rounded text-[10px] font-mono opacity-40">
                ENTER TO SUBMIT
              </div>
            </div>
          </form>
        </div>

        {/* Data Grid */}
        <div className="bg-white rounded-2xl border-2 border-[#141414] overflow-hidden shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
          <div className="grid grid-cols-5 border-b-2 border-[#141414] bg-[#141414] text-white">
            <div className="p-4 text-[11px] font-bold uppercase tracking-widest border-r border-white/20">Sample ID</div>
            <div className="p-4 text-[11px] font-bold uppercase tracking-widest border-r border-white/20">Normal: O.D.</div>
            <div className="p-4 text-[11px] font-bold uppercase tracking-widest border-r border-white/20">Normal: Calc</div>
            <div className="p-4 text-[11px] font-bold uppercase tracking-widest border-r border-white/20">SRC: O.D.</div>
            <div className="p-4 text-[11px] font-bold uppercase tracking-widest">SRC: Calc</div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {rows.length === 0 ? (
              <div className="p-20 text-center opacity-20 flex flex-col items-center gap-4">
                <FileText className="w-12 h-12" />
                <p className="font-mono text-sm uppercase tracking-widest">Awaiting data input...</p>
              </div>
            ) : (
              rows.map((row, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={row.id} 
                  className={`grid grid-cols-5 border-b border-[#141414]/10 hover:bg-[#E4E3E0]/30 transition-colors ${mode === 'POST' && postIndex === idx ? 'bg-amber-50' : ''}`}
                >
                  <div className="p-4 font-mono text-sm border-r border-[#141414]/10">{row.id}</div>
                  <div className="p-4 font-mono text-sm border-r border-[#141414]/10">{row.normalOD?.toFixed(2) || '-'}</div>
                  <div className="p-4 font-mono text-sm border-r border-[#141414]/10 font-bold">{row.normalCalc?.toFixed(2) || '-'}</div>
                  <div className="p-4 font-mono text-sm border-r border-[#141414]/10">{row.postOD?.toFixed(2) || '-'}</div>
                  <div className="p-4 font-mono text-sm font-bold">{row.postCalc?.toFixed(2) || '-'}</div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Quick Help */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { cmd: 'POST', desc: 'Switch to SRC Mode' },
            { cmd: 'NORMAL', desc: 'Switch to Normal Mode' },
            { cmd: 'SET ID [N]', desc: 'Jump to specific ID' },
            { cmd: 'DELETE', desc: 'Remove last entry' },
            { cmd: 'DELETE ALL', desc: 'Reset to Setup' },
          ].map(item => (
            <div key={item.cmd} className="bg-white p-3 rounded-xl border border-[#141414]/10 flex items-center justify-between">
              <code className="text-[10px] font-bold bg-[#141414] text-white px-1.5 py-0.5 rounded">{item.cmd}</code>
              <span className="text-[10px] font-medium opacity-60 uppercase tracking-wider">{item.desc}</span>
            </div>
          ))}
        </div>
      </main>

      {/* Export Modal */}
      <AnimatePresence>
        {showExport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExport(false)}
              className="fixed inset-0 bg-[#141414]/60 backdrop-blur-sm print:hidden"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col min-h-[90vh] print:min-h-0 print:shadow-none print:rounded-none print:static"
            >
              {/* Report Header (Print Only or Preview) */}
              <div id="printable-report" ref={reportRef} className="p-8 sm:p-12 flex-1 overflow-y-auto print:overflow-visible bg-white">
                <div className="flex justify-between items-start mb-12">
                  <div className="flex flex-col gap-6">
                    {logo && <img src={logo} alt="Logo" className="h-16 object-contain self-start" referrerPolicy="no-referrer" />}
                    <h1 className="text-4xl font-bold tracking-tight text-[#141414]">Laboratory Summary Report</h1>
                    <p className="text-xs text-[#141414]/40 font-mono">Report Timestamp: {new Date().toLocaleString()}</p>
                  </div>
                </div>

                {/* Summary Box */}
                <div className="bg-[#F0F4F8] p-8 rounded-xl border border-[#141414]/5 mb-12">
                  <div className="grid grid-cols-3 gap-8 mb-8">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-2">CONCENTRATION:</label>
                      <span className="text-sm font-mono font-bold">{concentration?.toFixed(2)}</span>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-2">STD. O.D.:</label>
                      <span className="text-sm font-mono font-bold">{stdOD?.toFixed(2)}</span>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-2">SOLVENT:</label>
                      <span className="text-sm font-mono font-bold">{solvent}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-8">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-2">NORMAL DATE:</label>
                      <span className="text-sm font-mono font-bold">{normalDate}</span>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-2">SRC DATE:</label>
                      <span className="text-sm font-mono font-bold">{srcDate}</span>
                    </div>
                  </div>
                </div>

                {/* Report Table */}
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#141414] text-white">
                      <th className="p-4 text-left text-[11px] font-bold uppercase tracking-widest border-r border-white/10">Sample ID</th>
                      <th className="p-4 text-left text-[11px] font-bold uppercase tracking-widest border-r border-white/10">Normal: O.D.</th>
                      <th className="p-4 text-left text-[11px] font-bold uppercase tracking-widest border-r border-white/10">Normal: Calc</th>
                      <th className="p-4 text-left text-[11px] font-bold uppercase tracking-widest border-r border-white/10">SRC: O.D.</th>
                      <th className="p-4 text-left text-[11px] font-bold uppercase tracking-widest">SRC: Calc</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="border-b border-[#141414]/10">
                        <td className="p-4 text-center font-mono text-sm border-r border-[#141414]/10">{row.id}</td>
                        <td className="p-4 text-center font-mono text-sm border-r border-[#141414]/10 text-[#141414]/60">{row.normalOD?.toFixed(2) || '-'}</td>
                        <td className="p-4 text-center font-mono text-sm border-r border-[#141414]/10 font-bold text-blue-600">{row.normalCalc?.toFixed(2) || '-'}</td>
                        <td className="p-4 text-center font-mono text-sm border-r border-[#141414]/10 text-[#141414]/60">{row.postOD?.toFixed(2) || '-'}</td>
                        <td className="p-4 text-center font-mono text-sm font-bold text-emerald-600">{row.postCalc?.toFixed(2) || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-12 pt-8 border-t border-[#141414]/10 flex justify-between items-center text-[10px] font-mono opacity-40">
                  <span>Generated via LabCalc Engine Professional</span>
                  <span>Page 1 of 1</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-white border-t border-[#141414]/10 flex justify-end gap-3 print:hidden">
                <button
                  onClick={handleCopyMarkdown}
                  className="border border-[#141414] px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#141414]/5 transition-all flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Copy Markdown
                </button>
                <button
                  onClick={handleDownloadPdf}
                  disabled={isDownloading}
                  className="bg-[#141414] text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#141414]/90 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isDownloading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Download PDF
                </button>
                <button
                  onClick={handlePrint}
                  className="border border-[#141414] px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#141414]/5 transition-all flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
                <button
                  onClick={() => setShowExport(false)}
                  className="border border-[#141414] px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#141414]/5 transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            {toast.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report, #printable-report * {
            visibility: visible;
          }
          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            box-shadow: none !important;
            border: none !important;
            overflow: visible !important;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
        }
      `}</style>
    </div>
  );
}
