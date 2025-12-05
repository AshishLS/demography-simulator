export enum GroupType {
  NATIVE = 'Native',
  LEGAL_IMMIGRANT = 'Legal Immigrant',
  ILLEGAL_IMMIGRANT = 'Illegal Immigrant',
  OUTSIDER = 'Outsider'
}

export interface Agent {
  id: number;
  x: number;
  z: number;
  vx: number;
  vz: number;
  group: GroupType;
  age: number;
  lifespan: number;
  color: string;
  // Animation props
  scale: number;
  dying: boolean;
}

export interface SimulationParams {
  timeSpeed: number; // Simulated years per real second
  legalAcceptanceRate: number; // 0-100%
  illegalSuccessRate: number; // 0-100%
  tfrNative: number; // Total Fertility Rate (Births per couple per lifespan)
  tfrLegal: number; // Total Fertility Rate
  tfrIllegal: number; // Total Fertility Rate
  initialNatives: number;
  initialOutsiders: number; // Target number of outsiders to maintain
}

export interface SimulationStats {
  yearsPassed: number;
  totalInside: number;
  countNative: number;
  countLegal: number;
  countIllegal: number;
  countOutsider: number;
  percentNative: number;
  percentLegal: number;
  percentIllegal: number;
  minorityYear: number | null; // Year when natives became minority (<50%), null if never
}

export interface HistoryEntry {
  id: string;
  date: string;
  stats: SimulationStats;
  params: SimulationParams;
}