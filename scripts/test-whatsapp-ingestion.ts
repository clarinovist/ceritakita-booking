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

import { NextRequest } from 'next/server';

async function testIngestion() {
  console.log('--- Testing Watzap Webhook Ingestion API Route ---');
  try {
    const { POST } = await import('../app/api/watzap/webhook/route');
    const { getConversations, getMessages } = await import('../lib/repositories/whatsapp');

    const { getDb } = await import('../lib/db');
    const db = getDb();

    // Clean up conversation state to leads before running test if exists
    try {
      db.prepare(`
        UPDATE whatsapp_conversations
        SET crm_label = 'leads', next_fu_at = NULL, fu_note = NULL, label_source = 'system'
        WHERE id = (
          SELECT c.id
          FROM whatsapp_conversations c
          JOIN whatsapp_contacts con ON c.contact_id = con.id
          WHERE con.phone_number = '628127780285'
        )
      `).run();
      console.log('🧹 Cleaned up target conversation CRM state');
    } catch {
      // conversation doesn't exist yet, which is fine
    }

    // Mock a standard incoming message payload (provider-agnostic / Watzap-compatible)
    const testId = 'wamid.' + Date.now();
    const mockPayload = {
      id: testId,
      waId: '628127780285',
      senderName: 'Nugroho Pramono',
      type: 'text',
      text: 'Halo CeritaKita Studio! Saya tertarik dengan paket wisuda untuk bulan depan.',
      timestamp: Math.floor(Date.now() / 1000),
      owner: false,
      contactId: 'watzap-contact-nugroho-1',
      conversationId: 'watzap-conv-nugroho-1'
    };

    console.log('Ingesting mock payload...');
    const req = new NextRequest('http://localhost:3000/api/watzap/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mockPayload)
    });

    const response = await POST(req);
    console.log('Response Status:', response.status);
    const body = await response.json();
    console.log('Response Body:', body);

    if (response.status === 200 && body.success) {
      console.log('✅ Webhook route returned success status');

      const convs = getConversations({ search: '628127780285' });
      console.log('Found Conversations:', convs.total);
      if (convs.total > 0 && convs.conversations[0]) {
        console.log('✅ Ingestion correctly created the conversation & contact');
        const conversation = convs.conversations[0];
        console.log('CRM Label in DB:', (conversation as any).crm_label);
        console.log('Next FU date in DB:', (conversation as any).next_fu_at);
        console.log('FU Note in DB:', (conversation as any).fu_note);

        if ((conversation as any).crm_label === 'warm' && (conversation as any).next_fu_at !== null) {
          console.log('✅ Ingestion correctly classified and updated conversation CRM label to warm');
        } else {
          console.error('❌ Ingestion CRM auto-classification failed!');
        }

        const messages = getMessages(conversation.id);
        console.log('Messages count in DB:', messages.length);
        console.log('Message text:', messages[0]?.text);
        if (messages[0]?.text === mockPayload.text) {
          console.log('✅ Message content matches exactly');
        } else {
          console.error('❌ Message text mismatch!');
        }
      } else {
        console.error('❌ Conversation was not created in DB');
      }
    } else {
      console.error('❌ Webhook API route failed');
    }

    console.log('\n🎉 ALL WEBHOOK INGESTION TESTS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Webhook Ingestion Test Failed:', err);
    process.exit(1);
  }
}

testIngestion();
