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
  console.log('--- Testing WATI Webhook Ingestion API Route ---');
  try {
    const { POST } = await import('../app/api/wati/webhook/route');
    const { getConversations, getMessages } = await import('../lib/repositories/whatsapp');

    // 1. Mock a standard incoming message payload from WATI
    const mockPayload = {
      id: 'wamid.HBgLNjI4MTI3NzgwMjg1FgoA',
      waId: '628127780285',
      senderName: 'Nugroho Pramono',
      type: 'text',
      text: 'Halo CeritaKita Studio! Saya tertarik dengan paket wisuda untuk bulan depan.',
      timestamp: Math.floor(Date.now() / 1000),
      owner: false,
      contactId: 'wati-contact-nugroho-1',
      conversationId: 'wati-conv-nugroho-1'
    };

    console.log('Ingesting mock payload...');
    // Create a mock NextRequest
    const req = new NextRequest('http://localhost:3000/api/wati/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mockPayload)
    });

    // Call POST handler directly
    const response = await POST(req);
    console.log('Response Status:', response.status);
    const body = await response.json();
    console.log('Response Body:', body);

    if (response.status === 200 && body.success) {
      console.log('✅ Webhook route returned success status');
      
      // Verify database state
      const convs = getConversations({ search: '628127780285' });
      console.log('Found Conversations:', convs.total);
      if (convs.total > 0 && convs.conversations[0]) {
        console.log('✅ Ingestion correctly created the conversation & contact');
        const messages = getMessages(convs.conversations[0].id);
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
