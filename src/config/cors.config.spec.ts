/* eslint-disable sonarjs/no-clear-text-protocols -- CORS localhost origins intentionally use HTTP in development. */
import { resolveCorsOrigins } from './cors.config';

describe('resolveCorsOrigins', () => {
  it('uses the explicit comma-separated allowlist', () => {
    expect(resolveCorsOrigins('http://localhost:5173, http://localhost:5174')).toEqual([
      'http://localhost:5173',
      'http://localhost:5174',
    ]);
  });

  it('removes empty and duplicate origins', () => {
    expect(resolveCorsOrigins('http://localhost:5174, ,http://localhost:5174')).toEqual(['http://localhost:5174']);
  });

  it('falls back to the frontend redirect URL', () => {
    expect(resolveCorsOrigins(undefined, 'http://localhost:5174')).toEqual(['http://localhost:5174']);
  });

  it('uses the default Vite origin when nothing is configured', () => {
    expect(resolveCorsOrigins()).toEqual(['http://localhost:5173']);
  });
});
