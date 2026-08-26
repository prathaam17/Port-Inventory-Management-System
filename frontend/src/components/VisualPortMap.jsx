import React, { useState } from 'react';
import { Anchor, Grid, Layers, Database, Box, Info, CheckCircle, AlertTriangle } from 'lucide-react';

const VisualPortMap = ({ berths = [], warehouses = [] }) => {
  const [selectedPlot, setSelectedPlot] = useState(null);

  // Default berths data if empty
  const activeBerths = berths.length > 0 ? berths : [
    { id: 1, number: 'Berth 01 (General Cargo)', draftLimit: 14.5, capacity: 50000, status: 'Available' },
    { id: 2, number: 'Berth 02 (Container Quay)', draftLimit: 15.0, capacity: 75000, status: 'Occupied', vessel: 'MV MNGPRT EXPRESS' },
    { id: 3, number: 'Berth 03 (Liquid Bulk / POL)', draftLimit: 13.8, capacity: 40000, status: 'Available' },
    { id: 4, number: 'Berth 04 (Dry Bulk Coal)', draftLimit: 14.0, capacity: 60000, status: 'Occupied', vessel: 'MV OCEAN PIONEER' }
  ];

  // Default warehouses data if empty
  const activeWarehouses = warehouses.length > 0 ? warehouses : [
    { id: 1, name: 'Transit Shed No. 1', type: 'Transit Shed', capacity: 15000, availableSpace: 4500, YardLocations: [{ zoneCode: 'ZONE-A1', capacity: 500 }, { zoneCode: 'ZONE-A2', capacity: 500 }] },
    { id: 2, name: 'Transit Shed No. 2', type: 'Transit Shed', capacity: 20000, availableSpace: 12000, YardLocations: [{ zoneCode: 'ZONE-B1', capacity: 800 }] },
    { id: 3, name: 'Open Storage Plot Alpha', type: 'Open Yard', capacity: 50000, availableSpace: 8000, YardLocations: [{ zoneCode: 'PLOT-X1', capacity: 2000 }] },
    { id: 4, name: 'Covered Godown Beta', type: 'Godown', capacity: 30000, availableSpace: 22000, YardLocations: [{ zoneCode: 'GD-01', capacity: 1200 }] }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 space-y-6 select-none">
      
      {/* Map Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Grid className="w-5 h-5 text-sky-500" />
            mngprt Panambur Live Terminal & Yard Layout Map
          </h3>
          <p className="text-xs text-slate-400 font-light mt-0.5">Real-time spatial visualization of berth quays, transit sheds, and open yard storage occupancy</p>
        </div>
        <div className="flex gap-3 text-[11px] font-bold">
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-800/40">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> &lt; 60% Capacity
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 rounded-lg border border-amber-200 dark:border-amber-800/40">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> 60% - 85% Capacity
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 rounded-lg border border-rose-200 dark:border-rose-800/40">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> &gt; 85% High Occupancy
          </span>
        </div>
      </div>

      {/* Map Layout Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Section 1: Marine Waterway & Berth Quays (4 cols) */}
        <div className="lg:col-span-4 p-4 bg-sky-900/5 dark:bg-sky-950/20 border border-sky-200/50 dark:border-sky-900/30 rounded-2xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-sky-200/40 dark:border-sky-900/40">
            <span className="font-extrabold text-xs text-sky-700 dark:text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
              <Anchor className="w-4 h-4" /> Panambur Channel & Berth Quays
            </span>
            <span className="text-[10px] font-mono font-bold text-sky-600 bg-sky-100 dark:bg-sky-900/40 px-2 py-0.5 rounded">Deep Draft Quay</span>
          </div>

          <div className="space-y-2.5">
            {activeBerths.map((b) => (
              <div 
                key={b.id} 
                className={`p-3 rounded-xl border transition-all text-xs flex justify-between items-center ${
                  b.status === 'Occupied' || b.vessel
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/50 text-amber-900 dark:text-amber-200'
                    : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200'
                }`}
              >
                <div>
                  <span className="font-extrabold block text-sm">{b.number}</span>
                  <span className="text-[11px] opacity-80">Draft Limit: {b.draftLimit}m</span>
                  {b.vessel && (
                    <span className="block text-[10px] font-bold text-amber-700 dark:text-amber-300 mt-0.5">
                      Docked: {b.vessel}
                    </span>
                  )}
                </div>
                <span className={`px-2 py-1 rounded-md text-[10px] font-extrabold uppercase ${
                  b.status === 'Occupied' || b.vessel
                    ? 'bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                    : 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                }`}>
                  {b.vessel ? 'Docked' : b.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Storage Yards & Covered Sheds Grid (8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-4 h-4 text-sky-500" /> Terminal Storage Plots & Shed Grids
            </span>
            <span className="text-[10px] text-slate-400">Click plot card for coordinate breakdown</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeWarehouses.map((wh) => {
              const cap = wh.capacity || 1;
              const avail = wh.availableSpace !== undefined ? wh.availableSpace : cap;
              const occupied = cap - avail;
              const percent = Math.min(100, Math.round((occupied / cap) * 100));

              let statusColor = 'bg-emerald-500';
              let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
              if (percent > 85) {
                statusColor = 'bg-rose-500';
                badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
              } else if (percent > 60) {
                statusColor = 'bg-amber-500';
                badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
              }

              return (
                <div 
                  key={wh.id}
                  onClick={() => setSelectedPlot(wh)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-lg space-y-3 ${
                    selectedPlot?.id === wh.id 
                      ? 'bg-sky-50/80 dark:bg-sky-950/40 border-sky-500 ring-2 ring-sky-500/20' 
                      : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Box className="w-4 h-4 text-sky-500" />
                        {wh.name}
                      </h4>
                      <span className="text-[10px] font-semibold text-slate-400">{wh.type}</span>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md border ${badgeColor}`}>
                      {percent}% Occupied
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${statusColor}`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 font-semibold">
                      <span>Occupied: {occupied.toLocaleString()} MT</span>
                      <span>Free: {avail.toLocaleString()} MT</span>
                    </div>
                  </div>

                  {/* Registered Zones count */}
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                    <span>Slots: {wh.YardLocations?.length || 0} Registered</span>
                    <span className="text-sky-600 dark:text-sky-400 font-bold">Details &rarr;</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Selected Storage Plot Coordinates Modal / Drawer */}
      {selectedPlot && (
        <div className="p-4 bg-sky-50/50 dark:bg-slate-800/80 border border-sky-200 dark:border-slate-700 rounded-2xl space-y-3 animate-in fade-in duration-150 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-sky-200/60 dark:border-slate-700">
            <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
              <Info className="w-4 h-4 text-sky-600" />
              Plot Coordinate Breakdown: {selectedPlot.name}
            </span>
            <button 
              onClick={() => setSelectedPlot(null)}
              className="text-slate-400 hover:text-slate-600 text-sm font-bold"
            >
              Close ✕
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {selectedPlot.YardLocations && selectedPlot.YardLocations.length > 0 ? (
              selectedPlot.YardLocations.map((yl, idx) => (
                <div key={idx} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-[11px]">
                  <span className="block font-extrabold text-sky-600">{yl.zoneCode}</span>
                  <span className="text-slate-500">Cap: {yl.capacity || 500} MT</span>
                </div>
              ))
            ) : (
              <p className="col-span-full text-slate-400 italic font-light p-2 text-center">
                No individual slot coordinates registered. General open storage space active.
              </p>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default VisualPortMap;
