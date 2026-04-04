import {
  WORKOUT_LOG_ATTRIBUTE_KEYS,
  canonicalWorkoutLogAttributesForDisplay,
  labelForWorkoutLogAttributeKey,
  normalizeWorkoutLogAttributeKey,
  sanitizeWorkoutLogAttributesForApi,
} from './workoutLoggingAttributes';

describe('workoutLoggingAttributes', () => {
  test('canonical keys set matches modal options', () => {
    expect(WORKOUT_LOG_ATTRIBUTE_KEYS.has('drop_set')).toBe(true);
    expect(WORKOUT_LOG_ATTRIBUTE_KEYS.has('rest_pause')).toBe(true);
    expect(WORKOUT_LOG_ATTRIBUTE_KEYS.size).toBe(5);
  });

  test('normalize hides tempo intent intensity', () => {
    expect(normalizeWorkoutLogAttributeKey('tempo')).toBe(null);
    expect(normalizeWorkoutLogAttributeKey('intent')).toBe(null);
    expect(normalizeWorkoutLogAttributeKey('intensity')).toBe(null);
  });

  test('normalize maps legacy dropset', () => {
    expect(normalizeWorkoutLogAttributeKey('dropset')).toBe('drop_set');
  });

  test('canonicalWorkoutLogAttributesForDisplay dedupes and orders by first occurrence', () => {
    expect(
      canonicalWorkoutLogAttributesForDisplay(['partials', 'dropset', 'partials', 'tempo'])
    ).toEqual(['partials', 'drop_set']);
  });

  test('labelForWorkoutLogAttributeKey', () => {
    expect(labelForWorkoutLogAttributeKey('drop_set')).toBe('Drop Set');
  });

  test('sanitizeWorkoutLogAttributesForApi filters keys and input prefixes', () => {
    const { attributes, attribute_inputs } = sanitizeWorkoutLogAttributesForApi(
      ['drop_set', 'tempo', 'negatives'],
      {
        drop_set_weight: '50',
        drop_set_reps: '8',
        negatives_reps: '3',
        tempo_foo: 'x',
      }
    );
    expect(attributes).toEqual(['drop_set', 'negatives']);
    expect(attribute_inputs).toEqual({
      drop_set_weight: '50',
      drop_set_reps: '8',
      negatives_reps: '3',
    });
  });
});
