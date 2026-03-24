/**
 * Utilities for normalizing OpenAI parse-food API payloads for the chatbot preview UI.
 */

function toValidNumber(val, fallback = 0) {
  if (val === null || val === undefined || val === '') return fallback;
  const n = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : fallback;
}

function coerceField(field, raw) {
  if (field.type === 'number') {
    let n = toValidNumber(raw, 0);
    if (field.key === 'serving_size' && (!Number.isFinite(n) || n <= 0)) {
      n = 1;
    }
    return n;
  }
  if (field.type === 'select') {
    const opts = field.options || [];
    const v = raw == null || raw === '' ? null : String(raw);
    if (v && opts.includes(v)) return v;
    return opts[0] ?? '';
  }
  if (raw === undefined || raw === null) return '';
  return String(raw);
}

function defaultForField(field) {
  if (field.type === 'number') {
    if (field.key === 'serving_size') return 1;
    return 0;
  }
  if (field.type === 'select') return field.options?.[0] ?? '';
  return '';
}

function apiValuePresent(field, raw) {
  if (raw === undefined || raw === null) return false;
  if (raw === '') return false;
  if (field.type === 'number') {
    const n = toValidNumber(raw, NaN);
    return Number.isFinite(n);
  }
  if (field.type === 'select') {
    const opts = field.options || [];
    return opts.includes(String(raw));
  }
  return true;
}

/**
 * Merge DB/API `food` with parse-step `metadata` (user-stated brand, price, etc.).
 * Parse metadata wins for keys that are present and valid.
 */
export function buildFoodLayerFromParse(parsedItem, metadataFields) {
  const food = parsedItem?.food && typeof parsedItem.food === 'object' ? { ...parsedItem.food } : {};
  const meta = parsedItem?.metadata && typeof parsedItem.metadata === 'object' ? parsedItem.metadata : {};
  metadataFields.forEach((field) => {
    const k = field.key;
    if (!Object.prototype.hasOwnProperty.call(meta, k)) return;
    if (apiValuePresent(field, meta[k])) {
      food[k] = meta[k];
    }
  });
  return food;
}

/**
 * Merge a new API `food` object with the user's previous preview row.
 * - API values win when they are present (non-empty / valid).
 * - When the API omits or invalidates a field, keep the previous preview value.
 * - When neither has a value, apply schema defaults.
 */
export function mergeApiFoodWithPrevious(apiFood, previousFood, metadataFields) {
  const api = apiFood && typeof apiFood === 'object' ? { ...apiFood } : {};
  const prev = previousFood && typeof previousFood === 'object' ? { ...previousFood } : {};
  const merged = {};

  metadataFields.forEach((field) => {
    const key = field.key;
    const incoming = api[key];
    // API often sends cost: 0 as placeholder; prefer previous / metadata layer instead
    const skipIncoming =
      key === 'cost' &&
      field.type === 'number' &&
      apiValuePresent(field, incoming) &&
      Number(toValidNumber(incoming, NaN)) === 0;
    if (apiValuePresent(field, incoming) && !skipIncoming) {
      merged[key] = coerceField(field, incoming);
      return;
    }
    const kept = prev[key];
    if (kept !== undefined && kept !== null && kept !== '') {
      merged[key] = coerceField(field, kept);
      return;
    }
    merged[key] = defaultForField(field);
  });

  merged.food_id = api.food_id ?? prev.food_id;
  merged.food_name = api.food_name ?? prev.food_name;

  return merged;
}

/** First-time parse: same as merge with no previous row. */
export function normalizeParsedFoodForPreview(food, metadataFields) {
  return mergeApiFoodWithPrevious(food, {}, metadataFields);
}
