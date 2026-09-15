import 'server-only';
import { getDb } from '@/lib/db';

/** SQLite callbacks must be synchronous. IMMEDIATE serializes read-check-write use cases. */
export function inBookingTransaction<T>(work: () => T): T {
  return getDb().transaction(() => {
    const result = work();
    if (result instanceof Promise) throw new Error('SQLite transaction callbacks must be synchronous');
    return result;
  }).immediate();
}
