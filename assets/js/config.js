/* ============================================================
   RDK Emergency Care — site configuration
   Single swap point for contact/booking channels.
   ============================================================ */
window.RDK_CONFIG = {
  // WhatsApp number in international format, digits only.
  whatsapp: "255684114433",
  whatsappDisplay: "+255 684 114 433",

  email: "info@rdk.co.tz",

  // Social profiles — paste the Facebook / TikTok URLs when ready;
  // empty entries simply hide the icon.
  social: {
    instagram: "https://www.instagram.com/rdk.co.tz",
    facebook: "",
    tiktok: ""
  },
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
