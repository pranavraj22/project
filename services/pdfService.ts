import { ExamData, QA } from "../types";
import { jsPDF } from "jspdf";

declare global {
  interface Window {
    html2pdf: any;
  }
}

// Fallback method using html2pdf if simple element capture is needed
export const generateRobustPdf = async (elementId: string, options: any) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with ID ${elementId} not found`);
    return false;
  }

  if (typeof window.html2pdf !== 'function') {
    console.error("html2pdf library not found. Please ensure the script is loaded.");
    return false;
  }

  try {
    const worker = window.html2pdf();
    await worker.set(options).from(element).save();
    return true;
  } catch (e) {
    console.error("html2pdf error:", e);
    return false;
  }
};

export const generateLearningPlanPdf = async (units: any[], subject: string, college: string, semester: string) => {
  const elementId = 'learning-plan-pdf';
  const filename = `${subject.trim().replace(/[^a-z0-9]/gi, '_')}_MasterPlan.pdf`;
  
  const options = {
    margin: [15, 15, 15, 15],
    filename: filename,
    image: { type: 'jpeg', quality: 1.0 },
    html2canvas: { 
      scale: 2, 
      useCORS: true, 
      backgroundColor: '#ffffff', 
      logging: false,
      letterRendering: true,
      windowWidth: 800
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  return await generateRobustPdf(elementId, options);
};

export const generateSkillRoadmapPdf = async (topic: string) => {
  const elementId = 'skill-mastery-pdf';
  const filename = `${topic.trim().replace(/[^a-z0-9]/gi, '_')}_ZeroToHero.pdf`;

  const options = {
    margin: [15, 15, 15, 15],
    filename: filename,
    image: { type: 'jpeg', quality: 1.0 },
    html2canvas: { 
      scale: 2, 
      useCORS: true, 
      backgroundColor: '#ffffff', 
      logging: false,
      letterRendering: true,
      windowWidth: 800
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'], avoid: ['.break-inside-avoid'] }
  };

  return await generateRobustPdf(elementId, options);
};

// --- NEW ROBUST PDF GENERATOR FOR EXAMS ---

class PDFGenerator {
  doc: any;
  y: number;
  pageHeight: number;
  pageWidth: number;
  margin: number;
  lineHeight: number;

  constructor(jsPDFInstance: any) {
    this.doc = new jsPDFInstance({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;
    this.margin = 20;
    this.y = this.margin;
    this.lineHeight = 7; // Approx line height for 11pt font
  }

  addHeader(text: string, subText: string) {
    const pageCount = this.doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      if (i === 1) continue; // Skip header on cover page

      this.doc.setFont("helvetica", "bold");
      this.doc.setFontSize(10);
      this.doc.setTextColor(30, 58, 138); // Navy
      this.doc.text(text, this.margin, 15);
      
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(9);
      this.doc.setTextColor(100);
      this.doc.text(subText, this.margin, 20);

      this.doc.text(`Page ${i} of ${pageCount}`, this.pageWidth - this.margin, 15, { align: 'right' });
      
      // Separator line
      this.doc.setDrawColor(200, 200, 200);
      this.doc.line(this.margin, 23, this.pageWidth - this.margin, 23);
    }
  }

  addFooter(footerText: string) {
    const pageCount = this.doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(8);
      this.doc.setTextColor(150);
      
      // Separator line
      this.doc.setDrawColor(200, 200, 200);
      this.doc.line(this.margin, this.pageHeight - 15, this.pageWidth - this.margin, this.pageHeight - 15);

      this.doc.text(footerText, this.pageWidth / 2, this.pageHeight - 10, { align: 'center' });
    }
  }

  checkPageBreak(heightNeeded: number) {
    if (this.y + heightNeeded > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.y = 30; // Start lower to account for header
      return true;
    }
    return false;
  }

  addCoverPage(data: ExamData, userDetails: any) {
    // Background accent
    this.doc.setFillColor(30, 58, 138); // Navy
    this.doc.rect(0, 0, this.pageWidth, 15, 'F');

    this.y = 60;
    
    // Title
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(28);
    this.doc.setTextColor(30, 58, 138);
    
    const splitTitle = this.doc.splitTextToSize(data.topicName.toUpperCase(), this.pageWidth - (2 * this.margin));
    this.doc.text(splitTitle, this.pageWidth / 2, this.y, { align: 'center' });
    this.y += (splitTitle.length * 12) + 20;

    this.doc.setFontSize(16);
    this.doc.setTextColor(100);
    this.doc.text("EXAM MASTER GUIDE", this.pageWidth / 2, this.y, { align: 'center' });
    this.y += 30;

    // Metadata Box
    this.doc.setDrawColor(30, 58, 138);
    this.doc.setLineWidth(0.5);
    this.doc.setFillColor(248, 250, 252);
    this.doc.roundedRect(this.margin, this.y, this.pageWidth - (2 * this.margin), 60, 3, 3, 'FD');
    
    const boxY = this.y + 15;
    const col1X = this.margin + 10;
    const col2X = this.pageWidth / 2 + 10;

    this.doc.setFontSize(11);
    this.doc.setTextColor(50);
    
    this.doc.setFont("helvetica", "bold");
    this.doc.text("College:", col1X, boxY);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(userDetails?.college || "N/A", col1X + 25, boxY);

    this.doc.setFont("helvetica", "bold");
    this.doc.text("Subject:", col2X, boxY);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(userDetails?.subject || "N/A", col2X + 25, boxY);

    this.doc.setFont("helvetica", "bold");
    this.doc.text("Semester:", col1X, boxY + 10);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(userDetails?.semester || "N/A", col1X + 25, boxY + 10);

    this.doc.setFont("helvetica", "bold");
    this.doc.text("Exam Type:", col2X, boxY + 10);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(userDetails?.examType || "N/A", col2X + 25, boxY + 10);

    this.doc.setFont("helvetica", "bold");
    this.doc.text("Date:", col1X, boxY + 20);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(new Date().toLocaleDateString(), col1X + 25, boxY + 20);

    if (userDetails?.units) {
      this.doc.setFont("helvetica", "bold");
      this.doc.text("Units:", col2X, boxY + 20);
      this.doc.setFont("helvetica", "normal");
      this.doc.text(userDetails.units, col2X + 25, boxY + 20);
    }

    this.y += 80;

    // Table of Contents Summary
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(14);
    this.doc.setTextColor(30, 58, 138);
    this.doc.text("CONTENT SUMMARY", this.margin, this.y);
    this.y += 10;

    const summaryItems = [
      { label: "Very Short Questions", count: data.veryShortQuestions.length },
      { label: "Short Answer Questions", count: data.shortQuestions.length },
      { label: "Long Answer Questions", count: data.longQuestions.length },
      { label: "Numericals & Derivations", count: data.numericals.length },
      { label: "Examiner's Expert Tips", count: data.examinerNotes.length },
    ];

    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(12);
    this.doc.setTextColor(50);
    
    summaryItems.forEach(item => {
      if (item.count > 0) {
        this.doc.text(`• ${item.label}`, this.margin + 5, this.y);
        this.doc.text(`${item.count}`, this.pageWidth - this.margin - 10, this.y, { align: 'right' });
        this.doc.setDrawColor(220);
        this.doc.setLineWidth(0.1);
        this.doc.line(this.margin + 60, this.y, this.pageWidth - this.margin - 15, this.y); // dotted line effect manually? No just a line
        this.y += 8;
      }
    });

    this.doc.addPage();
    this.y = 30;
  }

  addSectionHeader(title: string, color: [number, number, number]) {
    this.checkPageBreak(30);
    
    this.doc.setFillColor(...color);
    this.doc.rect(this.margin, this.y, 1.5, 8, 'F'); // Colored accent bar
    
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(16);
    this.doc.setTextColor(...color);
    this.doc.text(title.toUpperCase(), this.margin + 5, this.y + 6);
    
    this.y += 15;
  }

  addQuestion(q: any, index: number) {
    // Calculate approximate height needed
    const questionText = `Q${index + 1}. ${q.question}`;
    const cleanAnswer = q.answer.replace(/\*\*/g, ''); // Remove markdown bold for simple text wrap
    
    const qLines = this.doc.splitTextToSize(questionText, this.pageWidth - (2 * this.margin));
    const aLines = this.doc.splitTextToSize(cleanAnswer, this.pageWidth - (2 * this.margin) - 5); // Indented
    
    const heightNeeded = (qLines.length * 6) + (aLines.length * 5) + 20;

    this.checkPageBreak(heightNeeded);

    // Question
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(12);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(qLines, this.margin, this.y);
    this.y += (qLines.length * 6) + 2;

    // Answer
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(11);
    this.doc.setTextColor(50);
    
    // Draw left border for answer
    this.doc.setDrawColor(220, 220, 220);
    this.doc.setLineWidth(0.5);
    const answerHeight = aLines.length * 5;
    this.doc.line(this.margin, this.y, this.margin, this.y + answerHeight);
    
    this.doc.text(aLines, this.margin + 4, this.y + 4);
    this.y += answerHeight + 6;

    // Diagram Hint
    if (q.diagramPrompt) {
      this.checkPageBreak(15);
      this.doc.setFontSize(9);
      this.doc.setTextColor(100);
      this.doc.setFont("helvetica", "italic");
      this.doc.text(`[Visual Tip: ${q.diagramPrompt}]`, this.margin + 4, this.y);
      this.y += 8;
    }

    this.y += 6; // Spacing between questions
  }
}


export const generateExamPdf = async (data: ExamData, userDetails?: any) => {
  // Use the imported jsPDF class
  const builder = new PDFGenerator(jsPDF);
  const filename = `${data.topicName.trim().replace(/[^a-z0-9]/gi, '_')}_MasterGuide.pdf`;

  // 1. Cover Page
  builder.addCoverPage(data, userDetails);

  // 2. Sections
  if (data.veryShortQuestions.length > 0) {
    builder.addSectionHeader("Part A: Very Short Questions (1-2 Marks)", [16, 185, 129]); // Emerald
    data.veryShortQuestions.forEach((q, i) => builder.addQuestion(q, i));
  }

  if (data.shortQuestions.length > 0) {
    builder.addSectionHeader("Part B: Short Answer Questions (3-5 Marks)", [37, 99, 235]); // Blue
    data.shortQuestions.forEach((q, i) => builder.addQuestion(q, i));
  }

  if (data.longQuestions.length > 0) {
    builder.addSectionHeader("Part C: Long Answer / Essays (8-16 Marks)", [147, 51, 234]); // Purple
    data.longQuestions.forEach((q, i) => builder.addQuestion(q, i));
  }

  if (data.numericals.length > 0) {
    builder.addSectionHeader("Part D: Numericals & Derivations", [234, 88, 12]); // Orange
    data.numericals.forEach((q, i) => builder.addQuestion(q, i));
  }

  if (data.examinerNotes && data.examinerNotes.length > 0) {
    builder.checkPageBreak(60);
    builder.addSectionHeader("Examiner's Expert Tips", [202, 138, 4]); // Amber
    
    builder.doc.setFillColor(254, 252, 232); // yellow-50
    const startY = builder.y;
    // We need to calculate height first to draw rect, but simple approach: just list them
    
    builder.doc.setFont("helvetica", "bold");
    builder.doc.setFontSize(11);
    builder.doc.setTextColor(133, 77, 14); // yellow-900

    data.examinerNotes.forEach(note => {
      const lines = builder.doc.splitTextToSize(`• ${note}`, builder.pageWidth - (2 * builder.margin));
      builder.checkPageBreak(lines.length * 6);
      builder.doc.text(lines, builder.margin, builder.y);
      builder.y += lines.length * 6 + 2;
    });
  }

  // 3. Global Header/Footer
  builder.addHeader("Note2Exam AI - Study Master Guide", `${data.topicName} - ${userDetails?.subject || ''}`);
  builder.addFooter(`Generated by Note2Exam AI on ${new Date().toLocaleDateString()} • Optimized for University Standards`);

  // 4. Save
  builder.doc.save(filename);
  return true;
};