const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:3001', 'http://127.0.0.1:3001'];

export const getAllowedOrigins = () => {
  const configured = (process.env.ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS.join(','))
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  return configured.length ? configured : DEFAULT_ALLOWED_ORIGINS;
};

export const isAllowedOrigin = (origin: string | undefined) =>
  !origin || getAllowedOrigins().includes(origin);
