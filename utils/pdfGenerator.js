/**
 * EcoSort ESG Certificate — PDF Generator
 * Produces a professional A4 certificate as a Buffer ready to send via WhatsApp.
 */

const PDFDocument = require('pdfkit');

// Brand colours
const GREEN      = '#2D6A4F';
const LIGHT_GREEN = '#52B788';
const DARK_TEXT  = '#1B2A22';
const GRAY       = '#6B7280';
const BG_LIGHT   = '#F0FAF4';
const WHITE      = '#FFFFFF';

/**
 * @param {object} cert  — certificate record from storage
 * @returns {Promise<Buffer>}
 */
function generateCertificatePDF(cert) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end',  () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = doc.page.width;   // 595
    const H = doc.page.height;  // 842

    // ── Background ────────────────────────────────────────────────────────────
    doc.rect(0, 0, W, H).fill(WHITE);

    // ── Top header bar ────────────────────────────────────────────────────────
    doc.rect(0, 0, W, 90).fill(GREEN);

    // Header text
    doc.fillColor(WHITE)
       .fontSize(22).font('Helvetica-Bold')
       .text('ECOSORT', 40, 22, { continued: false });

    doc.fillColor(LIGHT_GREEN)
       .fontSize(10).font('Helvetica')
       .text('Verified Recycling Network', 40, 48);

    // Certificate label (right side of header)
    doc.fillColor(WHITE)
       .fontSize(13).font('Helvetica-Bold')
       .text('ESG CERTIFICATE', 0, 30, { align: 'right', width: W - 40 });

    doc.fillColor(LIGHT_GREEN)
       .fontSize(9).font('Helvetica')
       .text('Sustainable Material Sourcing', 0, 50, { align: 'right', width: W - 40 });

    // ── Decorative side stripe ────────────────────────────────────────────────
    doc.rect(0, 90, 6, H - 90).fill(LIGHT_GREEN);

    // ── Certificate ID banner ─────────────────────────────────────────────────
    doc.rect(0, 90, W, 40).fill(BG_LIGHT);
    doc.fillColor(GREEN)
       .fontSize(11).font('Helvetica-Bold')
       .text(`Certificate ID:  ${cert.id}`, 20, 102);
    doc.fillColor(GRAY)
       .fontSize(9).font('Helvetica')
       .text(`Verification Code: ${cert.verificationCode}`, 0, 104, { align: 'right', width: W - 20 });

    // ── Main content area ─────────────────────────────────────────────────────
    let y = 150;

    // Title
    doc.fillColor(DARK_TEXT)
       .fontSize(18).font('Helvetica-Bold')
       .text('Certificate of Sustainable Material Sourcing', 40, y, { width: W - 80, align: 'center' });
    y += 36;

    doc.fillColor(GRAY)
       .fontSize(10).font('Helvetica')
       .text('This certifies that the following recycled materials were sourced through', 40, y, { width: W - 80, align: 'center' })
       .text('EcoSort\'s verified collection and chain-of-custody process.', 40, y + 14, { width: W - 80, align: 'center' });
    y += 44;

    // ── Info grid ─────────────────────────────────────────────────────────────
    const col1 = 40, col2 = W / 2 + 10;
    const labelColor = GRAY, valueColor = DARK_TEXT;

    function infoRow(label, value, cx, cy) {
      doc.fillColor(labelColor).fontSize(9).font('Helvetica').text(label.toUpperCase(), cx, cy);
      doc.fillColor(valueColor).fontSize(13).font('Helvetica-Bold').text(value, cx, cy + 13, { width: W / 2 - 60 });
    }

    // Divider
    doc.rect(40, y, W - 80, 1).fill('#E5E7EB');
    y += 14;

    infoRow('Buyer / Organisation', cert.buyerName || '—', col1, y);
    infoRow('Material Type', cert.material || '—', col2, y);
    y += 48;

    infoRow('Quantity Sourced', `${cert.quantity || 0} kg`, col1, y);
    infoRow('Agreed Price', `₦${(cert.agreedPrice || 0).toLocaleString()}/kg`, col2, y);
    y += 48;

    infoRow('Total Transaction Value', `₦${(cert.totalValue || 0).toLocaleString()}`, col1, y);
    infoRow('GPS Coordinates', cert.gps || '—', col2, y);
    y += 48;

    infoRow('Date Issued', formatDate(cert.issuedAt), col1, y);
    infoRow('Transaction Ref', cert.transactionId || '—', col2, y);
    y += 48;

    // ── Chain of Custody ──────────────────────────────────────────────────────
    doc.rect(40, y, W - 80, 1).fill('#E5E7EB');
    y += 16;

    doc.fillColor(GREEN).fontSize(12).font('Helvetica-Bold')
       .text('CHAIN OF CUSTODY', 40, y);
    y += 22;

    const chain = cert.chainOfCustody || [];
    const stepW = (W - 80) / Math.max(chain.length, 1);

    chain.forEach((step, i) => {
      const cx = 40 + i * stepW;

      // Circle
      doc.circle(cx + stepW / 2, y + 14, 14).fill(i === chain.length - 1 ? GREEN : LIGHT_GREEN);
      doc.fillColor(WHITE).fontSize(10).font('Helvetica-Bold')
         .text(String(i + 1), cx + stepW / 2 - 4, y + 8);

      // Line connector
      if (i < chain.length - 1) {
        doc.rect(cx + stepW / 2 + 14, y + 13, stepW - 28, 2).fill(LIGHT_GREEN);
      }

      // Label
      doc.fillColor(DARK_TEXT).fontSize(9).font('Helvetica-Bold')
         .text(step.step, cx, y + 34, { width: stepW, align: 'center' });
      doc.fillColor(GRAY).fontSize(8).font('Helvetica')
         .text(step.actor, cx, y + 47, { width: stepW, align: 'center' });
    });

    y += 80;

    // ── ESG statement box ─────────────────────────────────────────────────────
    doc.rect(40, y, W - 80, 60).fill(BG_LIGHT).stroke(LIGHT_GREEN);
    doc.fillColor(GREEN).fontSize(10).font('Helvetica-Bold')
       .text('ESG / CSR COMPLIANCE STATEMENT', 55, y + 10);
    doc.fillColor(DARK_TEXT).fontSize(9).font('Helvetica')
       .text(
         'This certificate confirms that the materials above were collected from registered households, ' +
         'handled by verified EcoSort collectors, and transferred through an auditable chain of custody. ' +
         'Suitable for ESG reporting, sustainability audits, and CSR documentation.',
         55, y + 24, { width: W - 110 }
       );
    y += 74;

    // ── Signature area ────────────────────────────────────────────────────────
    const sigY = H - 110;
    doc.rect(40, sigY, W - 80, 1).fill('#E5E7EB');

    doc.fillColor(GRAY).fontSize(8).font('Helvetica')
       .text('Digitally issued by EcoSort Platform', 40, sigY + 10)
       .text(`Generated: ${new Date().toUTCString()}`, 40, sigY + 22);

    doc.fillColor(GREEN).fontSize(9).font('Helvetica-Bold')
       .text('www.ecosort.com  |  support@ecosort.com', 0, sigY + 10, { align: 'right', width: W - 40 });

    // ── Bottom bar ────────────────────────────────────────────────────────────
    doc.rect(0, H - 30, W, 30).fill(GREEN);
    doc.fillColor(WHITE).fontSize(8).font('Helvetica')
       .text('EcoSort — Turning Waste into Value while Keeping Nigeria Clean', 0, H - 18, { align: 'center', width: W });

    doc.end();
  });
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return iso; }
}

module.exports = { generateCertificatePDF };
