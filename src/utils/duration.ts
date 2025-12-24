/**
 * Parse a duration like "15m", "24h", "30d" into milliseconds.
 * Very small helper so we don't need an extra dependency.
 */
export function parseDurationToMs(input: string): number {
  const m = /^(\d+)\s*([smhd])$/i.exec(input.trim());
  if (!m) throw new Error(`Unsupported duration format: ${input}`);
  const value = Number(m[1]);
  const unit = m[2].toLowerCase();
  const mult =
    unit === "s"
      ? 1000
      : unit === "m"
        ? 60 * 1000
        : unit === "h"
          ? 60 * 60 * 1000
          : 24 * 60 * 60 * 1000;
  return value * mult;
}


