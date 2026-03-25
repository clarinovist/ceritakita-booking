import { generateDailyReport } from './lib/report-generator';

async function test() {
  try {
    const data = await generateDailyReport();
    console.log("Date:", data.date);
    console.log("Metrics:", JSON.stringify(data.metrics, null, 2));
    
    // Check payments Received
    console.log("Payments Received:", data.paymentsReceived.length);
  } catch (error) {
    console.error("Test error:", error);
  }
}

test().catch(console.error);
