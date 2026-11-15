export interface PokreniKampanjuDto {
  type: 'STRESS_AUDIO_CDN' | 'NUTRI_FLOW_ALIGNMENT' | 'HYDRO_ALERT';
  cohort: 'Engineering' | 'Marketing' | 'Sales' | 'All';
}

export interface OsveziSedistaDto {
  seatQuantity: number;
}
