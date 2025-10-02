(function () {
  const BASE_URL = "https://kangadoelcakep-boop.github.io/review/";

  fetch(BASE_URL + "latest.txt", { cache: "no-cache" })
    .then(res => res.text())
    .then(fileName => {
      const script = document.createElement("script");
      script.src = BASE_URL + fileName.trim();
      script.async = true;
      document.head.appendChild(script);
      console.log("✅ Loaded latest JS:", fileName.trim());
    })
    .catch(err => {
      console.error("❌ Gagal load latest.txt:", err);
    });
})();
