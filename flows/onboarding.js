const session = require('../utils/session');
const { msg } = require('../utils/messages');
const { isMenuChoice, getMenuChoice } = require('../utils/validators');

async function handle(client, message, phone, sess) {
  const body = message.body.trim();
  const lang = sess.lang;

  // ── START: language selection ──────────────────────────────────────────────
  if (sess.step === 'start') {
    if (!isMenuChoice(body, 2)) {
      await message.reply(msg('welcome', 'en'));
      session.set(phone, { step: 'lang_select' });
      return;
    }
  }

  if (sess.step === 'lang_select' || sess.step === 'start') {
    if (isMenuChoice(body, 2)) {
      const choice = getMenuChoice(body);
      const selectedLang = choice === 2 ? 'pid' : 'en';
      session.set(phone, { lang: selectedLang, step: 'role_select' });

      if (selectedLang === 'pid') {
        await message.reply(`👍 Oya! Make we dey go.\n\n${msg('roleSelect', 'pid')}`);
      } else {
        await message.reply(`👍 Great! Let's go.\n\n${msg('roleSelect', 'en')}`);
      }
      return;
    }
    await message.reply(msg('welcome', 'en'));
    session.set(phone, { step: 'lang_select' });
    return;
  }

  // ── ROLE SELECTION ─────────────────────────────────────────────────────────
  if (sess.step === 'role_select') {
    if (!isMenuChoice(body, 3)) {
      await message.reply(msg('invalidChoice', lang));
      await message.reply(msg('roleSelect', lang));
      return;
    }
    const choice = getMenuChoice(body);
    const roleMap = { 1: 'household', 2: 'collector', 3: 'buyer' };
    const role = roleMap[choice];
    session.set(phone, { role, step: 'role_entry', flow: role });

    const roleLabel = {
      en: { household: 'Household User', collector: 'Collector', buyer: 'Buyer / Business' },
      pid: { household: 'Household User', collector: 'Collector', buyer: 'Buyer / Business' }
    };

    const next = lang === 'pid'
      ? `✅ You don choose *${roleLabel.pid[role]}!*\n\nReply with:\n👉 *REGISTER* — Create a new account\n👉 *MENU* — Access your existing account`
      : `✅ You have selected *${roleLabel.en[role]}!*\n\nReply with:\n👉 *REGISTER* — Create a new account\n👉 *MENU* — Access your existing account`;

    await message.reply(next);
    return;
  }
}

module.exports = { handle };
