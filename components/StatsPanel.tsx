import React from 'react';
import { SimulationStats } from '../types';

interface StatsPanelProps {
  stats: SimulationStats;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ stats }) => {
  return (
    <div className="absolute top-4 right-4 w-64 bg-gray-900/90 backdrop-blur-md p-4 rounded-lg border border-gray-700 text-gray-200 shadow-xl pointer-events-none select-none">
       <div className="text-center mb-4">
          <div className="text-xs uppercase text-gray-400 font-bold">Simulated Year</div>
          <div className="text-3xl font-mono text-white">Year {stats.yearsPassed}</div>
       </div>

       <div className="mb-4 text-center">
          <div className="text-xs uppercase text-gray-400">Total Population (Inside)</div>
          <div className="text-2xl font-bold text-blue-400">{stats.totalInside}</div>
       </div>

       <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
             <span className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#FFFF00] rounded-sm shadow-[0_0_5px_#FFFF00]"></div> Native
             </span>
             <span className="font-mono">{stats.countNative} ({stats.percentNative.toFixed(1)}%)</span>
          </div>
          <div className="flex justify-between items-center">
             <span className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#00FF00] rounded-sm shadow-[0_0_5px_#00FF00]"></div> Legal Imm.
             </span>
             <span className="font-mono">{stats.countLegal} ({stats.percentLegal.toFixed(1)}%)</span>
          </div>
          <div className="flex justify-between items-center">
             <span className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#FF0000] rounded-sm shadow-[0_0_5px_#FF0000]"></div> Illegal Imm.
             </span>
             <span className="font-mono">{stats.countIllegal} ({stats.percentIllegal.toFixed(1)}%)</span>
          </div>
          <div className="border-t border-gray-700 my-2 pt-2 flex justify-between items-center opacity-75">
             <span className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#990000] rounded-sm"></div> Outsiders
             </span>
             <span className="font-mono">{stats.countOutsider} (Waiting)</span>
          </div>
       </div>
       
       {/* Minority Warning */}
       {stats.percentNative < 50 && stats.totalInside > 0 && (
         <div className="mt-4 bg-red-900/80 border border-red-500 p-2 rounded text-center animate-pulse">
           <div className="text-red-200 text-xs font-bold uppercase tracking-wider">Demographic Alert</div>
           <div className="text-white text-sm font-semibold">Natives are now a minority</div>
           <div className="text-red-300 text-[10px] mt-1">
             Since Year {stats.minorityYear}
           </div>
         </div>
       )}
    </div>
  );
};