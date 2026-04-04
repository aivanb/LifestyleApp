/**
 * Canonical workout log "attributes" (set modifiers).
 *
 * These are the only attribute keys the logging modal (`WorkoutLogger` /
 * `.workout-logging-modal` → `.workout-logging-attributes`) may offer and the
 * only ones the workout dashboard should surface per logged set.
 *
 * Stored on each log as `attributes: string[]` and optional `attribute_inputs`
 * with keys `${attributeKey}_${inputKey}` (e.g. `drop_set_weight`).
 *
 * Do not reintroduce tempo / intent / intensity as log attributes; legacy rows
 * may still exist in the database but the UI filters them out.
 */

export const WORKOUT_LOG_ATTRIBUTE_OPTIONS = [
  {
    key: 'drop_set',
    label: 'Drop Set',
    description: 'Reducing weight and continuing the set without rest',
    inputs: [
      { key: 'weight', label: 'Weight (lbs)', type: 'number', placeholder: 'Weight' },
      { key: 'reps', label: 'Reps', type: 'number', placeholder: 'Reps' },
    ],
  },
  {
    key: 'partials',
    label: 'Partials',
    description: 'Performing partial range of motion repetitions',
    inputs: [{ key: 'reps', label: 'Reps', type: 'number', placeholder: 'Reps' }],
  },
  {
    key: 'assisted_sets',
    label: 'Assisted Sets',
    description: 'Using assistance to complete additional repetitions',
    inputs: [{ key: 'reps', label: 'Reps', type: 'number', placeholder: 'Reps' }],
  },
  {
    key: 'negatives',
    label: 'Negatives',
    description: 'Focusing on the eccentric (lowering) portion of the movement',
    inputs: [{ key: 'reps', label: 'Reps', type: 'number', placeholder: 'Reps' }],
  },
  {
    key: 'rest_pause',
    label: 'Rest Pause',
    description: 'Brief rest within a set to continue with additional reps',
    inputs: [
      { key: 'rest_time', label: 'Rest Time (sec)', type: 'number', placeholder: 'Rest time' },
      { key: 'reps', label: 'Reps', type: 'number', placeholder: 'Reps' },
    ],
  },
];

export const WORKOUT_LOG_ATTRIBUTE_KEYS = new Set(
  WORKOUT_LOG_ATTRIBUTE_OPTIONS.map((o) => o.key)
);

/** Legacy API / client keys mapped to the canonical key for display and sanitization. */
export const WORKOUT_LOG_ATTRIBUTE_LEGACY_TO_CANONICAL = {
  dropset: 'drop_set',
  drop_sets: 'drop_set',
};

const LABEL_BY_KEY = Object.fromEntries(
  WORKOUT_LOG_ATTRIBUTE_OPTIONS.map((o) => [o.key, o.label])
);

const HIDDEN_LEGACY_KEYS = new Set(['tempo', 'intent', 'intensity']);

/**
 * Normalize a stored attribute key to the canonical key, or null if it should not be shown.
 * @param {string} rawKey
 * @returns {string|null}
 */
export function normalizeWorkoutLogAttributeKey(rawKey) {
  if (rawKey == null || typeof rawKey !== 'string') return null;
  const k = rawKey.trim();
  if (!k) return null;
  const lower = k.toLowerCase();
  if (HIDDEN_LEGACY_KEYS.has(lower)) return null;
  if (WORKOUT_LOG_ATTRIBUTE_KEYS.has(k)) return k;
  if (WORKOUT_LOG_ATTRIBUTE_KEYS.has(lower)) return lower;
  const mapped = WORKOUT_LOG_ATTRIBUTE_LEGACY_TO_CANONICAL[lower];
  if (mapped && WORKOUT_LOG_ATTRIBUTE_KEYS.has(mapped)) return mapped;
  return null;
}

/**
 * Deduplicated canonical keys in dashboard order (modal order).
 * @param {string[]|null|undefined} attributes
 * @returns {string[]}
 */
export function canonicalWorkoutLogAttributesForDisplay(attributes) {
  if (!Array.isArray(attributes) || !attributes.length) return [];
  const seen = new Set();
  const out = [];
  for (const raw of attributes) {
    const c = normalizeWorkoutLogAttributeKey(raw);
    if (!c || seen.has(c)) continue;
    seen.add(c);
    out.push(c);
  }
  return out;
}

export function labelForWorkoutLogAttributeKey(canonicalKey) {
  return LABEL_BY_KEY[canonicalKey] || canonicalKey.replace(/_/g, ' ');
}

/**
 * Build API-safe `attributes` and `attribute_inputs` from form state.
 * @param {string[]} attributes
 * @param {Record<string, string>} attributeInputs
 * @returns {{ attributes: string[], attribute_inputs: Record<string, string> }}
 */
export function sanitizeWorkoutLogAttributesForApi(attributes, attributeInputs) {
  const raw = Array.isArray(attributes) ? attributes : [];
  const inputs = attributeInputs && typeof attributeInputs === 'object' ? attributeInputs : {};
  const canonicalList = canonicalWorkoutLogAttributesForDisplay(raw);
  const attribute_inputs = {};
  for (const key of canonicalList) {
    const prefix = `${key}_`;
    for (const [ik, iv] of Object.entries(inputs)) {
      if (ik.startsWith(prefix)) attribute_inputs[ik] = iv;
    }
  }
  return { attributes: canonicalList, attribute_inputs };
}
