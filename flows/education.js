const session = require('../utils/session');
const { msg } = require('../utils/messages');
const storage = require('../utils/storage');
const { delay } = require('../utils/helpers');
const { isMenuChoice, getMenuChoice } = require('../utils/validators');

const TOPICS = {
  en: [
    {
      title: '♻️ PET Bottle Sorting',
      content: `*How to Sort PET Bottles*\n\n✅ Crush bottles to save space\n✅ Remove caps and labels\n✅ Keep them dry\n✅ Separate by colour if possible\n\n❌ Don't mix with dirty or oily bottles\n\n💡 PET bottles are one of the most valuable recyclables in Nigeria!`
    },
    {
      title: '🌿 Top Recycling Tips',
      content: `*Top Recycling Tips*\n\n♻️ Rinse containers before recycling\n♻️ Flatten cardboard boxes\n♻️ Never bag recyclables in black bags\n♻️ Separate paper from plastic\n♻️ Keep recyclables dry\n\n💡 Clean material = more ₦ for you!`
    },
    {
      title: '⚠️ Contamination Prevention',
      content: `*Prevent Contamination*\n\nContamination happens when:\n❌ Food waste mixes with recyclables\n❌ Wet paper is stored with dry paper\n❌ Different plastic types are mixed\n\n✅ Keep separate bins for each material\n✅ Dry materials before storage\n\n💡 Contamination-free materials earn 30% more!`
    },
    {
      title: '🌍 Environmental Impact',
      content: `*Why Recycling Matters*\n\n🌊 Plastic in oceans kills 1M+ sea creatures yearly\n🏙️ Lagos generates 13,000 tonnes of waste/day\n♻️ Recycling 1 tonne of PET saves 1.5 tonnes of CO2\n💰 Nigeria recycling market worth ₦500B+\n\n🌿 Every pickup = a step toward a cleaner Nigeria!`
    }
  ],
  pid: [
    {
      title: '♻️ How To Sort PET Bottle',
      content: `*How To Sort PET Bottle*\n\n✅ Crush the bottle make e take less space\n✅ Remove cap and label\n✅ Keep am dry\n✅ Separate by colour if you fit\n\n❌ No mix with dirty or oily bottle\n\n💡 PET bottle na one of the most valuable recyclable for Nigeria!`
    },
    {
      title: '🌿 Top Recycling Tips',
      content: `*Top Recycling Tips*\n\n♻️ Wash container before you recycle am\n♻️ Press down cardboard box flat\n♻️ No put recyclable inside black nylon bag\n♻️ Separate paper from plastic\n♻️ Keep am dry\n\n💡 Clean material = more ₦ for you!`
    },
    {
      title: '⚠️ Prevent Contamination',
      content: `*How To Prevent Contamination*\n\nContamination happen when:\n❌ Food waste mix with recyclable\n❌ Wet paper dey with dry paper\n❌ Different plastic type mix together\n\n✅ Keep separate container for each material\n✅ Dry material before you store am\n\n💡 Clean material earn 30% more!`
    },
    {
      title: '🌍 Why Recycling Matter',
      content: `*Why Recycling Matter*\n\n🌊 Plastic for ocean kill 1M+ sea animal every year\n🏙️ Lagos generate 13,000 tonnes of waste per day\n♻️ Recycling 1 tonne of PET save 1.5 tonnes of CO2\n💰 Nigeria recycling market worth ₦500B+\n\n🌿 Every pickup na one step towards cleaner Nigeria!`
    }
  ]
};

