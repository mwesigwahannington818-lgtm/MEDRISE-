import React, { useState } from "react";
import { useListQueue, useAddToQueue, useUpdateQueueEntry, useRemoveFromQueue, useListPatients, useListStaff, getListQueueQueryKey, useCreateVitals, useCreatePatient, getListPatientsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  UserPlus, Clock, Stethoscope, CheckCircle2, SkipForward,
  Trash2, AlertTriangle, RefreshCw, ChevronRight, Users,
  ArrowRightLeft, Activity, Bell, BellRing, Building2, Home, Phone,
  MessageSquare, ClipboardList, Printer,
} from "lucide-react";

const LOGO_URL = () => window.location.origin + "/images/medrise-logo.jpg";

const PRINT_BASE_STYLES = () => `
  *{box-sizing:border-box;}
  body{font-family:Arial,sans-serif;margin:0;padding:28px;color:#222;font-size:13px;position:relative;}
  body::before{content:'';position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
    width:300px;height:300px;background-image:url('${LOGO_URL()}');
    background-size:contain;background-repeat:no-repeat;background-position:center;
    opacity:0.05;pointer-events:none;z-index:-1;}
  .doc-header{text-align:center;border-bottom:3px solid #003087;padding-bottom:14px;margin-bottom:18px;}
  .doc-header img{height:65px;object-fit:contain;display:block;margin:0 auto 8px;}
  .doc-header h1{color:#003087;margin:0;font-size:20px;font-weight:900;letter-spacing:1px;}
  .doc-header .sub{margin:3px 0;color:#555;font-size:11px;}
  .doc-header .green-bar{height:4px;background:linear-gradient(90deg,#1a8a4c,#003087);border-radius:2px;margin-top:10px;}
  .doc-title{font-size:16px;font-weight:bold;color:#003087;text-align:center;margin:0 0 18px;text-transform:uppercase;letter-spacing:.5px;}
  .section{margin-bottom:14px;}
  .section h3{font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.5px;
    background:linear-gradient(90deg,#003087,#1a8a4c);padding:5px 10px;border-radius:4px;margin-bottom:8px;}
  table{width:100%;border-collapse:collapse;}
  td{padding:5px 8px;vertical-align:top;}
  .sig-row{display:flex;justify-content:space-between;margin-top:44px;gap:16px;}
  .sig-box{text-align:center;flex:1;}
  .sig-line{border-top:1.5px solid #003087;margin-top:44px;padding-top:5px;font-size:11px;color:#333;}
  .doc-footer{text-align:center;color:#aaa;font-size:10px;margin-top:24px;border-top:1px solid #eee;padding-top:10px;}
  @media print{body{padding:18px;} @page{margin:1.2cm;}}
`;

const printHeader = () => `
  <div class="doc-header">
    <img src="${LOGO_URL()}" alt="MedRise" onerror="this.style.display='none'" />
    <h1>MEDRISE MEDICAL CENTRE</h1>
    <p class="sub">Lwadda A, Matugga, Gombe Division, Wakiso District, Uganda</p>
    <p class="sub">Tel: +256 770 775268 / +256 751 527730 &nbsp;|&nbsp; medrisemedicalcentre@gmail.com</p>
    <div class="green-bar"></div>
  </div>`;

