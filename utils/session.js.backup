// In-memory session store keyed by WhatsApp number
const sessions = {};

function get(phone) {
  if (!sessions[phone]) {
    sessions[phone] = {
      phone,
      step: 'start',
      flow: null,
      lang: 'en',
      role: null,
      data: {},
      updatedAt: Date.now()
    };
  }
  return sessions[phone];
}

function set(phone, updates) {
  const session = get(phone);
  Object.assign(session, updates, { updatedAt: Date.now() });
  return session;
}

function reset(phone) {
  const lang = sessions[phone] ? sessions[phone].lang : 'en';
  sessions[phone] = {
    phone,
    step: 'start',
    flow: null,
    lang,
    role: null,
    data: {},
    updatedAt: Date.now()
  };
  return sessions[phone];
}

function setData(phone, key, value) {
  const session = get(phone);
  session.data[key] = value;
  session.updatedAt = Date.now();
  return session;
}

function getData(phone, key) {
  const session = get(phone);
  return session.data[key];
}

module.exports = { get, set, reset, setData, getData };
