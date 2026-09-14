/*
  resume-export.js
  ------------------------------------------------------------------
  Drop-in, no-build-step resume export for a static site.
  Two buttons call the two functions at the bottom of this file:

    <button onclick="exportResumeDocx()">Download Resume (.docx)</button>
    <button onclick="exportResumePdf()">Download Resume (PDF)</button>

  Requires, before this script tag:
    <script src="https://unpkg.com/docx@9.7.1/build/index.js"></script>
  (only needed for the .docx path — the PDF path uses the browser's
  own print engine, no library required)

  Both paths read from the same resume-data.json, so editing that one
  file (by hand, or later through the admin panel) keeps the resume,
  the DOCX export, and the PDF export all in sync automatically.
  ------------------------------------------------------------------
*/

async function loadResumeData() {
  const res = await fetch("data/resume-data.json");
  if (!res.ok) throw new Error("Could not load resume-data.json");
  return res.json();
}

/* ============================== DOCX ============================== */

async function exportResumeDocx() {
  const data = await loadResumeData();
  const {
    Document, Packer, Paragraph, TextRun, BorderStyle,
    AlignmentType, LevelFormat, convertInchesToTwip
  } = docx; // global from the CDN UMD build

  const NAVY = "1F2937", ACCENT = "2563EB", GREY = "444444";

  const sectionHeading = (text) => new Paragraph({
    spacing: { before: 160, after: 70 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 2 } },
    children: [new TextRun({ text, bold: true, size: 21, color: NAVY, allCaps: true, font: "Calibri" })]
  });

  const bullet = (text, opts = {}) => new Paragraph({
    numbering: { reference: "resume-bullets", level: 0 },
    spacing: { after: 30, line: 252 },
    children: [new TextRun({ text, size: 19, color: "111111", font: "Calibri", ...opts })]
  });

  const body = (text, opts = {}) => new Paragraph({
    spacing: { after: 70, line: 252 },
    children: [new TextRun({ text, size: 19, color: "111111", font: "Calibri", ...opts })]
  });

  const children = [];

  children.push(new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 20 },
    children: [new TextRun({ text: data.name, bold: true, size: 32, color: NAVY, font: "Calibri" })]
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 40 },
    children: [new TextRun({ text: data.title, bold: true, size: 23, color: ACCENT, font: "Calibri" })]
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 40 },
    children: [new TextRun({ text: data.tagline, italics: true, size: 18, color: GREY, font: "Calibri" })]
  }));
  const c = data.contact;
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 160 },
    children: [new TextRun({
      text: `${c.location} · ${c.remote} | ${c.email} | ${c.linkedin} | ${c.phone}`,
      size: 18, color: GREY, font: "Calibri"
    })]
  }));

  children.push(sectionHeading("Executive Summary"));
  children.push(body(data.executiveSummary));

  children.push(sectionHeading("Impact Snapshot"));
  data.impactSnapshot.forEach(item => children.push(bullet(item)));

  children.push(sectionHeading("Core Expertise"));
  data.coreExpertise.forEach(item => children.push(bullet(item)));

  children.push(sectionHeading("Technology Stack"));
  data.techStack.forEach(row => {
    children.push(new Paragraph({
      spacing: { after: 30 },
      children: [
        new TextRun({ text: `${row.label}: `, bold: true, size: 19, color: "111111", font: "Calibri" }),
        new TextRun({ text: row.value, size: 19, color: "111111", font: "Calibri" })
      ]
    }));
  });

  children.push(sectionHeading("Professional Experience"));
  data.experience.forEach(job => {
    children.push(new Paragraph({
      spacing: { before: 60, after: 10 },
      children: [new TextRun({ text: job.title, bold: true, size: 21, color: NAVY, font: "Calibri" })]
    }));
    children.push(new Paragraph({
      spacing: { after: 30 },
      children: [new TextRun({ text: `${job.org} | ${job.dates}`, italics: true, size: 19, color: GREY, font: "Calibri" })]
    }));
    if (job.intro) children.push(body(job.intro));
    job.bullets.forEach(b => children.push(bullet(b)));
  });

  children.push(sectionHeading("Marketing Infrastructure Designed"));
  data.infrastructure.forEach(proj => {
    children.push(new Paragraph({
      spacing: { before: 60, after: 20 },
      children: [new TextRun({ text: proj.title, bold: true, size: 21, color: NAVY, font: "Calibri" })]
    }));
    children.push(new Paragraph({
      spacing: { after: 20 },
      children: [
        new TextRun({ text: "Problem: ", bold: true, size: 19, font: "Calibri" }),
        new TextRun({ text: proj.problem, size: 19, font: "Calibri" })
      ]
    }));
    children.push(new Paragraph({
      spacing: { after: 20 },
      children: [
        new TextRun({ text: "Built: ", bold: true, size: 19, font: "Calibri" }),
        new TextRun({ text: proj.built, size: 19, font: "Calibri" })
      ]
    }));
    children.push(new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({ text: "Result: ", bold: true, size: 19, font: "Calibri" }),
        new TextRun({ text: proj.result, size: 19, font: "Calibri" })
      ]
    }));
  });

  children.push(sectionHeading("Education & Certifications"));
  data.education.forEach(item => children.push(bullet(item)));

  const document = new Document({
    numbering: {
      config: [{
        reference: "resume-bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: convertInchesToTwip(0.25), hanging: convertInchesToTwip(0.18) } } }
        }]
      }]
    },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 }, // US Letter
          margin: { top: 500, bottom: 500, left: 720, right: 720 }
        }
      },
      children
    }]
  });

  const blob = await Packer.toBlob(document);
  downloadBlob(blob, "Jaswant_Kanojia_Resume.docx");
}