function printForm(type: "discharge" | "referral", entry: QueueEntry) {
  const today = new Date().toLocaleDateString("en-UG", { year: "numeric", month: "long", day: "numeric" });
  const vitals = entry.vitalsSnapshot ? (() => { try { return JSON.parse(entry.vitalsSnapshot!); } catch { return {}; } })() : {};
  const vitalsHtml = Object.keys(vitals).length
    ? Object.entries(vitals).map(([k, v]) => `<tr><td style="padding:4px 8px;font-weight:600;color:#003087;width:40%;">${k}</td><td style="padding:4px 8px;">${v}</td></tr>`).join("")
    : "<tr><td colspan='2' style='padding:4px 8px;color:#888;'>Not recorded</td></tr>";

  const html = type === "discharge" ? `
    <html><head><title>Discharge Summary</title>
    <style>${PRINT_BASE_STYLES()}</style></head><body>
    ${printHeader()}
    <p class="doc-title">Patient Discharge Summary</p>
    <div class="section"><h3>Patient Information</h3>
      <table><tr><td><b>Name:</b> ${entry.patientName}</td><td><b>Date:</b> ${today}</td></tr>
      <tr><td><b>Queue #:</b> ${entry.arrivalOrder}</td><td><b>Department:</b> ${entry.department || "General OPD"}</td></tr>
      <tr><td><b>Arrival:</b> ${entry.referralSource === "facility_referral" ? `Referral from ${entry.referralFacility || "facility"}` : entry.referralSource === "self_referral" ? "Self Referral" : "Walk-in / Appointment"}</td><td></td></tr>
      </table></div>
    <div class="section"><h3>Vital Signs at Triage</h3><table>${vitalsHtml}</table></div>
    <div class="section"><h3>Clinical Notes / Reason for Visit</h3><p style="background:#f0fdf4;border:1px solid #bbf7d0;padding:10px;border-radius:6px;min-height:40px;">${entry.notes || "—"}</p></div>
    <div class="section"><h3>Management Plan &amp; Discharge Instructions</h3><p style="background:#eff6ff;border:1px solid #bfdbfe;padding:10px;border-radius:6px;min-height:60px;">${(entry.managementPlan || "—").replace(/\n/g, "<br/>")}</p></div>
    <div class="section"><h3>Condition at Discharge</h3>
      <p style="padding:8px;">☐ Improved &nbsp;&nbsp;&nbsp; ☐ Stable &nbsp;&nbsp;&nbsp; ☐ Referred &nbsp;&nbsp;&nbsp; ☐ AMA (Against Medical Advice)</p></div>
    <div class="section"><h3>Follow-up Instructions</h3>
      <p style="background:#f0fdf4;border:1px solid #bbf7d0;padding:10px;border-radius:6px;min-height:40px;">Return date: ________________________________</p></div>
    <div style="margin-top:40px;">
      <div style="text-align:center;width:240px;">
        <div style="border-top:1.5px solid #003087;margin-top:48px;padding-top:5px;font-size:12px;color:#333;">Clinician Signature &amp; Stamp</div>
      </div>
    </div>
    <div class="doc-footer">MedRise Medical Centre &copy; ${new Date().getFullYear()} &nbsp;|&nbsp; Printed: ${today}</div>
    </body></html>`
  : `
    <html><head><title>Referral Letter</title>
    <style>${PRINT_BASE_STYLES()}
      .ref-meta{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;}
      .ref-no{font-size:12px;color:#555;text-align:right;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:6px 12px;}
    </style></head><body>
    ${printHeader()}
    <p class="doc-title">Patient Referral Letter</p>
    <div class="ref-meta">
      <div style="font-size:14px;"><b>TO:</b> &nbsp;_________________________________________________________________</div>
      <div class="ref-no">Ref No: MMC-${entry.id}-${Date.now().toString().slice(-6)}<br/>Date: ${today}</div>
    </div>
    <div class="section"><h3>Patient Details</h3>
      <table>
        <tr><td style="border:1px solid #e5e7eb;"><b>Full Name</b></td><td style="border:1px solid #e5e7eb;">${entry.patientName}</td><td style="border:1px solid #e5e7eb;"><b>Date</b></td><td style="border:1px solid #e5e7eb;">${today}</td></tr>
        <tr><td style="border:1px solid #e5e7eb;"><b>Queue #</b></td><td style="border:1px solid #e5e7eb;">${entry.arrivalOrder}</td><td style="border:1px solid #e5e7eb;"><b>Department</b></td><td style="border:1px solid #e5e7eb;">${entry.department || "General OPD"}</td></tr>
      </table></div>
    <div class="section"><h3>Vital Signs</h3><table>${vitalsHtml}</table></div>
    <div class="section"><h3>Presenting Complaint</h3><p style="background:#f0fdf4;border:1px solid #bbf7d0;padding:10px;border-radius:6px;min-height:40px;">${entry.notes || "—"}</p></div>
    <div class="section"><h3>Clinical Summary &amp; Reason for Referral</h3><p style="background:#eff6ff;border:1px solid #bfdbfe;padding:10px;border-radius:6px;min-height:60px;">${(entry.managementPlan || "—").replace(/\n/g, "<br/>")}</p></div>
    <div class="section"><h3>Investigations Done</h3><p style="background:#f8f9fa;border:1px solid #e5e7eb;padding:10px;border-radius:6px;min-height:40px;">(Please attach any lab/imaging results)</p></div>
    <p>We kindly request for your expert management of this patient.</p>
    <div class="sig-row">
      <div class="sig-box"><div class="sig-line">Referring Clinician Signature &amp; Stamp</div></div>
      <div class="sig-box"><div class="sig-line">Facility Stamp</div></div>
    </div>
    <div class="doc-footer">MedRise Medical Centre &copy; ${new Date().getFullYear()} &nbsp;|&nbsp; Printed: ${today}</div>
    </body></html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  }
}

function printDeathCertificate(entry: QueueEntry) {
  const today = new Date().toLocaleDateString("en-UG", { year: "numeric", month: "long", day: "numeric" });
  const timeNow = new Date().toLocaleTimeString("en-UG", { hour: "2-digit", minute: "2-digit" });
  const certNo = `MMC-DC-${entry.id}-${Date.now().toString().slice(-6)}`;
  const html = `
    <html><head><title>Death Notification Certificate</title>
    <style>
      ${PRINT_BASE_STYLES()}
      .cert-title{font-size:17px;font-weight:bold;color:#003087;text-align:center;margin:0 0 4px;text-transform:uppercase;letter-spacing:2px;border:3px double #003087;padding:10px;}
      .cert-no{text-align:center;color:#555;font-size:11px;margin:8px 0 20px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:6px;}
      .dc-section{margin-bottom:14px;border:1px solid #d1d5db;border-radius:6px;overflow:hidden;}
      .dc-section-title{background:linear-gradient(90deg,#003087,#1a8a4c);color:#fff;padding:6px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;}
      .dc-section-body{padding:12px 14px;}
      .field-row{display:flex;gap:16px;margin-bottom:10px;flex-wrap:wrap;}
      .field{flex:1;min-width:160px;}
      .field label{font-size:10px;color:#555;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:3px;}
      .field .val{font-size:13px;border-bottom:1.5px solid #003087;min-height:20px;padding-bottom:2px;}
      .notice{background:#fff3cd;border:1px solid #ffc107;padding:10px 14px;border-radius:6px;font-size:11px;color:#856404;margin-top:16px;text-align:center;}
    </style></head><body>
    ${printHeader()}
    <p class="cert-title">Notification of Death Certificate</p>
    <p class="cert-no">Certificate No: <strong>${certNo}</strong> &nbsp;|&nbsp; Issued: ${today}</p>

    <div class="dc-section">
      <div class="dc-section-title">1. Deceased's Personal Information</div>
      <div class="dc-section-body">
        <div class="field-row">
          <div class="field" style="flex:2"><label>Full Name of Deceased</label><div class="val">${entry.patientName}</div></div>
          <div class="field"><label>Sex</label><div class="val">☐ Male &nbsp; ☐ Female</div></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Date of Birth / Estimated Age</label><div class="val">__________________________</div></div>
          <div class="field"><label>Nationality</label><div class="val">__________________________</div></div>
          <div class="field"><label>Religion</label><div class="val">__________________________</div></div>
        </div>
        <div class="field-row">
          <div class="field" style="flex:2"><label>Village / Address</label><div class="val">__________________________</div></div>
          <div class="field"><label>District</label><div class="val">__________________________</div></div>
        </div>
      </div>
    </div>

    <div class="dc-section">
      <div class="dc-section-title">2. Death Details</div>
      <div class="dc-section-body">
        <div class="field-row">
          <div class="field"><label>Date of Death</label><div class="val">${today}</div></div>
          <div class="field"><label>Time of Death</label><div class="val">${timeNow}</div></div>
          <div class="field" style="flex:2"><label>Place of Death</label><div class="val">MedRise Medical Centre, Matugga, Wakiso District</div></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Manner of Death</label>
            <div class="val">☐ Natural &nbsp;&nbsp; ☐ Accident &nbsp;&nbsp; ☐ Unknown &nbsp;&nbsp; ☐ Other: ____________</div>
          </div>
        </div>
      </div>
    </div>

    <div class="dc-section">
      <div class="dc-section-title">3. Cause of Death (Medical)</div>
      <div class="dc-section-body">
        <div class="field-row">
          <div class="field" style="flex:3"><label>I(a) Immediate Cause</label><div class="val">${entry.diagnosis || "__________________________"}</div></div>
          <div class="field"><label>Duration</label><div class="val">________________</div></div>
        </div>
        <div class="field-row">
          <div class="field" style="flex:3"><label>I(b) Underlying Cause</label><div class="val">__________________________</div></div>
          <div class="field"><label>Duration</label><div class="val">________________</div></div>
        </div>
        <div class="field-row">
          <div class="field" style="flex:3"><label>II. Other Contributing Conditions</label><div class="val">__________________________</div></div>
        </div>
      </div>
    </div>

    <div class="dc-section">
      <div class="dc-section-title">4. Next of Kin / Informant</div>
      <div class="dc-section-body">
        <div class="field-row">
          <div class="field" style="flex:2"><label>Full Name</label><div class="val">__________________________</div></div>
          <div class="field"><label>Relationship to Deceased</label><div class="val">__________________________</div></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Phone Number</label><div class="val">__________________________</div></div>
          <div class="field" style="flex:2"><label>Physical Address</label><div class="val">__________________________</div></div>
        </div>
      </div>
    </div>

    <div class="sig-row">
      <div class="sig-box"><div class="sig-line">Certifying Clinician<br/><small>Name, Signature &amp; Stamp</small></div></div>
      <div class="sig-box"><div class="sig-line">Medical Director<br/><small>Signature &amp; Stamp</small></div></div>
      <div class="sig-box"><div class="sig-line">Informant's Signature<br/><small>Name &amp; Date</small></div></div>
    </div>

    <div class="notice">⚠ This is a <strong>Notification of Death</strong> for facility records only. It is NOT a burial permit.<br/>Obtain a burial permit from the LC / Sub-County office before burial.</div>
    <div class="doc-footer">MedRise Medical Centre &copy; ${new Date().getFullYear()} &nbsp;|&nbsp; Cert No: ${certNo} &nbsp;|&nbsp; Printed: ${today}</div>
    </body></html>`;
  const win = window.open("", "_blank");
  if (win) { win.document.write(html); win.document.close(); win.focus(); setTimeout(() => win.print(), 400); }
}

function printInvestigationRequest(type: "lab" | "imaging" | "both", entry: QueueEntry, overrideTests?: { lab?: string[]; imaging?: string[] }) {
  const today = new Date().toLocaleDateString("en-UG", { year: "numeric", month: "long", day: "numeric" });
  const reqNo = `MMC-${type.toUpperCase().slice(0, 3)}-${entry.id}-${Date.now().toString().slice(-5)}`;
  const vitals = entry.vitalsSnapshot ? (() => { try { return JSON.parse(entry.vitalsSnapshot!); } catch { return {}; } })() : {};
  const vitalsLine = Object.entries(vitals).map(([k, v]) => `${k}: ${v}`).join(" | ") || "Not recorded";

  const parseTests = (raw: string | null | undefined): string[] => {
    if (!raw) return [];
    try { const arr = JSON.parse(raw); return Array.isArray(arr) ? arr : []; } catch { return [raw]; }
  };

  const labTests = overrideTests?.lab ?? parseTests(entry.labInvestigations);
  const imagingTests = overrideTests?.imaging ?? parseTests(entry.imagingInvestigations);

  const labRows = labTests.length
    ? labTests.map((t, i) => `<tr><td style="width:24px;padding:5px 6px;text-align:center;">${i + 1}</td><td style="padding:5px 8px;">${t}</td><td style="width:90px;padding:5px 6px;border-left:1px solid #e5e7eb;font-size:10px;color:#9ca3af;">Result</td></tr>`).join("")
    : "<tr><td colspan='3' style='padding:8px;color:#9ca3af;'>No tests selected</td></tr>";

  const imagingRows = imagingTests.length
    ? imagingTests.map((t, i) => `<tr><td style="width:24px;padding:5px 6px;text-align:center;">${i + 1}</td><td style="padding:5px 8px;">${t}</td><td style="width:90px;padding:5px 6px;border-left:1px solid #e5e7eb;font-size:10px;color:#9ca3af;">Findings</td></tr>`).join("")
    : "<tr><td colspan='3' style='padding:8px;color:#9ca3af;'>No studies selected</td></tr>";

  const SHARED_CSS = `
    ${PRINT_BASE_STYLES()}
    .req-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;}
    .req-meta{text-align:right;font-size:11px;color:#555;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:6px 12px;}
    .req-meta strong{display:block;color:#003087;font-size:13px;margin-bottom:2px;}
    .badge{display:inline-block;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700;letter-spacing:.5px;}
    .badge-lab{background:#e0f2fe;color:#0369a1;}
    .badge-img{background:#f0fdf4;color:#15803d;}
    .patient-bar{background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:10px 14px;margin-bottom:14px;display:flex;flex-wrap:wrap;gap:12px;font-size:12px;}
    .patient-bar span{color:#374151;} .patient-bar strong{color:#003087;}
    .vitals-bar{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:6px 12px;font-size:11px;color:#166534;margin-bottom:14px;}
    .section-title{font-size:12px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.5px;
      background:linear-gradient(90deg,#003087,#1a8a4c);padding:6px 10px;border-radius:4px;margin:0 0 8px;}
    table.tests{width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;}
    table.tests thead tr{background:linear-gradient(90deg,#003087,#1a8a4c);color:white;}
    table.tests thead td{padding:7px 8px;font-size:11px;font-weight:600;}
    table.tests tbody tr:nth-child(even){background:#f0fdf4;}
    table.tests tbody td{padding:5px 8px;font-size:12px;border-bottom:1px solid #f3f4f6;}
    .diagnosis-box{background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:8px 12px;font-size:12px;color:#1e40af;margin-bottom:14px;}
    .sig-row{display:flex;justify-content:space-between;margin-top:36px;gap:16px;}
    .sig-box{text-align:center;flex:1;}
    .sig-line{border-top:1.5px solid #003087;margin-top:36px;padding-top:4px;font-size:11px;color:#333;}
    .footer{text-align:center;color:#9ca3af;font-size:10px;margin-top:28px;border-top:1px solid #e5e7eb;padding-top:10px;}
  `;

  const patientBar = `
    <div class="patient-bar">
      <span><strong>Patient:</strong> ${entry.patientName}</span>
      <span><strong>Date:</strong> ${today}</span>
      <span><strong>Queue #:</strong> ${entry.arrivalOrder}</span>
      <span><strong>Dept:</strong> ${entry.department || "General OPD"}</span>
      <span><strong>Priority:</strong> ${entry.priority}</span>
    </div>`;

  const diagnosisBar = entry.diagnosis
    ? `<div class="diagnosis-box"><strong>Clinical Diagnosis:</strong> ${entry.diagnosis.replace(/\n/g, " &bull; ")}</div>`
    : "";

  const vitalsBar = vitalsLine !== "Not recorded"
    ? `<div class="vitals-bar"><strong>Vitals:</strong> ${vitalsLine}</div>`
    : "";

  const labSection = `
    <div style="margin-bottom:20px;">
      <p class="section-title">🔬 Laboratory Investigations Requested</p>
      <table class="tests">
        <thead><tr><td>#</td><td>Investigation</td><td>Result / Remark</td></tr></thead>
        <tbody>${labRows}</tbody>
      </table>
    </div>`;

  const imagingSection = `
    <div style="margin-bottom:20px;">
      <p class="section-title">🩻 Radiology / Imaging Studies Requested</p>
      <table class="tests">
        <thead><tr><td>#</td><td>Study</td><td>Radiologist Findings</td></tr></thead>
        <tbody>${imagingRows}</tbody>
      </table>
    </div>`;

  const labBadge = `<span class="badge badge-lab">LABORATORY REQUEST</span>`;
  const imgBadge = `<span class="badge badge-img">RADIOLOGY / IMAGING REQUEST</span>`;
  const bothBadge = `<span class="badge badge-lab">LAB</span>&nbsp;<span class="badge badge-img">IMAGING</span>`;

  const sigRow = `
    <div class="sig-row">
      <div class="sig-box"><div class="sig-line">Requesting Clinician Signature &amp; Date</div></div>
      <div class="sig-box"><div class="sig-line">Receiving Dept Stamp &amp; Date Received</div></div>
    </div>`;

  const footer = `<p class="footer">MedRise Medical Centre &copy; ${new Date().getFullYear()} &nbsp;|&nbsp; Lwadda A, Matugga, Wakiso District &nbsp;|&nbsp; +256 770 775268 / +256 751 527730 &nbsp;|&nbsp; Req No: ${reqNo}</p>`;

  const titleBadge = type === "lab" ? labBadge : type === "imaging" ? imgBadge : bothBadge;
  const sections = type === "lab" ? labSection : type === "imaging" ? imagingSection : labSection + imagingSection;

  const html = `<html><head><title>Investigation Request</title><style>${SHARED_CSS}</style></head><body>
    ${printHeader()}
    <div class="req-header">
      <div style="margin-bottom:12px;">${titleBadge}</div>
      <div class="req-meta"><strong>INVESTIGATION REQUEST</strong>Req No: ${reqNo}<br/>Date: ${today}</div>
    </div>
    ${patientBar}
    ${vitalsBar}
    ${diagnosisBar}
    ${sections}
    ${sigRow}
    ${footer}
  </body></html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  }
}

type QueueStatus = "waiting" | "in-consultation" | "done" | "skipped";
type TriagePriority = "non-urgent" | "urgent" | "emergency" | "deceased";

const STATUS_CONFIG: Record<QueueStatus, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  waiting:          { label: "Waiting",        color: "text-yellow-700", bg: "bg-yellow-50",  border: "border-yellow-200", icon: Clock },
  "in-consultation":{ label: "In Consultation", color: "text-blue-700",   bg: "bg-blue-50",    border: "border-blue-200",   icon: Stethoscope },
  done:             { label: "Done",            color: "text-green-700",  bg: "bg-green-50",   border: "border-green-200",  icon: CheckCircle2 },
  skipped:          { label: "Skipped",         color: "text-gray-500",   bg: "bg-gray-50",    border: "border-gray-200",   icon: SkipForward },
};

const PRIORITY_CONFIG: Record<TriagePriority, { label: string; cardBorder: string; cardBg: string; badge: string; badgeBg: string; dot: string }> = {
  emergency:  { label: "🔴 Emergency",  cardBorder: "border-red-400",    cardBg: "bg-red-50",    badge: "text-red-700",   badgeBg: "bg-red-100",   dot: "bg-red-500" },
  urgent:     { label: "🟡 Urgent",     cardBorder: "border-yellow-400", cardBg: "bg-yellow-50", badge: "text-yellow-800",badgeBg: "bg-yellow-100",dot: "bg-yellow-500" },
  "non-urgent":{ label: "🟢 Non-Urgent",cardBorder: "border-green-300",  cardBg: "bg-green-50",  badge: "text-green-700", badgeBg: "bg-green-100", dot: "bg-green-500" },
  deceased:   { label: "⬛ Deceased",   cardBorder: "border-gray-500",   cardBg: "bg-gray-100",  badge: "text-gray-800",  badgeBg: "bg-gray-200",  dot: "bg-gray-700" },
};

const PRIORITY_ORDER: Record<TriagePriority, number> = { emergency: 0, urgent: 1, "non-urgent": 2, deceased: 3 };

const NEXT_LABEL: Record<QueueStatus, string> = {
  waiting: "Call In",
  "in-consultation": "Mark Done",
  done: "",
  skipped: "",
};

const DEPARTMENTS = [
  "General OPD",
  "Maternal & Child Health",
  "Pediatrics",
  "Emergency",
  "Laboratory",
  "Pharmacy",
  "Minor Procedures",
  "Chronic Disease Clinic",
];

const REFERRAL_LABELS: Record<string, string> = {
  home: "Came from Home",
  facility_referral: "Facility Referral",
  self_referral: "Self Referral",
};

interface QueueEntry {
  id: number;
  patientId?: number | null;
  patientName: string;
  queueDate: string;
  status: QueueStatus;
  arrivalOrder: number;
  staffId?: number | null;
  staffName?: string | null;
  priority: TriagePriority;
  notes?: string | null;
  referralSource?: string | null;
  referralFacility?: string | null;
  department?: string | null;
  transferNote?: string | null;
  diagnosis?: string | null;
  labInvestigations?: string | null;
  imagingInvestigations?: string | null;
  managementPlan?: string | null;
  vitalsSnapshot?: string | null;
  notificationPhone?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface NotificationLog {
  id: number;
  patientName: string;
  phone?: string | null;
  message: string;
  time: string;
  type: "queue" | "results" | "feedback" | "emergency";
}

export default function QueueTab({ staffId }: { staffId?: number }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [addOpen, setAddOpen] = useState(false);
  const [walkinName, setWalkinName] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [priority, setPriority] = useState<TriagePriority>("non-urgent");
  const [notes, setNotes] = useState("");
  const [assignStaffId, setAssignStaffId] = useState<string>("");
  const [referralSource, setReferralSource] = useState<string>("home");
  const [referralFacility, setReferralFacility] = useState("");
  const [department, setDepartment] = useState("General OPD");
  const [notifPhone, setNotifPhone] = useState("");
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [transferOpen, setTransferOpen] = useState<number | null>(null);
  const [transferDept, setTransferDept] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [consultOpen, setConsultOpen] = useState<number | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: queue = [], isLoading, refetch } = useListQueue({ date: selectedDate }, { query: {} as any });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: patients = [] } = useListPatients(undefined, { query: {} as any });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: staffList = [] } = useListStaff({ query: {} as any });

  const [registerOpen, setRegisterOpen] = useState(false);
  const [regName, setRegName] = useState("");
  const [regAge, setRegAge] = useState("");
  const [regSex, setRegSex] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regNextOfKinName, setRegNextOfKinName] = useState("");
  const [regNextOfKinPhone, setRegNextOfKinPhone] = useState("");
  const [regNextOfKinRel, setRegNextOfKinRel] = useState("");
  const [regInsuranceName, setRegInsuranceName] = useState("");
  const [regInsurancePolicy, setRegInsurancePolicy] = useState("");
  const [regPriority, setRegPriority] = useState<TriagePriority>("non-urgent");
  const [regDept, setRegDept] = useState("General OPD");
  const [regReferralSource, setRegReferralSource] = useState("home");
  const [regReferralFacility, setRegReferralFacility] = useState("");
  const [regNotes, setRegNotes] = useState("");
  const [regStaffId, setRegStaffId] = useState("");

  const addMutation = useAddToQueue();
  const updateMutation = useUpdateQueueEntry();
  const removeMutation = useRemoveFromQueue();
  const createPatientMutation = useCreatePatient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createVitalsMutation = useCreateVitals();

  const invalidate = () => qc.invalidateQueries({ queryKey: getListQueueQueryKey({ date: selectedDate }) });

  const resetRegForm = () => {
    setRegName(""); setRegAge(""); setRegSex(""); setRegPhone(""); setRegEmail("");
    setRegAddress(""); setRegNextOfKinName(""); setRegNextOfKinPhone(""); setRegNextOfKinRel("");
    setRegInsuranceName(""); setRegInsurancePolicy(""); setRegPriority("non-urgent");
    setRegDept("General OPD"); setRegReferralSource("home"); setRegReferralFacility("");
    setRegNotes(""); setRegStaffId("");
  };

  const handleRegisterAndAdd = () => {
    if (!regName.trim()) { toast({ title: "Full name is required", variant: "destructive" }); return; }
    if (!regPhone.trim()) { toast({ title: "Phone number is required", variant: "destructive" }); return; }
    createPatientMutation.mutate({
      data: {
        fullName: regName.trim(),
        phone: regPhone.trim(),
        email: regEmail.trim() || undefined,
        age: regAge ? parseInt(regAge) : undefined,
        gender: (regSex || undefined) as "male" | "female" | "other" | undefined,
        address: regAddress.trim() || undefined,
        nextOfKinName: regNextOfKinName.trim() || undefined,
        nextOfKinPhone: regNextOfKinPhone.trim() || undefined,
        nextOfKinRelationship: regNextOfKinRel.trim() || undefined,
        insuranceName: regInsuranceName.trim() || undefined,
        insurancePolicyNumber: regInsurancePolicy.trim() || undefined,
        medicalNotes: regNotes.trim() || undefined,
      },
    }, {
      onSuccess: (newPatient) => {
        qc.invalidateQueries({ queryKey: getListPatientsQueryKey() });
        addMutation.mutate({
          data: {
            patientId: newPatient.id,
            patientName: newPatient.fullName,
            queueDate: selectedDate,
            priority: regPriority,
            staffId: regStaffId ? parseInt(regStaffId) : (staffId ?? undefined),
            notes: regNotes.trim() || undefined,
            referralSource: regReferralSource as "home" | "facility_referral" | "self_referral",
            referralFacility: regReferralFacility.trim() || undefined,
            department: regDept || "General OPD",
            notificationPhone: regPhone.trim(),
          },
        }, {
          onSuccess: (newEntry) => {
            const entry = newEntry as QueueEntry;
            toast({ title: `${newPatient.fullName} registered and added to queue (#${entry.arrivalOrder})` });
            addNotification(
              { ...entry, patientName: newPatient.fullName, notificationPhone: regPhone },
              `Dear ${newPatient.fullName}, you have been registered and added to the queue at MedRise Medical Centre. You are #${entry.arrivalOrder} in line. Department: ${regDept}.`,
              "queue"
            );
            setRegisterOpen(false);
            resetRegForm();
            invalidate();
          },
          onError: () => toast({ title: "Patient registered but failed to add to queue", variant: "destructive" }),
        });
      },
      onError: () => toast({ title: "Registration failed", variant: "destructive" }),
    });
  };

  const addNotification = (entry: QueueEntry, message: string, type: NotificationLog["type"]) => {
    const notif: NotificationLog = {
      id: Date.now(),
      patientName: entry.patientName,
      phone: entry.notificationPhone,
      message,
      time: new Date().toLocaleTimeString("en-UG", { hour: "2-digit", minute: "2-digit" }),
      type,
    };
    setNotifications(prev => [notif, ...prev].slice(0, 20));
  };

  const entries = queue as QueueEntry[];
  const waiting = entries.filter(e => e.status === "waiting").sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 99;
    const pb = PRIORITY_ORDER[b.priority] ?? 99;
    if (pa !== pb) return pa - pb;
    return a.arrivalOrder - b.arrivalOrder;
  });
  const inConsult = entries.filter(e => e.status === "in-consultation").sort((a, b) => a.arrivalOrder - b.arrivalOrder);
  const done = entries.filter(e => e.status === "done" || e.status === "skipped").sort((a, b) => a.arrivalOrder - b.arrivalOrder);

  const handleAdd = () => {
    const chosenPatient = patients.find(p => String(p.id) === selectedPatientId);
    const name = chosenPatient ? chosenPatient.fullName : walkinName.trim();
    if (!name) {
      toast({ title: "Enter patient name or select from database", variant: "destructive" });
      return;
    }
    addMutation.mutate({
      data: {
        patientId: chosenPatient ? chosenPatient.id : undefined,
        patientName: name,
        queueDate: selectedDate,
        priority,
        staffId: assignStaffId ? parseInt(assignStaffId) : (staffId ?? undefined),
        notes: notes || undefined,
        referralSource: referralSource as "home" | "facility_referral" | "self_referral",
        referralFacility: referralFacility || undefined,
        department: department || "General OPD",
        notificationPhone: notifPhone || undefined,
      },
    }, {
      onSuccess: (newEntry) => {
        const entry = newEntry as QueueEntry;
        toast({ title: `${name} added to queue` });
        addNotification(
          { ...entry, patientName: name, notificationPhone: notifPhone || null },
          `You have been added to the queue at MedRise Medical Centre. You are #${entry.arrivalOrder} in line. Department: ${department}. We will notify you when it is your turn.`,
          "queue"
        );
        if (priority === "emergency") {
          addNotification(
            { ...entry, patientName: name, notificationPhone: notifPhone || null },
            `EMERGENCY: ${name} has been flagged as an emergency case and will be attended to immediately.`,
            "emergency"
          );
        } else if (priority === "urgent") {
          addNotification(
            { ...entry, patientName: name, notificationPhone: notifPhone || null },
            `URGENT: ${name} has been added as an urgent case — priority attendance required.`,
            "emergency"
          );
        }
        setAddOpen(false);
        setWalkinName(""); setSelectedPatientId(""); setPriority("non-urgent"); setNotes("");
        setAssignStaffId(""); setReferralSource("home"); setReferralFacility("");
        setDepartment("General OPD"); setNotifPhone("");
        invalidate();
      },
      onError: () => toast({ title: "Failed to add patient", variant: "destructive" }),
    });
  };

  const handleStatusChange = (entry: QueueEntry, newStatus: QueueStatus) => {
    updateMutation.mutate({ id: entry.id, data: { status: newStatus } }, {
      onSuccess: () => {
        if (newStatus === "in-consultation") {
          addNotification(entry,
            `Dear ${entry.patientName}, it is now YOUR TURN. Please proceed to the ${entry.department || "consultation room"} at MedRise Medical Centre.`,
            "queue"
          );
        } else if (newStatus === "done") {
          addNotification(entry,
            `Dear ${entry.patientName}, your consultation is complete. Please proceed to collect your prescription/results. Thank you for choosing MedRise Medical Centre.`,
            "results"
          );
        }
        invalidate();
      },
      onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
    });
  };

  const handleSkip = (entry: QueueEntry) => {
    updateMutation.mutate({ id: entry.id, data: { status: "skipped" } }, {
      onSuccess: () => { invalidate(); },
      onError: () => toast({ title: "Failed to skip patient", variant: "destructive" }),
    });
  };

  const handleRemove = (id: number) => {
    removeMutation.mutate({ id }, {
      onSuccess: () => { toast({ title: "Removed from queue" }); invalidate(); },
      onError: () => toast({ title: "Failed to remove", variant: "destructive" }),
    });
  };

  const handleTransfer = (entry: QueueEntry) => {
    if (!transferDept) { toast({ title: "Select a department to transfer to", variant: "destructive" }); return; }
    updateMutation.mutate({ id: entry.id, data: { department: transferDept, transferNote: transferNote || `Transferred to ${transferDept}` } }, {
      onSuccess: () => {
        toast({ title: `${entry.patientName} transferred to ${transferDept}` });
        addNotification(entry,
          `Dear ${entry.patientName}, you have been transferred to the ${transferDept} department at MedRise Medical Centre. Please proceed there now.`,
          "queue"
        );
        setTransferOpen(null); setTransferDept(""); setTransferNote("");
        invalidate();
      },
      onError: () => toast({ title: "Failed to transfer", variant: "destructive" }),
    });
  };

  const handleSaveConsult = (entry: QueueEntry, data: { mgmtPlan: string; vitals: string; diagnosis: string; labInvest: string; imagingInvest: string }) => {
    updateMutation.mutate({ id: entry.id, data: {
      managementPlan: data.mgmtPlan,
      vitalsSnapshot: data.vitals,
      diagnosis: data.diagnosis || undefined,
      labInvestigations: data.labInvest || undefined,
      imagingInvestigations: data.imagingInvest || undefined,
    }}, {
      onSuccess: () => {
        toast({ title: "Consultation saved successfully" });
        setConsultOpen(null);
        invalidate();
      },
      onError: () => toast({ title: "Failed to save", variant: "destructive" }),
    });
  };

  const stats = {
    total: entries.length,
    waiting: waiting.length,
    inConsult: inConsult.length,
    done: done.length,
  };

  const unreadCount = notifications.length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Patient Triage Queue</h1>
          <p className="text-gray-500 text-sm">First-come, first-served — urgent/emergency cases take priority automatically.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-40 h-9 text-sm"
          />
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>

          {/* Notification Panel */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="gap-1 relative"
              onClick={() => setNotifPanelOpen(!notifPanelOpen)}
            >
              {unreadCount > 0 ? <BellRing className="h-3.5 w-3.5 text-orange-500" /> : <Bell className="h-3.5 w-3.5" />}
              Alerts
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
            {notifPanelOpen && (
              <div className="absolute right-0 top-10 z-50 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                  <span className="font-semibold text-sm text-gray-800">SMS / WhatsApp Alerts Log</span>
                  <button className="text-xs text-gray-400 hover:text-gray-600" onClick={() => setNotifications([])}>Clear all</button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-6">No alerts yet. Alerts are logged when patients are called or results are ready.</p>
                  ) : notifications.map(n => (
                    <div key={n.id} className={`p-3 ${n.type === "emergency" ? "bg-red-50" : n.type === "results" ? "bg-green-50" : "bg-white"}`}>
                      <div className="flex items-center gap-2 mb-0.5">
                        {n.type === "emergency" ? <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" /> :
                         n.type === "results" ? <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" /> :
                         <MessageSquare className="h-3 w-3 text-blue-500 shrink-0" />}
                        <span className="font-semibold text-xs text-gray-800 truncate">{n.patientName}</span>
                        <span className="text-xs text-gray-400 ml-auto shrink-0">{n.time}</span>
                      </div>
                      {n.phone && (
                        <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
                          <Phone className="h-2.5 w-2.5" /> {n.phone}
                        </p>
                      )}
                      <p className="text-xs text-gray-600 leading-relaxed">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Register New Patient */}
          <Dialog open={registerOpen} onOpenChange={v => { setRegisterOpen(v); if (!v) resetRegForm(); }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 border-teal-600 text-teal-700 hover:bg-teal-50">
                <UserPlus className="h-4 w-4" /> Register New Patient
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-teal-600" /> Register New Patient & Add to Queue
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5 pt-1">
                {/* Patient Details */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" /> Patient Details
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">Full Name *</label>
                      <Input placeholder="e.g. Mwesigwa Hannington" value={regName} onChange={e => setRegName(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">Age (Years) *</label>
                      <Input type="number" placeholder="e.g. 32" min={0} max={120} value={regAge} onChange={e => setRegAge(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">Sex *</label>
                      <Select value={regSex} onValueChange={setRegSex}>
                        <SelectTrigger><SelectValue placeholder="Select sex" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">Phone Number *</label>
                      <Input placeholder="+256751527730" value={regPhone} onChange={e => setRegPhone(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email (Optional)</label>
                      <Input type="email" placeholder="patient@email.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">Physical Address</label>
                      <Input placeholder="e.g. Matugga, Wakiso District" value={regAddress} onChange={e => setRegAddress(e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Next of Kin */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> Next of Kin
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">Full Name</label>
                      <Input placeholder="Next of kin name" value={regNextOfKinName} onChange={e => setRegNextOfKinName(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">Phone</label>
                      <Input placeholder="+256..." value={regNextOfKinPhone} onChange={e => setRegNextOfKinPhone(e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">Relationship</label>
                      <Select value={regNextOfKinRel} onValueChange={setRegNextOfKinRel}>
                        <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="spouse">Spouse</SelectItem>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="child">Child</SelectItem>
                          <SelectItem value="sibling">Sibling</SelectItem>
                          <SelectItem value="relative">Other Relative</SelectItem>
                          <SelectItem value="friend">Friend</SelectItem>
                          <SelectItem value="guardian">Guardian</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Insurance (Optional) */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Insurance Details (Optional)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">Insurance Provider</label>
                      <Input placeholder="e.g. NHIS, AAR, Jubilee" value={regInsuranceName} onChange={e => setRegInsuranceName(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">Policy / Member Number</label>
                      <Input placeholder="e.g. NHIS-12345" value={regInsurancePolicy} onChange={e => setRegInsurancePolicy(e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Queue Assignment */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Queue Assignment</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">Arrival Source</label>
                      <Select value={regReferralSource} onValueChange={setRegReferralSource}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="home">Came from Home</SelectItem>
                          <SelectItem value="facility_referral">Referred from Facility</SelectItem>
                          <SelectItem value="self_referral">Self Referral</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">Department</label>
                      <Select value={regDept} onValueChange={setRegDept}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    {regReferralSource === "facility_referral" && (
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">Referring Facility</label>
                        <Input placeholder="e.g. Mulago National Referral Hospital" value={regReferralFacility} onChange={e => setRegReferralFacility(e.target.value)} />
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">Priority</label>
                      <Select value={regPriority} onValueChange={v => setRegPriority(v as TriagePriority)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="non-urgent">🟢 Non-Urgent</SelectItem>
                          <SelectItem value="urgent">🟡 Urgent</SelectItem>
                          <SelectItem value="emergency">🔴 Emergency</SelectItem>
                          <SelectItem value="deceased">⬛ Deceased</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">Assign Staff</label>
                      <Select value={regStaffId || "none"} onValueChange={v => setRegStaffId(v === "none" ? "" : v)}>
                        <SelectTrigger><SelectValue placeholder="Any available" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Any available</SelectItem>
                          {staffList.filter(s => ["doctor","nurse","midwife"].includes(s.role ?? "")).map(s => (
                            <SelectItem key={s.id} value={String(s.id)}>{s.name} ({s.role})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">Chief Complaint / Notes</label>
                      <Textarea
                        placeholder="Chief complaint or reason for visit…"
                        value={regNotes}
                        onChange={e => setRegNotes(e.target.value)}
                        className="min-h-[60px] resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-1 border-t border-gray-100">
                  <Button variant="outline" className="flex-1" onClick={() => { setRegisterOpen(false); resetRegForm(); }}>Cancel</Button>
                  <Button
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                    onClick={handleRegisterAndAdd}
                    disabled={createPatientMutation.isPending || addMutation.isPending}
                  >
                    {createPatientMutation.isPending || addMutation.isPending ? "Registering…" : "Register & Add to Queue"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Add Existing Patient */}
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
                <UserPlus className="h-4 w-4" /> Add Patient
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-teal-600" /> Add to Queue
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-1">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Select from Patient Database</label>
                  <Select value={selectedPatientId} onValueChange={v => { setSelectedPatientId(v); setWalkinName(""); }}>
                    <SelectTrigger><SelectValue placeholder="Search registered patient…" /></SelectTrigger>
                    <SelectContent>
                      {patients.map(p => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.fullName} — {p.phone}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-gray-200" />
                  <span className="text-xs text-gray-400">or walk-in</span>
                  <div className="flex-1 border-t border-gray-200" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Walk-in Patient Name</label>
                  <Input
                    placeholder="Full name of walk-in patient"
                    value={walkinName}
                    onChange={e => { setWalkinName(e.target.value); setSelectedPatientId(""); }}
                  />
                </div>

                {/* Referral Source */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Patient Arrival Source</label>
                  <Select value={referralSource} onValueChange={setReferralSource}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="home">
                        <span className="flex items-center gap-2"><Home className="h-3.5 w-3.5" /> Came from Home</span>
                      </SelectItem>
                      <SelectItem value="facility_referral">
                        <span className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5" /> Referred from Another Facility</span>
                      </SelectItem>
                      <SelectItem value="self_referral">
                        <span className="flex items-center gap-2"><Users className="h-3.5 w-3.5" /> Self Referral</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {referralSource === "facility_referral" && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Referring Facility Name</label>
                    <Input
                      placeholder="e.g. Mulago National Referral Hospital"
                      value={referralFacility}
                      onChange={e => setReferralFacility(e.target.value)}
                    />
                  </div>
                )}

                {/* Department */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Department</label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Priority</label>
                    <Select value={priority} onValueChange={v => setPriority(v as TriagePriority)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="non-urgent">🟢 Non-Urgent</SelectItem>
                        <SelectItem value="urgent">🟡 Urgent</SelectItem>
                        <SelectItem value="emergency">🔴 Emergency</SelectItem>
                        <SelectItem value="deceased">⬛ Deceased</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Assign Staff</label>
                    <Select value={assignStaffId || "none"} onValueChange={v => setAssignStaffId(v === "none" ? "" : v)}>
                      <SelectTrigger><SelectValue placeholder="Any available" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Any available</SelectItem>
                        {staffList.filter(s => ["doctor","nurse","midwife"].includes(s.role ?? "")).map(s => (
                          <SelectItem key={s.id} value={String(s.id)}>{s.name} ({s.role})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Notification Phone */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" /> Notification Phone (SMS / WhatsApp)
                  </label>
                  <Input
                    placeholder="e.g. +256751527730"
                    value={notifPhone}
                    onChange={e => setNotifPhone(e.target.value)}
                  />
                  <p className="text-xs text-gray-400 mt-1">Patient will be notified when called in and when results are ready.</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Notes / Chief Complaint</label>
                  <Textarea
                    placeholder="Chief complaint or reason for visit…"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="min-h-[70px] resize-none"
                  />
                </div>
                <Button
                  onClick={handleAdd}
                  disabled={addMutation.isPending}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                >
                  {addMutation.isPending ? "Adding…" : "Add to Queue"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", value: stats.total, color: "text-gray-900", bg: "bg-white" },
          { label: "Waiting", value: stats.waiting, color: "text-yellow-700", bg: "bg-yellow-50" },
          { label: "In Consultation", value: stats.inConsult, color: "text-blue-700", bg: "bg-blue-50" },
          { label: "Done / Skipped", value: stats.done, color: "text-green-700", bg: "bg-green-50" },
        ].map(s => (
          <Card key={s.label} className={`${s.bg} border shadow-none`}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FIFO Notice */}
      <div className="flex items-center gap-2 mb-4 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 text-sm text-blue-700">
        <Clock className="h-4 w-4 shrink-0 text-blue-500" />
        <span>Patients are served in arrival order (FIFO). <strong>Urgent/Emergency cases</strong> are automatically moved to the top of the queue.</span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40 text-gray-400">Loading queue…</div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-3">
          <Users className="h-10 w-10 opacity-30" />
          <p className="text-sm">No patients in queue for this date. Click <strong>Add Patient</strong> to begin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* WAITING */}
          <QueueColumn
            title="Waiting"
            icon={Clock}
            color="text-yellow-600"
            borderColor="border-yellow-300"
            count={waiting.length}
            entries={waiting}
            onNext={(e) => handleStatusChange(e, "in-consultation")}
            onSkip={handleSkip}
            onRemove={handleRemove}
            onTransfer={(e) => { setTransferOpen(e.id); setTransferDept(e.department || ""); }}
            onConsult={null}
            isPending={updateMutation.isPending}
          />

          {/* IN CONSULTATION */}
          <QueueColumn
            title="In Consultation"
            icon={Stethoscope}
            color="text-blue-600"
            borderColor="border-blue-300"
            count={inConsult.length}
            entries={inConsult}
            onNext={(e) => handleStatusChange(e, "done")}
            onSkip={null}
            onRemove={handleRemove}
            onTransfer={(e) => { setTransferOpen(e.id); setTransferDept(e.department || ""); }}
            onConsult={(e) => setConsultOpen(e.id)}
            isPending={updateMutation.isPending}
          />

          {/* DONE / SKIPPED */}
          <QueueColumn
            title="Done / Skipped"
            icon={CheckCircle2}
            color="text-green-600"
            borderColor="border-green-300"
            count={done.length}
            entries={done}
            onNext={null}
            onSkip={null}
            onRemove={handleRemove}
            onTransfer={null}
            onConsult={null}
            isPending={updateMutation.isPending}
          />
        </div>
      )}

      {/* Transfer Dialog */}
      {transferOpen !== null && (() => {
        const entry = entries.find(e => e.id === transferOpen);
        if (!entry) return null;
        return (
          <Dialog open={true} onOpenChange={() => { setTransferOpen(null); setTransferDept(""); setTransferNote(""); }}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4 text-teal-600" /> Transfer Patient
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-1">
                <p className="text-sm text-gray-600">Transferring <strong>{entry.patientName}</strong> from <em>{entry.department || "current department"}</em>.</p>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Transfer To Department</label>
                  <Select value={transferDept} onValueChange={setTransferDept}>
                    <SelectTrigger><SelectValue placeholder="Select destination department" /></SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.filter(d => d !== entry.department).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Transfer Reason / Note</label>
                  <Textarea
                    placeholder="Reason for transfer…"
                    value={transferNote}
                    onChange={e => setTransferNote(e.target.value)}
                    className="min-h-[70px] resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => { setTransferOpen(null); setTransferDept(""); setTransferNote(""); }}>Cancel</Button>
                  <Button className="flex-1 bg-teal-600 hover:bg-teal-700 text-white" onClick={() => handleTransfer(entry)} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Transferring…" : "Confirm Transfer"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* Consultation / Vitals + Management Plan Dialog */}
      {consultOpen !== null && (() => {
        const entry = entries.find(e => e.id === consultOpen);
        if (!entry) return null;
        return (
          <ConsultationDialog
            entry={entry}
            patients={patients}
            onSave={handleSaveConsult}
            onClose={() => setConsultOpen(null)}
            createVitalsMutation={createVitalsMutation}
            isSaving={updateMutation.isPending}
          />
        );
      })()}
    </div>
  );
}

function QueueColumn({
  title, icon: Icon, color, borderColor, count, entries, onNext, onSkip, onRemove, onTransfer, onConsult, isPending,
}: {
  title: string;
  icon: React.ElementType;
  color: string;
  borderColor: string;
  count: number;
  entries: QueueEntry[];
  onNext: ((e: QueueEntry) => void) | null;
  onSkip: ((e: QueueEntry) => void) | null;
  onRemove: (id: number) => void;
  onTransfer: ((e: QueueEntry) => void) | null;
  onConsult: ((e: QueueEntry) => void) | null;
  isPending: boolean;
}) {
  return (
    <div className={`rounded-xl border-2 ${borderColor} bg-white overflow-hidden`}>
      <div className={`px-4 py-3 flex items-center justify-between border-b ${borderColor}`}>
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${color}`} />
          <span className={`font-semibold text-sm ${color}`}>{title}</span>
        </div>
        <Badge variant="outline" className={`text-xs ${color} border-current`}>{count}</Badge>
      </div>
      <div className="p-3 space-y-2 min-h-[200px]">
        {entries.length === 0 ? (
          <p className="text-xs text-gray-400 text-center pt-6">No patients here</p>
        ) : entries.map(entry => (
          <QueueCard
            key={entry.id}
            entry={entry}
            onNext={onNext}
            onSkip={onSkip}
            onRemove={onRemove}
            onTransfer={onTransfer}
            onConsult={onConsult}
            isPending={isPending}
          />
        ))}
      </div>
    </div>
  );
}

function QueueCard({
  entry, onNext, onSkip, onRemove, onTransfer, onConsult, isPending,
}: {
  entry: QueueEntry;
  onNext: ((e: QueueEntry) => void) | null;
  onSkip: ((e: QueueEntry) => void) | null;
  onRemove: (id: number) => void;
  onTransfer: ((e: QueueEntry) => void) | null;
  onConsult: ((e: QueueEntry) => void) | null;
  isPending: boolean;
}) {
  const cfg = STATUS_CONFIG[entry.status];
  const pcfg = PRIORITY_CONFIG[entry.priority] ?? PRIORITY_CONFIG["non-urgent"];

  return (
    <div className={`rounded-lg border-2 ${pcfg.cardBorder} ${pcfg.cardBg} p-3`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-bold text-gray-400 shrink-0">#{entry.arrivalOrder}</span>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{entry.patientName}</p>
            {entry.staffName && (
              <p className="text-xs text-gray-500 truncate">👤 {entry.staffName}</p>
            )}
            {entry.department && (
              <p className="text-xs text-teal-600 truncate">🏥 {entry.department}</p>
            )}
            {entry.referralSource && entry.referralSource !== "home" && (
              <p className="text-xs text-purple-600 truncate">
                {entry.referralSource === "facility_referral" ? `🏨 Referred: ${entry.referralFacility || "another facility"}` : "↩ Self referral"}
              </p>
            )}
            {entry.notes && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 italic">{entry.notes}</p>
            )}
            {entry.transferNote && (
              <p className="text-xs text-orange-600 mt-0.5 italic">↪ {entry.transferNote}</p>
            )}
            {entry.diagnosis && (
              <p className="text-xs text-indigo-600 mt-0.5 line-clamp-1">🩺 Dx: {entry.diagnosis}</p>
            )}
            {entry.managementPlan && (
              <p className="text-xs text-blue-600 mt-0.5 line-clamp-1">📋 Plan recorded</p>
            )}
            {entry.vitalsSnapshot && (
              <p className="text-xs text-green-600 mt-0.5 line-clamp-1">📊 Vitals recorded</p>
            )}
            {entry.labInvestigations && (
              <p className="text-xs text-purple-600 mt-0.5 line-clamp-1">🔬 Lab requested</p>
            )}
            {entry.imagingInvestigations && (
              <p className="text-xs text-orange-600 mt-0.5 line-clamp-1">🩻 Imaging requested</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-full ${pcfg.badge} ${pcfg.badgeBg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${pcfg.dot}`} />
            {pcfg.label}
          </span>
          <Badge variant="outline" className={`text-xs ${cfg.color} ${cfg.bg} ${cfg.border}`}>
            {cfg.label}
          </Badge>
          {entry.notificationPhone && (
            <span className="inline-flex items-center gap-0.5 text-xs text-gray-400">
              <Phone className="h-2.5 w-2.5" />{entry.notificationPhone.slice(-4)}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
        {onNext && (
          <Button
            size="sm"
            className="h-7 text-xs px-2.5 bg-teal-600 hover:bg-teal-700 text-white flex-1"
            onClick={() => onNext(entry)}
            disabled={isPending}
          >
            {NEXT_LABEL[entry.status]} <ChevronRight className="h-3 w-3 ml-0.5" />
          </Button>
        )}
        {onConsult && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-2 text-blue-600 hover:bg-blue-50 border-blue-200"
            onClick={() => onConsult(entry)}
            disabled={isPending}
            title="Record vitals & management plan"
          >
            <ClipboardList className="h-3 w-3" />
          </Button>
        )}
        {onTransfer && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-2 text-teal-600 hover:bg-teal-50 border-teal-200"
            onClick={() => onTransfer(entry)}
            disabled={isPending}
            title="Transfer to another department"
          >
            <ArrowRightLeft className="h-3 w-3" />
          </Button>
        )}
        {onSkip && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50"
            onClick={() => onSkip(entry)}
            disabled={isPending}
          >
            <SkipForward className="h-3 w-3" />
          </Button>
        )}
        {entry.labInvestigations && (
          <Button
            size="sm" variant="outline"
            className="h-7 text-xs px-2 text-violet-700 hover:bg-violet-50 border-violet-200"
            onClick={() => printInvestigationRequest("lab", entry)}
            title="Print Lab Request Form"
          >
            <Printer className="h-3 w-3 mr-0.5" />Lab
          </Button>
        )}
        {entry.imagingInvestigations && (
          <Button
            size="sm" variant="outline"
            className="h-7 text-xs px-2 text-orange-700 hover:bg-orange-50 border-orange-200"
            onClick={() => printInvestigationRequest("imaging", entry)}
            title="Print Imaging / Radiology Request"
          >
            <Printer className="h-3 w-3 mr-0.5" />X-Ray
          </Button>
        )}
        {entry.labInvestigations && entry.imagingInvestigations && (
          <Button
            size="sm" variant="outline"
            className="h-7 text-xs px-2 text-teal-700 hover:bg-teal-50 border-teal-200"
            onClick={() => printInvestigationRequest("both", entry)}
            title="Print Combined Request (Lab + Imaging)"
          >
            <Printer className="h-3 w-3 mr-0.5" />All
          </Button>
        )}
        {(entry.status === "done" || entry.status === "in-consultation") && (
          <>
            <Button
              size="sm" variant="outline"
              className="h-7 text-xs px-2 text-green-700 hover:bg-green-50 border-green-200"
              onClick={() => printForm("discharge", entry)}
              title="Print Discharge Summary"
            >
              <Printer className="h-3 w-3 mr-0.5" />D
            </Button>
            <Button
              size="sm" variant="outline"
              className="h-7 text-xs px-2 text-purple-700 hover:bg-purple-50 border-purple-200"
              onClick={() => printForm("referral", entry)}
              title="Print Referral Letter"
            >
              <Printer className="h-3 w-3 mr-0.5" />R
            </Button>
            {entry.priority === "deceased" && (
              <Button
                size="sm" variant="outline"
                className="h-7 text-xs px-2 text-gray-700 hover:bg-gray-100 border-gray-400 font-semibold"
                onClick={() => printDeathCertificate(entry)}
                title="Print Death Notification Certificate"
              >
                <Printer className="h-3 w-3 mr-0.5" />DC
              </Button>
            )}
          </>
        )}
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs px-2 text-gray-400 hover:text-red-600 hover:bg-red-50"
          onClick={() => onRemove(entry.id)}
          disabled={isPending}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

const LAB_TESTS = [
  "Full Blood Count (FBC)", "Malaria RDT", "Malaria Smear", "Blood Glucose (RBS/FBS)",
  "HbA1c", "Urine Analysis", "Urine Culture & Sensitivity", "Stool MCS",
  "Liver Function Tests (LFTs)", "Renal Function Tests (RFTs)", "Electrolytes",
  "Thyroid Function Tests (TFTs)", "HIV Test (ELISA/Rapid)", "Hepatitis B (HBsAg)",
  "Hepatitis C (Anti-HCV)", "RPR/VDRL (Syphilis)", "Widal Test", "Blood Culture & Sensitivity",
  "Sputum AFB (TB)", "GeneXpert MTB/RIF", "CD4 Count", "Viral Load",
  "Pregnancy Test (urine βHCG)", "Pap Smear", "Worm Ova & Cysts",
  "Lipid Profile", "Cardiac Enzymes (Troponin/CK-MB)", "INR/PT/APTT",
  "ESR", "CRP", "Urethral/Vaginal Swab MCS", "Blood Group & Cross Match",
];

const IMAGING_TESTS = [
  "Chest X-Ray (CXR) PA", "Chest X-Ray Lateral", "Abdominal X-Ray (AXR)",
  "Pelvic X-Ray", "Skull X-Ray", "Spine X-Ray (Cervical/Thoracic/Lumbar)",
  "Limb X-Ray (specify site)", "Wrist/Hand X-Ray", "Foot/Ankle X-Ray",
  "Abdominal Ultrasound", "Pelvic Ultrasound", "Obstetric Ultrasound (Dating/Anomaly)",
  "Renal/Bladder Ultrasound", "Thyroid Ultrasound", "Scrotal Ultrasound",
  "Breast Ultrasound", "Doppler Ultrasound (Vascular)",
  "Echocardiogram (ECHO)", "ECG (12-lead)",
  "CT Scan — Head", "CT Scan — Chest", "CT Scan — Abdomen/Pelvis",
  "MRI — Brain", "MRI — Spine", "MRI — Joint (specify)",
  "Mammogram", "DEXA Scan (Bone Density)",
];

function ConsultationDialog({
  entry, patients, onSave, onClose, createVitalsMutation, isSaving,
}: {
  entry: QueueEntry;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  patients: any[];
  onSave: (entry: QueueEntry, data: { mgmtPlan: string; vitals: string; diagnosis: string; labInvest: string; imagingInvest: string }) => void;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createVitalsMutation: any;
  isSaving: boolean;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"history" | "vitals" | "nursing" | "diagnosis" | "lab" | "imaging" | "plan">("history");

  // History / HPC
  const [chiefComplaint, setChiefComplaint] = useState(entry.notes || "");
  const [hpc, setHpc] = useState("");
  const [pastHistory, setPastHistory] = useState("");
  const [allergies, setAllergies] = useState("");

  // Vitals
  const [bp, setBp] = useState("");
  const [temp, setTemp] = useState("");
  const [pulse, setPulse] = useState("");
  const [spo2, setSpo2] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [rr, setRr] = useState("");
  const [muac, setMuac] = useState("");
  const [gcs, setGcs] = useState("");
  const [bloodGlucose, setBloodGlucose] = useState("");

  // Nursing
  const [nursingNotes, setNursingNotes] = useState("");
  const [nursingTreatment, setNursingTreatment] = useState("");
  const [fluidIn, setFluidIn] = useState("");
  const [fluidOut, setFluidOut] = useState("");

  // Diagnosis
  const [diagnosis, setDiagnosis] = useState(entry.diagnosis || "");
  const [differentials, setDifferentials] = useState("");

  // Lab
  const [selectedLabTests, setSelectedLabTests] = useState<string[]>(() => {
    if (entry.labInvestigations) { try { return JSON.parse(entry.labInvestigations); } catch { return []; } }
    return [];
  });
  const [labNotes, setLabNotes] = useState("");

  // Imaging
  const [selectedImaging, setSelectedImaging] = useState<string[]>(() => {
    if (entry.imagingInvestigations) { try { return JSON.parse(entry.imagingInvestigations); } catch { return []; } }
    return [];
  });
  const [imagingNotes, setImagingNotes] = useState("");

  // Management plan
  const [mgmtPlan, setMgmtPlan] = useState(entry.managementPlan || "");

  const toggleLab = (t: string) => setSelectedLabTests(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  const toggleImaging = (t: string) => setSelectedImaging(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const handleSave = () => {
    const vitalsStr = [
      bp && `BP: ${bp}`,
      temp && `Temp: ${temp}`,
      pulse && `Pulse: ${pulse}`,
      spo2 && `SpO2: ${spo2}`,
      weight && `Wt: ${weight}`,
      height && `Ht: ${height}`,
      rr && `RR: ${rr}`,
      muac && `MUAC: ${muac}`,
      gcs && `GCS: ${gcs}`,
      bloodGlucose && `RBS: ${bloodGlucose}`,
    ].filter(Boolean).join(" | ");

    const patient = patients.find(p => p.id === entry.patientId);
    if (patient && (bp || temp || pulse || spo2 || weight || height || rr)) {
      createVitalsMutation.mutate({
        data: {
          patientId: patient.id,
          bloodPressure: bp || undefined,
          temperature: temp || undefined,
          pulse: pulse || undefined,
          oxygenSaturation: spo2 || undefined,
          weight: weight || undefined,
          height: height || undefined,
          respiratoryRate: rr || undefined,
        },
      }, {
        onSuccess: () => { toast({ title: "Vitals saved to EHR" }); qc.invalidateQueries(); },
        onError: () => toast({ title: "Vitals saved to queue only", variant: "destructive" }),
      });
    }

    const labStr = selectedLabTests.length > 0
      ? JSON.stringify(selectedLabTests.concat(labNotes ? [`Note: ${labNotes}`] : []))
      : "";
    const imagingStr = selectedImaging.length > 0
      ? JSON.stringify(selectedImaging.concat(imagingNotes ? [`Note: ${imagingNotes}`] : []))
      : "";
    const historyNote = [
      chiefComplaint && `CC: ${chiefComplaint}`,
      hpc && `HPC: ${hpc}`,
      pastHistory && `PMH: ${pastHistory}`,
      allergies && `Allergies: ${allergies}`,
    ].filter(Boolean).join("\n");
    const nursingNote = [
      nursingNotes && `Nursing Notes: ${nursingNotes}`,
      nursingTreatment && `Nursing Treatment: ${nursingTreatment}`,
      (fluidIn || fluidOut) && `Fluid Balance: In=${fluidIn || "—"} ml / Out=${fluidOut || "—"} ml`,
    ].filter(Boolean).join("\n");
    const diagFull = [historyNote, diagnosis, differentials && `DDx: ${differentials}`, nursingNote].filter(Boolean).join("\n\n");

    onSave(entry, { mgmtPlan, vitals: vitalsStr, diagnosis: diagFull, labInvest: labStr, imagingInvest: imagingStr });
  };

  const tabs: { id: "history" | "vitals" | "nursing" | "diagnosis" | "lab" | "imaging" | "plan"; label: string; icon: string }[] = [
    { id: "history",   label: "History",   icon: "📋" },
    { id: "vitals",    label: "Vitals",    icon: "📊" },
    { id: "nursing",   label: "Nursing",   icon: "💊" },
    { id: "diagnosis", label: "Diagnosis", icon: "🩺" },
    { id: "lab",       label: "Lab",       icon: "🔬" },
    { id: "imaging",   label: "Imaging",   icon: "🩻" },
    { id: "plan",      label: "Rx / Plan", icon: "📋" },
  ];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Stethoscope className="h-4 w-4 text-teal-600" />
            Doctor's Consultation — <span className="text-teal-700">{entry.patientName}</span>
            <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_CONFIG[entry.priority]?.badge} ${PRIORITY_CONFIG[entry.priority]?.badgeBg}`}>
              {PRIORITY_CONFIG[entry.priority]?.label}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Patient context banner */}
        <div className="flex flex-wrap gap-2 text-xs bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
          {entry.department && <span className="text-teal-700 font-medium">🏥 {entry.department}</span>}
          {entry.referralSource && entry.referralSource !== "home" && (
            <span className="text-purple-700">
              {entry.referralSource === "facility_referral" ? `🏨 Referred from ${entry.referralFacility || "facility"}` : "↩ Self Referral"}
            </span>
          )}
          {entry.notes && <span className="text-gray-600 italic">CC: {entry.notes}</span>}
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 border-b border-gray-200 mt-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-t-lg transition-colors border-b-2 -mb-px ${
                activeTab === t.id
                  ? "border-teal-500 text-teal-700 bg-teal-50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {t.icon} {t.label}
              {t.id === "lab" && selectedLabTests.length > 0 && (
                <span className="bg-purple-100 text-purple-700 rounded-full px-1.5 py-0 text-xs">{selectedLabTests.length}</span>
              )}
              {t.id === "imaging" && selectedImaging.length > 0 && (
                <span className="bg-orange-100 text-orange-700 rounded-full px-1.5 py-0 text-xs">{selectedImaging.length}</span>
              )}
            </button>
          ))}
        </div>

        <div className="pt-1">
          {/* ── HISTORY / HPC ── */}
          {activeTab === "history" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Chief Complaint <span className="text-red-500">*</span></label>
                <Textarea
                  placeholder="e.g. Fever for 3 days, severe headache, generalised body aches…"
                  value={chiefComplaint}
                  onChange={e => setChiefComplaint(e.target.value)}
                  className="min-h-[72px] resize-none text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">History of Presenting Complaint</label>
                <Textarea
                  placeholder="Onset, duration, character, severity, associated symptoms, aggravating/relieving factors, treatment already taken…"
                  value={hpc}
                  onChange={e => setHpc(e.target.value)}
                  className="min-h-[110px] resize-none text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Past Medical / Surgical History</label>
                  <Textarea
                    placeholder="e.g. Hypertension, Diabetes (DM2), previous ops…"
                    value={pastHistory}
                    onChange={e => setPastHistory(e.target.value)}
                    className="min-h-[60px] resize-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Known Allergies</label>
                  <Textarea
                    placeholder="e.g. Penicillin — rash, Sulfa — anaphylaxis, NKDA…"
                    value={allergies}
                    onChange={e => setAllergies(e.target.value)}
                    className="min-h-[60px] resize-none text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── VITALS ── */}
          {activeTab === "vitals" && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 mb-2">Record observations at time of consultation.</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Blood Pressure (mmHg)", ph: "e.g. 120/80", val: bp, set: setBp },
                  { label: "Temperature (°C)", ph: "e.g. 36.5", val: temp, set: setTemp },
                  { label: "Pulse (bpm)", ph: "e.g. 72", val: pulse, set: setPulse },
                  { label: "SpO₂ (%)", ph: "e.g. 98", val: spo2, set: setSpo2 },
                  { label: "Weight (kg)", ph: "e.g. 68", val: weight, set: setWeight },
                  { label: "Height (cm)", ph: "e.g. 170", val: height, set: setHeight },
                  { label: "Respiratory Rate (/min)", ph: "e.g. 16", val: rr, set: setRr },
                  { label: "Blood Glucose (mmol/L)", ph: "e.g. 5.4", val: bloodGlucose, set: setBloodGlucose },
                  { label: "MUAC (cm)", ph: "e.g. 25", val: muac, set: setMuac },
                  { label: "GCS", ph: "e.g. 15/15", val: gcs, set: setGcs },
                ].map(({ label, ph, val, set }) => (
                  <div key={label}>
                    <label className="text-xs text-gray-500 block mb-1">{label}</label>
                    <Input placeholder={ph} value={val} onChange={e => set(e.target.value)} className="h-9 text-sm" />
                  </div>
                ))}
              </div>
              {!entry.patientId && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded p-2">⚠ Walk-in patient — vitals saved to queue only. Register in Patient Database to link to EHR.</p>
              )}
            </div>
          )}

          {/* ── DIAGNOSIS ── */}
          {activeTab === "diagnosis" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Primary Diagnosis</label>
                <Textarea
                  placeholder="e.g. Malaria (Plasmodium falciparum), Acute Gastroenteritis, UTI, Hypertension Grade II…"
                  value={diagnosis}
                  onChange={e => setDiagnosis(e.target.value)}
                  className="min-h-[90px] resize-none text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Differential Diagnoses <span className="text-xs font-normal text-gray-400">(optional)</span></label>
                <Textarea
                  placeholder="e.g. 1. Typhoid fever  2. Viral hepatitis  3. Septicaemia"
                  value={differentials}
                  onChange={e => setDifferentials(e.target.value)}
                  className="min-h-[70px] resize-none text-sm"
                />
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
                <strong>Tip:</strong> Use ICD-10 codes if available (e.g. B54 – Unspecified malaria, K59.1 – Functional diarrhoea). This helps with HMIS reporting.
              </div>
            </div>
          )}

          {/* ── LAB INVESTIGATIONS ── */}
          {activeTab === "lab" && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">Select all required laboratory investigations. These will be printed on the request form.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-64 overflow-y-auto pr-1">
                {LAB_TESTS.map(t => (
                  <label key={t} className={`flex items-center gap-2 text-xs px-2.5 py-2 rounded-lg border cursor-pointer transition-colors ${selectedLabTests.includes(t) ? "border-purple-400 bg-purple-50 text-purple-800 font-medium" : "border-gray-200 hover:border-gray-300 text-gray-700"}`}>
                    <input type="checkbox" className="accent-purple-600" checked={selectedLabTests.includes(t)} onChange={() => toggleLab(t)} />
                    {t}
                  </label>
                ))}
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Additional tests / clinical notes for lab</label>
                <Input placeholder="e.g. Urea & Creatinine, Amylase, custom panel…" value={labNotes} onChange={e => setLabNotes(e.target.value)} className="h-9 text-sm" />
              </div>
              {selectedLabTests.length > 0 && (
                <div className="bg-purple-50 rounded-lg p-2.5 text-xs text-purple-700 flex items-start justify-between gap-2">
                  <span><strong>{selectedLabTests.length} test(s) requested:</strong> {selectedLabTests.join(", ")}</span>
                  <button
                    type="button"
                    className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-violet-700 bg-white border border-violet-300 rounded px-2 py-1 hover:bg-violet-50 transition-colors"
                    onClick={() => printInvestigationRequest("lab", entry, { lab: labNotes ? [...selectedLabTests, `Note: ${labNotes}`] : selectedLabTests })}
                  >
                    <Printer className="h-3 w-3" /> Print Lab Form
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── IMAGING ── */}
          {activeTab === "imaging" && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">Select required radiology / imaging studies.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-64 overflow-y-auto pr-1">
                {IMAGING_TESTS.map(t => (
                  <label key={t} className={`flex items-center gap-2 text-xs px-2.5 py-2 rounded-lg border cursor-pointer transition-colors ${selectedImaging.includes(t) ? "border-orange-400 bg-orange-50 text-orange-800 font-medium" : "border-gray-200 hover:border-gray-300 text-gray-700"}`}>
                    <input type="checkbox" className="accent-orange-500" checked={selectedImaging.includes(t)} onChange={() => toggleImaging(t)} />
                    {t}
                  </label>
                ))}
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Additional notes for radiology</label>
                <Input placeholder="e.g. Contrast CT, specific views, clinical query…" value={imagingNotes} onChange={e => setImagingNotes(e.target.value)} className="h-9 text-sm" />
              </div>
              {selectedImaging.length > 0 && (
                <div className="bg-orange-50 rounded-lg p-2.5 text-xs text-orange-700 flex items-start justify-between gap-2">
                  <span><strong>{selectedImaging.length} study(ies) requested:</strong> {selectedImaging.join(", ")}</span>
                  <button
                    type="button"
                    className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-orange-700 bg-white border border-orange-300 rounded px-2 py-1 hover:bg-orange-50 transition-colors"
                    onClick={() => printInvestigationRequest("imaging", entry, { imaging: imagingNotes ? [...selectedImaging, `Note: ${imagingNotes}`] : selectedImaging })}
                  >
                    <Printer className="h-3 w-3" /> Print Imaging Form
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── NURSING NOTES ── */}
          {activeTab === "nursing" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Nursing Notes / Observations</label>
                <Textarea
                  placeholder="Nurse's observations, patient behaviour, pain score (1–10), comfort level, any concerns…"
                  value={nursingNotes}
                  onChange={e => setNursingNotes(e.target.value)}
                  className="min-h-[90px] resize-none text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Nursing Treatment / Procedures Performed</label>
                <Textarea
                  placeholder="e.g. IV cannula inserted (20G, left arm), IV fluids commenced (Normal Saline 500ml), wound dressing done, O₂ given at 4L/min via nasal prongs, catheter inserted (16Fr)…"
                  value={nursingTreatment}
                  onChange={e => setNursingTreatment(e.target.value)}
                  className="min-h-[80px] resize-none text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Fluid Balance Chart</label>
                <div className="border border-blue-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-blue-600 text-white">
                      <tr>
                        <th className="text-left px-3 py-2 text-xs font-semibold">Fluid INPUT (ml)</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold">Fluid OUTPUT (ml)</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold">Net Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-3 py-2">
                          <Input placeholder="e.g. 500" value={fluidIn} onChange={e => setFluidIn(e.target.value)} className="h-8 text-sm" />
                          <p className="text-[10px] text-gray-400 mt-0.5">IV fluids + oral intake</p>
                        </td>
                        <td className="px-3 py-2">
                          <Input placeholder="e.g. 350" value={fluidOut} onChange={e => setFluidOut(e.target.value)} className="h-8 text-sm" />
                          <p className="text-[10px] text-gray-400 mt-0.5">Urine, vomitus, drain, etc.</p>
                        </td>
                        <td className="px-3 py-2 font-mono">
                          {fluidIn && fluidOut ? (
                            <span className={`font-bold ${parseInt(fluidIn) - parseInt(fluidOut) >= 0 ? "text-blue-700" : "text-red-700"}`}>
                              {parseInt(fluidIn) - parseInt(fluidOut) >= 0 ? "+" : ""}{parseInt(fluidIn) - parseInt(fluidOut)} ml
                            </span>
                          ) : <span className="text-gray-400">—</span>}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Positive balance = fluid retention · Negative = deficit. Record cumulative totals for the shift.</p>
              </div>
            </div>
          )}

          {/* ── MANAGEMENT PLAN ── */}
          {activeTab === "plan" && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Treatment & Management Plan</label>
                <Textarea
                  placeholder={"Rx:\n1. Tab Artemether/Lumefantrine 80/480mg BD × 3 days\n2. Tab Paracetamol 500mg TDS PRN\n3. ORS sachets\n\nInstructions:\n- Increase fluid intake\n- Rest\n- Return if no improvement in 48hrs\n\nFollow-up: 1 week"}
                  value={mgmtPlan}
                  onChange={e => setMgmtPlan(e.target.value)}
                  className="min-h-[160px] resize-none text-sm font-mono"
                />
              </div>
              <div className="bg-teal-50 border border-teal-100 rounded-lg p-2.5 text-xs text-teal-700 space-y-1">
                <strong>Abbreviation guide:</strong><br/>
                OD=once daily · BD=twice daily · TDS=three times daily · QDS=four times daily<br/>
                PRN=as needed · IM=intramuscular · IV=intravenous · PO=oral · SC=subcutaneous<br/>
                STAT=immediately · AC=before meals · PC=after meals
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-3 border-t border-gray-100 mt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 bg-teal-600 hover:bg-teal-700 text-white" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving…" : "Save Consultation"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
