// Rewards flow is handled inline inside household.js (handleRewards).
// This module is reserved for future expansion: redeeming rewards, etc.

const session = require('../utils/session');
const storage = require('../utils/storage');
const { msg } = require('../utils/messages');

async function handle(client, message, phone, sess) {
  const lang = sess.lang;
  const user = storage.findOne('users', u => u.phone === phone);
  if (!user) {
    await message.reply(msg('notRegistered', lang));
    return;
  }

  const allUsers = storage.readAll('users');
  const sorted = [...allUsers].sort((a, b) => (b.points || 0) - (a.points || 0));
  const rank = sorted.findIndex(u => u.phone === phone) + 1;
  const topThree = sorted.slice(0, 3).map((u, i) =>
    `${['🥇','🥈','🥉'][i]} ${u.name} — ${u.points || 0} pts`
  ).join('\n');

  await message.reply(lang === 'pid'
    ? `🏆 *Your Rewards*\n\n⭐ Points: *${user.points || 0}*\n🏅 Rank: *#${rank}*\n🎖️ Badges: ${(user.badges || []).join(', ') || 'None yet'}\n\n📊 Top Recyclers:\n${topThree}`
    : `🏆 *Your Rewards*\n\n⭐ Points: *${user.points || 0}*\n🏅 Rank: *#${rank}*\n🎖️ Badges: ${(user.badges || []).join(', ') || 'None yet'}\n\n📊 Top Recyclers:\n${topThree}`);

  session.set(phone, { step: 'household_menu' });
  await message.reply(msg('mainMenu', lang));
}

module.exports = { handle };
