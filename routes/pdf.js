const express = require('express');
const { PDFDocument, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const db = require('../db');
const router = express.Router();

const selectById = db.prepare('SELECT * FROM ratings WHERE id = ?');

// Map template keywords to filenames
const TEMPLATE_MAP = {
  default: 'new performance rating pdf.pdf',
  workplan: 'Employee Work Plan form.pdf',
  blanker: 'Blanker  - Supervisory and Administrative 02-13 .pdf',
  outside: 'Outside Employment.pdf'
};

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const record = selectById.get(id);
  if (!record) return res.status(404).json({ error: 'Rating not found' });

  // Pick template
  const key = (req.query.template || 'default').toLowerCase();
  const filename = TEMPLATE_MAP[key] || TEMPLATE_MAP.default;
  const templatePath = path.join(__dirname, '..', 'public', 'assets', filename);

  if (!fs.existsSync(templatePath)) {
    return res.status(500).json({ error: `PDF template not found: ${filename}` });
  }

  try {
    const existingPdfBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { height } = firstPage.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 10;

    // Simple overlay (adjust coordinates as needed per template)
    const leftMargin = 50;
    let y = height - 120;

    const writeLine = (text, x = leftMargin, dy = 14) => {
      firstPage.drawText(text || '', { x, y, size: fontSize, font });
      y -= dy;
    };

    writeLine(`Employee Name: ${record.employee_name}`);
    writeLine(`Employee ID: ${record.employee_id}`);
    writeLine(`Position: ${record.position}`);
    writeLine(`Department: ${record.department}`);
    writeLine(`Reviewer: ${record.reviewer}`);
    writeLine(`Rating Period: ${record.review_period_start || ''} - ${record.review_period_end || ''}`);
    writeLine(`Overall Rating: ${record.overall_rating}`);
    y -= 6;
    writeLine(`Strengths: ${record.strengths || ''}`, leftMargin, 12);
    writeLine(`Areas to Improve: ${record.improvements || ''}`, leftMargin, 12);
    writeLine(`Goals: ${record.goals || ''}`, leftMargin, 12);

    const pdfBytes = await pdfDoc.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="rating-${id}-${key}.pdf"`);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'PDF generation failed' });
  }
});

module.exports = router;
