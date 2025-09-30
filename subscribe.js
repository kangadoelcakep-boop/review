const API_URL = "https://script.google.com/macros/s/AKfycbwjJQ69NNajRuYS2_w2mZlK7zY3CHs1pbY2vJvOisRtmMZSwEZJIPcn9u4djtUCe1HqPg/exec";

console.log("✅ subscribe.js loaded");

// Jalan langsung, karena script dipanggil setelah DOM sudah siap
(function () {
  console.log("✅ Inisialisasi langsung, mencari form subscribe...");

  const forms = document.querySelectorAll("form[id^='subscribe-form']");
  if (!forms.length) {
    console.error("❌ Tidak ada form subscribe ditemukan.");
    return;
  }

  forms.forEach(form => {
    const emailField = form.querySelector("input[type='email']");
    const msg = form.parentElement.querySelector("p[id^='subMessage']");

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const email = emailField ? emailField.value.trim() : "";
      if (!email) {
        if (msg) {
          msg.style.color = "red";
          msg.textContent = "⚠️ Masukkan email yang valid.";
        }
        return;
      }

      console.log("📨 Form submit terpanggil dengan email:", email);

      // Kirim data ke Google Apps Script
      fetch(API_URL, {
        method: "POST",
        mode: "no-cors", // bypass CORS
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "subscribe", email })
      });

      if (msg) {
        msg.style.color = "green";
        msg.textContent = "✅ Subscribe berhasil! Email Anda masuk ke daftar.";
      }

      // Simpan email di localStorage (opsional)
      localStorage.setItem("subscriberEmail", email);

      // Reset form
      form.reset();
    });
  });
})();
