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

    // 5.5 Test CRM features
    console.log('\nTesting CRM updateConversationCrm...');
    const { updateConversationCrm, markFollowUpSent, classifyIncomingMessage } = await import('../lib/repositories/whatsapp');

    updateConversationCrm(conversationId, {
      crmLabel: 'warm',
      nextFuAt: '2026-06-10T12:00:00.000Z',
      fuNote: 'Test follow up note',
      fuTemplateKey: 'warm_3d'
    });

    // Retrieve conversation and verify
    let convAfterCrm = db.prepare('SELECT * FROM whatsapp_conversations WHERE id = ?').get(conversationId) as any;
    console.log('CRM Label updated to:', convAfterCrm.crm_label);
    console.log('Next FU date:', convAfterCrm.next_fu_at);
    console.log('FU Note:', convAfterCrm.fu_note);
    console.log('Label Source:', convAfterCrm.label_source);

    if (convAfterCrm.crm_label === 'warm' && convAfterCrm.next_fu_at === '2026-06-10T12:00:00.000Z') {
      console.log('✅ updateConversationCrm success');
    } else {
      console.error('❌ updateConversationCrm mismatch!');
    }

    console.log('\nTesting CRM markFollowUpSent...');
    markFollowUpSent(conversationId, 'copied');
    let convAfterSent = db.prepare('SELECT * FROM whatsapp_conversations WHERE id = ?').get(conversationId) as any;
    console.log('FU count after mark sent:', convAfterSent.fu_count);
    console.log('Next FU date after mark sent (should be null):', convAfterSent.next_fu_at);
    console.log('Last FU date:', convAfterSent.last_fu_at);
    if (convAfterSent.fu_count === 1 && convAfterSent.next_fu_at === null && convAfterSent.last_fu_at !== null) {
      console.log('✅ markFollowUpSent success');
    } else {
      console.error('❌ markFollowUpSent mismatch!');
    }

    console.log('\nTesting CRM classifyIncomingMessage...');
    const class1 = classifyIncomingMessage('Berapa harga paket prewedding?', 'leads', 'system');
    console.log('Classified price inquiry:', class1);
    if (class1?.crmLabel === 'warm' && class1.fuTemplateKey === 'warm_3d') {
      console.log('✅ Price keywords classification success');
    } else {
      console.error('❌ Price keywords classification failed');
    }

    const class2 = classifyIncomingMessage('Saya ada komplain mengenai jadwal reschedule', 'warm', 'system');
    console.log('Classified reschedule/complaint:', class2);
    if (class2 && class2.nextFuAt === null) {
      console.log('✅ Reschedule/complaint classification success');
    } else {
      console.error('❌ Reschedule/complaint classification failed');
    }

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
