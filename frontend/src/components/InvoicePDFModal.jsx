import React from 'react';
import { Printer, Download, X, CheckCircle2 } from 'lucide-react';
import NMPAHeader from './NMPAHeader';
import NMPAFooter from './NMPAFooter';

const InvoicePDFModal = ({ invoice, onClose }) => {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const amount = invoice.totalAmount || invoice.amount || 0;
  const subtotal = Math.round(amount / 1.18);
  const gst = amount - subtotal;
  const cgst = Math.round(gst / 2);
  const sgst = gst - cgst;
  const invoiceNo = invoice.invoiceNo || invoice.invoiceNumber || invoice.billNo || `INV-MNGPRT-${invoice.id || '88371'}`;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[300] flex justify-center items-center p-4 overflow-y-auto">
      <div className="max-w-2xl w-full bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden my-auto text-slate-800 animate-in zoom-in-95 duration-150">
        
        {/* Action Toolbar */}
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center no-print border-b border-slate-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">Official Tax Invoice & Receipt</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition shadow cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-lg transition text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div id="printable-invoice" className="p-8 space-y-6 bg-white select-none">
          
          {/* Official NMPA Header Component */}
          <NMPAHeader 
            documentTitle="INVOICE" 
            documentNo={invoiceNo} 
          />

          {/* Billed Details Grid */}
          <div className="grid grid-cols-2 gap-6 text-xs p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Billed To (Shipping Agent / Consignee)</span>
              <p className="font-bold text-slate-900 text-sm">{invoice.agentName || invoice.consignee || 'Registered Port Agent'}</p>
              <p className="text-slate-600 mt-0.5">Trade Account: PDA-MNGPRT-ONLINE</p>
              <p className="text-slate-500">Panambur Port Terminal Access</p>
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Cargo & Vessel Information</span>
              <p className="font-bold text-slate-900">Vessel: <span className="text-sky-700">{invoice.vesselName || 'MV MNGPRT MARINER'}</span></p>
              <p className="text-slate-600">Cargo Ref: <span className="font-mono">{invoice.cargoId || 'CRG-EXP-8821'}</span></p>
              <p className="text-slate-500">Trade Type: <span className="font-bold text-slate-700">{invoice.tradeType || 'Export Cargo'}</span></p>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="overflow-hidden border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold">
                  <th className="p-3">Item Description</th>
                  <th className="p-3 text-center">HSN/SAC Code</th>
                  <th className="p-3 text-right">Taxable Value (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                <tr>
                  <td className="p-3">
                    <p className="font-bold text-slate-900">Port Wharfage & Cargo Handling Charges</p>
                    <p className="text-[10px] text-slate-500">Standard quay loader & berthage tariff assessment</p>
                  </td>
                  <td className="p-3 text-center font-mono text-slate-600">996711</td>
                  <td className="p-3 text-right font-mono font-bold">₹{Math.round(subtotal * 0.7).toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td className="p-3">
                    <p className="font-bold text-slate-900">Storage Yard & Demurrage Charges</p>
                    <p className="text-[10px] text-slate-500">Transit shed slot storage assessment</p>
                  </td>
                  <td className="p-3 text-center font-mono text-slate-600">996719</td>
                  <td className="p-3 text-right font-mono font-bold">₹{Math.round(subtotal * 0.3).toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Calculation Summary */}
          <div className="flex justify-end pt-2">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Excl. Tax):</span>
                <span className="font-mono font-bold">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>CGST @ 9%:</span>
                <span className="font-mono">₹{cgst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>SGST @ 9%:</span>
                <span className="font-mono">₹{sgst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between pt-2 border-t-2 border-slate-900 text-sm font-extrabold text-slate-900">
                <span>Total Amount Paid:</span>
                <span className="font-mono text-emerald-700">₹{amount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Official Stamp Footer */}
          <div className="pt-6 border-t border-slate-200 flex justify-between items-end text-[11px] text-slate-500">
            <div>
              <p className="font-bold text-slate-700">Computer Generated Official Receipt</p>
              <p className="text-[10px]">Pre-Deposit Account Wallet Ref: <span className="font-mono text-slate-600">TXN-PDA-{Date.now().toString().slice(-6)}</span></p>
            </div>
            <div className="text-center">
              <div className="w-24 h-12 border border-dashed border-sky-300 rounded flex items-center justify-center text-[10px] font-bold text-sky-600 bg-sky-50 mx-auto mb-1">
                MNGPRT FINANCE DEPT SEAL
              </div>
              <p className="font-extrabold text-slate-800">Authorized Accounts Signatory</p>
            </div>
          </div>

          {/* Official NMPA Footer Component */}
          <NMPAFooter />

        </div>

      </div>
    </div>
  );
};

export default InvoicePDFModal;
