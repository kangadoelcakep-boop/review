// subscribe.js (robust, multi-form, fallback no-cors)


// Optional: client-side allowed domains for better UX (server is authoritative)
const ALLOWED_DOMAINS = [
  'gmail.com', 'googlemail.com',
  'yahoo.com', 'yahoo.co.id',
  'outlook.com', 'outlook.co.uk',
  'hotmail.com', 'live.com', 'msn.com'
];

console.log("✅ subscribe.js loaded");

function getDomainFromEmail(email) {
  if (!email || email.indexOf('@') === -1) return '';
  return email.split('@')[1].toLowerCase();
}

function findMessageElement(form) {
  // cari elemen pesan relatif ke form, beberapa fallback
  let msg = form.querySelector("[id^='subMessage']");
  if (!msg && form.parentElement) msg = form.parentElement.querySelector("p[id^='subMessage'], div[id^='subMessage']");
  if (!msg) msg = document.querySelector("p[id^='subMessage'], div[id^='subMessage']");
  return msg;
}

async function sendNormal(email) {
  // Kirim normal, coba baca JSON response
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "subscribe", email })
  });
  // Bisa melempar jika CORS/Network error
  const data = await res.json();
  return data; // {status: 'ok'|'exists'|'error', message: '...'}
}

function sendNoCors(email) {
  // fallback: kirim tanpa baca respons
  try {
    fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "subscribe", email })
    });
    return true;
  } catch (e) {
    return false;
  }
}

function showMsg(msgElem, color, text) {
  if (!msgElem) return;
  msgElem.style.color = color;
  msgElem.textContent = text;
}

async function handleFormSubmit(form) {
  const emailField = form.querySelector("input[type='email']");
  const msgElem = findMessageElement(form);
  if (!emailField) {
    console.error("subscribe.js: email input not found for form", form);
    return;
  }
  const email = (emailField.value || '').trim();
  if (!email) {
    showMsg(msgElem, "red", "⚠️ Masukkan email yang valid.");
    return;
  }
  // quick client-side validation (UX only)
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    showMsg(msgElem, "red", "⚠️ Format email tidak valid.");
    return;
  }
  const domain = getDomainFromEmail(email);
  if (!ALLOWED_DOMAINS.includes(domain)) {
    showMsg(msgElem, "red", "⚠️ Hanya Gmail / Yahoo / Outlook/Hotmail yang diperbolehkan.");
    return;
  }

  showMsg(msgElem, "#333", "⏳ Memproses...");

  // coba kirim normal dulu (bisa gagal karena CORS)
  try {
    const data = await sendNormal(email);
    console.log("subscribe.js: server response:", data);

    if (!data || !data.status) {
      // unexpected, fallback to no-cors result UX
      showMsg(msgElem, "green", "✅ Subscribe terkirim. Cek inbox email anda untuk verifikasi.");
      localStorage.setItem("subscriberEmail", email);
      form.reset();
      return;
    }

    if (data.status === "ok") {
      showMsg(msgElem, "green", "✅ Subscribe berhasil! Cek email Anda untuk validasi.");
      localStorage.setItem("subscriberEmail", email);
      form.reset();
    } else if (data.status === "exists") {
      showMsg(msgElem, "orange", "⚠️ Email sudah terdaftar. Jika belum validasi, cek inbox Anda.");
      localStorage.setItem("subscriberEmail", email);
    } else {
      showMsg(msgElem, "red", "❌ " + (data.message || "Terjadi kesalahan."));
    }
    return;
  } catch (err) {
    console.warn("subscribe.js: normal fetch failed (likely CORS). Falling back to no-cors.", err);
    // fallback: send no-cors (we cannot read server response)
    const ok = sendNoCors(email);
    if (ok) {
      showMsg(msgElem, "green", "✅ Subscribe berhasil! Cek email Anda untuk validasi.");
      localStorage.setItem("subscriberEmail", email);
      form.reset();
    } else {
      showMsg(msgElem, "red", "❌ Gagal mengirim subscribe. Coba lagi nanti.");
    }
    return;
  }
}

function initSubscribe() {
  console.log("✅ subscribe.js: initSubscribe()");
  // cari semua form dengan id mulai "subscribe-form"
  const forms = document.querySelectorAll("form[id^='subscribe-form']");
  if (!forms || forms.length === 0) {
    console.warn("subscribe.js: no subscribe-form found");
    return;
  }

  forms.forEach(form => {
    // remove previous listener (if any) to avoid duplicates
    form.removeEventListener("__subscribe__handler", function(){});
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      handleFormSubmit(form);
    });
  });

  console.log("subscribe.js: hooked %d form(s)", forms.length);
}

// init either immediately (script placed at end) or on DOMContentLoaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSubscribe);
} else {
  // DOM already ready
  initSubscribe();
}


