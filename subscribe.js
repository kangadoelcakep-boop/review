const API_URL = "https://script.google.com/macros/s/AKfycbwjJQ69NNajRuYS2_w2mZlK7zY3CHs1pbY2vJvOisRtmMZSwEZJIPcn9u4djtUCe1HqPg/exec";

console.log("✅ subscribe.js loaded");
document.addEventListener("DOMContentLoaded", () => {
  const forms = document.querySelectorAll("form[id^='subscribe-form']");
  forms.forEach(form => {
    const msg = form.parentElement.querySelector("#subMessage");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = form.querySelector("#subEmail").value.trim();

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
});




