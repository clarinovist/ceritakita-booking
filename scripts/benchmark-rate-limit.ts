
import { performance } from 'perf_hooks';

const ITEM_COUNT = 1_000_000;
const EXPIRED_RATIO = 0.5; // 50% items expired

function createStore(count: number) {
  const store = new Map<string, { resetTime: number }>();
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const isExpired = Math.random() < EXPIRED_RATIO;
    store.set(`key-${i}`, {
      resetTime: isExpired ? now - 1000 : now + 10000
    });
  }
  return store;
}

function cleanupWithArrayFrom(store: Map<string, { resetTime: number }>) {
  const now = Date.now();
  const entries = Array.from(store.entries());
  for (const [key, data] of entries) {
    if (data.resetTime < now) {
      store.delete(key);
    }
  }
}

function cleanupWithDirectIteration(store: Map<string, { resetTime: number }>) {
  const now = Date.now();
  // @ts-ignore
  for (const [key, data] of store) {
    if (data.resetTime < now) {
      store.delete(key);
    }
  }
}

function cleanupWithForEach(store: Map<string, { resetTime: number }>) {
  const now = Date.now();
  store.forEach((data, key) => {
    if (data.resetTime < now) {
      store.delete(key);
    }
  });
}

function runBenchmark() {
  console.log(`Setting up benchmark with ${ITEM_COUNT} items...`);

  // Benchmark 1: Array.from
  global.gc?.();
  const store1 = createStore(ITEM_COUNT);
  const startTime1 = performance.now();

  cleanupWithArrayFrom(store1);

  const endTime1 = performance.now();
  const time1 = endTime1 - startTime1;

  console.log(`\nStrategy: Array.from(store.entries())`);
  console.log(`Time: ${time1.toFixed(2)}ms`);

  // Benchmark 2: Direct Iteration
  global.gc?.();
  const store2 = createStore(ITEM_COUNT);
  const startTime2 = performance.now();

  cleanupWithDirectIteration(store2);

  const endTime2 = performance.now();
  const time2 = endTime2 - startTime2;

  console.log(`\nStrategy: Direct Iteration (for..of store)`);
  console.log(`Time: ${time2.toFixed(2)}ms`);

  // Benchmark 3: forEach
  global.gc?.();
  const store3 = createStore(ITEM_COUNT);
  const startTime3 = performance.now();

  cleanupWithForEach(store3);

  const endTime3 = performance.now();
  const time3 = endTime3 - startTime3;

  console.log(`\nStrategy: forEach`);
  console.log(`Time: ${time3.toFixed(2)}ms`);
}

runBenchmark();
