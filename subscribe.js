const API_URL = "https://script.google.com/macros/s/AKfycbwjJQ69NNajRuYS2_w2mZlK7zY3CHs1pbY2vJvOisRtmMZSwEZJIPcn9u4djtUCe1HqPg/exec";

console.log("✅ subscribe.js loaded");
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM loaded, mencari form...");
  const form = document.getElementById("subscribe-form");
  const msg = document.getElementById("subMessage");

  if (!form) {
    console.error("❌ Form subscribe tidak ditemukan di halaman.");
    return;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    console.log("📨 Form submit terpanggil");
    const email = document.getElementById("subEmail").value.trim();

    fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "subscribe", email })
    });

    msg.style.color = "green";
    msg.textContent = "✅ Subscribe berhasil! Email Anda masuk ke daftar.";
    localStorage.setItem("subscriberEmail", email);
    form.reset();
  });
});


