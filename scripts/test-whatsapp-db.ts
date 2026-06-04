import Module from 'module';

// Mock server-only
// @ts-ignore
const originalRequire = Module.prototype.require;
// @ts-ignore
Module.prototype.require = function(id) {
  if (id === 'server-only') {
    return {};
  }
  // @ts-ignore
  return originalRequire.apply(this, arguments);
};

async function testDatabase() {
  console.log('--- Testing WhatsApp Database Schema and Repository ---');
  try {
    const { getDb } = await import('../lib/db');
    const {
      upsertContact,
      upsertConversation,
      insertMessageIdempotent,
      getConversations,
      getMessages,
      queueOutbox
    } = await import('../lib/repositories/whatsapp');

    const db = getDb();
    console.log('✅ SQLite Connection obtained successfully');

    // 1. Verify tables exist
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'whats%'").all() as { name: string }[];
    console.log('Tables found:', tables.map(t => t.name));

    // 2. Test upsertContact
    console.log('\nTesting Contact Upsert...');
    const contactId = upsertContact('6281234567890', 'Test Customer', 'wati-cont-123');
    console.log('✅ Contact upserted. ID:', contactId);

    // 3. Test upsertConversation
    console.log('\nTesting Conversation Upsert...');
    const conversationId = upsertConversation(contactId, 'wati-conv-123', 'open');
    console.log('✅ Conversation upserted. ID:', conversationId);

    // 4. Test insertMessageIdempotent (incoming)
    console.log('\nTesting Message Ingestion (Idempotent)...');
    const msg1 = insertMessageIdempotent({
      watiMessageId: 'msg-id-001',
      conversationId,
      contactId,
      direction: 'incoming',
      senderType: 'customer',
      text: 'Halo, saya mau tanya paket foto',
      watiTimestamp: new Date().toISOString()
    });
    console.log('✅ Message 1 inserted (incoming). Success status:', msg1.success, 'ID:', msg1.messageId);

    // Test duplicate insertion
    const msg1Duplicate = insertMessageIdempotent({
      watiMessageId: 'msg-id-001',
      conversationId,
      contactId,
      direction: 'incoming',
      senderType: 'customer',
      text: 'Halo, saya mau tanya paket foto',
      watiTimestamp: new Date().toISOString()
    });
    console.log('✅ Duplicate Message 1 check. Success status:', msg1Duplicate.success, 'ID:', msg1Duplicate.messageId);

    // 5. Test queueOutbox
    console.log('\nTesting Outbox queue...');
    const outboxId = queueOutbox(conversationId, contactId, 'Halo! Silakan lihat paket kami.', 'session_text');
    console.log('✅ Outbox message queued. ID:', outboxId);

    // 6. Test getConversations
    console.log('\nTesting getConversations list...');
    const list = getConversations();
    console.log('✅ Conversations count:', list.total);
    console.log('Conversation list sample:', list.conversations[0]);

    // 7. Test getMessages
    console.log('\nTesting getMessages list...');
    const msgsList = getMessages(conversationId);
    console.log('✅ Messages count inside conversation:', msgsList.length);
    console.log('Messages list sample:', msgsList[0]);

    console.log('\n🎉 ALL DATABASE AND REPOSITORY TESTS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Database Test Failed:', err);
    process.exit(1);
  }
}

testDatabase();