const QUIZZES = {
  en: [
    {
      q: '♻️ Which material is NOT recyclable?',
      options: ['A) PET Plastic Bottle', 'B) Food-Soaked Cardboard', 'C) Aluminum Can'],
      correct: 'b',
      explanation: 'Food-soaked cardboard cannot be recycled — food contamination degrades the paper fibres.'
    },
    {
      q: '🧴 HDPE plastic is found in:',
      options: ['A) PET Water Bottles', 'B) Jerry Cans & Shampoo Bottles', 'C) Food Wrappers'],
      correct: 'b',
      explanation: 'HDPE is used for jerry cans, shampoo bottles, and detergent containers.'
    },
    {
      q: '🌍 How much waste does Lagos generate per day?',
      options: ['A) 1,000 tonnes', 'B) 5,000 tonnes', 'C) 13,000 tonnes'],
      correct: 'c',
      explanation: 'Lagos generates ~13,000 tonnes of solid waste per day — recycling makes a real difference!'
    },
    {
      q: '💰 Which material is usually most valuable per kg?',
      options: ['A) Aluminum', 'B) Nylon bags', 'C) Cardboard'],
      correct: 'a',
      explanation: 'Aluminum is highly valuable and infinitely recyclable — highest price per kg!'
    },
    {
      q: '♻️ What should you do BEFORE recycling plastic bottles?',
      options: ['A) Crush and rinse them', 'B) Leave food residue inside', 'C) Keep caps tightly on'],
      correct: 'a',
      explanation: 'Always crush and rinse bottles — clean materials are worth more and easier to process!'
    }
  ],
  pid: [
    {
      q: '♻️ Which material no fit recycle?',
      options: ['A) PET Plastic Bottle', 'B) Cardboard wey food soak', 'C) Aluminum Can'],
      correct: 'b',
      explanation: 'Cardboard wey food soak no fit recycle — food don spoil the paper fibre.'
    },
    {
      q: '🧴 HDPE plastic dey inside which product?',
      options: ['A) PET Water Bottle', 'B) Jerry Can & Shampoo Bottle', 'C) Food Wrapper'],
      correct: 'b',
      explanation: 'HDPE dey for jerry can, shampoo bottle, and detergent container.'
    },
    {
      q: '🌍 How much waste Lagos generate per day?',
      options: ['A) 1,000 tonnes', 'B) 5,000 tonnes', 'C) 13,000 tonnes'],
      correct: 'c',
      explanation: 'Lagos generate about 13,000 tonnes of solid waste per day!'
    },
    {
      q: '💰 Which material expensive pass per kg?',
      options: ['A) Aluminum', 'B) Nylon Bag', 'C) Cardboard'],
      correct: 'a',
      explanation: 'Aluminum na the most valuable — e dey fetch highest price per kg!'
    },
    {
      q: '♻️ Wetin you suppose do before you recycle plastic bottle?',
      options: ['A) Crush am and wash am', 'B) Leave food inside', 'C) Keep cap tight'],
      correct: 'a',
      explanation: 'Always crush and wash bottle before recycling — clean material worth more!'
    }
  ]
};

// ── EDUCATION TOPICS ──────────────────────────────────────────────────────────
async function showTopics(client, message, phone, sess) {
  const lang = sess.lang === 'pid' ? 'pid' : 'en';
  const topics = TOPICS[lang];
  const list = topics.map((t, i) => `${i + 1}. ${t.title}`).join('\n');
  await message.reply(lang === 'pid'
    ? `📚 *Learn Recycling*\n\nChoose topic:\n\n${list}\n\nReply with number.`
    : `📚 *Learn Recycling*\n\nChoose a topic:\n\n${list}\n\nReply with number.`);
  session.set(phone, { step: 'edu_topic', flow: 'education' });
}

async function showTopic(client, message, phone, sess) {
  const body = message.body.trim();
  const lang = sess.lang === 'pid' ? 'pid' : 'en';
  const topics = TOPICS[lang];
  if (!isMenuChoice(body, topics.length)) {
    await message.reply(msg('invalidChoice', lang));
    return showTopics(client, message, phone, sess);
  }
  const topic = topics[getMenuChoice(body) - 1];
  await message.reply(`${topic.content}\n\n${lang === 'pid' ? 'Type *menu* to go back.' : 'Type *menu* to return to your dashboard.'}`);
  const role = sess.role;
  session.set(phone, { step: role === 'collector' ? 'collector_menu' : 'household_menu', flow: role });
}

// ── QUIZ ──────────────────────────────────────────────────────────────────────
async function startQuiz(client, message, phone, sess) {
  const lang = sess.lang === 'pid' ? 'pid' : 'en';
  const quizzes = QUIZZES[lang];
  session.set(phone, { step: 'quiz_answer', flow: 'quiz' });
  session.setData(phone, 'quizIndex', 0);
  session.setData(phone, 'quizScore', 0);
  session.setData(phone, 'quizLang', lang);

  const q = quizzes[0];
  const opts = q.options.join('\n');
  await message.reply(lang === 'pid'
    ? `🧠 *Quiz Challenge!*\n\nQuestion 1 of ${quizzes.length}:\n\n${q.q}\n\n${opts}\n\nReply A, B, or C:`
    : `🧠 *Quiz Challenge!*\n\nQuestion 1 of ${quizzes.length}:\n\n${q.q}\n\n${opts}\n\nReply A, B, or C:`);
}

