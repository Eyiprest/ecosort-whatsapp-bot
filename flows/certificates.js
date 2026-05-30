// ESG Certificate generation — handled inline in buyer.js.
// This module is reserved for future standalone certificate generation.

const storage = require('../utils/storage');
const { generateId, timestamp, formatDate, materialEmoji } = require('../utils/helpers');

function generateCertificate(transaction, buyerName) {
  const certId = `CERT-${transaction.id}`;
  const existing = storage.findOne('certificates', c => c.id === certId);
  if (existing) return existing;

  const cert = {
    id: certId,
    transactionId: transaction.id,
    buyerName,
    material: transaction.material,
    quantity: transaction.quantity,
    agreedPrice: transaction.agreedPrice,
    totalValue: transaction.totalValue,
    gps: transaction.gps || `6.5244, 3.3792`,
    chainOfCustody: [
      { step: 'Collection', actor: 'EcoSort Collector', date: transaction.createdAt },
      { step: 'Verification', actor: 'EcoSort Platform', date: timestamp() },
      { step: 'Transfer', actor: buyerName, date: timestamp() }
    ],
    verificationCode: `ECO-${certId}`,
    issuedAt: timestamp()
  };

  storage.insert('certificates', cert);
  return cert;
}

function formatCertificateText(cert) {
  return [
    `🌿 *EcoSort ESG Certificate*`,
    ``,
    `Certificate ID: *${cert.id}*`,
    `Verification: *${cert.verificationCode}*`,
    ``,
    `🏢 Buyer: ${cert.buyerName}`,
    `♻️ Material: ${materialEmoji(cert.material)}`,
    `📦 Quantity: ${cert.quantity}kg`,
    `💰 Value: ₦${(cert.totalValue || 0).toLocaleString()}`,
    `📍 GPS: ${cert.gps}`,
    `📅 Issued: ${formatDate(cert.issuedAt)}`,
    ``,
    `*Chain of Custody:*`,
    ...cert.chainOfCustody.map((c, i) => `${i + 1}. ${c.step} — ${c.actor}`),
    ``,
    `✅ This certificate verifies sustainable material sourcing through EcoSort's verified recycling network.`
  ].join('\n');
}

module.exports = { generateCertificate, formatCertificateText };
