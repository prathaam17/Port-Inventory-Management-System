import React from 'react';

export const SagarmalaLogo = ({ className = "h-16 w-auto" }) => (
  <div className={`flex flex-col items-center text-center shrink-0 ${className}`}>
    <svg viewBox="0 0 140 65" className="h-10 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M70 6 C70 6, 82 24, 76 38 C72 34, 68 34, 64 38 C58 24, 70 6, 70 6 Z" fill="#F97316" />
      <path d="M50 14 C50 14, 68 24, 62 40 C56 38, 52 40, 48 44 C44 30, 50 14, 50 14 Z" fill="#EA580C" />
      <path d="M90 14 C90 14, 72 24, 78 40 C84 38, 88 40, 92 44 C96 30, 90 14, 90 14 Z" fill="#EA580C" />
      <path d="M15 46 C35 38, 55 52, 70 46 C85 40, 105 52, 125 46 C125 51, 105 57, 70 51 C55 57, 35 43, 15 51 Z" fill="#0284C7" />
      <path d="M15 54 C35 48, 55 60, 70 54 C85 48, 105 60, 125 54 C125 58, 105 63, 70 58 C55 63, 35 52, 15 58 Z" fill="#16A34A" />
    </svg>
    <div style={{ fontSize: '13px', lineHeight: '1', fontWeight: 900, textTransform: 'uppercase', marginTop: '2px' }}>
      <span style={{ color: '#002B66' }}>SAGAR</span><span style={{ color: '#EA580C' }}>MALA</span>
    </div>
    <div style={{ fontSize: '7.5px', lineHeight: '1.1', fontWeight: 800, textTransform: 'uppercase', color: '#16A34A', marginTop: '2px' }}>
      PORT-LED PROSPERITY
    </div>
  </div>
);

const NMPAHeader = ({ documentTitle = "", documentNo = "" }) => {
  return (
    <div className="nmpa-official-header w-full font-sans text-slate-900 bg-white select-none">
      {/* Clean Header Picture & Emblem Row */}
      <div className="flex items-center justify-between gap-4 pb-3 border-b-[3px] border-[#003366]">
        {/* Left: Official NMPA Header Picture & Authority Title */}
        <div className="flex items-center gap-3">
          <div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#002B66', lineHeight: '1.1', textTransform: 'uppercase', letterSpacing: '-0.3px' }}>
              PORT INVENTORY MANAGEMENT SYSTEM
            </div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#16A34A', marginTop: '2px' }}>
              (Fully Solar Powered)
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginTop: '2px' }}>
              Govt. of India (Ministry of Ports, Shipping and Waterways)
            </div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748B' }}>
              Panambur, Mangaluru, Karnataka - 575010
            </div>
          </div>
        </div>

        {/* Right: Sagarmala Logo Picture */}
        <div className="shrink-0">
          <SagarmalaLogo className="h-16 w-auto" />
        </div>
      </div>

      {/* Sub-Header Document Bar */}
      {(documentTitle || documentNo) && (
        <div className="flex justify-between items-end pt-2 pb-1 border-b border-slate-200">
          <div className="text-left">
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Government of India Enterprise
            </span>
          </div>
          <div className="text-right">
            {documentTitle && (
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#002B66', textTransform: 'uppercase', letterSpacing: '-0.3px' }}>
                {documentTitle}
              </div>
            )}
            {documentNo && (
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>
                No: {documentNo}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NMPAHeader;
