import React, { useMemo } from 'react';
import { HistoryEntry } from '../types';
import { X, Trash2, FileJson, FileSpreadsheet, Download } from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  onClearHistory: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, history, onClearHistory }) => {
  if (!isOpen) return null;

  const downloadJSON = () => {
    const jsonString = JSON.stringify(history, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `immigration_sim_history_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    const headers = [
      "Run ID",
      "Date",
      "Years Passed",
      "Total Pop",
      "Native Count",
      "Legal Count",
      "Illegal Count",
      "Native %",
      "Legal %",
      "Illegal %",
      "Minority Year",
      "Init Natives",
      "Init Outsiders",
      "Legal Rate %",
      "Illegal Rate %",
      "TFR Native",
      "TFR Legal",
      "TFR Illegal"
    ];

    const rows = history.map(entry => [
      entry.id,
      `"${entry.date}"`,
      entry.stats.yearsPassed,
      entry.stats.totalInside,
      entry.stats.countNative,
      entry.stats.countLegal,
      entry.stats.countIllegal,
      entry.stats.percentNative.toFixed(2),
      entry.stats.percentLegal.toFixed(2),
      entry.stats.percentIllegal.toFixed(2),
      entry.stats.minorityYear !== null ? entry.stats.minorityYear : "",
      entry.params.initialNatives,
      entry.params.initialOutsiders,
      entry.params.legalAcceptanceRate,
      entry.params.illegalSuccessRate,
      entry.params.tfrNative,
      entry.params.tfrLegal,
      entry.params.tfrIllegal
    ].join(","));

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `immigration_sim_history_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Simple SVG Chart Component
  const Chart = ({ entries }: { entries: HistoryEntry[] }) => {
    if (entries.length === 0) return <div className="text-gray-500 text-center py-8">No history recorded yet.</div>;

    const maxPop = Math.max(...entries.map(e => e.stats.totalInside), 100);
    const chartHeight = 200;
    const barWidth = 40;
    const gap = 20;
    const chartWidth = Math.max(entries.length * (barWidth + gap), 300);

    return (
      <div className="overflow-x-auto pb-2 custom-scrollbar">
        <svg width={chartWidth} height={chartHeight + 40} className="mt-4">
          {entries.map((entry, i) => {
            const hNative = (entry.stats.countNative / maxPop) * chartHeight;
            const hLegal = (entry.stats.countLegal / maxPop) * chartHeight;
            const hIllegal = (entry.stats.countIllegal / maxPop) * chartHeight;
            const x = i * (barWidth + gap);
            
            return (
              <g key={entry.id} transform={`translate(${x}, 0)`}>
                {/* Stacked Bars */}
                <rect x={0} y={chartHeight - hNative} width={barWidth} height={hNative} fill="#FFFF00" />
                <rect x={0} y={chartHeight - hNative - hLegal} width={barWidth} height={hLegal} fill="#00FF00" />
                <rect x={0} y={chartHeight - hNative - hLegal - hIllegal} width={barWidth} height={hIllegal} fill="#FF0000" />
                
                {/* Label */}
                <text x={barWidth/2} y={chartHeight + 20} textAnchor="middle" fill="#aaa" fontSize="10">
                  Run {i + 1}
                </text>
                 <text x={barWidth/2} y={chartHeight + 35} textAnchor="middle" fill="#666" fontSize="9">
                  Yr {entry.stats.yearsPassed}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="flex gap-4 text-xs justify-center mt-2">
           <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#FFFF00]"></div> Native</div>
           <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#00FF00]"></div> Legal</div>
           <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#FF0000]"></div> Illegal</div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full border border-gray-700 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Simulation History</h2>
          <div className="flex gap-2 items-center">
             {history.length > 0 && (
               <>
                <button onClick={downloadJSON} className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded flex items-center gap-1 text-xs font-bold transition-colors" title="Download JSON">
                   <FileJson size={16}/> JSON
                </button>
                <button onClick={downloadCSV} className="bg-green-600 hover:bg-green-500 text-white p-2 rounded flex items-center gap-1 text-xs font-bold transition-colors" title="Download CSV">
                   <FileSpreadsheet size={16}/> CSV
                </button>
                <div className="w-px h-6 bg-gray-600 mx-1"></div>
                <button onClick={onClearHistory} className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1 px-2">
                   <Trash2 size={16}/> Clear
                </button>
               </>
             )}
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors ml-2">
                <X size={24} />
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar">
           <div className="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-gray-200 mb-2">Population Comparison</h3>
              <Chart entries={history} />
           </div>

           <h3 className="text-lg font-semibold text-gray-200 mb-4">Detailed Logs</h3>
           <div className="space-y-3">
              {history.length === 0 && <p className="text-gray-500 italic">No runs saved yet.</p>}
              {history.map((entry, idx) => (
                 <div key={entry.id} className="bg-gray-900 border border-gray-700 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                         <div className="font-bold text-white">Run #{idx + 1} <span className="text-gray-500 text-xs font-normal ml-2">{new Date(entry.date).toLocaleString()}</span></div>
                         <div className="text-xs text-blue-400 font-mono mt-0.5">
                            Simulated Years: {entry.stats.yearsPassed} | Total Pop: {entry.stats.totalInside}
                         </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-950/50 p-3 rounded grid grid-cols-2 sm:grid-cols-4 gap-y-2 gap-x-4 text-xs border border-gray-800">
                        <div className="text-gray-500">Time Speed</div>
                        <div className="text-gray-200 font-mono">{entry.params.timeSpeed}x</div>

                        <div className="text-gray-500">Init Natives</div>
                        <div className="text-gray-200 font-mono">{entry.params.initialNatives}</div>

                        <div className="text-gray-500">Legal Rate</div>
                        <div className="text-gray-200 font-mono">{entry.params.legalAcceptanceRate}%</div>

                        <div className="text-gray-500">Illegal Rate</div>
                        <div className="text-gray-200 font-mono">{entry.params.illegalSuccessRate}%</div>

                        <div className="text-gray-500">TFR Native</div>
                        <div className="text-yellow-400 font-mono">{entry.params.tfrNative.toFixed(2)}</div>

                        <div className="text-gray-500">TFR Legal</div>
                        <div className="text-green-400 font-mono">{entry.params.tfrLegal.toFixed(2)}</div>

                        <div className="text-gray-500">TFR Illegal</div>
                        <div className="text-red-400 font-mono">{entry.params.tfrIllegal.toFixed(2)}</div>

                        <div className="text-gray-500">Outsiders Cap</div>
                        <div className="text-gray-200 font-mono">{entry.params.initialOutsiders}</div>
                    </div>

                    {/* Minority Warning in History */}
                    {entry.stats.minorityYear !== null ? (
                      <div className="mt-3 bg-red-950/30 border border-red-900/50 p-2 rounded text-center">
                        <div className="text-red-400 font-bold text-xs">
                          ⚠️ Natives became minority at Year {entry.stats.minorityYear}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 text-center text-xs text-gray-600">
                        Native majority maintained throughout simulation.
                      </div>
                    )}
                 </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};