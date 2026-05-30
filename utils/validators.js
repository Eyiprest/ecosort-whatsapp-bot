function isValidPhone(phone) {
  const clean = phone.replace(/\D/g, '');
  return clean.length >= 10 && clean.length <= 15;
}

function isValidName(name) {
  return typeof name === 'string' && name.trim().length >= 2;
}

function isMenuChoice(input, max) {
  const n = parseInt(input.trim(), 10);
  return !isNaN(n) && n >= 1 && n <= max;
}

function getMenuChoice(input) {
  return parseInt(input.trim(), 10);
}

function isPositiveNumber(val) {
  return !isNaN(val) && parseFloat(val) > 0;
}

module.exports = { isValidPhone, isValidName, isMenuChoice, getMenuChoice, isPositiveNumber };
