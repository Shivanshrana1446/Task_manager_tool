const UNIT_MS = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

const parseDurationMs = (value) => {
  const match = /^(\d+)([smhd])$/.exec(String(value).trim());
  if (!match) return 15 * 60 * 1000;

  const [, amount, unit] = match;
  return Number(amount) * UNIT_MS[unit];
};

module.exports = parseDurationMs;