/* ============================== PDF (print) ============================== */
/*
  No PDF library needed: we render the same data into a hidden,
  print-styled view and let the browser's native "Print > Save as PDF"
  produce the file. This keeps typography/kerning identical to real
  print output and needs zero dependencies. See resume-print.css.
*/

async function exportResumePdf() {
  const data = await loadResumeData();
  const view = document.getElementById("resume-print-view");
  view.innerHTML = renderResumeHtml(data);
  document.body.classList.add("printing-resume");
  window.print();
  document.body.classList.remove("printing-resume");
}

function renderResumeHtml(d) {
  const esc = (s) => String(s).replace(/[&<>]/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[m]));
  const bullets = (arr) => `<ul>${arr.map(i => `<li>${esc(i)}</li>`).join("")}</ul>`;

  return `
    <h1>${esc(d.name)}</h1>
    <p class="title">${esc(d.title)}</p>
    <p class="tagline">${esc(d.tagline)}</p>
    <p class="contact">${esc(d.contact.location)} · ${esc(d.contact.remote)} | ${esc(d.contact.email)} | ${esc(d.contact.linkedin)} | ${esc(d.contact.phone)}</p>

    <h2>Executive Summary</h2>
    <p>${esc(d.executiveSummary)}</p>

    <h2>Impact Snapshot</h2>
    ${bullets(d.impactSnapshot)}

    <h2>Core Expertise</h2>
    ${bullets(d.coreExpertise)}

    <h2>Technology Stack</h2>
    ${d.techStack.map(r => `<p><strong>${esc(r.label)}:</strong> ${esc(r.value)}</p>`).join("")}

    <h2>Professional Experience</h2>
    ${d.experience.map(job => `
      <h3>${esc(job.title)}</h3>
      <p class="meta">${esc(job.org)} | ${esc(job.dates)}</p>
      ${job.intro ? `<p>${esc(job.intro)}</p>` : ""}
      ${bullets(job.bullets)}
    `).join("")}

    <h2>Marketing Infrastructure Designed</h2>
    ${d.infrastructure.map(p => `
      <h3>${esc(p.title)}</h3>
      <p><strong>Problem:</strong> ${esc(p.problem)}</p>
      <p><strong>Built:</strong> ${esc(p.built)}</p>
      <p><strong>Result:</strong> ${esc(p.result)}</p>
    `).join("")}

    <h2>Education &amp; Certifications</h2>
    ${bullets(d.education)}
  `;
}

/* ============================== shared ============================== */

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
