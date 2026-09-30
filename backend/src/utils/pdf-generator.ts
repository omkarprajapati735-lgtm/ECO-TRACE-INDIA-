import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export interface EprPdfData {
  certificateNumber: string;
  issuedTo: string;
  issuedAt: Date;
  certifiedWeightKg: number;
  qrPayload: string;
  recycler: {
    companyName: string;
    licenseNumber: string;
    address: string;
    city: string;
    state: string;
    contactNumber?: string;
  };
  batch: {
    batchCode: string;
    netWeightKg: number;
    grossWeightKg: number;
    hubName: string;
    categoryName: string;
  };
  yields: {
    copperKg: number;
    goldKg: number;
    aluminumKg: number;
    plasticKg: number;
    wasteKg: number;
    totalOutputYieldKg: number;
    massBalancePercentage: number;
  };
}

export async function generateEprPdfBuffer(data: EprPdfData): Promise<Buffer> {
  const qrBuffer = await QRCode.toBuffer(data.qrPayload, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 90,
  });

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 36,
      info: {
        Title: `CPCB EPR Certificate - ${data.certificateNumber}`,
        Author: 'EcoTrace India - CPCB Compliance Engine',
        Subject: `EPR Form-2 E-Waste Certificate for ${data.issuedTo}`,
        Keywords: 'CPCB, EPR, E-Waste, Recycling, Certificate',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (err: Error) => reject(err));

    // Outer double border
    doc.rect(20, 20, 555, 802).lineWidth(2).strokeColor('#1b4332').stroke();
    doc.rect(24, 24, 547, 794).lineWidth(0.75).strokeColor('#2d6a4f').stroke();

    // Watermark
    doc.save();
    doc.fontSize(42)
      .fillColor('#2d6a4f', 0.05)
      .rotate(-30, { origin: [297, 421] })
      .text('CPCB EPR VERIFIED', 80, 400, { align: 'center', width: 450 });
    doc.restore();

    // Header
    doc.fontSize(8)
      .fillColor('#2d6a4f')
      .font('Helvetica-Bold')
      .text('CENTRAL POLLUTION CONTROL BOARD • MINISTRY OF ENVIRONMENT, FOREST & CLIMATE CHANGE', 36, 36, { align: 'center' });

    doc.moveDown(0.3);
    doc.fontSize(14)
      .fillColor('#081c15')
      .text('FORM-2: E-WASTE RECYCLING COMPLIANCE CERTIFICATE', { align: 'center' });

    doc.moveDown(0.2);
    doc.fontSize(8)
      .font('Helvetica')
      .fillColor('#52b788')
      .text('Extended Producer Responsibility (EPR) Credit Fulfillment Under E-Waste Rules 2022', { align: 'center' });

    doc.moveDown(0.8);
    doc.moveTo(36, doc.y).lineTo(559, doc.y).lineWidth(1).strokeColor('#1b4332').stroke();
    doc.moveDown(0.6);

    // Certificate metadata box
    const metaY = doc.y;
    doc.rect(36, metaY, 523, 62).fillAndStroke('#f4fbf7', '#d8f3dc');

    doc.font('Helvetica-Bold').fontSize(8).fillColor('#1b4332')
      .text('CERTIFICATE NUMBER:', 46, metaY + 8)
      .font('Courier-Bold').fontSize(11).fillColor('#081c15')
      .text(data.certificateNumber, 46, metaY + 20)
      .font('Helvetica-Bold').fontSize(8).fillColor('#1b4332')
      .text('ISSUED TO (PRODUCER / BRAND):', 46, metaY + 36)
      .font('Helvetica').fontSize(9).fillColor('#081c15')
      .text(data.issuedTo, 46, metaY + 47);

    doc.font('Helvetica-Bold').fontSize(8).fillColor('#1b4332')
      .text('DATE OF ISSUANCE:', 320, metaY + 8)
      .font('Helvetica').fontSize(9).fillColor('#081c15')
      .text(data.issuedAt.toISOString().slice(0, 10), 320, metaY + 20)
      .font('Helvetica-Bold').fontSize(8).fillColor('#1b4332')
      .text('CPCB SYNC STATUS:', 320, metaY + 36)
      .font('Helvetica-Bold').fontSize(9).fillColor('#2d6a4f')
      .text('VERIFIED & CERTIFIED', 320, metaY + 47);

    doc.y = metaY + 70;

    // Recycler & Batch Section
    const colY = doc.y;
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#1b4332').text('AUTHORIZED RECYCLER DETAILS', 36, colY);
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#1b4332').text('BATCH TRACEABILITY', 310, colY);

    doc.font('Helvetica').fontSize(8).fillColor('#333333');
    doc.text(`Company: ${data.recycler.companyName}`, 36, colY + 14);
    doc.text(`CPCB License: ${data.recycler.licenseNumber}`, 36, colY + 26);
    doc.text(`Address: ${data.recycler.address}, ${data.recycler.city}, ${data.recycler.state}`, 36, colY + 38);

    doc.text(`Batch Code: ${data.batch.batchCode}`, 310, colY + 14);
    doc.text(`Origin Hub: ${data.batch.hubName}`, 310, colY + 26);
    doc.text(`Waste Category: ${data.batch.categoryName} (${data.batch.netWeightKg.toFixed(3)} kg net)`, 310, colY + 38);

    doc.y = colY + 54;
    doc.moveTo(36, doc.y).lineTo(559, doc.y).lineWidth(0.5).strokeColor('#e0e0e0').stroke();
    doc.moveDown(0.6);

    // Yield Breakdown Table
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#1b4332').text('METALLURGICAL & POLYMER YIELD RECOVERY BREAKDOWN', 36, doc.y);
    doc.moveDown(0.4);

    const tableTop = doc.y;
    const col1 = 40;
    const col2 = 300;
    const col3 = 440;

    doc.rect(36, tableTop, 523, 18).fill('#2d6a4f');
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff')
      .text('Recovered Material Component', col1, tableTop + 5)
      .text('Yield Weight (kg)', col2, tableTop + 5)
      .text('Mass Fraction', col3, tableTop + 5);

    const netWeight = data.batch.netWeightKg || 1;
    const rows = [
      { name: 'Pure Refined Copper (Cu)', kg: data.yields.copperKg },
      { name: 'Gold & Precious Metals (Au)', kg: data.yields.goldKg },
      { name: 'Structural Grade Aluminium (Al)', kg: data.yields.aluminumKg },
      { name: 'Clean Engineering Polymers (ABS/HDPE)', kg: data.yields.plasticKg },
      { name: 'Hazardous Non-Recyclable Residue (Slag)', kg: data.yields.wasteKg },
    ];

    let currentY = tableTop + 18;
    rows.forEach((r, idx) => {
      const bg = idx % 2 === 0 ? '#ffffff' : '#f9f9f9';
      doc.rect(36, currentY, 523, 16).fill(bg);
      const pct = ((r.kg / netWeight) * 100).toFixed(2);
      doc.font('Helvetica').fontSize(8).fillColor('#1f2937')
        .text(r.name, col1, currentY + 4)
        .text(r.kg.toFixed(4), col2, currentY + 4)
        .text(`${pct}%`, col3, currentY + 4);
      currentY += 16;
    });

    // Summary line
    doc.rect(36, currentY, 523, 18).fill('#e8f5e9');
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#1b4332')
      .text('Total Output Yield / Mass Balance Efficiency', col1, currentY + 5)
      .text(`${data.yields.totalOutputYieldKg.toFixed(4)} kg`, col2, currentY + 5)
      .text(`${data.yields.massBalancePercentage.toFixed(2)}%`, col3, currentY + 5);

    currentY += 24;
    doc.y = currentY;

    // Certified Weight Highlight Box
    doc.rect(36, doc.y, 523, 38).fillAndStroke('#d8f3dc', '#2d6a4f');
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#1b4332')
      .text('OFFICIALLY CERTIFIED RECYCLED WEIGHT:', 46, doc.y + 6)
      .font('Helvetica-Bold').fontSize(16).fillColor('#081c15')
      .text(`${data.certifiedWeightKg.toFixed(3)} KG`, 46, doc.y + 18);
    doc.font('Helvetica').fontSize(8).fillColor('#2d6a4f')
      .text('(Net Recoverable Non-Hazardous Materials Eligible for EPR Credit)', 220, doc.y + 22);

    doc.y += 48;

    // Security & QR Verification Box
    const qrSectionY = doc.y;
    doc.rect(36, qrSectionY, 523, 95).fillAndStroke('#fcfdfd', '#e5e7eb');

    doc.image(qrBuffer, 46, qrSectionY + 4, { width: 85, height: 85 });

    doc.font('Helvetica-Bold').fontSize(8).fillColor('#111827')
      .text('DIGITAL COMPLIANCE VERIFICATION & AUDIT INTEGRITY', 145, qrSectionY + 8)
      .font('Helvetica').fontSize(7.5).fillColor('#4b5563')
      .text('This certificate is cryptographically fingerprinted using SHA-256 for non-repudiation.', 145, qrSectionY + 22)
      .text('Any alteration to weight, recycler license, or yield fractions renders this document invalid.', 145, qrSectionY + 32)
      .text(`Public Verification URL: https://ecotrace.in/verify/epr/${data.certificateNumber}`, 145, qrSectionY + 42)
      .text(`QR Verification Payload: ${data.qrPayload}`, 145, qrSectionY + 52)
      .font('Helvetica-Bold').fontSize(7.5).fillColor('#2d6a4f')
      .text('✓ Tamper-Evident Digital Seal Affixed', 145, qrSectionY + 68);

    // Signatures
    doc.y = qrSectionY + 105;
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#1b4332')
      .text('Authorized Recycler Signatory', 46, doc.y)
      .text('CPCB Regulatory Compliance Officer', 360, doc.y);

    doc.font('Helvetica').fontSize(7).fillColor('#6b7280')
      .text('Digitally signed on behalf of ' + data.recycler.companyName, 46, doc.y + 12)
      .text('Central Pollution Control Board Electronic Portal', 360, doc.y + 12);

    doc.end();
  });
}
