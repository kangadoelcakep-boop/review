// GripAndReview build 1759381753754
console.log("✅ GripAndReview build loaded: 1759381753754");


// ---- subscribe.js ----
// subscribe.js (robust, multi-form, fallback no-cors)
const API_URL = "https://script.google.com/macros/s/AKfycbwjJQ69NNajRuYS2_w2mZlK7zY3CHs1pbY2vJvOisRtmMZSwEZJIPcn9u4djtUCe1HqPg/exec";

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



// ---- review.js ----
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ review.js loaded");

  const form = document.getElementById("review-form");
  if (!form) {
    console.error("❌ review-form tidak ditemukan");
    return;
  }

  // handle klik bintang rating
  const stars = document.querySelectorAll("#star-rating span");
  const ratingInput = document.getElementById("rating");

  stars.forEach(star => {
    star.addEventListener("click", () => {
      const value = star.getAttribute("data-value");
      ratingInput.value = value;
      // highlight bintang
      stars.forEach(s => {
        s.style.color = (s.getAttribute("data-value") <= value) ? "gold" : "#ccc";
      });
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nama = document.getElementById("nama").value.trim();
    const email = document.getElementById("email").value.trim();
    const rating = document.getElementById("rating").value;
    const reviewText = document.getElementById("reviewText").value.trim();
    const marketplace = document.getElementById("marketplace").value;
    const seller = document.getElementById("seller").value.trim();

    let msgBox = document.getElementById("review-msg");
    if (!msgBox) {
      msgBox = document.createElement("p");
      msgBox.id = "review-msg";
      msgBox.style.marginTop = "10px";
      form.appendChild(msgBox);
    }

    if (!nama || !email || !rating || !reviewText || !marketplace || !seller) {
      msgBox.style.color = "red";
      msgBox.textContent = "❌ Semua field wajib diisi.";
      return;
    }

    msgBox.style.color = "#333";
    msgBox.textContent = "⏳ Mengirim ulasan...";

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "review",
          name: nama,
          email: email,
          rating: rating,
          text: reviewText,
          marketplace: marketplace,
          seller: seller,
          postUrl: window.location.href
        })
      });

      const data = await res.json();
      console.log("📩 Server response:", data);

      if (data.status === "ok") {
        msgBox.style.color = "green";
        msgBox.textContent = "✅ Ulasan berhasil dikirim! Silahkan menunggu moderasi.";
        form.reset();
        stars.forEach(s => s.style.color = "#ccc");
        ratingInput.value = "0";
      } else {
        msgBox.style.color = "red";
        msgBox.textContent = "❌ " + (data.message || "Terjadi kesalahan.");
      }

    } catch (err) {
      console.error("❌ Error kirim review:", err);
      msgBox.style.color = "red";
      msgBox.textContent = "❌ Gagal kirim ulasan.";
    }
  });
});



