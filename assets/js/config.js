/* ============================================================
   RDK Emergency Care — site configuration
   Single swap point for contact/booking channels.
   ============================================================ */
window.RDK_CONFIG = {
  // WhatsApp number in international format, digits only.
  // Leave "" until the real number is provided — WhatsApp buttons
  // automatically fall back to the email link below.
  whatsapp: "",               // e.g. "255712345678"
  whatsappDisplay: "",        // e.g. "+255 712 345 678" (shown as text)

  email: "info@rdk.co.tz",
  office: {
    line1: "Kigamboni",
    line2: "P.O. Box Kigamboni",
    city: "Dar es Salaam, Tanzania"
  },
  legal: {
    incorporationNo: "189166923",
    businessLicense: "BL01396942025-2600004032",
    tin: "189-166-923"
  }
};

/* Build a WhatsApp deep link with a prefilled message. */
window.rdkWhatsApp = function (message) {
  var cfg = window.RDK_CONFIG;
  if (!cfg.whatsapp) return "mailto:" + cfg.email +
    "?subject=" + encodeURIComponent("Training enquiry — RDK Emergency Care") +
    "&body=" + encodeURIComponent(message || "");
  var text = message ? "?text=" + encodeURIComponent(message) : "";
  return "https://wa.me/" + cfg.whatsapp + text;
};
