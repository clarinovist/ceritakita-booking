import Module from 'module';

// Mock 'server-only' to allow CLI script execution
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id) {
  if (id === 'server-only') {
    return {};
  }
  return originalRequire.apply(this, arguments as any);
};

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function runTests() {
  const { getDb } = await import('../lib/db');
  const {
    upsertContact,
    upsertConversation,
    insertMessageIdempotent,
    buildWhatsAppCustomerContext,
    saveConversationInsight,
    getLatestConversationInsight,
    saveAIDraft,
    getAIDraftById,
    logAIEvent
  } = await import('../lib/repositories/whatsapp');
  const { getAICompletion, isAIEnabled } = await import('../lib/services/whatsapp-ai-service');

  console.log('🚀 Starting WhatsApp Brain & AI Reply verification tests...');
  
  // Ensure DB is initialized
  getDb();
  console.log('✅ SQLite DB connection established successfully.');

  // 1. Create a dummy test contact and conversation
  console.log('\n--- Test Case 1: Seeding Dummy Contact & Conversation ---');
  const dummyPhone = '+628999999999';
  const dummyName = 'Budi Test';
  
  const contactId = upsertContact(dummyPhone, dummyName, null);
  const conversationId = upsertConversation(contactId, null, 'open');
  console.log(`Contact ID: ${contactId}`);
  console.log(`Conversation ID: ${conversationId}`);

  // Insert some test messages
  insertMessageIdempotent({
    watiMessageId: 'msg-inbound-1',
    conversationId,
    contactId,
    direction: 'incoming',
    senderType: 'customer',
    text: 'Halo, saya mau tanya harga paket prewedding bulan depan tanggal 20 apakah ada slot?',
    watiTimestamp: new Date(Date.now() - 3600 * 1000).toISOString()
  });

  insertMessageIdempotent({
    watiMessageId: 'msg-outbound-1',
    conversationId,
    contactId,
    direction: 'outgoing',
    senderType: 'cs',
    text: 'Halo Kak Budi, untuk prewedding kami ada beberapa paket. Untuk tanggal 20 kami periksa dulu ya.',
    watiTimestamp: new Date(Date.now() - 1800 * 1000).toISOString()
  });

  insertMessageIdempotent({
    watiMessageId: 'msg-inbound-2',
    conversationId,
    contactId,
    direction: 'incoming',
    senderType: 'customer',
    text: 'Oke ditunggu ya kak, tolong diinfo harganya sekalian.',
    watiTimestamp: new Date().toISOString()
  });

  console.log('✅ Dummy chat messages seeded.');

  // 2. Test context builder
  console.log('\n--- Test Case 2: Verification of buildWhatsAppCustomerContext ---');
  const context = buildWhatsAppCustomerContext(conversationId);
  if (!context) {
    throw new Error('❌ Failed to build customer context');
  }
  console.log('Customer Context keys:', Object.keys(context));
  console.log(`Contact Name: ${context.contact.displayName}`);
  console.log(`Message Count: ${context.messageHistory.length}`);
  console.log(`Bookings Count: ${context.bookings.length}`);
  console.log('✅ Context building works perfectly.');

  // 3. Test AI Completion / Fallback behavior
  console.log('\n--- Test Case 3: Verification of getAICompletion ---');
  console.log(`Is AI enabled globally via env? ${isAIEnabled()}`);
  const completion = await getAICompletion(context, 'insight');
  console.log('Resulting Completion properties:');
  console.log(`- Intent: ${completion.intent}`);
  console.log(`- Sentiment: ${completion.sentiment}`);
  console.log(`- Urgency: ${completion.urgency}`);
  console.log(`- Needs Human: ${completion.needs_human}`);
  console.log(`- Summary: ${completion.summary}`);
  console.log(`- Draft Reply: ${completion.draft_reply}`);
  console.log('✅ Completion analysis & fallback retrieval works.');

  // 4. Test Database Schema inserts & reads
  console.log('\n--- Test Case 4: Verifying AI Database Helpers ---');
  
  // Save Insight
  const insightId = saveConversationInsight({
    conversationId,
    summary: completion.summary,
    intent: completion.intent,
    sentiment: completion.sentiment,
    urgency: completion.urgency,
    riskLevel: completion.risk_level,
    needsHuman: completion.needs_human,
    suggestedNextAction: completion.suggested_next_action,
    confidence: completion.confidence,
    modelName: 'verification-test',
    sourceMessageId: 'msg-inbound-2'
  });
  console.log(`Saved Insight ID: ${insightId}`);
  
  // Read Insight
  const readInsight = getLatestConversationInsight(conversationId);
  if (!readInsight || readInsight.intent !== completion.intent) {
    throw new Error('❌ Failed to retrieve correct conversation insight');
  }
  console.log(`Successfully retrieved Insight. Intent matched: ${readInsight.intent}`);

  // Save AI Draft
  const draftId = saveAIDraft({
    conversationId,
    messageId: 'msg-inbound-2',
    draftText: completion.draft_reply,
    draftType: 'reply',
    status: 'drafted',
    riskLevel: completion.risk_level,
    guardrailNotes: 'Verification testing notes',
    createdBy: 'test-runner',
    modelName: 'verification-test',
    promptVersion: 'v0.1'
  });
  console.log(`Saved AI Draft ID: ${draftId}`);

  // Read Draft
  const readDraft = getAIDraftById(draftId);
  if (!readDraft || readDraft.draft_text !== completion.draft_reply) {
    throw new Error('❌ Failed to retrieve correct AI draft');
  }
  console.log('Successfully retrieved AI Draft. Content matched.');

  // Log AI event audit trail
  const eventId = logAIEvent({
    conversationId,
    eventType: 'verification',
    inputSnapshot: '{"test": true}',
    outputSnapshot: '{"status": "ok"}',
    actor: 'test-runner'
  });
  console.log(`Logged AI event successfully. Event ID: ${eventId}`);

  console.log('\n🎉 All verification tests completed successfully!');
}

runTests().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
