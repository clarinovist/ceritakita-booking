
// Native fetch is available in Node 18+

async function verify() {
    const baseUrl = 'http://localhost:3000'; // Adjust port if needed
    // Test with a wide date range to ensure data
    const start = '2024-01-01';
    const end = '2025-12-31';

    try {
        console.log(`Fetching from ${baseUrl}/api/analytics/leads?start=${start}&end=${end}...`);
        const res = await fetch(`${baseUrl}/api/analytics/leads?start=${start}&end=${end}`);

        if (!res.ok) {
            // If 404, it might mean the route doesn't exist yet, which is expected in the first run
            if (res.status === 404) {
                console.log('✅ Verified: Route does not exist yet (Expected failure for TDD)');
                process.exit(1); // Exit with error to confirm "Test Failed" as expected
            }
            throw new Error(`API failed: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        console.log('API Response:', JSON.stringify(data, null, 2));

        // Validate structure
        if (typeof data.total_leads !== 'number') throw new Error('Missing total_leads');
        if (typeof data.total_won !== 'number') throw new Error('Missing total_won');
        if (typeof data.conversion_rate !== 'number') throw new Error('Missing conversion_rate');
        if (!Array.isArray(data.by_agent)) throw new Error('Missing by_agent array');

        console.log('✅ API Structure Verified');
    } catch (err) {
        console.error('❌ Verification Failed:', err);
        process.exit(1);
    }
}

verify();
