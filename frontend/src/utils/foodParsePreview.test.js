import {
  normalizeParsedFoodForPreview,
  mergeApiFoodWithPrevious,
  buildFoodLayerFromParse
} from './foodParsePreview';

const fields = [
  { key: 'serving_size', type: 'number', step: '0.01' },
  { key: 'cost', type: 'number', step: '0.01' },
  { key: 'food_group', type: 'select', options: ['fruit', 'vegetable', 'grain', 'protein', 'dairy', 'other'] },
  { key: 'brand', type: 'text' }
];

describe('normalizeParsedFoodForPreview', () => {
  it('fills missing cost with 0', () => {
    const out = normalizeParsedFoodForPreview({}, fields);
    expect(out.cost).toBe(0);
  });

  it('coerces numeric strings from API', () => {
    const out = normalizeParsedFoodForPreview({ cost: '12.50' }, fields);
    expect(out.cost).toBe(12.5);
  });
});

describe('buildFoodLayerFromParse', () => {
  it('overlays parse metadata onto food when values are valid', () => {
    const out = buildFoodLayerFromParse(
      {
        food: { food_name: 'Sandwich', cost: 0 },
        metadata: { brand: 'DeliCo', cost: 3.5 }
      },
      fields
    );
    expect(out.brand).toBe('DeliCo');
    expect(out.cost).toBe(3.5);
    expect(out.food_name).toBe('Sandwich');
  });

  it('ignores invalid metadata cost', () => {
    const out = buildFoodLayerFromParse(
      {
        food: { cost: 2 },
        metadata: { cost: 'nope' }
      },
      fields
    );
    expect(out.cost).toBe(2);
  });
});

describe('mergeApiFoodWithPrevious', () => {
  it('keeps user cost when API omits cost', () => {
    const out = mergeApiFoodWithPrevious(
      { food_name: 'Egg', calories: 70 },
      { cost: 2.5, brand: 'A' },
      fields
    );
    expect(out.cost).toBe(2.5);
    expect(out.brand).toBe('A');
  });

  it('applies new API cost when provided', () => {
    const out = mergeApiFoodWithPrevious(
      { cost: 3 },
      { cost: 1 },
      fields
    );
    expect(out.cost).toBe(3);
  });

  it('treats API cost 0 as unset and keeps previous cost', () => {
    const out = mergeApiFoodWithPrevious({ cost: 0, food_name: 'X' }, { cost: 4.5 }, fields);
    expect(out.cost).toBe(4.5);
  });

  it('keeps previous food_group when API sends invalid option', () => {
    const out = mergeApiFoodWithPrevious(
      { food_group: 'bogus' },
      { food_group: 'dairy' },
      fields
    );
    expect(out.food_group).toBe('dairy');
  });
});
