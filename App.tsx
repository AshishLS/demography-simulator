import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { SimulationWorld } from './components/SimulationWorld';
import { Controls } from './components/Controls';
import { StatsPanel } from './components/StatsPanel';
import { ResultModal } from './components/ResultModal';
import { HistoryModal } from './components/HistoryModal';
import { SimulationParams, SimulationStats, HistoryEntry } from './types';
import { DEFAULT_PARAMS } from './constants';

const App: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // Params State
  const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS);
  
  // Stats State (Updated periodically by SimulationWorld)
  const [stats, setStats] = useState<SimulationStats>({
    yearsPassed: 0,
    totalInside: 0,
    countNative: 0,
    countLegal: 0,
    countIllegal: 0,
    countOutsider: 0,
    percentNative: 0,
    percentLegal: 0,
    percentIllegal: 0,
    minorityYear: null
  });

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [resetTrigger, setResetTrigger] = useState(0);

  // Load history from localStorage
  useEffect(() => {
     const saved = localStorage.getItem('sim_history');
     if (saved) {
        try {
           const parsed = JSON.parse(saved);
           // Simple migration check: if old keys exist, we might want to map them or just use defaults for params
           // For simplicity in this demo, if structure doesn't match perfectly, we keep stats but might lose precise param recall
           // or we can map them.
           setHistory(parsed);
        } catch (e) {
           console.error("Failed to parse history", e);
        }
     }
  }, []);

  const handleParamChange = (key: keyof SimulationParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const togglePlay = () => {
    setIsRunning(!isRunning);
  };

  const stopSimulation = () => {
    setIsRunning(false);
    setShowResults(true);
  };

  const closeResults = () => {
    setShowResults(false);
    setResetTrigger(prev => prev + 1); // Reset sim
  };

  const saveToHistory = () => {
     const newEntry: HistoryEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        stats: stats,
        params: params
     };
     const newHistory = [...history, newEntry];
     setHistory(newHistory);
     localStorage.setItem('sim_history', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
     setHistory([]);
     localStorage.removeItem('sim_history');
  };

  return (
    <div className="relative w-full h-screen bg-gray-900">
      
      {/* 3D Scene */}
      <Canvas camera={{ position: [0, 50, 40], fov: 50 }} shadows>
        <color attach="background" args={['#111827']} />
        <SimulationWorld 
          isRunning={isRunning} 
          params={params} 
          onStatsUpdate={setStats}
          resetTrigger={resetTrigger}
        />
      </Canvas>

      {/* UI Overlay */}
      <Controls 
        isRunning={isRunning}
        onTogglePlay={togglePlay}
        onStop={stopSimulation}
        params={params}
        stats={stats}
        onParamChange={handleParamChange}
        onShowHistory={() => setShowHistory(true)}
      />

      <StatsPanel stats={stats} />

      <ResultModal 
        isOpen={showResults} 
        onClose={closeResults}
        stats={stats}
        params={params}
        onSave={saveToHistory}
      />

      <HistoryModal 
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        history={history}
        onClearHistory={clearHistory}
      />

    </div>
  );
};

export default App;