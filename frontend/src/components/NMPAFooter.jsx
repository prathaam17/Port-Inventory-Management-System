import React from 'react';

const NMPAFooter = () => {
  return (
    <div className="w-full font-sans text-center text-slate-800 bg-white select-none border-t border-slate-300 pt-3 mt-6">
      {/* Phone Number Line */}
      <p className="text-xs sm:text-sm font-black text-[#2e1065] tracking-wide mb-0.5">
        ದೂರವಾಣಿ / दूरभाष / Phone : 0824 - 2407341, 2887399
      </p>

      {/* ISO Compliance Hindi */}
      <p className="text-[10px] sm:text-[11px] font-bold text-[#2e1065] leading-tight">
        आईएसओ 9001:2015, 14001:2015 आईएसओ एवं 45001:2018 आईएसएपीएस अनुपालनकर्ता पत्तन
      </p>

      {/* ISO Compliance English */}
      <p className="text-[10.5px] sm:text-[11.5px] font-extrabold text-[#002B66] leading-tight mt-0.5 mb-3">
        An ISO 9001:2015, 14001:2015 ISO 45001:2018 & ISPS Compliant Port
      </p>

      {/* Social Media & Official Web Links Bar */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-[10px] sm:text-[11px] font-bold text-slate-800 border-t border-slate-200 pt-2.5">
        {/* X / Twitter */}
        <div className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5 fill-current text-black" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span className="font-bold text-[#002B66]">NewMngPort</span>
        </div>

        {/* Facebook */}
        <div className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5 fill-current text-[#1877F2]" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          <span className="font-bold text-[#002B66]">NewMngPort</span>
        </div>

        {/* Instagram */}
        <div className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5 fill-current text-[#E4405F]" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
          <span className="font-bold text-[#002B66]">newmngport</span>
        </div>

        {/* YouTube */}
        <div className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5 fill-current text-[#FF0000]" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          <span className="font-bold text-[#002B66]">newmngport</span>
        </div>

        {/* Website Link */}
        <div className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5 fill-current text-[#0284C7]" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
          <a 
            href="https://newmangaloreport.gov.in/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="font-extrabold text-[#002B66] hover:underline"
          >
            https://newmangaloreport.gov.in/
          </a>
        </div>
      </div>
    </div>
  );
};

export default NMPAFooter;
