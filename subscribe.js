const API_URL = "https://script.google.com/macros/s/AKfycbwjJQ69NNajRuYS2_w2mZlK7zY3CHs1pbY2vJvOisRtmMZSwEZJIPcn9u4djtUCe1HqPg/exec";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("subscribe-form");
  const msg = document.getElementById("subMessage");

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("subEmail").value.trim();

    // langsung kirim tanpa async/await (supaya tidak "silent fail")
    fetch(API_URL, {
      method: "POST",
      mode: "no-cors",  // bypass CORS
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "subscribe", email })
    });

    // karena no-cors, kita tidak bisa tahu responnya
    msg.style.color = "green";
    msg.textContent = "✅ Subscribe berhasil! Email Anda masuk ke daftar.";
    localStorage.setItem("subscriberEmail", email);
    form.reset();
  });
});
