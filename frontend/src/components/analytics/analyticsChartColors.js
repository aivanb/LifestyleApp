/**
 * Shared bright high-contrast palette for analytics charts.
 * Used across workout and food analytics for consistency and accessibility.
 */
export const ANALYTICS_COLORS = {
  primary: '#3B82F6',     // bright blue
  secondary: '#10B981',   // bright emerald
  tertiary: '#F59E0B',   // bright amber
  accent: '#F97316',     // bright red-orange (metric comparison, goal lines)
};

/** Palette for stacked/series charts: protein, fat, carbs, etc. (bright, high contrast) */
export const ANALYTICS_SERIES = [
  ANALYTICS_COLORS.primary,
  ANALYTICS_COLORS.secondary,
  ANALYTICS_COLORS.tertiary,
  ANALYTICS_COLORS.accent,
  '#8B5CF6',   // bright violet
  '#EC4899',   // bright pink
  '#14B8A6',   // bright teal
  '#EF4444',   // bright red
  '#6366F1',   // bright indigo
  '#84CC16',   // bright lime
];

export default ANALYTICS_COLORS;
