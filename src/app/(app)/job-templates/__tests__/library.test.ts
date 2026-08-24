import {
  LIBRARY_FILTERS,
  TemplateRow,
  advertsProduced,
  busiest,
  byAdvertsProduced,
  countLibrary,
  filterCount,
  hasUsageData,
  stateOf,
} from '../library';

function template(overrides: Partial<TemplateRow> = {}): TemplateRow {
  return { id: 't1', name: 'Investment Analyst', usageCount: 0, ...overrides };
}

describe('stateOf', () => {
  it('separates a template doing work from one that has never been drawn on', () => {
    expect(stateOf(template({ usageCount: 31 }))).toBe('in-use');
    expect(stateOf(template({ usageCount: 0 }))).toBe('never-used');
  });

  it('reports an archived template as archived whatever its history', () => {
    expect(stateOf(template({ usageCount: 31, isArchived: true }))).toBe('archived');
  });
});

describe('advertsProduced', () => {
  it('reports zero as zero', () => {
    expect(advertsProduced(template({ usageCount: 0 }))).toBe(0);
  });

  it('is null when the field is absent, not zero', () => {
    // "Never used" is a claim about the template. It should not rest on a missing field.
    expect(advertsProduced(template({ usageCount: undefined }))).toBeNull();
  });
});

describe('byAdvertsProduced', () => {
  it('ranks the templates doing most work first', () => {
    const rows = [
      template({ id: 'b', name: 'ICT', usageCount: 19 }),
      template({ id: 'a', name: 'Investment', usageCount: 31 }),
      template({ id: 'c', name: 'Graduate', usageCount: 13 }),
    ];
    expect(byAdvertsProduced(rows).map((r) => r.id)).toEqual(['a', 'b', 'c']);
  });

  it('breaks a tie by name so the order is stable between loads', () => {
    const rows = [
      template({ id: 'z', name: 'Zeta', usageCount: 5 }),
      template({ id: 'a', name: 'Alpha', usageCount: 5 }),
    ];
    expect(byAdvertsProduced(rows).map((r) => r.id)).toEqual(['a', 'z']);
  });

  it('sorts a template with no count last, not first', () => {
    const rows = [
      template({ id: 'unknown', usageCount: undefined }),
      template({ id: 'known', usageCount: 1 }),
    ];
    expect(byAdvertsProduced(rows).map((r) => r.id)).toEqual(['known', 'unknown']);
  });

  it('does not mutate the array it was given', () => {
    const rows = [template({ id: 'b', usageCount: 1 }), template({ id: 'a', usageCount: 9 })];
    byAdvertsProduced(rows);
    expect(rows.map((r) => r.id)).toEqual(['b', 'a']);
  });
});

describe('busiest', () => {
  it('names the template carrying most of the output', () => {
    const rows = [
      template({ id: 'a', usageCount: 31 }),
      template({ id: 'b', usageCount: 19 }),
    ];
    expect(busiest(rows)?.id).toBe('a');
  });

  it('is null when nothing has produced anything', () => {
    expect(busiest([template({ id: 'a' }), template({ id: 'b' })])).toBeNull();
  });

  it('is null for a library of one — "most used" of one is not a finding', () => {
    expect(busiest([template({ id: 'a', usageCount: 31 })])).toBeNull();
  });

  it('ignores archived templates when picking the busiest', () => {
    const rows = [
      template({ id: 'archived', usageCount: 99, isArchived: true }),
      template({ id: 'live', usageCount: 31 }),
      template({ id: 'other', usageCount: 2 }),
    ];
    expect(busiest(rows)?.id).toBe('live');
  });
});

describe('countLibrary', () => {
  it('counts each state and totals the adverts generated', () => {
    const counts = countLibrary([
      template({ id: 'a', usageCount: 31 }),
      template({ id: 'b', usageCount: 19 }),
      template({ id: 'c', usageCount: 0 }),
      template({ id: 'd', usageCount: 5, isArchived: true }),
    ]);

    expect(counts.total).toBe(4);
    expect(counts.inUse).toBe(2);
    expect(counts.neverUsed).toBe(1);
    expect(counts.archived).toBe(1);
    // Archived templates still produced adverts; the total is of the library's output.
    expect(counts.advertsGenerated).toBe(55);
  });

  it('handles an empty library without inventing figures', () => {
    const counts = countLibrary([]);
    expect(counts).toEqual({
      total: 0,
      inUse: 0,
      neverUsed: 0,
      archived: 0,
      advertsGenerated: 0,
    });
  });
});

describe('filterCount', () => {
  const counts = countLibrary([
    template({ id: 'a', usageCount: 31 }),
    template({ id: 'b', usageCount: 0 }),
    template({ id: 'c', usageCount: 0, isArchived: true }),
  ]);

  it('counts each chip off the library', () => {
    expect(filterCount(counts, 'all')).toBe(3);
    expect(filterCount(counts, 'active')).toBe(1);
    expect(filterCount(counts, 'never-used')).toBe(1);
    expect(filterCount(counts, 'archived')).toBe(1);
  });

  it('is null without counts, never zero', () => {
    expect(filterCount(null, 'active')).toBeNull();
  });

  it('covers every chip', () => {
    LIBRARY_FILTERS.forEach((filter) =>
      expect(filterCount(counts, filter.key)).not.toBeNull(),
    );
  });
});

describe('hasUsageData', () => {
  it('is false when every template reads zero', () => {
    // The demo seed sets usageCount: 0 for all five, so the column says nothing there. Saying the
    // data is absent is true and distinguishable from a library nobody has drawn on.
    expect(hasUsageData([template({ id: 'a' }), template({ id: 'b' })])).toBe(false);
  });

  it('is true as soon as one template has produced something', () => {
    expect(hasUsageData([template({ id: 'a' }), template({ id: 'b', usageCount: 3 })])).toBe(true);
  });
});
