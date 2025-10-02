// subscribe.js (force no-cors)
const API_URL = "https://script.google.com/macros/s/AKfycbwjJQ69NNajRuYS2_w2mZlK7zY3CHs1pbY2vJvOisRtmMZSwEZJIPcn9u4djtUCe1HqPg/exec";

const ALLOWED_DOMAINS = [
  'gmail.com', 'googlemail.com',
  'yahoo.com', 'yahoo.co.id',
  'outlook.com', 'outlook.co.uk',
  'hotmail.com', 'live.com', 'msn.com'
];

console.log("✅ subscribe.js loaded (no-cors mode)");

function getDomainFromEmail(email) {
  if (!email || email.indexOf('@') === -1) return '';
  return email.split('@')[1].toLowerCase();
}

function findMessageElement(form) {
  let msg = form.querySelector("[id^='subMessage']");
  if (!msg && form.parentElement) msg = form.parentElement.querySelector("p[id^='subMessage'], div[id^='subMessage']");
  if (!msg) msg = document.querySelector("p[id^='subMessage'], div[id^='subMessage']");
  return msg;
}

function showMsg(msgElem, color, text) {
  if (!msgElem) return;
  msgElem.style.color = color;
  msgElem.textContent = text;
}

async function handleFormSubmit(form) {
  const emailField = form.querySelector("input[type='email']");
  const msgElem = findMessageElement(form);
  if (!emailField) return;

  const email = (emailField.value || '').trim();
  if (!email) {
    showMsg(msgElem, "red", "⚠️ Masukkan email yang valid.");
    return;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    showMsg(msgElem, "red", "⚠️ Format email tidak valid.");
    return;
  }

  const domain = getDomainFromEmail(email);
  if (!ALLOWED_DOMAINS.includes(domain)) {
    showMsg(msgElem, "red", "⚠️ Hanya Gmail / Yahoo / Outlook yang diperbolehkan.");
    return;
  }

  showMsg(msgElem, "#333", "⏳ Mengirim...");

  try {
    await fetch(API_URL, {
      method: "POST",
      mode: "no-cors", // paksa no-cors
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "subscribe", email })
    });

    // kita tidak bisa baca balikan dari server → asumsi sukses
    showMsg(msgElem, "green", "✅ Subscribe berhasil! Cek email Anda untuk validasi.");
    localStorage.setItem("subscriberEmail", email);
    form.reset();
  } catch (err) {
    console.error("❌ subscribe.js error:", err);
    showMsg(msgElem, "red", "❌ Gagal mengirim subscribe.");
  }
}

function initSubscribe() {
  console.log("✅ subscribe.js: initSubscribe()");
  const forms = document.querySelectorAll("form[id^='subscribe-form']");
  if (!forms || forms.length === 0) return;

  forms.forEach(form => {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      handleFormSubmit(form);
    });
  });

  console.log("subscribe.js: hooked %d form(s)", forms.length);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSubscribe);
} else {
  initSubscribe();
}
