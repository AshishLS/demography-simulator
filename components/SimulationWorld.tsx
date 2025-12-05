import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Agent, GroupType, SimulationParams, SimulationStats } from '../types';
import { 
  COLORS, 
  WORLD_WIDTH, 
  WORLD_HEIGHT, 
  BORDER_X, 
  OUTSIDE_MIN_X, 
  OUTSIDE_MAX_X, 
  INSIDE_MIN_X, 
  INSIDE_MAX_X, 
  Z_MIN, 
  Z_MAX,
  AGENT_SIZE,
  MAX_POPULATION_CAP,
  MOVE_SPEED
} from '../constants';

interface SimulationWorldProps {
  isRunning: boolean;
  params: SimulationParams;
  onStatsUpdate: (stats: SimulationStats) => void;
  resetTrigger: number;
}

const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();

// Helper to create a new agent
const createAgent = (id: number, isInside: boolean, startScale = 0): Agent => {
  const group = isInside ? GroupType.NATIVE : GroupType.OUTSIDER;
  const minX = isInside ? INSIDE_MIN_X : OUTSIDE_MIN_X;
  const maxX = isInside ? INSIDE_MAX_X : OUTSIDE_MAX_X;
  
  // Skewed random for lifespan, median roughly 78
  const lifespan = Math.min(100, Math.max(1, 78 + (Math.random() - 0.5) * 30));

  return {
    id: id,
    x: Math.random() * (maxX - minX) + minX,
    z: Math.random() * (Z_MAX - Z_MIN) + Z_MIN,
    vx: (Math.random() - 0.5) * MOVE_SPEED,
    vz: (Math.random() - 0.5) * MOVE_SPEED,
    group,
    age: Math.random() * 40, // Start with mixed ages
    lifespan,
    color: COLORS[group],
    scale: startScale, // Start small if animated
    dying: false
  };
};

