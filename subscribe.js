const API_URL = "https://script.google.com/macros/s/AKfycbwjJQ69NNajRuYS2_w2mZlK7zY3CHs1pbY2vJvOisRtmMZSwEZJIPcn9u4djtUCe1HqPg/exec";

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ subscribe.js loaded, DOM ready");
  const form = document.getElementById("subscribe-form");
  const msg = document.getElementById("subMessage");

  if (!form) {
    console.error("❌ Subscribe form not found");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("subEmail").value.trim();
    msg.style.color = "#333";
    msg.textContent = "⏳ Memproses...";

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "subscribe", email }),
      });

      const data = await res.json();
      console.log("Server response:", data);

      if (data.status === "ok") {
        msg.style.color = "green";
        msg.textContent = "✅ Subscribe berhasil! Cek email Anda untuk validasi.";
        localStorage.setItem("subscriberEmail", email);
        form.reset();
      } else if (data.status === "exists") {
        msg.style.color = "orange";
        msg.textContent = "⚠️ Email sudah terdaftar. Jika belum validasi, cek inbox Anda.";
        localStorage.setItem("subscriberEmail", email);
      } else {
        msg.style.color = "red";
        msg.textContent = "❌ " + (data.message || "Terjadi kesalahan.");
      }
    } catch (err) {
      console.error("❌ Fetch error:", err);
      msg.style.color = "red";
      msg.textContent = "❌ Error: " + err;
    }
  });
});
