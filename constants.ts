import { GroupType } from './types';

// Visual Dimensions
export const WORLD_WIDTH = 60;
export const WORLD_HEIGHT = 40;
export const BORDER_X = 0; // The vertical line x-coordinate

export const OUTSIDE_MIN_X = -30;
export const OUTSIDE_MAX_X = -0.5;
export const INSIDE_MIN_X = 0.5;
export const INSIDE_MAX_X = 30;

export const Z_MIN = -20;
export const Z_MAX = 20;

// Colors
export const COLORS = {
  [GroupType.NATIVE]: '#FFFF00', // Bright Neon Yellow
  [GroupType.LEGAL_IMMIGRANT]: '#00FF00', // Bright Neon Green
  [GroupType.ILLEGAL_IMMIGRANT]: '#FF0000', // Bright Red
  [GroupType.OUTSIDER]: '#990000', // Deep Red (Distinct from bright red inside)
  BORDER: '#FFFFFF',
  GROUND: '#1F2937'
};

// Simulation Constants
export const AGENT_SIZE = 0.12; // Reduced by factor 5 (was 0.6)
export const MAX_POPULATION_CAP = 10000; // Increased to 10k
export const MOVE_SPEED = 5;

// Default Params
export const DEFAULT_PARAMS = {
  timeSpeed: 1.0,
  legalAcceptanceRate: 30,
  illegalSuccessRate: 10,
  tfrNative: 1.5,   // Approx 1.5 children per couple
  tfrLegal: 2.1,    // Replacement rate
  tfrIllegal: 3.0,  // Higher rate
  initialNatives: 100,
  initialOutsiders: 100
};