// Writes public/announcements/sample-notice.pdf: a one-page placeholder that
// says SAMPLE. Run: node scripts/make-sample-pdf.mjs
import { writeFileSync, mkdirSync } from "node:fs";

const text = "SAMPLE NOTICE - not a real government document";
const stream = `BT /F1 20 Tf 60 740 Td (${text}) Tj 0 -30 Td /F1 12 Tf (Amar Sheba demo placeholder PDF.) Tj ET`;
const objs = [
  "<< /Type /Catalog /Pages 2 0 R >>",
  "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
  "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
  `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
];
let pdf = "%PDF-1.4\n";
const offsets = [];
objs.forEach((o, i) => {
  offsets.push(pdf.length);
  pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
});
const xref = pdf.length;
pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
offsets.forEach((o) => (pdf += `${String(o).padStart(10, "0")} 00000 n \n`));
pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
mkdirSync("public/announcements", { recursive: true });
writeFileSync("public/announcements/sample-notice.pdf", pdf, "latin1");
console.log("wrote", pdf.length, "bytes");
