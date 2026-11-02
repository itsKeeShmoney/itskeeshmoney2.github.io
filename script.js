(() => {
  "use strict";

  const config = window.WORTHIT_CONFIG && typeof window.WORTHIT_CONFIG === "object"
    ? window.WORTHIT_CONFIG
    : {};
  const requestTimeoutMs = 10000;

  // Accept HTTPS external URLs or same-origin HTTP(S) paths. Never accept credentials
  // or unfilled YOUR markers. Account links additionally require absolute HTTPS.
  function validatedUrl(value, { httpsOnly = false, absoluteOnly = false } = {}) {
    if (typeof value !== "string" || !value.trim() || value.length > 2048) return null;
    const candidate = value.trim();
    if (/[\u0000-\u0020\u007f]/.test(candidate) || /YOUR/i.test(candidate)) return null;
    if (candidate.startsWith("//") || candidate.includes("\\")) return null;
    if (absoluteOnly && !/^https:\/\//i.test(candidate)) return null;
    try {
      const url = new URL(candidate, document.baseURI);
      if (url.username || url.password) return null;
      if (httpsOnly && url.protocol !== "https:") return null;
      if (url.protocol !== "https:" && !(url.protocol === "http:" && url.origin === window.location.origin)) return null;
      return url;
    } catch {
      return null;
    }
  }

  function setupWelcome() {
    const video = document.getElementById("welcomeVideo");
    const toggle = document.getElementById("videoToggle");
    const status = document.getElementById("videoStatus");
    if (!video || !toggle || !status) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    video.controls = false;
    toggle.hidden = false;

    function updateControls() {
      toggle.textContent = video.paused ? "Play welcome film" : "Pause welcome film";
      status.textContent = video.paused ? "Welcome film is paused." : "Welcome film is playing.";
    }
    async function playVideo() {
      try {
        await video.play();
        updateControls();
      } catch {
        updateControls();
        status.textContent = "The film could not play. You can still explore the site.";
      }
    }
    toggle.addEventListener("click", () => {
      if (video.paused) playVideo();
      else video.pause();
    });
    video.addEventListener("play", updateControls);
    video.addEventListener("pause", updateControls);
    function videoUnavailable() {
      toggle.hidden = true;
      status.textContent = "The film is unavailable. You can still explore the site.";
    }
    video.addEventListener("error", videoUnavailable);
    const source = video.querySelector("source");
    if (source) source.addEventListener("error", videoUnavailable);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) video.pause();
    });
    window.addEventListener("pagehide", () => video.pause());
    document.querySelectorAll('a[href="home.html"], a[href="products.html"], a[href="account.html"]').forEach(link => {
      link.addEventListener("click", () => video.pause());
    });
    const onMotionChange = event => {
      if (event.matches) video.pause();
    };
    if (typeof motion.addEventListener === "function") motion.addEventListener("change", onMotionChange);
    else if (typeof motion.addListener === "function") motion.addListener(onMotionChange);
    updateControls();
    if (!motion.matches && !document.hidden) playVideo();
  }

  function setupAccount() {
    const actions = document.getElementById("accountActions");
    const status = document.getElementById("accountStatus");
    if (!actions || !status) return;
    const signIn = validatedUrl(config.accountSignInUrl, { httpsOnly: true, absoluteOnly: true });
    const signUp = validatedUrl(config.accountSignUpUrl, { httpsOnly: true, absoluteOnly: true });
    if (!signIn && !signUp) return;
    actions.replaceChildren();
    [
      { url: signIn, label: "Sign in" },
      { url: signUp, label: "Create account" }
    ].forEach(({ url, label }) => {
      if (!url) return;
      const link = document.createElement("a");
      link.className = "button button-secondary";
      link.textContent = label;
      link.href = url.href;
      actions.append(link);
    });
    actions.hidden = false;
    const availability = signIn && signUp
      ? "Continue to the configured account provider to sign in or create an account."
      : signIn
        ? "Continue to the configured account provider to sign in. Account creation is not configured."
        : "Continue to the configured account provider to create an account. Customer sign-in is not configured.";
    status.textContent = `${availability} No account information is collected on this page.`;
  }

  function validateProduct(product) {
    if (!product || typeof product !== "object" || Array.isArray(product)) return null;
    const validId = (typeof product.id === "number" && Number.isSafeInteger(product.id) && product.id > 0)
      || (typeof product.id === "string" && /^[A-Za-z0-9._-]{1,128}$/.test(product.id));
    const validName = typeof product.name === "string" && product.name.trim().length > 0
      && product.name.trim().length <= 160 && !/[\u0000-\u001f\u007f]/.test(product.name);
    const validPrice = typeof product.price === "number" && Number.isFinite(product.price)
      && product.price >= 0 && product.price <= 1000000000;
    const image = validatedUrl(product.image);
    if (!validId || !validName || !validPrice || !image) return null;
    return { id: String(product.id), name: product.name.trim(), price: product.price, image: image.href };
  }

  function createProductCard(product) {
    const card = document.createElement("article");
    card.className = "productCard";
    card.dataset.productId = product.id;
    const media = document.createElement("div");
    media.className = "product-image";
    const image = document.createElement("img");
    image.alt = product.name;
    image.loading = "lazy";
    image.decoding = "async";
    image.referrerPolicy = "no-referrer";
    image.addEventListener("error", () => {
      const unavailable = document.createElement("p");
      unavailable.className = "image-unavailable";
      unavailable.textContent = "Product image unavailable.";
      media.replaceChildren(unavailable);
    }, { once: true });
    image.src = product.image;
    media.append(image);
    const name = document.createElement("h3");
    name.textContent = product.name;
    const price = document.createElement("p");
    price.className = "product-price";
    // The API has no currency field. Do not invent a currency or checkout link.
    price.textContent = `Price: ${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(product.price)}`;
    card.append(media, name, price);
    return card;
  }

  class CatalogError extends Error {}

  function setupCatalog() {
    const grid = document.getElementById("productGrid");
    const status = document.getElementById("productStatus");
    const retry = document.getElementById("productRetry");
    if (!grid || !status || !retry) return;
    let loading = false;
    function getEndpoint() {
      const base = validatedUrl(config.apiBaseUrl);
      if (!base || base.search || base.hash) return null;
      // apiBaseUrl is the API origin or deployment prefix, not /api/products.
      base.pathname = `${base.pathname.replace(/\/+$/, "")}/api/products`;
      return base.href;
    }
    async function loadProducts() {
      if (loading) return;
      const endpoint = getEndpoint();
      grid.replaceChildren();
      if (!endpoint) {
        status.textContent = "The product service is not configured yet. Collections are coming soon; no live catalog is available.";
        retry.textContent = "Retry loading catalog";
        retry.hidden = true;
        return;
      }
      if (typeof window.fetch !== "function" || typeof window.AbortController !== "function") {
        status.textContent = "This browser cannot load the live catalog. The collection previews above are still available.";
        retry.hidden = true;
        return;
      }
      loading = true;
      grid.setAttribute("aria-busy", "true");
      status.textContent = "Loading the catalog…";
      retry.disabled = true;
      retry.hidden = false;
      retry.textContent = "Loading catalog…";
      const controller = new AbortController();
      let timedOut = false;
      const timeout = window.setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, requestTimeoutMs);
      try {
        const response = await window.fetch(endpoint, {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "omit",
          cache: "no-store",
          signal: controller.signal
        });
        if (!response.ok) throw new CatalogError(`The catalog could not be loaded (HTTP ${response.status}). Please try again.`);
        let data;
        try {
          data = await response.json();
        } catch {
          throw new CatalogError("The product service returned unreadable data. Please try again.");
        }
        if (!Array.isArray(data) || data.length > 500) {
          throw new CatalogError("The product service returned an unexpected catalog format. Please try again.");
        }
        const products = data.map(validateProduct);
        if (products.some(product => !product) || new Set(products.map(product => product.id)).size !== products.length) {
          throw new CatalogError("The catalog contains invalid product details and cannot be displayed safely. Please try again.");
        }
        const fragment = document.createDocumentFragment();
        products.forEach(product => fragment.append(createProductCard(product)));
        grid.append(fragment);
        status.textContent = products.length
          ? `${products.length} ${products.length === 1 ? "product" : "products"} loaded. Catalog browsing only; checkout is not configured.`
          : "The catalog is empty for pre-launch. WORTHIT OG and WORTHIT ANIME are coming soon; no products are available to order.";
        retry.textContent = "Refresh catalog";
      } catch (error) {
        grid.replaceChildren();
        status.textContent = timedOut
          ? "The catalog request timed out after 10 seconds. Please try again."
          : error instanceof CatalogError
            ? error.message
            : "The product service could not be reached. Please check your connection and try again.";
        retry.textContent = "Retry loading catalog";
      } finally {
        window.clearTimeout(timeout);
        grid.setAttribute("aria-busy", "false");
        retry.disabled = false;
        loading = false;
      }
    }
    retry.addEventListener("click", loadProducts);
    loadProducts();
  }

  setupWelcome();
  setupAccount();
  setupCatalog();
})();
