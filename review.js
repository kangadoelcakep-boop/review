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


