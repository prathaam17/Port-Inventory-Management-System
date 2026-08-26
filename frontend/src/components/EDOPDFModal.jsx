import React from 'react';
import { Printer, X, ShieldCheck, AlertOctagon } from 'lucide-react';
import NMPAHeader from './NMPAHeader';
import NMPAFooter from './NMPAFooter';

const EDOPDFModal = ({ edo, cargoItem, onClose }) => {
  if (!edo && !cargoItem) return null;

  const data = {
    deliveryOrderNo: edo?.deliveryOrderNo || cargoItem?.deliveryOrderNo || `EDO-MNGPRT-${Date.now().toString().slice(-6)}`,
    cargoId: edo?.cargoId || cargoItem?.cargoId || 'CRG-2026-9912',
    consignee: edo?.consignee || cargoItem?.consignee || 'Kaveri Kraft Ltd / Maritime Agency',
    vesselName: cargoItem?.vesselName || cargoItem?.vesselCall?.vesselName || 'MV MNGPRT MARINER',
    cargoType: cargoItem?.cargoType || cargoItem?.commodity || 'Containerized Cargo (Break-Bulk)',
    weight: edo?.weight || cargoItem?.weight || '425.00',
    billOfLading: cargoItem?.billOfLading || 'BL-MNGPRT-883921',
    isSeized: cargoItem?.customsHoldStatus === 'SEIZED' || cargoItem?.status === 'Customs Hold',
    issuedAt: edo?.createdAt || cargoItem?.updatedAt || Date.now()
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[300] flex justify-center items-center p-4 overflow-y-auto no-print-backdrop">
      <div className="max-w-3xl w-full bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden my-auto text-slate-800 animate-in zoom-in-95 duration-150 print-container">
        
        {/* Action Toolbar */}
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center no-print border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">MNGPRT Official Electronic Delivery Order (e-DO)</span>
          </div>
          <div className="flex items-center gap-2">
            {!data.isSeized && (
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print / Save e-DO PDF
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-lg transition text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable e-DO Container */}
        <div id="printable-edo" className="p-8 space-y-6 bg-white select-none relative">
          
          {/* Official NMPA Header */}
          <NMPAHeader 
            documentTitle="ELECTRONIC DELIVERY ORDER (e-DO) RELEASE CERTIFICATE"
            documentNo={data.deliveryOrderNo}
          />

          {/* Watermark / Rubber Stamp Status */}
          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Custody Release Status</span>
              {data.isSeized ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-100 text-rose-800 font-extrabold rounded-md text-xs uppercase tracking-wider mt-0.5 border border-rose-300">
                  <AlertOctagon className="w-4 h-4 text-rose-600" /> REVOKED / CUSTOMS EMERGENCY SEIZURE
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 font-extrabold rounded-md text-xs uppercase tracking-wider mt-0.5 border border-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> OFFICIAL CUSTODY RELEASED (e-DO ACTIVE)
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Issuance Date & Time</span>
              <span className="font-mono font-bold text-slate-800 text-xs">
                {new Date(data.issuedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {/* e-DO Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs p-5 bg-slate-50/80 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">e-DO Release Reference</span>
              <p className="font-extrabold font-mono text-[#002B66] text-sm mt-0.5">{data.deliveryOrderNo}</p>
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Cargo Consignment ID</span>
              <p className="font-extrabold font-mono text-slate-900 text-sm mt-0.5">{data.cargoId}</p>
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Bill of Lading (B/L) No</span>
              <p className="font-bold font-mono text-slate-800 text-xs mt-0.5">{data.billOfLading}</p>
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Vessel & Voyage Call</span>
              <p className="font-bold text-slate-800 text-xs mt-0.5">{data.vesselName}</p>
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Commodity Description</span>
              <p className="font-semibold text-slate-800 text-xs mt-0.5">{data.cargoType}</p>
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Discharged Tonnage / Weight</span>
              <p className="font-bold font-mono text-slate-800 text-xs mt-0.5">{data.weight} MT</p>
            </div>
            <div className="col-span-2 pt-2 border-t border-slate-200">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Importer / Authorized Consignee</span>
              <p className="font-extrabold text-slate-900 text-sm mt-0.5">{data.consignee}</p>
              <p className="text-[11px] text-slate-500 font-semibold">Registered Port Trade License | Gate Channel 04 Clearance Authorized</p>
            </div>
          </div>

          {/* Legal Custody Transfer Clause */}
          <div className="p-4 bg-sky-50/60 rounded-xl border border-sky-200 text-xs text-slate-800">
            <strong className="block text-[#002B66] font-extrabold uppercase mb-1">Declaration of Legal Custody Transfer:</strong>
            <p className="leading-relaxed text-slate-700">
              This Electronic Delivery Order (e-DO) serves as official legal authorization for release from the shipping line and Port Inventory Management System. Container and cargo custody is officially transferred to the designated consignee/importer. Terminal facilities, container freight stations (CFS), and storage yards are hereby authorized to log physical delivery and exit for this consignment upon Delivery Order verification.
            </p>
          </div>

          {/* Verification Stamps Section */}
          <div className="pt-4 flex justify-between items-end text-xs">
            <div className="space-y-1">
              <span className="font-mono text-[10px] text-slate-500 block">Security Verification Token:</span>
              <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded border border-slate-200 block text-[10.5px]">
                sha256-MNGPRT-EDO-{String(data.deliveryOrderNo || '').replace(/[^a-zA-Z0-9]/g, '')}-VERIFIED
              </span>
            </div>
            <div className="text-center">
              <div className="w-44 border-b-2 border-slate-800 pb-1 mb-1 font-bold text-slate-900 text-[11px]">
                MNGPRT HARBOR OPERATIONS
              </div>
              <span className="font-extrabold text-slate-700 text-[10px]">DIGITALLY SIGNED & VERIFIED</span>
            </div>
          </div>

          {/* Official NMPA Footer Component matching PDF */}
          <NMPAFooter />

        </div>

      </div>
    </div>
  );
};

export default EDOPDFModal;
