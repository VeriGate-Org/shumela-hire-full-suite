import { displayActor, isOpaqueId, shortRef } from '../identity';

describe('isOpaqueId', () => {
  it('recognises a dashed UUID', () => {
    expect(isOpaqueId('756ed04a-2854-4d2a-b304-c41b71aef220')).toBe(true);
  });

  it('recognises a bare 32-char hex id', () => {
    expect(isOpaqueId('756ed04a28544d2ab304c41b71aef220')).toBe(true);
  });

  it('does not treat a person as an id', () => {
    expect(isOpaqueId('Yolanda Gaba')).toBe(false);
  });

  it('does not treat a human reference as an id', () => {
    expect(isOpaqueId('SR-IDC-2026-1004')).toBe(false);
  });

  it('is false for non-strings and blanks', () => {
    expect(isOpaqueId(undefined)).toBe(false);
    expect(isOpaqueId(null)).toBe(false);
    expect(isOpaqueId(42)).toBe(false);
    expect(isOpaqueId('')).toBe(false);
  });
});

describe('shortRef', () => {
  it('shortens a UUID to a quotable reference', () => {
    expect(shortRef('REQ', '87173b20-59d8-4c3e-9a11-e4d2c6f0a913')).toBe('REQ-87173B20');
  });

  it('is stable — the same id always yields the same reference', () => {
    const id = '87173b20-59d8-4c3e-9a11-e4d2c6f0a913';
    expect(shortRef('REQ', id)).toBe(shortRef('REQ', id));
  });

  it('leaves a reference the backend already assigned alone', () => {
    expect(shortRef('SR', 'SR-IDC-2026-1004')).toBe('SR-IDC-2026-1004');
  });

  it('prefixes a short non-UUID id', () => {
    expect(shortRef('REQ', '1042')).toBe('REQ-1042');
  });

  it('returns empty for nothing', () => {
    expect(shortRef('REQ', null)).toBe('');
    expect(shortRef('REQ', '')).toBe('');
  });
});

describe('displayActor', () => {
  it('passes a name straight through', () => {
    expect(displayActor('Yolanda Gaba')).toBe('Yolanda Gaba');
  });

  it('never renders a raw id', () => {
    expect(displayActor('756ed04a-2854-4d2a-b304-c41b71aef220')).toBe('—');
  });

  it('resolves an id when the caller has a directory', () => {
    const directory = new Map([['756ed04a-2854-4d2a-b304-c41b71aef220', 'Yolanda Gaba']]);
    expect(
      displayActor('756ed04a-2854-4d2a-b304-c41b71aef220', (id) => directory.get(id)),
    ).toBe('Yolanda Gaba');
  });

  it('falls back when the directory does not know the id', () => {
    expect(
      displayActor('756ed04a-2854-4d2a-b304-c41b71aef220', () => undefined, 'Not recorded'),
    ).toBe('Not recorded');
  });

  it('falls back when the directory returns whitespace', () => {
    expect(
      displayActor('756ed04a-2854-4d2a-b304-c41b71aef220', () => '   ', 'Not recorded'),
    ).toBe('Not recorded');
  });

  it('falls back on a missing value', () => {
    expect(displayActor(undefined, undefined, 'Unknown user')).toBe('Unknown user');
    expect(displayActor('', undefined, 'Unknown user')).toBe('Unknown user');
  });
});
