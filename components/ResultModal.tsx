import React from 'react';
import { SimulationParams, SimulationStats } from '../types';
import { Download, X, Save } from 'lucide-react';

interface ResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: SimulationStats;
  params: SimulationParams;
  onSave: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({ isOpen, onClose, stats, params, onSave }) => {
  if (!isOpen) return null;

  const handleDownload = () => {
    const data = {
      timestamp: new Date().toISOString(),
      finalStats: stats,
      configuration: params
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `immigration_sim_year_${stats.yearsPassed}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveAndClose = () => {
     onSave();
     onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full border border-gray-700 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Simulation Results</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900 p-4 rounded-lg text-center">
              <div className="text-sm text-gray-400 uppercase">Years Passed</div>
              <div className="text-3xl font-bold text-white">{stats.yearsPassed}</div>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg text-center">
              <div className="text-sm text-gray-400 uppercase">Final Population</div>
              <div className="text-3xl font-bold text-blue-400">{stats.totalInside}</div>
            </div>
          </div>

          <div className="space-y-3">
             <h3 className="text-lg font-semibold text-white">Demographics</h3>
             <div className="bg-gray-900 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-yellow-400">Natives</span>
                  <span className="font-mono text-white">{stats.countNative} ({stats.percentNative.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-yellow-400 h-full" style={{width: `${stats.percentNative}%`}}></div>
                </div>

                <div className="flex justify-between">
                  <span className="text-green-400">Legal Immigrants</span>
                  <span className="font-mono text-white">{stats.countLegal} ({stats.percentLegal.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-green-400 h-full" style={{width: `${stats.percentLegal}%`}}></div>
                </div>

                <div className="flex justify-between">
                  <span className="text-red-400">Illegal Immigrants</span>
                  <span className="font-mono text-white">{stats.countIllegal} ({stats.percentIllegal.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-red-400 h-full" style={{width: `${stats.percentIllegal}%`}}></div>
                </div>
             </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-700 flex flex-col gap-3">
          <div className="flex gap-3">
             <button 
               onClick={handleSaveAndClose}
               className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
             >
               <Save size={20} /> Save to History
             </button>
             <button 
               onClick={handleDownload}
               className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
             >
               <Download size={20} /> JSON
             </button>
          </div>
          <button 
            onClick={onClose}
            className="w-full px-6 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-semibold transition-colors text-sm"
          >
            Close without Saving
          </button>
        </div>
      </div>
    </div>
  );
};