async function handleQuizAnswer(client, message, phone, sess) {
  const body = message.body.trim().toLowerCase();
  const lang = sess.data.quizLang || (sess.lang === 'pid' ? 'pid' : 'en');
  const quizzes = QUIZZES[lang];
  const idx = sess.data.quizIndex || 0;
  const score = sess.data.quizScore || 0;
  const q = quizzes[idx];
  const phone_waid = `${phone}@c.us`;

  if (!['a', 'b', 'c'].includes(body)) {
    await message.reply(lang === 'pid' ? '❌ Reply A, B, or C only.' : '❌ Please reply with A, B, or C.');
    return;
  }

  const isCorrect = body === q.correct;
  const newScore = isCorrect ? score + 1 : score;

  // ── Animated timing sequence ──────────────────────────────────────────────
  await message.reply(lang === 'pid' ? '🔍 Checking your answer...' : '🔍 Checking your answer...');
  await delay(1200);

  const resultMsg = isCorrect
    ? (lang === 'pid' ? '✅ *Correct! Well done!*' : '✅ *Correct! Great job!*')
    : (lang === 'pid' ? `❌ *Wrong!* Correct answer na *${q.correct.toUpperCase()}*` : `❌ *Incorrect!* The answer is *${q.correct.toUpperCase()}*`);

  try { await client.sendMessage(phone_waid, resultMsg); } catch (_) { await message.reply(resultMsg); }
  await delay(900);

  try { await client.sendMessage(phone_waid, `💡 ${q.explanation}`); } catch (_) {}
  await delay(700);

  const nextIdx = idx + 1;

  if (nextIdx >= quizzes.length) {
    const pct = Math.round((newScore / quizzes.length) * 100);
    const badge = newScore === quizzes.length ? '🏆 Quiz Master' : newScore >= 3 ? '🌿 Eco Learner' : null;
    const pts = newScore * 10;

    const user = storage.findOne('users', u => u.phone === phone);
    if (user) {
      const updatedBadges = badge && !(user.badges || []).includes(badge)
        ? [...(user.badges || []), badge]
        : user.badges || [];
      storage.update('users', u => u.phone === phone, {
        points: (user.points || 0) + pts,
        badges: updatedBadges
      });
    }

    const summaryMsg = lang === 'pid'
      ? `🎉 *Quiz Complete!*\n\nScore: ${newScore}/${quizzes.length} (${pct}%)\n${badge ? `🏅 Badge Earned: ${badge}!` : ''}\n\n+${pts} EcoPoints earned! ⭐`
      : `🎉 *Quiz Complete!*\n\nScore: ${newScore}/${quizzes.length} (${pct}%)\n${badge ? `🏅 Badge Earned: ${badge}!` : ''}\n\nYou earned +${pts} EcoPoints! ⭐`;

    try { await client.sendMessage(phone_waid, summaryMsg); } catch (_) { await message.reply(summaryMsg); }
    await delay(600);

    const role = sess.role;
    session.set(phone, { step: role === 'collector' ? 'collector_menu' : 'household_menu', flow: role });
    const menuKey = role === 'collector' ? 'collectorMenu' : 'mainMenu';
    try { await client.sendMessage(phone_waid, msg(menuKey, lang)); } catch (_) {}
    return;
  }

  session.setData(phone, 'quizIndex', nextIdx);
  session.setData(phone, 'quizScore', newScore);

  const nextQ = quizzes[nextIdx];
  const opts = nextQ.options.join('\n');
  const nextMsg = lang === 'pid'
    ? `🧠 Question ${nextIdx + 1} of ${quizzes.length}:\n\n${nextQ.q}\n\n${opts}\n\nReply A, B, or C:`
    : `🧠 Question ${nextIdx + 1} of ${quizzes.length}:\n\n${nextQ.q}\n\n${opts}\n\nReply A, B, or C:`;
  try { await client.sendMessage(phone_waid, nextMsg); } catch (_) { await message.reply(nextMsg); }
}

// ── MAIN HANDLE ───────────────────────────────────────────────────────────────
async function handle(client, message, phone, sess, quizMode = false) {
  if (sess.step === 'quiz_answer') return handleQuizAnswer(client, message, phone, sess);
  if (sess.step === 'edu_topic') return showTopic(client, message, phone, sess);
  if (quizMode) return startQuiz(client, message, phone, sess);
  return showTopics(client, message, phone, sess);
}

module.exports = { handle };
