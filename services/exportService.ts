import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import { Question, QuestionPaper, QuestionType } from '../types';

export const exportToPDF = (paper: QuestionPaper) => {
  const doc = new jsPDF();
  const margin = 20;
  let yPos = 20;

  // Header
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(paper.title, 105, yPos, { align: 'center' });
  yPos += 15;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Course Code: ${paper.courseCode}`, margin, yPos);
  doc.text(`Duration: ${paper.durationMinutes} mins`, 190, yPos, { align: 'right' });
  yPos += 7;

  doc.text(`Faculty: ${paper.facultyName}`, margin, yPos);
  doc.text(`Total Marks: ${paper.totalMarks}`, 190, yPos, { align: 'right' });
  yPos += 15;

  doc.setLineWidth(0.5);
  doc.line(margin, yPos, 190, yPos);
  yPos += 15;

  // Questions
  paper.questions.forEach((q, index) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFont('helvetica', 'bold');
    const qHeader = `Q${index + 1}. [${q.marks} Marks]`;
    doc.text(qHeader, margin, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'normal');
    const splitText = doc.splitTextToSize(q.text, 170);
    doc.text(splitText, margin, yPos);
    yPos += (splitText.length * 7);

    if (q.type === QuestionType.MCQ && q.options) {
      q.options.forEach((opt, optIdx) => {
        const optLabel = `${String.fromCharCode(65 + optIdx)}. ${opt}`;
        doc.text(optLabel, margin + 10, yPos);
        yPos += 7;
      });
    }

    yPos += 10;
  });

  // Answer Key on new page
  doc.addPage();
  yPos = 20;
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('ANSWER KEY', 105, yPos, { align: 'center' });
  yPos += 15;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  paper.questions.forEach((q, index) => {
    doc.text(`Q${index + 1}: ${q.correctAnswer}`, margin, yPos);
    yPos += 10;
  });

  doc.save(`${paper.title.replace(/\s+/g, '_')}.pdf`);
};

export const exportToDocx = async (paper: QuestionPaper) => {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: paper.title,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Course Code: ${paper.courseCode}`, bold: true }),
              new TextRun({ text: `\t\t\t\tDuration: ${paper.durationMinutes} mins`, bold: true }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Faculty: ${paper.facultyName}`, bold: true }),
              new TextRun({ text: `\t\t\t\tTotal Marks: ${paper.totalMarks}`, bold: true }),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            border: { bottom: { color: "auto", space: 1, style: BorderStyle.SINGLE, size: 6 } },
            text: "",
          }),
          new Paragraph({ text: "" }),
          ...paper.questions.flatMap((q, index) => {
            const questionElements = [
              new Paragraph({
                children: [
                  new TextRun({ text: `Q${index + 1}. [${q.marks} Marks]`, bold: true }),
                ],
                spacing: { before: 200 },
              }),
              new Paragraph({
                text: q.text,
                spacing: { after: 100 },
              }),
            ];

            if (q.type === QuestionType.MCQ && q.options) {
              q.options.forEach((opt, optIdx) => {
                questionElements.push(
                  new Paragraph({
                    text: `${String.fromCharCode(65 + optIdx)}. ${opt}`,
                    indent: { left: 720 },
                  })
                );
              });
            }

            return questionElements;
          }),
          new Paragraph({ text: "", pageBreakBefore: true }),
          new Paragraph({
            text: "ANSWER KEY",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          ...paper.questions.map((q, index) => (
            new Paragraph({
              text: `Q${index + 1}: ${q.correctAnswer}`,
              spacing: { before: 100 },
            })
          )),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${paper.title.replace(/\s+/g, '_')}.docx`);
};
