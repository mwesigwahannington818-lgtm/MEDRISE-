export interface PrintPrescriptionData {
  patientName: string;
  visitDate: string;
  staffName?: string | null;
  chiefComplaint?: string | null;
  diagnosis?: string | null;
  treatmentPlan?: string | null;
  prescriptions?: string | null;
  referral?: string | null;
  followUpDate?: string | null;
  notes?: string | null;
}

export interface PrintLabResultData {
  patientName: string;
  testName: string;
  orderedAt: string;
  priority: string;
  clinicalInfo?: string | null;
  staffName?: string | null;
  results?: {
    result?: string | null;
    unit?: string | null;
    referenceRange?: string | null;
    interpretation?: string | null;
    notes?: string | null;
  }[];
}

const CLINIC_NAME = "MEDRISE MEDICAL CENTRE";
const CLINIC_ADDRESS = "Lwadda A, Matugga, Gombe Division, Wakiso District, Uganda";
const CLINIC_PHONE = "+256 770 775268 / +256 751 527730";
const CLINIC_EMAIL = "medrisemedicalcentre@gmail.com";

function getLogoUrl(): string {
  return window.location.origin + "/images/medrise-logo.jpg";
}

function baseStyles(): string {
  const logoUrl = getLogoUrl();
  return `
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; font-size: 12pt; color: #111; padding: 24pt; position: relative; }
      body::before {
        content: ''; position: fixed; top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        width: 280px; height: 280px;
        background-image: url('${logoUrl}');
        background-size: contain; background-repeat: no-repeat; background-position: center;
        opacity: 0.05; pointer-events: none; z-index: -1;
      }
      .doc-header { text-align: center; border-bottom: 3px solid #003087; padding-bottom: 12pt; margin-bottom: 16pt; }
      .doc-header img { height: 60px; object-fit: contain; display: block; margin: 0 auto 8px; }
      .doc-header h1 { font-size: 18pt; font-weight: 900; color: #003087; letter-spacing: 1px; }
      .doc-header p { font-size: 9pt; color: #555; margin-top: 3pt; }
      .green-bar { height: 4px; background: linear-gradient(90deg, #1a8a4c, #003087); border-radius: 2px; margin-top: 10px; }
      .doc-title { text-align: center; font-size: 13pt; font-weight: bold; text-decoration: underline; margin-bottom: 14pt; color: #003087; }
      .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 6pt; margin-bottom: 14pt; font-size: 10.5pt; }
      .meta-item { display: flex; gap: 6pt; }
      .meta-label { font-weight: bold; color: #333; min-width: 90pt; }
      .section { margin-bottom: 12pt; }
      .section-title {
        font-size: 10pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;
        color: #fff; background: linear-gradient(90deg, #003087, #1a8a4c);
        padding: 5px 10px; border-radius: 4px; margin-bottom: 6pt;
      }
      .section-body { font-size: 11pt; line-height: 1.6; white-space: pre-wrap; padding: 6pt 2pt; }
      .rx-symbol { font-size: 22pt; font-weight: bold; color: #003087; float: left; margin-right: 8pt; line-height: 1; }
      .prescription-box { border: 1pt solid #aaa; border-radius: 4pt; padding: 10pt 14pt; min-height: 100pt; background: #f0fdf4; }
      table { width: 100%; border-collapse: collapse; font-size: 10.5pt; }
      th { background: linear-gradient(90deg, #003087, #1a8a4c); color: white; padding: 6pt 8pt; text-align: left; font-size: 9.5pt; }
      td { padding: 5pt 8pt; border-bottom: 1pt solid #e8e8e8; }
      tr:nth-child(even) td { background: #f0fdf4; }
      .badge { display: inline-block; padding: 2pt 6pt; border-radius: 3pt; font-size: 9pt; font-weight: bold; }
      .badge-normal { background: #d5f5e3; color: #1e8449; }
      .badge-high { background: #fadbd8; color: #c0392b; }
      .badge-low { background: #fdebd0; color: #e67e22; }
      .badge-critical { background: #f9ebea; color: #c0392b; border: 1pt solid #e74c3c; }
      .footer { margin-top: 24pt; border-top: 1pt solid #ccc; padding-top: 10pt; display: flex; justify-content: space-between; font-size: 9pt; color: #777; }
      .signature-box { margin-top: 20pt; }
      .signature-line { border-top: 1.5pt solid #003087; width: 160pt; margin-top: 30pt; }
      .signature-label { font-size: 9pt; color: #555; margin-top: 4pt; }
      @media print { body { padding: 16pt; } }
    </style>
  `;
}

function clinicHeader(): string {
  const logoUrl = getLogoUrl();
  return `
    <div class="doc-header">
      <img src="${logoUrl}" alt="${CLINIC_NAME}" onerror="this.style.display='none'" />
      <h1>${CLINIC_NAME}</h1>
      <p>${CLINIC_ADDRESS}</p>
      <p>Tel: ${CLINIC_PHONE} &bull; ${CLINIC_EMAIL}</p>
      <div class="green-bar"></div>
    </div>
  `;
}

