import { Resend } from "resend";
import { logger } from "./logger";

function createClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.warn("Email not configured — RESEND_API_KEY missing");
    return null;
  }
  return new Resend(apiKey);
}

interface AppointmentDetails {
  patientName: string;
  phone: string;
  email: string;
  service: string;
  preferredDate: string;
  preferredTime: string;
  message?: string | null;
}

export async function sendAppointmentConfirmationToPatient(appt: AppointmentDetails): Promise<void> {
  if (!appt.email) return;
  const resend = createClient();
  if (!resend) return;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 0; }
        .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
        .header { background: #003087; padding: 32px 40px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; }
        .header p { color: #a8c4e8; margin: 6px 0 0; font-size: 13px; }
        .body { padding: 36px 40px; }
        .body h2 { color: #003087; font-size: 20px; margin-top: 0; }
        .body p { color: #444; line-height: 1.6; }
        .detail-box { background: #f0f5ff; border-left: 4px solid #28a745; border-radius: 8px; padding: 20px 24px; margin: 24px 0; }
        .detail-box table { width: 100%; border-collapse: collapse; }
        .detail-box td { padding: 6px 0; color: #333; font-size: 14px; }
        .detail-box td:first-child { font-weight: bold; color: #003087; width: 140px; }
        .cta { text-align: center; margin: 28px 0; }
        .cta a { background: #25D366; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 30px; font-weight: bold; font-size: 15px; display: inline-block; }
        .footer { background: #f4f6f9; padding: 20px 40px; text-align: center; }
        .footer p { color: #888; font-size: 12px; margin: 4px 0; }
        .footer a { color: #003087; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>MEDRISE MEDICAL CENTRE</h1>
          <p>Compassionate Care. Better Health. Brighter Lives.</p>
        </div>
        <div class="body">
          <h2>Appointment Request Received</h2>
          <p>Dear <strong>${appt.patientName}</strong>,</p>
          <p>Thank you for choosing <strong>MedRise Medical Centre</strong>. We have received your appointment request and our team will contact you shortly to confirm your visit.</p>
          <div class="detail-box">
            <table>
              <tr><td>Patient Name</td><td>${appt.patientName}</td></tr>
              <tr><td>Service</td><td>${appt.service}</td></tr>
              <tr><td>Preferred Date</td><td>${appt.preferredDate}</td></tr>
              <tr><td>Preferred Time</td><td>${appt.preferredTime}</td></tr>
              <tr><td>Phone</td><td>${appt.phone}</td></tr>
              ${appt.message ? `<tr><td>Note</td><td>${appt.message}</td></tr>` : ""}
            </table>
          </div>
          <p>Our clinic is open <strong>24/7</strong>. For urgent needs, call or WhatsApp us directly:</p>
          <div class="cta">
            <a href="https://wa.me/256751527730">Chat on WhatsApp</a>
          </div>
          <p style="font-size:13px; color:#666;">
            MedRise Medical Centre &bull; Lwadda A, Matugga, Gombe Division, Wakiso District, Uganda<br/>
            <strong>+256 770 775268</strong> &nbsp;|&nbsp; <strong>+256 751 527730</strong>
          </p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>For queries, email us at <a href="mailto:medrisemedicalcentre@gmail.com">medrisemedicalcentre@gmail.com</a></p>
          <p>&copy; 2025 MedRise Medical Centre. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const { error } = await resend.emails.send({
      from: "MedRise Medical Centre <onboarding@resend.dev>",
      to: [appt.email],
      subject: `Appointment Request Received – ${appt.service} on ${appt.preferredDate}`,
      html,
    });
    if (error) {
      logger.error({ error }, "Resend error sending patient confirmation");
    } else {
      logger.info({ to: appt.email }, "Confirmation email sent to patient");
    }
  } catch (err) {
    logger.error({ err }, "Failed to send patient confirmation email");
  }
}

export async function sendAppointmentStatusUpdateToPatient(
  appt: AppointmentDetails & { status: "confirmed" | "cancelled" }
): Promise<void> {
  if (!appt.email) return;
  const resend = createClient();
  if (!resend) return;

  const isConfirmed = appt.status === "confirmed";
  const statusColor = isConfirmed ? "#28a745" : "#dc3545";
  const statusLabel = isConfirmed ? "CONFIRMED" : "CANCELLED";
  const statusMsg = isConfirmed
    ? `Great news! Your appointment has been <strong>confirmed</strong>. Please arrive on time at MedRise Medical Centre.`
    : `We regret to inform you that your appointment has been <strong>cancelled</strong>. Please call or WhatsApp us to reschedule.`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 0; }
        .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
        .header { background: #003087; padding: 32px 40px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; }
        .header p { color: #a8c4e8; margin: 6px 0 0; font-size: 13px; }
        .body { padding: 36px 40px; }
        .status-badge { display: inline-block; background: ${statusColor}; color: #fff; border-radius: 20px; padding: 6px 20px; font-size: 14px; font-weight: bold; margin-bottom: 20px; letter-spacing: 1px; }
        .body p { color: #444; line-height: 1.6; }
        .detail-box { background: #f0f5ff; border-left: 4px solid ${statusColor}; border-radius: 8px; padding: 20px 24px; margin: 24px 0; }
        .detail-box table { width: 100%; border-collapse: collapse; }
        .detail-box td { padding: 6px 0; color: #333; font-size: 14px; }
        .detail-box td:first-child { font-weight: bold; color: #003087; width: 140px; }
        .cta { text-align: center; margin: 28px 0; }
        .cta a { background: #25D366; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 30px; font-weight: bold; font-size: 15px; display: inline-block; }
        .footer { background: #f4f6f9; padding: 20px 40px; text-align: center; }
        .footer p { color: #888; font-size: 12px; margin: 4px 0; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>MEDRISE MEDICAL CENTRE</h1>
          <p>Compassionate Care. Better Health. Brighter Lives.</p>
        </div>
        <div class="body">
          <div class="status-badge">APPOINTMENT ${statusLabel}</div>
          <p>Dear <strong>${appt.patientName}</strong>,</p>
          <p>${statusMsg}</p>
          <div class="detail-box">
            <table>
              <tr><td>Service</td><td>${appt.service}</td></tr>
              <tr><td>Date</td><td>${appt.preferredDate}</td></tr>
              <tr><td>Time</td><td>${appt.preferredTime}</td></tr>
              <tr><td>Phone</td><td>${appt.phone}</td></tr>
            </table>
          </div>
          ${isConfirmed
            ? `<p style="font-size:13px;color:#555;">📍 <strong>Location:</strong> Lwadda A, Matugga, Gombe Division, Wakiso District, Uganda<br/>Please bring your National ID or any previous medical records.</p>`
            : `<p style="font-size:13px;color:#555;">To reschedule, contact us via WhatsApp or call:</p>`
          }
          <div class="cta">
            <a href="https://wa.me/256751527730">Chat on WhatsApp</a>
          </div>
          <p style="font-size:13px; color:#666;">
            <strong>+256 770 775268</strong> &nbsp;|&nbsp; <strong>+256 751 527730</strong>
          </p>
        </div>
        <div class="footer">
          <p>This is an automated message from MedRise Medical Centre.</p>
          <p>&copy; 2025 MedRise Medical Centre. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const { error } = await resend.emails.send({
      from: "MedRise Medical Centre <onboarding@resend.dev>",
      to: [appt.email],
      subject: `Appointment ${statusLabel} – ${appt.service} on ${appt.preferredDate}`,
      html,
    });
    if (error) {
      logger.error({ error }, "Resend error sending status update email");
    } else {
      logger.info({ to: appt.email, status: appt.status }, "Appointment status email sent to patient");
    }
  } catch (err) {
    logger.error({ err }, "Failed to send appointment status email");
  }
}

export async function sendAppointmentNotificationToClinic(appt: AppointmentDetails): Promise<void> {
  const resend = createClient();
  if (!resend) return;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 0; }
        .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
        .header { background: #003087; padding: 28px 40px; }
        .header h1 { color: #ffffff; margin: 0; font-size: 20px; }
        .header p { color: #a8c4e8; margin: 4px 0 0; font-size: 13px; }
        .body { padding: 32px 40px; }
        .badge { display: inline-block; background: #fff3cd; color: #856404; border: 1px solid #ffc107; border-radius: 20px; padding: 4px 14px; font-size: 13px; font-weight: bold; margin-bottom: 16px; }
        .detail-box { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px 24px; margin: 16px 0; }
        .detail-box table { width: 100%; border-collapse: collapse; }
        .detail-box td { padding: 7px 0; color: #333; font-size: 14px; border-bottom: 1px solid #eee; }
        .detail-box tr:last-child td { border-bottom: none; }
        .detail-box td:first-child { font-weight: bold; color: #003087; width: 150px; }
        .footer { background: #f4f6f9; padding: 16px 40px; text-align: center; }
        .footer p { color: #888; font-size: 12px; margin: 2px 0; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>New Appointment Request</h1>
          <p>MedRise Medical Centre — Staff Notification</p>
        </div>
        <div class="body">
          <div class="badge">STATUS: PENDING</div>
          <p style="color:#444; margin-top:0;">A new appointment has been submitted via the website. Please log in to the admin dashboard to confirm or manage it.</p>
          <div class="detail-box">
            <table>
              <tr><td>Patient Name</td><td>${appt.patientName}</td></tr>
              <tr><td>Phone</td><td>${appt.phone}</td></tr>
              <tr><td>Email</td><td>${appt.email || "Not provided"}</td></tr>
              <tr><td>Service Requested</td><td>${appt.service}</td></tr>
              <tr><td>Preferred Date</td><td>${appt.preferredDate}</td></tr>
              <tr><td>Preferred Time</td><td>${appt.preferredTime}</td></tr>
              ${appt.message ? `<tr><td>Patient Note</td><td>${appt.message}</td></tr>` : ""}
            </table>
          </div>
        </div>
        <div class="footer">
          <p>Login to the admin dashboard to manage this appointment.</p>
          <p>&copy; 2025 MedRise Medical Centre — Internal Staff Notification</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const { error } = await resend.emails.send({
      from: "MedRise Website <onboarding@resend.dev>",
      to: ["medrisemedicalcentre@gmail.com"],
      subject: `New Appointment: ${appt.patientName} – ${appt.service} on ${appt.preferredDate}`,
      html,
    });
    if (error) {
      logger.error({ error }, "Resend error sending clinic notification");
    } else {
      logger.info("Clinic appointment notification email sent");
    }
  } catch (err) {
    logger.error({ err }, "Failed to send clinic notification email");
  }
}