export const SimulationWorld: React.FC<SimulationWorldProps> = ({ isRunning, params, onStatsUpdate, resetTrigger }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // We use a ref for agents to avoid React re-renders on every frame
  const agentsRef = useRef<Agent[]>([]);
  const timeRef = useRef<number>(0);
  const nextIdRef = useRef<number>(1);
  const minorityYearRef = useRef<number | null>(null);
  
  // Timer for throttling stats updates to UI
  const statsTimerRef = useRef<number>(0);

  // Initialize Agents
  const initSimulation = () => {
    const newAgents: Agent[] = [];
    nextIdRef.current = 1;
    timeRef.current = 0;
    minorityYearRef.current = null;

    for (let i = 0; i < params.initialNatives; i++) {
      // Initial agents start at full scale (1) to avoid massive pop-in on reset
      newAgents.push(createAgent(nextIdRef.current++, true, 1));
    }
    for (let i = 0; i < params.initialOutsiders; i++) {
      newAgents.push(createAgent(nextIdRef.current++, false, 1));
    }

    agentsRef.current = newAgents;
    updateStats(true); // Force initial update
  };

  // Helper to generate stats
  const updateStats = (force = false) => {
    const agents = agentsRef.current;
    // Count only living (non-dying) agents for accurate stats
    const activeAgents = agents.filter(a => !a.dying);
    const insideAgents = activeAgents.filter(a => a.group !== GroupType.OUTSIDER);
    const totalInside = insideAgents.length;
    
    if (totalInside === 0 && !force) return;

    const counts = {
      [GroupType.NATIVE]: 0,
      [GroupType.LEGAL_IMMIGRANT]: 0,
      [GroupType.ILLEGAL_IMMIGRANT]: 0,
      [GroupType.OUTSIDER]: 0
    };

    activeAgents.forEach(a => counts[a.group]++);

    const percentNative = totalInside > 0 ? (counts[GroupType.NATIVE] / totalInside) * 100 : 0;
    
    // Check for minority status
    if (totalInside > 0 && percentNative < 50 && minorityYearRef.current === null) {
      minorityYearRef.current = Math.floor(timeRef.current);
    }

    const stats: SimulationStats = {
      yearsPassed: Math.floor(timeRef.current),
      totalInside,
      countNative: counts[GroupType.NATIVE],
      countLegal: counts[GroupType.LEGAL_IMMIGRANT],
      countIllegal: counts[GroupType.ILLEGAL_IMMIGRANT],
      countOutsider: counts[GroupType.OUTSIDER],
      percentNative: percentNative,
      percentLegal: totalInside > 0 ? (counts[GroupType.LEGAL_IMMIGRANT] / totalInside) * 100 : 0,
      percentIllegal: totalInside > 0 ? (counts[GroupType.ILLEGAL_IMMIGRANT] / totalInside) * 100 : 0,
      minorityYear: minorityYearRef.current
    };
    onStatsUpdate(stats);
  };

  // Reset when trigger changes
  useEffect(() => {
    initSimulation();
  }, [resetTrigger]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // UI Throttling
    statsTimerRef.current += delta;
    const shouldUpdateStats = statsTimerRef.current > 0.2; // Update UI every 200ms
    if (shouldUpdateStats) statsTimerRef.current = 0;

    if (!isRunning) {
      // Even if paused, we render the static agents
      const agents = agentsRef.current;
      agents.forEach((agent, i) => {
        tempObject.position.set(agent.x, AGENT_SIZE/2, agent.z);
        tempObject.scale.set(agent.scale, agent.scale, agent.scale); // Apply scale
        tempObject.updateMatrix();
        meshRef.current!.setMatrixAt(i, tempObject.matrix);
        tempColor.set(agent.color);
        meshRef.current!.setColorAt(i, tempColor);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
      if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
      return;
    }

    // --- SIMULATION LOGIC ---

    const yearsPassedThisFrame = delta * params.timeSpeed;
    timeRef.current += yearsPassedThisFrame;

    let agents = agentsRef.current;
    const currentPopulation = agents.length;
    const newAgents: Agent[] = [];

    // TFR Calculation: Probability of birth per year
    // TFR is children per couple over ~30 reproductive years.
    // P(Birth per person per year) = TFR / 2 / 30
    const REPRODUCTIVE_YEARS = 30;
    const pBirthNative = (params.tfrNative / 2 / REPRODUCTIVE_YEARS) * yearsPassedThisFrame;
    const pBirthLegal = (params.tfrLegal / 2 / REPRODUCTIVE_YEARS) * yearsPassedThisFrame;
    const pBirthIllegal = (params.tfrIllegal / 2 / REPRODUCTIVE_YEARS) * yearsPassedThisFrame;

    // Immigration Probability Logic
    // Sliders represent "Annual Probability of Entry" per outsider.
    // We scale this to the current frame's time step.
    const pLegalEntry = (params.legalAcceptanceRate / 100) * yearsPassedThisFrame;
    const pIllegalEntry = (params.illegalSuccessRate / 100) * yearsPassedThisFrame;
    
    const animationSpeed = 2.0 * delta; // Animation speed relative to real time

    // Update existing agents
    const nextAgents: Agent[] = [];
    
    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];

      // 0. Animation Logic (Scale)
      if (agent.dying) {
        agent.scale -= animationSpeed;
        if (agent.scale <= 0) {
          continue; // Remove from nextAgents (Despawn)
        }
      } else if (agent.scale < 1) {
        agent.scale += animationSpeed;
        if (agent.scale > 1) agent.scale = 1;
      }

      // 1. Movement
      let nx = agent.x + agent.vx * delta;
      let nz = agent.z + agent.vz * delta;

      // Boundaries
      const isOutsider = agent.group === GroupType.OUTSIDER;
      const minX = isOutsider ? OUTSIDE_MIN_X : INSIDE_MIN_X;
      const maxX = isOutsider ? OUTSIDE_MAX_X : INSIDE_MAX_X;

      if (nx < minX || nx > maxX) {
        agent.vx *= -1;
        nx = Math.max(minX, Math.min(maxX, nx));
      }
      if (nz < Z_MIN || nz > Z_MAX) {
        agent.vz *= -1;
        nz = Math.max(Z_MIN, Math.min(Z_MAX, nz));
      }

      agent.x = nx;
      agent.z = nz;

      // 2. Aging & Death
      if (!agent.dying) {
        agent.age += yearsPassedThisFrame;
        if (agent.age >= agent.lifespan) {
          agent.dying = true; // Start dying animation
        }
      }

      // 3. Births (Only for living adults inside)
      if (!agent.dying && currentPopulation + newAgents.length < MAX_POPULATION_CAP && agent.age > 18 && agent.age < 50) {
        let birthChance = 0;
        if (agent.group === GroupType.NATIVE) birthChance = pBirthNative;
        else if (agent.group === GroupType.LEGAL_IMMIGRANT) birthChance = pBirthLegal;
        else if (agent.group === GroupType.ILLEGAL_IMMIGRANT) birthChance = pBirthIllegal;

        if (Math.random() < birthChance) {
          newAgents.push({
            id: nextIdRef.current++,
            x: agent.x,
            z: agent.z,
            vx: (Math.random() - 0.5) * MOVE_SPEED,
            vz: (Math.random() - 0.5) * MOVE_SPEED,
            group: agent.group,
            age: 0,
            lifespan: Math.min(100, Math.max(1, 78 + (Math.random() - 0.5) * 30)),
            color: COLORS[agent.group],
            scale: 0, // Animate in
            dying: false
          });
        }
      }

      // 4. Immigration Logic (Only for Outsiders)
      if (!agent.dying && isOutsider) {
         // Attempt Legal First
         if (Math.random() < pLegalEntry) {
            agent.group = GroupType.LEGAL_IMMIGRANT;
            agent.color = COLORS[GroupType.LEGAL_IMMIGRANT];
            agent.x = INSIDE_MIN_X + 1; // Move inside
         } 
         // If failed legal (or didn't try), try Illegal
         else if (Math.random() < pIllegalEntry) {
            agent.group = GroupType.ILLEGAL_IMMIGRANT;
            agent.color = COLORS[GroupType.ILLEGAL_IMMIGRANT];
            agent.x = INSIDE_MIN_X + Math.random() * 5; // Move inside
         }
      }

      nextAgents.push(agent);
    }

    // Replenish Outsiders
    const activeOutsiders = nextAgents.filter(a => a.group === GroupType.OUTSIDER && !a.dying).length;
    const missingOutsiders = params.initialOutsiders - activeOutsiders;
    
    if (missingOutsiders > 0 && (nextAgents.length + newAgents.length) < MAX_POPULATION_CAP) {
       for (let i = 0; i < missingOutsiders; i++) {
         if ((nextAgents.length + newAgents.length) >= MAX_POPULATION_CAP) break;
         // Start scale 0 for animation
         newAgents.push(createAgent(nextIdRef.current++, false, 0));
       }
    }

    agentsRef.current = [...nextAgents, ...newAgents];

    // --- RENDERING ---
    
    agentsRef.current.forEach((agent, i) => {
       if (i >= MAX_POPULATION_CAP) return;
       tempObject.position.set(agent.x, AGENT_SIZE/2, agent.z);
       tempObject.scale.set(agent.scale, agent.scale, agent.scale); // Update scale for animation
       tempObject.updateMatrix();
       meshRef.current!.setMatrixAt(i, tempObject.matrix);
       
       tempColor.set(agent.color);
       meshRef.current!.setColorAt(i, tempColor);
    });

    // Hide unused instances
    for (let i = agentsRef.current.length; i < MAX_POPULATION_CAP; i++) {
       tempObject.position.set(0, -100, 0);
       tempObject.scale.set(0, 0, 0);
       tempObject.updateMatrix();
       meshRef.current!.setMatrixAt(i, tempObject.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;

    // Report stats
    if (shouldUpdateStats) {
      updateStats();
    }
  });

  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[WORLD_WIDTH + 10, WORLD_HEIGHT + 10]} />
        <meshStandardMaterial color={COLORS.GROUND} />
      </mesh>

      {/* Border Line */}
      <mesh position={[BORDER_X, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.2, WORLD_HEIGHT]} />
        <meshBasicMaterial color={COLORS.BORDER} />
      </mesh>

      {/* Agents */}
      <instancedMesh 
        ref={meshRef} 
        args={[undefined, undefined, MAX_POPULATION_CAP]}
        frustumCulled={false}
      >
        <boxGeometry args={[AGENT_SIZE, AGENT_SIZE, AGENT_SIZE]} />
        <meshStandardMaterial />
      </instancedMesh>

      {/* Lighting - Increased intensity for brighter colors */}
      <ambientLight intensity={0.9} />
      <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow />
    </group>
  );
};