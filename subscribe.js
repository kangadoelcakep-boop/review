const API_URL = "https://script.google.com/macros/s/AKfycbwjJQ69NNajRuYS2_w2mZlK7zY3CHs1pbY2vJvOisRtmMZSwEZJIPcn9u4djtUCe1HqPg/exec";

console.log("✅ subscribe.js loaded");

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM loaded, mencari form subscribe...");

  const forms = document.querySelectorAll("form[id^='subscribe-form']");
  if (!forms.length) {
    console.error("❌ Tidak ada form subscribe ditemukan.");
    return;
  }

  forms.forEach(form => {
    // ambil ID unik dari form (misalnya: subscribe-form-desktop / subscribe-form-mobile)
    const suffix = form.id.replace("subscribe-form-", "");
    const emailField = form.querySelector("input[type='email']");
    const msg = document.getElementById(`subMessage-${suffix}`);

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

      console.log(`📨 Form [${form.id}] submit dengan email:`, email);

      fetch(API_URL, {
        method: "POST",
        mode: "no-cors",  // bypass CORS
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "subscribe", email })
      });

      if (msg) {
        msg.style.color = "green";
        msg.textContent = "✅ Subscribe berhasil! Email Anda masuk ke daftar.";
      }

      localStorage.setItem("subscriberEmail", email);
      form.reset();
    });
  });
});
