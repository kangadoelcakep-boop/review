// loader.js
(function() {
  const baseUrl = "https://kangadoelcakep-boop.github.io/review/";

  // Ambil versi terbaru dari latest.txt
  fetch(baseUrl + "latest.txt", { cache: "no-store" })
    .then(res => res.text())
    .then(filename => {
      const scriptUrl = baseUrl + filename.trim();
      console.log("🔄 Memuat bundle:", scriptUrl);

      const script = document.createElement("script");
      script.src = scriptUrl;
      script.async = true;
      script.onload = () => console.log("✅ Bundle loaded:", scriptUrl);
      script.onerror = () => console.error("❌ Gagal load bundle:", scriptUrl);

      document.head.appendChild(script);
    })
    .catch(err => {
      console.error("❌ Gagal ambil latest.txt", err);
    });
})();
