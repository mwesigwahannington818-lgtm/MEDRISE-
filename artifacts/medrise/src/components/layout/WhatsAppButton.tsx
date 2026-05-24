import React, { useState } from "react";
import { MessageCircle, Phone, X } from "lucide-react";
import { CONTACT_INFO } from "@/lib/constants";

const EMERGENCY_PHONE = "+256770775268";
const WHATSAPP_MSG = "Hello, I need assistance from MedRise Medical Centre.";

export function WhatsAppButton() {
  const [open, setOpen] = useState(false);

  const whatsappUrl = `https://wa.me/${EMERGENCY_PHONE.replace(/\D/g, "")}?text=${encodeURIComponent(WHATSAPP_MSG)}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Expanded menu */}
      {open && (
        <div className="flex flex-col items-end gap-2 mb-1 animate-in slide-in-from-bottom-4 duration-200">
          {/* Emergency Call */}
          <a
            href={`tel:${EMERGENCY_PHONE}`}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-full shadow-lg hover:bg-red-700 transition-all text-sm font-semibold whitespace-nowrap"
          >
            <Phone className="h-4 w-4" />
            Emergency Call
          </a>

          {/* WhatsApp Chat */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#25D366] text-white px-4 py-2.5 rounded-full shadow-lg hover:bg-[#20b858] transition-all text-sm font-semibold whitespace-nowrap"
          >
            <MessageCircle className="h-4 w-4" />
            Chat on WhatsApp
          </a>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label={open ? "Close contact menu" : "Contact us"}
        className={`h-14 w-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${
          open ? "bg-gray-800 text-white" : "bg-[#25D366] text-white animate-pulse-slow"
        }`}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-7 w-7" />}
      </button>
    </div>
  );
}
