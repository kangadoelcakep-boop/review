// loader.js - auto load latest GripAndReview build with fallback
(function () {
  const base = "https://kangadoelcakep-boop.github.io/review/";
  const latestUrl = base + "latest.txt";

  function injectScript(file) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = base + file;
      script.async = false;

      script.onload = () => {
        console.log("✅ Loader: injected", script.src);
        resolve();
      };

      script.onerror = (e) => {
        console.error("❌ Loader: gagal load", script.src);
        reject(e);
      };

      document.head.appendChild(script);
    });
  }

  // coba ambil latest.txt
  fetch(latestUrl, { cache: "no-cache" })
    .then(res => {
      if (!res.ok) throw new Error("Gagal fetch latest.txt");
      return res.text();
    })
    .then(filename => {
      const file = filename.trim();
      if (!file) throw new Error("latest.txt kosong");

      // simpan ke localStorage sebagai fallback
      localStorage.setItem("gripreview_latest_js", file);

      return injectScript(file);
    })
    .catch(err => {
      console.error("❌ Loader error:", err);

      // fallback → cek cache lokal
      const cached = localStorage.getItem("gripreview_latest_js");
      if (cached) {
        console.log("⚠️ Loader: fallback ke cached file", cached);
        injectScript(cached).catch(() => {
          console.error("❌ Loader: fallback gagal juga");
        });
      } else {
        console.error("❌ Loader: tidak ada fallback tersedia");
      }
    });
})();
