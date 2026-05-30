const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || '/tmp/storage';

function filePath(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

function readAll(name) {
  try {
    const raw = fs.readFileSync(filePath(name), 'utf8');
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}

function writeAll(name, data) {
  fs.writeFileSync(filePath(name), JSON.stringify(data, null, 2), 'utf8');
}

function findOne(name, predicate) {
  return readAll(name).find(predicate) || null;
}

function findAll(name, predicate) {
  const items = readAll(name);
  return predicate ? items.filter(predicate) : items;
}

function insert(name, item) {
  const items = readAll(name);
  items.push(item);
  writeAll(name, items);
  return item;
}

function update(name, predicate, changes) {
  const items = readAll(name);
  let updated = null;
  const next = items.map(item => {
    if (predicate(item)) {
      updated = Object.assign({}, item, changes);
      return updated;
    }
    return item;
  });
  writeAll(name, next);
  return updated;
}

function remove(name, predicate) {
  const items = readAll(name);
  const next = items.filter(item => !predicate(item));
  writeAll(name, next);
}

module.exports = { readAll, writeAll, findOne, findAll, insert, update, remove };
