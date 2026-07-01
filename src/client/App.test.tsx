import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import App from './App';

beforeAll(() => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => [],
  });

  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.clearAllMocks();
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe('branding', () => {
  it('renders the main header with the brand name ZODOS', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { level: 1, name: /zodos/i }),
    ).toBeTruthy();
  });

  it('sets the page title in index.html to ZODOS', () => {
    const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');

    expect(html).toContain('<title>ZODOS</title>');
  });
});
