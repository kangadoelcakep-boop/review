const API_URL = "https://script.google.com/macros/s/AKfycbwjJQ69NNajRuYS2_w2mZlK7zY3CHs1pbY2vJvOisRtmMZSwEZJIPcn9u4djtUCe1HqPg/exec";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("subscribe-form");
  const msg = document.getElementById("subMessage");

  if (!form) return;

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const email = document.getElementById("subEmail").value.trim();

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "subscribe", email })
      });
      const data = await res.json();

      if (data.status === "ok") {
        msg.style.color = "green";
        msg.textContent = "✅ Berhasil subscribe!";
        localStorage.setItem("subscriberEmail", email);
      } else if (data.status === "exists") {
        msg.style.color = "orange";
        msg.textContent = "⚠️ Email sudah terdaftar.";
        localStorage.setItem("subscriberEmail", email);
      } else {
        msg.style.color = "red";
        msg.textContent = "❌ " + data.message;
      }
    } catch (err) {
      msg.style.color = "red";
      msg.textContent = "❌ Error: " + err;
    }
  });
});
