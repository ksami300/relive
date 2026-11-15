export interface User {
  id: number;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN' | 'ENTERPRISE_MANAGER';
}

export interface SubscriptionData {
  activeSeats: number;
  seatLimit: number;
  utilization: number;
  status: 'STABLE' | 'EXPANSION_REQUIRED' | 'PAST_DUE' | 'CANCELED';
}

export interface CorporateScorecard {
  healthScore: number;
  healthScoreDelta: number;
  engagementRate: number;
  hydrationScore: number;
  stressScore: number;
  trend: 'IMPROVING' | 'CRITICAL';
}

export interface WellnessIntervention {
  id: number;
  organizationId: number;
  type: 'STRESS_AUDIO_CDN' | 'NUTRI_FLOW_ALIGNMENT' | 'HYDRO_ALERT';
  cohort: 'Engineering' | 'Marketing' | 'Sales' | 'All';
  active: boolean;
  launchedAt: string;
}
