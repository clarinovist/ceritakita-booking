const http = require('http');

const URL = 'http://localhost:3000/api/homepage';
const WARMUP_ITERATIONS = 5;
const MEASURE_ITERATIONS = 20;

async function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const start = process.hrtime();
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const diff = process.hrtime(start);
        const timeInMs = (diff[0] * 1e9 + diff[1]) / 1e6;
        resolve(timeInMs);
      });
    });
    req.on('error', (err) => {
      reject(err);
    });
    req.end();
  });
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForServer(url, timeout = 30000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        try {
            await fetchUrl(url);
            console.log('Server is up!');
            return true;
        } catch (e) {
            console.log('Waiting for server...');
            await sleep(1000);
        }
    }
    throw new Error('Server did not start in time');
}

async function runBenchmark() {
    console.log(`Benchmarking ${URL}...`);

    try {
        await waitForServer(URL);
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }

    console.log('Warming up...');
    for (let i = 0; i < WARMUP_ITERATIONS; i++) {
        await fetchUrl(URL);
        process.stdout.write('.');
    }
    console.log('\nMeasuring...');

    const times = [];
    for (let i = 0; i < MEASURE_ITERATIONS; i++) {
        const time = await fetchUrl(URL);
        times.push(time);
        process.stdout.write('.');
    }
    console.log('\n');

    const sum = times.reduce((a, b) => a + b, 0);
    const avg = sum / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);

    console.log(`Results (${MEASURE_ITERATIONS} iterations):`);
    console.log(`Average: ${avg.toFixed(2)} ms`);
    console.log(`Min: ${min.toFixed(2)} ms`);
    console.log(`Max: ${max.toFixed(2)} ms`);
}

runBenchmark();
