const session = require('../utils/session');
const { msg } = require('../utils/messages');
const storage = require('../utils/storage');
const { delay } = require('../utils/helpers');
const { isMenuChoice, getMenuChoice } = require('../utils/validators');

const TOPICS = {
  en: [
    {
      title: '♻️ Plastic Waste',
      content: `*Plastic Waste*\n\nExamples:\n• PET bottles\n• Shampoo containers\n• Drinking water jerry cans\n\nHow to prepare:\n• Rinse and dry containers\n• Remove caps and lids\n• Flatten bottles and jerry cans\n• Keep plastics separate from paper\n\nCommon mistakes:\n❌ Mixing plastic with paper or food waste\n❌ Leaving liquids inside bottles\n❌ Adding nylon bags to hard plastic\n\nEnvironmental benefits:\n✅ Saves energy and resources\n✅ Reduces road and water pollution\n✅ Makes recycling more valuable\n\nPoints earned: 5 points per KG`
    },
    {
      title: '📄 Paper Waste',
      content: `*Paper Waste*\n\nExamples:\n• Cardboard boxes\n• Newspapers and magazines\n• Office paper\n\nHow to prepare:\n• Keep paper dry\n• Remove tape and plastic\n• Flatten boxes and bundle sheets\n• Keep paper away from wet waste\n\nCommon mistakes:\n❌ Recycling wet or greasy paper\n❌ Mixing paper with plastic-coated items\n❌ Bundling paper with food scraps\n\nEnvironmental benefits:\n✅ Saves trees and water\n✅ Reduces landfill volume\n✅ Supports local recycling jobs\n\nPoints earned: 4 points per KG`
    },
    {
      title: '🔩 Metal Waste',
      content: `*Metal Waste*\n\nExamples:\n• Aluminum cans\n• Steel tins\n• Scrap metal pieces\n\nHow to prepare:\n• Rinse cans and tins\n• Remove non-metal parts\n• Separate metals by type when possible\n\nCommon mistakes:\n❌ Recycling oily or dirty metal\n❌ Mixing metals with glass or plastic\n❌ Including batteries or electronics\n\nEnvironmental benefits:\n✅ Saves natural resources\n✅ Reduces mining and landfill impact\n✅ Produces strong recycled materials\n\nPoints earned: 7 points per KG`
    },
    {
      title: '🍾 Glass Waste',
      content: `*Glass Waste*\n\nExamples:\n• Bottles\n• Jars\n• Glass containers\n\nHow to prepare:\n• Rinse and dry glass\n• Remove caps and lids\n• Wrap broken glass safely\n• Keep clear and colored glass separate\n\nCommon mistakes:\n❌ Mixing glass with metal or plastic\n❌ Including ceramics or mirrors\n❌ Packaging broken shards loosely\n\nEnvironmental benefits:\n✅ Saves sand and energy\n✅ Reduces hazards for collectors\n✅ Keeps recycling clean\n\nPoints earned: 6 points per KG`
    },
    {
      title: '🌱 Organic Waste',
      content: `*Organic Waste*\n\nExamples:\n• Fruit and vegetable peels\n• Garden trimmings\n• Food scraps\n\nHow to prepare:\n• Keep organic waste separate\n• Remove plastics and metals\n• Chop large items into smaller pieces\n• Use a compost bin or paper bag\n\nCommon mistakes:\n❌ Mixing organic waste with plastics\n❌ Putting cooked oil or chemicals in compost\n❌ Storing organics in black bags\n\nEnvironmental benefits:\n✅ Feeds soil and gardens\n✅ Reduces methane from landfills\n✅ Creates nutrient-rich compost\n\nPoints earned: 4 points per KG`
    },
    {
      title: '⚡ E-Waste',
      content: `*E-Waste*\n\nExamples:\n• Old phones and chargers\n• Batteries and cables\n• Small electronics\n\nHow to prepare:\n• Keep electronics dry and intact\n• Separate batteries and cables\n• Remove non-electronic parts\n• Do not crush or burn devices\n\nCommon mistakes:\n❌ Throwing e-waste in the regular trash\n❌ Mixing batteries with other waste\n❌ Breaking devices apart\n\nEnvironmental benefits:\n✅ Prevents toxic leaks\n✅ Saves rare metals\n✅ Supports safer recycling jobs\n\nPoints earned: 8 points per KG`
    }
  ],
  pid: [
    {
      title: '♻️ Plastic Waste',
      content: `*Plastic Waste*\n\nExamples:\n• PET bottle\n• Shampoo container\n• Water jerry can\n\nHow to prepare:\n• Wash and dry them\n• Remove cap and lid\n• Flatten bottles and jerry cans\n• Keep plastic away from paper\n\nCommon mistakes:\n❌ Mixing plastic with paper or food waste\n❌ Leaving water inside bottles\n❌ Putting nylon bag with hard plastic\n\nEnvironmental benefits:\n✅ Saves energy\n✅ Keeps road and water clean\n✅ Increases recycling value\n\nPoints earned: 5 points per KG`
    },
    {
      title: '📄 Paper Waste',
      content: `*Paper Waste*\n\nExamples:\n• Cardboard box\n• Newspaper\n• Office paper\n\nHow to prepare:\n• Keep paper dry\n• Remove tape and plastic\n• Flatten boxes and bundle sheets\n• Keep paper away from wet waste\n\nCommon mistakes:\n❌ Recycling wet or oily paper\n❌ Mixing paper with plastic-coated items\n❌ Bundling paper with food scraps\n\nEnvironmental benefits:\n✅ Saves trees and water\n✅ Reduces landfill waste\n✅ Supports recycling business\n\nPoints earned: 4 points per KG`
    },
    {
      title: '🔩 Metal Waste',
      content: `*Metal Waste*\n\nExamples:\n• Aluminum can\n• Steel tin\n• Scrap metal\n\nHow to prepare:\n• Wash cans and tins\n• Remove non-metal parts\n• Separate metals when you fit\n\nCommon mistakes:\n❌ Recycling oily or dirty metal\n❌ Mixing metals with glass or plastic\n❌ Including batteries or electronics\n\nEnvironmental benefits:\n✅ Saves natural resources\n✅ Reduces mining wahala\n✅ Creates strong recycled materials\n\nPoints earned: 7 points per KG`
    },
    {
      title: '🍾 Glass Waste',
      content: `*Glass Waste*\n\nExamples:\n• Bottle\n• Jar\n• Glass container\n\nHow to prepare:\n• Wash and dry glass\n• Remove cap and lid\n• Wrap broken pieces safe\n• Keep clear and coloured glass separate\n\nCommon mistakes:\n❌ Mixing glass with metal or plastic\n❌ Including ceramic or mirror\n❌ Packaging broken glass loosely\n\nEnvironmental benefits:\n✅ Saves sand and energy\n✅ Protects collectors\n✅ Keeps recycling clean\n\nPoints earned: 6 points per KG`
    },
    {
      title: '🌱 Organic Waste',
      content: `*Organic Waste*\n\nExamples:\n• Fruit peel\n• Vegetable scrap\n• Food leftovers\n\nHow to prepare:\n• Keep organic waste separate\n• Remove plastic and metal\n• Chop big items into smaller pieces\n• Use compost bin or paper bag\n\nCommon mistakes:\n❌ Mixing organic waste with plastic or metal\n❌ Putting cooked oil or chemical in compost\n❌ Storing organics in black bag\n\nEnvironmental benefits:\n✅ Feeds soil and garden\n✅ Reduces methane\n✅ Creates compost\n\nPoints earned: 4 points per KG`
    },
    {
      title: '⚡ E-Waste',
      content: `*E-Waste*\n\nExamples:\n• Old phone\n• Battery\n• Charger\n\nHow to prepare:\n• Keep electronics dry\n• Separate battery and cable\n• Remove non-electronic parts\n• Don’t crush or burn devices\n\nCommon mistakes:\n❌ Throwing e-waste away\n❌ Mixing battery with other waste\n❌ Breaking device apart\n\nEnvironmental benefits:\n✅ Prevents toxic leaks\n✅ Saves rare metals\n✅ Supports safe recycling jobs\n\nPoints earned: 8 points per KG`
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