function docFooter(): string {
  const now = new Date().toLocaleString("en-UG", { dateStyle: "long", timeStyle: "short" });
  return `
    <div class="footer">
      <span>Generated: ${now}</span>
      <span>CONFIDENTIAL — ${CLINIC_NAME}</span>
    </div>
  `;
}

export function printPrescription(data: PrintPrescriptionData): void {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Prescription — ${data.patientName}</title>${baseStyles()}</head><body>
    ${clinicHeader()}
    <div class="doc-title">OUTPATIENT PRESCRIPTION</div>
    <div class="meta">
      <div class="meta-item"><span class="meta-label">Patient:</span><span>${data.patientName}</span></div>
      <div class="meta-item"><span class="meta-label">Visit Date:</span><span>${data.visitDate}</span></div>
      ${data.staffName ? `<div class="meta-item"><span class="meta-label">Attending:</span><span>Dr. ${data.staffName}</span></div>` : ""}
      ${data.followUpDate ? `<div class="meta-item"><span class="meta-label">Follow-Up:</span><span>${data.followUpDate}</span></div>` : ""}
    </div>

    ${data.chiefComplaint ? `<div class="section"><div class="section-title">Chief Complaint</div><div class="section-body">${data.chiefComplaint}</div></div>` : ""}
    ${data.diagnosis ? `<div class="section"><div class="section-title">Diagnosis</div><div class="section-body">${data.diagnosis}</div></div>` : ""}
    ${data.treatmentPlan ? `<div class="section"><div class="section-title">Treatment Plan</div><div class="section-body">${data.treatmentPlan}</div></div>` : ""}

    <div class="section">
      <div class="section-title">Prescriptions</div>
      <div class="prescription-box">
        <span class="rx-symbol">℞</span>
        <div class="section-body" style="margin-left: 32pt;">${data.prescriptions ?? "No prescriptions recorded."}</div>
      </div>
    </div>

    ${data.referral ? `<div class="section"><div class="section-title">Referral</div><div class="section-body">${data.referral}</div></div>` : ""}
    ${data.notes ? `<div class="section"><div class="section-title">Clinical Notes</div><div class="section-body">${data.notes}</div></div>` : ""}

    <div class="signature-box" style="display:flex; gap: 60pt;">
      <div>
        <div class="signature-line"></div>
        <div class="signature-label">Clinician Signature</div>
      </div>
      <div>
        <div class="signature-line"></div>
        <div class="signature-label">Date</div>
      </div>
    </div>
    ${docFooter()}
    <script>window.onload = function(){ window.print(); }<\/script>
  </body></html>`;

  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
}

export function printLabResult(data: PrintLabResultData): void {
  const interpretationBadge = (interp?: string | null) => {
    if (!interp) return "";
    const cls = interp === "Normal" ? "badge-normal" : interp === "High" ? "badge-high" : interp === "Low" ? "badge-low" : interp === "Critical" ? "badge-critical" : "";
    return `<span class="badge ${cls}">${interp}</span>`;
  };

  const resultsHtml = data.results && data.results.length > 0
    ? `<table>
        <thead><tr><th>Parameter</th><th>Result</th><th>Unit</th><th>Reference Range</th><th>Interpretation</th><th>Notes</th></tr></thead>
        <tbody>
          ${data.results.map(r => `
            <tr>
              <td>${data.testName}</td>
              <td><strong>${r.result ?? "—"}</strong></td>
              <td>${r.unit ?? "—"}</td>
              <td>${r.referenceRange ?? "—"}</td>
              <td>${interpretationBadge(r.interpretation)}</td>
              <td>${r.notes ?? "—"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>`
    : `<p style="color:#888; font-style:italic;">Results pending or not yet recorded.</p>`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Lab Result — ${data.patientName}</title>${baseStyles()}</head><body>
    ${clinicHeader()}
    <div class="doc-title">LABORATORY RESULT REPORT</div>
    <div class="meta">
      <div class="meta-item"><span class="meta-label">Patient:</span><span>${data.patientName}</span></div>
      <div class="meta-item"><span class="meta-label">Test:</span><span>${data.testName}</span></div>
      <div class="meta-item"><span class="meta-label">Ordered:</span><span>${new Date(data.orderedAt).toLocaleDateString("en-UG")}</span></div>
      <div class="meta-item"><span class="meta-label">Priority:</span><span>${data.priority.toUpperCase()}</span></div>
      ${data.staffName ? `<div class="meta-item"><span class="meta-label">Ordered By:</span><span>Dr. ${data.staffName}</span></div>` : ""}
      ${data.clinicalInfo ? `<div class="meta-item" style="grid-column: span 2;"><span class="meta-label">Clinical Info:</span><span>${data.clinicalInfo}</span></div>` : ""}
    </div>

    <div class="section">
      <div class="section-title">Test Results</div>
      ${resultsHtml}
    </div>

    <div class="signature-box" style="display:flex; gap: 60pt; margin-top: 24pt;">
      <div>
        <div class="signature-line"></div>
        <div class="signature-label">Lab Technician Signature</div>
      </div>
      <div>
        <div class="signature-line"></div>
        <div class="signature-label">Date Reported</div>
      </div>
    </div>
    ${docFooter()}
    <script>window.onload = function(){ window.print(); }<\/script>
  </body></html>`;

  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
}
