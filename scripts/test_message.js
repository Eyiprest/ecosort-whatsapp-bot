const { handleIncomingMessage } = require('../server');

function makeMsg(from, body) {
  return {
    from: from + '@c.us',
    body,
    fromMe: false,
    reply: async (txt) => { console.log(`-> Reply to ${from}:`, txt); }
  };
}

async function run() {
  console.log('Simulating conversation from +2348010000000');
  const phone = '2348010000000';
  await handleIncomingMessage(makeMsg(phone, 'Hi'));
  await handleIncomingMessage(makeMsg(phone, '1'));
  await handleIncomingMessage(makeMsg(phone, '1'));
  await handleIncomingMessage(makeMsg(phone, 'register'));
  await handleIncomingMessage(makeMsg(phone, 'Amina Yusuf'));
  await handleIncomingMessage(makeMsg(phone, '08010000000'));
  await handleIncomingMessage(makeMsg(phone, '1'));
  await handleIncomingMessage(makeMsg(phone, '2'));
  await handleIncomingMessage(makeMsg(phone, '3'));
  console.log('Simulation complete.');
}

run().catch(e => console.error(e));
