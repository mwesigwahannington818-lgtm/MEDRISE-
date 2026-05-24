const CLINIC_NAME = "MedRise Medical Centre";
const CLINIC_PHONE = "+256 770 775268";
const CLINIC_ADDRESS = "Lwadda A, Matugga, Wakiso District";

function cleanPhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "256" + digits.slice(1);
  if (!digits.startsWith("256")) digits = "256" + digits;
  return digits;
}

export interface AppointmentReminderData {
  patientName: string;
  phone: string;
  service: string;
  preferredDate: string;
  preferredTime: string;
}

export function buildReminderUrl(appt: AppointmentReminderData): string {
  const dateStr = (() => {
    try {
      return new Date(appt.preferredDate).toLocaleDateString("en-UG", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      });
    } catch {
      return appt.preferredDate;
    }
  })();

  const message = [
    `Dear ${appt.patientName},`,
    ``,
    `This is a friendly reminder from *${CLINIC_NAME}* about your upcoming appointment.`,
    ``,
    `📅 *Date:* ${dateStr}`,
    `🕐 *Time:* ${appt.preferredTime}`,
    `🏥 *Service:* ${appt.service}`,
    `📍 *Location:* ${CLINIC_ADDRESS}`,
    ``,
    `Please arrive 10–15 minutes early. If you need to reschedule, call us at ${CLINIC_PHONE}.`,
    ``,
    `We look forward to seeing you!`,
    `— ${CLINIC_NAME} Team`,
  ].join("\n");

  return `https://wa.me/${cleanPhone(appt.phone)}?text=${encodeURIComponent(message)}`;
}

export function buildConfirmationUrl(appt: AppointmentReminderData): string {
  const dateStr = (() => {
    try {
      return new Date(appt.preferredDate).toLocaleDateString("en-UG", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      });
    } catch {
      return appt.preferredDate;
    }
  })();

  const message = [
    `Dear ${appt.patientName},`,
    ``,
    `✅ Your appointment at *${CLINIC_NAME}* has been *confirmed*!`,
    ``,
    `📅 *Date:* ${dateStr}`,
    `🕐 *Time:* ${appt.preferredTime}`,
    `🏥 *Service:* ${appt.service}`,
    `📍 *Location:* ${CLINIC_ADDRESS}`,
    ``,
    `Please bring your health card or ID. Arrive 10–15 minutes early.`,
    `For any changes, call us at ${CLINIC_PHONE}.`,
    ``,
    `See you soon! 😊`,
    `— ${CLINIC_NAME} Team`,
  ].join("\n");

  return `https://wa.me/${cleanPhone(appt.phone)}?text=${encodeURIComponent(message)}`;
}

export function isToday(dateStr: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return dateStr.slice(0, 10) === today;
}

export function isTomorrow(dateStr: string): boolean {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  return dateStr.slice(0, 10) === tomorrow;
}

export function isUpcoming(dateStr: string, daysAhead = 3): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  const cutoff = new Date(Date.now() + daysAhead * 86400000);
  return d >= now && d <= cutoff;
}
