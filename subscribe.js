// ganti API_URL sesuai Web App Anda (tetap gunakan versi commit hash di production)
const API_URL = "https://script.google.com/macros/s/AKfycbwjJQ69NNajRuYS2_w2mZlK7zY3CHs1pbY2vJvOisRtmMZSwEZJIPcn9u4djtUCe1HqPg/exec";

console.log("✅ subscribe.js loaded (client-side domain check active)");

// daftar domain yang sama seperti di server (sinkron supaya UX konsisten)
const ALLOWED_DOMAINS = [
  'gmail.com', 'googlemail.com',
  'yahoo.com', 'yahoo.co.id',
  'outlook.com', 'outlook.co.uk', 'hotmail.com',
  'live.com', 'msn.com'
];

function getDomainFromEmail(email) {
  if (!email || email.indexOf('@') === -1) return '';
  return email.split('@')[1].toLowerCase();
}

(function () {
  // script diharapkan dipanggil setelah form ada di DOM
  console.log("✅ Inisialisasi subscribe client (cek domain sebelum submit)...");

  const forms = document.querySelectorAll("form[id^='subscribe-form']");
  if (!forms.length) {
    console.warn("⚠️ Tidak ada form subscribe ditemukan.");
    return;
  }

  forms.forEach(form => {
    const emailField = form.querySelector("input[type='email']");
    const msg = form.parentElement.querySelector("p[id^='subMessage']");

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const email = emailField ? (emailField.value || '').trim() : '';
      if (!email) {
        if (msg) { msg.style.color = "red"; msg.textContent = "⚠️ Masukkan email yang valid."; }
        return;
      }

      // Cek format email sederhana di client
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) {
        if (msg) { msg.style.color = "red"; msg.textContent = "⚠️ Format email tidak valid."; }
        return;
      }

      // Cek domain yang diizinkan
      const domain = getDomainFromEmail(email);
      if (!ALLOWED_DOMAINS.includes(domain)) {
        if (msg) {
          msg.style.color = "red";
          msg.innerHTML = "⚠️ Hanya email <b>Gmail</b>, <b>Yahoo</b>, atau <b>Outlook/Hotmail/Live</b> yang diperbolehkan.";
        }
        return;
      }

      console.log("📨 Submit subscribe (domain OK):", email);

      // Kirim ke Apps Script (pakai no-cors jika masih perlu)
      fetch(API_URL, {
        method: "POST",
        mode: "no-cors", // jika masih perlu bypass CORS - hasil response tidak bisa dibaca
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "subscribe", email })
      });

      // UX: tampilkan pesan sukses (karena kita validasi di client dulu)
      if (msg) {
        msg.style.color = "green";
        msg.textContent = "✅ Subscribe berhasil! Cek inbox untuk verifikasi (jika diaktifkan).";
      }
      localStorage.setItem("subscriberEmail", email);
      form.reset();
    });
  });
})();
