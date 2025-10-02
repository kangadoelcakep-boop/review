// GripAndReview build 1759387892800
console.log("✅ GripAndReview build loaded: 1759387892800");


// ---- subscribe.js ----
// subscribe.js (uses global API_URL from config.js)
console.log("✅ subscribe.js loaded");

(function () {
  const ALLOWED_DOMAINS = [
    'gmail.com','googlemail.com',
    'yahoo.com','yahoo.co.id',
    'outlook.com','outlook.co.uk',
    'hotmail.com','live.com','msn.com'
  ];

  function getDomain(email) {
    if (!email || email.indexOf('@') === -1) return '';
    return email.split('@')[1].toLowerCase();
  }

  function findMessageElement(form) {
    // cari elemen pesan relatif ke form
    let msg = form.querySelector("[id^='subMessage']");
    if (!msg && form.parentElement) msg = form.parentElement.querySelector("[id^='subMessage']");
    if (!msg) msg = document.querySelector("[id^='subMessage']");
    return msg;
  }

  function showMsg(msgElem, color, text) {
    if (!msgElem) {
      console.log("subscribe: msgElem not found ->", text);
      return;
    }
    msgElem.style.color = color;
    msgElem.textContent = text;
  }

  async function sendNormal(email) {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "subscribe", email })
    });
    // jika sukses akan me-return JSON
    return await res.json();
  }

  function sendNoCors(email) {
    // fallback: kirim tanpa baca response (NO GUARANTEE data masuk)
    return fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "subscribe", email })
    }).then(() => ({ status: "ok", fallback: true }))
      .catch(() => ({ status: "error", message: "network" }));
  }

  async function handleFormSubmit(form) {
    const emailField = form.querySelector("input[type='email']");
    const msgElem = findMessageElement(form);
    if (!emailField) {
      console.error("subscribe: email input not found for form", form);
      return;
    }
    const email = (emailField.value || '').trim().toLowerCase();

    if (!email) {
      showMsg(msgElem, "red", "⚠️ Masukkan email yang valid.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      showMsg(msgElem, "red", "⚠️ Format email tidak valid.");
      return;
    }

    // optional client-side domain check (UX only)
    const domain = getDomain(email);
    if (!ALLOWED_DOMAINS.includes(domain)) {
      showMsg(msgElem, "red", "⚠️ Hanya Gmail / Yahoo / Outlook/Hotmail yang diperbolehkan.");
      return;
    }

    showMsg(msgElem, "#333", "⏳ Memproses...");

    try {
      // coba fetch normal (CORS must be enabled on server)
      const data = await sendNormal(email);
      console.log("subscribe: server response:", data);

      if (!data || !data.status) {
        // server didn't return JSON (maybe CORS blocked)
        showMsg(msgElem, "green", "✅ Subscribe terkirim. Cek inbox untuk verifikasi.");
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
    } catch (err) {
      console.warn("subscribe: normal fetch failed (likely CORS). Falling back to no-cors.", err);
      // fallback no-cors (can't read response). this *may* still send but we can't confirm
      const fb = await sendNoCors(email);
      if (fb && fb.status === "ok") {
        showMsg(msgElem, "green", "✅ Subscribe terkirim. Cek inbox untuk verifikasi.");
        localStorage.setItem("subscriberEmail", email);
        form.reset();
      } else {
        showMsg(msgElem, "red", "❌ Gagal mengirim subscribe. Coba lagi nanti.");
      }
    }
  }

  function initSubscribe() {
    console.log("✅ subscribe.js: initSubscribe()");
    const forms = document.querySelectorAll("form[id^='subscribe-form']");
    if (!forms || forms.length === 0) {
      console.warn("subscribe.js: no subscribe-form found");
      return;
    }
    forms.forEach(form => {
      // attach listener (no duplicates)
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        handleFormSubmit(form);
      });
    });
    console.log("subscribe.js: hooked", forms.length, "form(s)");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSubscribe);
  } else {
    initSubscribe();
  }
})();


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



