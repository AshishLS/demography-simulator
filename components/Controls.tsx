import React, { useState } from 'react';
import { SimulationParams } from '../types';
import { Play, Pause, Square, ChevronUp, ChevronDown, BarChart2 } from 'lucide-react';

interface ControlsProps {
  isRunning: boolean;
  onTogglePlay: () => void;
  onStop: () => void;
  params: SimulationParams;
  onParamChange: (key: keyof SimulationParams, value: number) => void;
  onShowHistory: () => void;
}

export const Controls: React.FC<ControlsProps> = ({ 
  isRunning, 
  onTogglePlay, 
  onStop, 
  params, 
  onParamChange,
  onShowHistory
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Calculate estimated annual immigrants
  const legalProb = params.legalAcceptanceRate / 100;
  const illegalProb = params.illegalSuccessRate / 100;
  // Prob of entering = Legal + (1-Legal)*Illegal
  const totalProb = legalProb + (1 - legalProb) * illegalProb;
  const estimatedAnnualImmigrants = Math.round(params.initialOutsiders * totalProb);

  return (
    <div className="absolute top-4 left-4 w-80 flex flex-col gap-2 max-h-[90vh] transition-all">
      {/* Header Bar (Always Visible) */}
      <div className="bg-gray-900/90 backdrop-blur-md p-3 rounded-lg border border-gray-700 shadow-xl flex items-center justify-between">
         <h1 className="text-white font-bold text-sm">Controls</h1>
         <div className="flex gap-2">
            <button 
              onClick={onShowHistory}
              className="p-1.5 hover:bg-gray-700 rounded text-blue-400 transition-colors"
              title="View History Charts"
            >
              <BarChart2 size={16} />
            </button>
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 hover:bg-gray-700 rounded text-gray-400 transition-colors"
            >
              {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
         </div>
      </div>

      {/* Collapsible Content */}
      <div className={`bg-gray-900/90 backdrop-blur-md rounded-lg border border-gray-700 text-sm text-gray-200 shadow-xl overflow-hidden transition-all duration-300 flex flex-col ${isCollapsed ? 'max-h-0 opacity-0 border-0' : 'max-h-[80vh] opacity-100 p-4'}`}>
        
        {/* Main Buttons */}
        <div className="flex gap-2 mb-6 shrink-0">
          <button 
            onClick={onTogglePlay}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded font-semibold transition-colors ${
              isRunning ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-green-600 hover:bg-green-500'
            }`}
          >
            {isRunning ? <><Pause size={16}/> Pause</> : <><Play size={16}/> Start</>}
          </button>
          <button 
            onClick={onStop}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-600 hover:bg-red-500 rounded font-semibold transition-colors"
          >
            <Square size={16} fill="currentColor"/> Stop
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto no-scrollbar">
          {/* Time Control */}
          <div className="space-y-1">
            <label className="flex justify-between text-xs uppercase font-bold text-gray-400">
              Time Speed <span className="text-white">{params.timeSpeed.toFixed(1)} yrs/sec</span>
            </label>
            <input 
              type="range" min="0.1" max="20" step="0.1"
              value={params.timeSpeed}
              onChange={(e) => onParamChange('timeSpeed', parseFloat(e.target.value))}
              className="w-full accent-blue-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <hr className="border-gray-700" />

          {/* Immigration Policy */}
          <h3 className="font-semibold text-blue-400">Immigration Policy</h3>
          <p className="text-[10px] text-gray-500 leading-tight">
            Probability that an outsider successfully moves in per year.
          </p>
          
          <div className="bg-gray-800 p-2 rounded border border-gray-700 mb-2">
            <div className="flex justify-between text-xs">
               <span className="text-gray-400">Est. Immigrants/Year:</span>
               <span className="text-white font-mono font-bold">{estimatedAnnualImmigrants}</span>
            </div>
            <div className="text-[9px] text-gray-500 text-right mt-0.5">
               (Based on {params.initialOutsiders} outsiders)
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="flex justify-between text-xs">
                Legal Annual Chance <span className="text-green-400">{params.legalAcceptanceRate}%</span>
              </label>
              <input 
                type="range" min="0" max="100" step="1"
                value={params.legalAcceptanceRate}
                onChange={(e) => onParamChange('legalAcceptanceRate', parseInt(e.target.value))}
                className="w-full accent-green-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <label className="flex justify-between text-xs">
                Illegal Annual Chance <span className="text-red-400">{params.illegalSuccessRate}%</span>
              </label>
              <input 
                type="range" min="0" max="100" step="1"
                value={params.illegalSuccessRate}
                onChange={(e) => onParamChange('illegalSuccessRate', parseInt(e.target.value))}
                className="w-full accent-red-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          <hr className="border-gray-700" />

          {/* Birth Rates */}
          <h3 className="font-semibold text-blue-400">Birth Rates (TFR)</h3>
          <p className="text-[10px] text-gray-500 mb-2">Total Fertility Rate: Avg children per couple (e.g., 2.1 is replacement)</p>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="flex justify-between text-xs">
                Native <span className="text-yellow-400">{params.tfrNative.toFixed(2)}</span>
              </label>
              <input 
                type="range" min="0" max="8.0" step="0.1"
                value={params.tfrNative}
                onChange={(e) => onParamChange('tfrNative', parseFloat(e.target.value))}
                className="w-full accent-yellow-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <label className="flex justify-between text-xs">
                Legal Immigrant <span className="text-green-400">{params.tfrLegal.toFixed(2)}</span>
              </label>
              <input 
                type="range" min="0" max="8.0" step="0.1"
                value={params.tfrLegal}
                onChange={(e) => onParamChange('tfrLegal', parseFloat(e.target.value))}
                className="w-full accent-green-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <label className="flex justify-between text-xs">
                Illegal Immigrant <span className="text-red-400">{params.tfrIllegal.toFixed(2)}</span>
              </label>
              <input 
                type="range" min="0" max="8.0" step="0.1"
                value={params.tfrIllegal}
                onChange={(e) => onParamChange('tfrIllegal', parseFloat(e.target.value))}
                className="w-full accent-red-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};