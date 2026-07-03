(() => {
  "use strict";

  /* ======================================================
     0. CONFIG
     ====================================================== */
  const WEBHOOK_URL = "https://webhooksite.net/a6e446d7-5bb5-4d32-ac02-4a18bd6ddb95";
  const ANALYTICS_DEBUG = true; // shows small toasts when click/scroll events are tracked

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ======================================================
     1. THEME (dark / light) — persisted
     ====================================================== */
  const themeToggle = $("#themeToggle");
  const root = document.body;
  const savedTheme = localStorage.getItem("vesta_theme");
  if (savedTheme) root.setAttribute("data-theme", savedTheme);
  else if (window.matchMedia("(prefers-color-scheme: light)").matches) root.setAttribute("data-theme", "light");

  themeToggle.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    localStorage.setItem("vesta_theme", next);
    track("theme_toggle", { theme: next });
  });

  /* ======================================================
     2. NAV: scrolled state + mobile menu
     ====================================================== */
  const nav = $("#nav");
  const onScrollNav = () => nav.classList.toggle("scrolled", window.scrollY > 8);
  onScrollNav();
  window.addEventListener("scroll", onScrollNav, { passive: true });

  const mobileMenu = $("#mobileMenu");
  $("#burgerBtn").addEventListener("click", () => mobileMenu.classList.add("open"));
  $("#closeMobileMenu").addEventListener("click", () => mobileMenu.classList.remove("open"));
  $$("#mobileMenu nav a").forEach(a => a.addEventListener("click", () => mobileMenu.classList.remove("open")));

  /* ======================================================
     3. SCROLL REVEAL (IntersectionObserver)
     ====================================================== */
  const revealEls = $$(".reveal, .reveal-stagger");
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -60px 0px" });
  revealEls.forEach(el => revealObserver.observe(el));

  /* ======================================================
     4. SCROLLYTELLING — active step highlight
     ====================================================== */
  const steps = $$(".story-step");
  if (steps.length) {
    const stepObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        entry.target.classList.toggle("active", entry.isIntersecting);
      });
    }, { threshold: 0.5 });
    steps.forEach(s => stepObserver.observe(s));
  }

  /* Parallax orbs in story section (rAF-throttled) */
  const orbs = $$(".story-orb");
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking || !orbs.length) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      orbs.forEach((orb, i) => {
        const speed = i === 0 ? 0.04 : -0.05;
        orb.style.transform = `translateY(${y * speed}px)`;
      });
      ticking = false;
    });
  }, { passive: true });

  /* ======================================================
     5. TOASTS
     ====================================================== */
  const toastStack = $("#toastStack");
  function showToast(msg) {
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `<span class="dot"></span><span>${msg}</span>`;
    toastStack.appendChild(el);
    setTimeout(() => {
      el.classList.add("leaving");
      setTimeout(() => el.remove(), 300);
    }, 3200);
  }

  /* ======================================================
     6. LIGHTWEIGHT BEHAVIOUR ANALYTICS (click / scroll)
     ====================================================== */
  function track(event, payload = {}) {
    // In production, replace with a real analytics call, e.g.:
    // navigator.sendBeacon('/api/analytics', JSON.stringify({event, payload, ts: Date.now()}));
    console.log("[analytics]", event, payload);
  }

  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-track]");
    if (el) track("click", { id: el.dataset.track });
  });

  let scrollMilestones = new Set();
  window.addEventListener("scroll", () => {
    const pct = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
    [25, 50, 75, 90].forEach(m => {
      if (pct >= m && !scrollMilestones.has(m)) {
        scrollMilestones.add(m);
        track("scroll_depth", { percent: m });
        if (ANALYTICS_DEBUG) showToast(`Đã cuộn ${m}% trang`);
      }
    });
  }, { passive: true });

  /* ======================================================
     7. SKELETON LOADING — reviews
     ====================================================== */
  window.addEventListener("load", () => {
    $$(".review-card").forEach((card, i) => {
      setTimeout(() => {
        const name = card.dataset.name, role = card.dataset.role, quote = card.dataset.quote;
        $(".review-quote", card).textContent = `“${quote}”`;
        $(".review-avatar", card).textContent = name.split(" ").slice(-2).map(w => w[0]).join("");
        $(".review-who b", card).textContent = name;
        $(".review-who span", card).textContent = role;
        card.classList.add("loaded");
      }, 500 + i * 350);
    });
  });

  /* ======================================================
     8. MINI E-COMMERCE — cart, favorites, recently viewed
     ====================================================== */
  const PRODUCT = { id: "vesta-halo", name: "VESTA Halo", price: 4990000 };
  const FINISH_LABEL = { gold: "Vàng đồng", graphite: "Than chì", rose: "Hồng đồng" };
  const FINISH_COLOR = { gold: "#E4C55E", graphite: "#5b5f70", rose: "#e3b3ae" };

  const store = {
    get(key, fallback) {
      try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
      catch { return fallback; }
    },
    set(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
  };

  let cart = store.get("vesta_cart", []);
  let favorites = store.get("vesta_favorites", []);
  let recentlyViewed = store.get("vesta_recent", []);

  const money = (n) => n.toLocaleString("vi-VN") + "₫";

  /* -- shop options state -- */
  let selected = { finish: "gold", size: "8" };
  const finishSvg = $("#finishSvg");
  const finishLabel = $("#finishLabel");

  $("#swatchGroup").addEventListener("click", (e) => {
    const btn = e.target.closest(".swatch");
    if (!btn) return;
    $$(".swatch").forEach(s => s.classList.remove("active"));
    btn.classList.add("active");
    selected.finish = btn.dataset.finish;
    finishLabel.textContent = btn.dataset.label;
    $$("circle", finishSvg)[0].setAttribute("stroke", FINISH_COLOR[selected.finish]);
    pushRecentlyViewed();
  });

  $("#sizeGroup").addEventListener("click", (e) => {
    const btn = e.target.closest(".pill");
    if (!btn) return;
    $$(".pill", $("#sizeGroup")).forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    selected.size = btn.dataset.size;
  });

  function pushRecentlyViewed() {
    const entry = { finish: selected.finish, label: FINISH_LABEL[selected.finish], ts: Date.now() };
    recentlyViewed = [entry, ...recentlyViewed.filter(r => r.finish !== entry.finish)].slice(0, 6);
    store.set("vesta_recent", recentlyViewed);
    renderRecentlyViewed();
  }

  function renderRecentlyViewed() {
    const wrap = $("#recentlyViewedWrap");
    const track = $("#rvTrack");
    if (!recentlyViewed.length) { wrap.hidden = true; return; }
    wrap.hidden = false;
    track.innerHTML = recentlyViewed.map(r => `
      <div class="rv-card">
        <div class="rv-swatch" style="background:${FINISH_COLOR[r.finish]}"></div>
        VESTA Halo<br>${r.label}
      </div>`).join("");
  }

  /* -- cart -- */
  function addToCart() {
    const key = `${selected.finish}-${selected.size}`;
    const existing = cart.find(c => c.key === key);
    if (existing) existing.qty += 1;
    else cart.push({ key, finish: selected.finish, size: selected.size, qty: 1, price: PRODUCT.price });
    store.set("vesta_cart", cart);
    renderCart();
    showToast(`Đã thêm VESTA Halo (${FINISH_LABEL[selected.finish]}, size ${selected.size}) vào giỏ`);
    track("add_to_cart", { finish: selected.finish, size: selected.size });
    openDrawer("cart");
  }
  $("#addToCartBtn").addEventListener("click", addToCart);

  function renderCart() {
    const body = $("#cartBody");
    const countEl = $("#cartCount");
    const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
    countEl.textContent = cart.reduce((s, c) => s + c.qty, 0);
    countEl.classList.toggle("show", cart.length > 0);
    $("#cartTotal").textContent = money(total);

    if (!cart.length) { body.innerHTML = `<p class="drawer-empty">Giỏ hàng của bạn đang trống.</p>`; return; }
    body.innerHTML = cart.map(c => `
      <div class="cart-item" data-key="${c.key}">
        <div class="cart-swatch" style="background:${FINISH_COLOR[c.finish]}"></div>
        <div class="ci-info">
          <b>VESTA Halo — ${FINISH_LABEL[c.finish]}</b>
          <span>Size ${c.size} · SL ${c.qty} · ${money(c.price * c.qty)}</span>
        </div>
        <button class="ci-remove" data-remove="${c.key}">Xoá</button>
      </div>`).join("");
  }
  $("#cartBody").addEventListener("click", (e) => {
    const key = e.target.dataset.remove;
    if (!key) return;
    cart = cart.filter(c => c.key !== key);
    store.set("vesta_cart", cart);
    renderCart();
  });

  $("#checkoutBtn").addEventListener("click", () => {
    if (!cart.length) { showToast("Giỏ hàng đang trống"); return; }
    showToast("Đã ghi nhận đơn đặt trước — cảm ơn bạn!");
    track("checkout", { items: cart.length });
    cart = []; store.set("vesta_cart", cart); renderCart();
    closeDrawer("cart");
  });

  /* -- favorites -- */
  function toggleFavorite() {
    const idx = favorites.findIndex(f => f === selected.finish);
    if (idx >= 0) favorites.splice(idx, 1);
    else favorites.push(selected.finish);
    store.set("vesta_favorites", favorites);
    renderFavorites();
    showToast(idx >= 0 ? "Đã bỏ khỏi yêu thích" : "Đã thêm vào yêu thích");
    track("toggle_favorite", { finish: selected.finish });
  }
  $("#favToggle").addEventListener("click", toggleFavorite);

  function renderFavorites() {
    const body = $("#favBody");
    const countEl = $("#favCount");
    countEl.textContent = favorites.length;
    countEl.classList.toggle("show", favorites.length > 0);
    $("#favToggle").classList.toggle("active", favorites.includes(selected.finish));

    if (!favorites.length) { body.innerHTML = `<p class="drawer-empty">Chưa có sản phẩm yêu thích nào.</p>`; return; }
    body.innerHTML = favorites.map(f => `
      <div class="cart-item">
        <div class="cart-swatch" style="background:${FINISH_COLOR[f]}"></div>
        <div class="ci-info"><b>VESTA Halo — ${FINISH_LABEL[f]}</b><span>${money(PRODUCT.price)}</span></div>
      </div>`).join("");
  }

  /* -- drawers -- */
  const overlay = $("#drawerOverlay");
  const drawers = { cart: $("#cartDrawer"), fav: $("#favDrawer") };
  function openDrawer(name) {
    Object.values(drawers).forEach(d => d.classList.remove("open"));
    drawers[name].classList.add("open");
    overlay.classList.add("open");
  }
  function closeDrawer() {
    Object.values(drawers).forEach(d => d.classList.remove("open"));
    overlay.classList.remove("open");
  }
  $("#cartBtn").addEventListener("click", () => openDrawer("cart"));
  $("#favBtn").addEventListener("click", () => openDrawer("fav"));
  $("#closeCart").addEventListener("click", closeDrawer);
  $("#closeFav").addEventListener("click", closeDrawer);
  overlay.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });

  renderCart(); renderFavorites(); renderRecentlyViewed();

  /* ======================================================
     9. FAQ ACCORDION
     ====================================================== */
  $$(".faq-item").forEach(item => {
    const btn = $(".faq-q", item);
    const answer = $(".faq-a", item);
    btn.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");
      $$(".faq-item").forEach(i => { i.classList.remove("open"); $(".faq-a", i).style.maxHeight = null; $(".faq-q", i).setAttribute("aria-expanded", "false"); });
      if (!isOpen) {
        item.classList.add("open");
        answer.style.maxHeight = answer.scrollHeight + "px";
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* ======================================================
     10. NEWSLETTER FORM — validation + webhook
     ====================================================== */
  const form = $("#newsletterForm");
  const fields = {
    fullName: { input: $("#fullName"), row: $("#rowName"), err: $("#errName"),
      validate: v => v.trim().length >= 2 ? "" : "Vui lòng nhập họ tên đầy đủ." },
    email: { input: $("#email"), row: $("#rowEmail"), err: $("#errEmail"),
      validate: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "Email không hợp lệ." },
    phone: { input: $("#phone"), row: $("#rowPhone"), err: $("#errPhone"),
      validate: v => v.trim() === "" || /^(0|\+84)[0-9]{9,10}$/.test(v.trim().replace(/\s/g, "")) ? "" : "Số điện thoại không hợp lệ." }
  };
  const consent = $("#consent");
  const errConsent = $("#errConsent");
  const statusEl = $("#formStatus");
  const submitBtn = $("#submitBtn");

  function validateField(key) {
    const f = fields[key];
    const msg = f.validate(f.input.value);
    f.row.classList.toggle("error", !!msg);
    f.err.textContent = msg;
    return !msg;
  }
  Object.keys(fields).forEach(key => {
    fields[key].input.addEventListener("blur", () => validateField(key));
    fields[key].input.addEventListener("input", () => { if (fields[key].row.classList.contains("error")) validateField(key); });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const validFlags = Object.keys(fields).map(validateField);
    const consentOk = consent.checked;
    errConsent.textContent = consentOk ? "" : "Bạn cần đồng ý trước khi đăng ký.";
    if (!validFlags.every(Boolean) || !consentOk) {
      statusEl.textContent = "Vui lòng kiểm tra lại các trường được đánh dấu.";
      statusEl.className = "form-status fail";
      return;
    }

    const payload = {
      fullName: fields.fullName.input.value.trim(),
      email: fields.email.input.value.trim(),
      phone: fields.phone.input.value.trim(),
      source: "vesta-landing-page",
      submittedAt: new Date().toISOString()
    };

    submitBtn.disabled = true;
    submitBtn.textContent = "Đang gửi...";
    statusEl.textContent = "";

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      statusEl.textContent = "Cảm ơn bạn! Chúng tôi sẽ gửi cập nhật sớm nhất.";
      statusEl.className = "form-status ok";
      form.reset();
      track("newsletter_signup", { email: payload.email });
      showToast("Đăng ký nhận tin thành công");
    } catch (err) {
      statusEl.textContent = "Không thể kết nối máy chủ lúc này. Vui lòng thử lại sau.";
      statusEl.className = "form-status fail";
      track("newsletter_signup_failed", { reason: String(err) });
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Đăng ký nhận tin";
    }
  });

  /* ======================================================
     11. CHATBOT — rule-based fallback assistant
     ====================================================== */
  const chatLauncher = $("#chatLauncher");
  const chatWindow = $("#chatWindow");
  const chatBody = $("#chatBody");
  const chatForm = $("#chatForm");
  const chatInput = $("#chatInput");
  const chatQuick = $("#chatQuick");

  chatLauncher.addEventListener("click", () => {
    chatWindow.classList.toggle("open");
    if (chatWindow.classList.contains("open")) chatInput.focus();
  });
  $("#chatClose").addEventListener("click", () => chatWindow.classList.remove("open"));

  function addMsg(text, who = "bot") {
    const el = document.createElement("div");
    el.className = `chat-msg ${who}`;
    el.textContent = text;
    chatBody.appendChild(el);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function showTyping() {
    const el = document.createElement("div");
    el.className = "chat-typing";
    el.id = "typingIndicator";
    el.innerHTML = "<span></span><span></span><span></span>";
    chatBody.appendChild(el);
    chatBody.scrollTop = chatBody.scrollHeight;
  }
  function hideTyping() { $("#typingIndicator")?.remove(); }

  const KB = [
    { keys: ["giá", "bao nhiêu", "price"], reply: "VESTA Halo có giá 4.990.000₫ cho đơn đặt trước, giảm từ 5.490.000₫. Giá đã bao gồm hộp sạc và bộ đo size." },
    { keys: ["pin", "sạc", "battery"], reply: "Pin dùng được khoảng 6 ngày cho một lần sạc, sạc đầy trong 40 phút bằng hộp sạc từ tính đi kèm." },
    { keys: ["giao hàng", "ship", "khi nào"], reply: "Lô hàng đầu tiên dự kiến giao từ tháng 9, theo đúng thứ tự đặt hàng. Giao miễn phí toàn quốc." },
    { keys: ["chống nước", "nước", "bơi", "tắm"], reply: "VESTA Halo chống nước đạt chuẩn 10ATM, tương đương độ sâu 100m — bơi và tắm thoải mái mà không cần tháo ra." },
    { keys: ["size", "kích", "cỡ"], reply: "VESTA Halo có size từ 5 đến 13. Mỗi đơn hàng đi kèm bộ đo size miễn phí gửi trước để bạn chọn đúng size." },
    { keys: ["bảo hành"], reply: "Sản phẩm được bảo hành chính hãng 2 năm và có thể đổi trả miễn phí trong 30 ngày đầu." },
    { keys: ["đổi trả", "hoàn tiền"], reply: "Bạn có thể đổi trả miễn phí trong vòng 30 ngày kể từ ngày nhận hàng nếu chưa hài lòng." },
    { keys: ["cảm biến", "đo", "spo2", "nhịp tim"], reply: "Nhẫn có 6 cảm biến: nhịp tim quang học, SpO2, nhiệt độ da, gia tốc kế, con quay hồi chuyển và NFC." },
  ];

  function getBotReply(msg) {
    const lower = msg.toLowerCase();
    const hit = KB.find(item => item.keys.some(k => lower.includes(k)));
    if (hit) return hit.reply;
    return "Câu hỏi thú vị! Đội ngũ VESTA sẽ phản hồi chi tiết hơn qua email — bạn có thể để lại email ở form đăng ký nhận tin phía trên trang, hoặc hỏi mình về giá, pin, chống nước, size hay bảo hành nhé.";
  }

  function handleUserMessage(text) {
    if (!text.trim()) return;
    addMsg(text, "user");
    chatInput.value = "";
    track("chat_message", { text });
    showTyping();
    setTimeout(() => {
      hideTyping();
      addMsg(getBotReply(text), "bot");
    }, 650 + Math.random() * 500);
  }

  chatForm.addEventListener("submit", (e) => { e.preventDefault(); handleUserMessage(chatInput.value); });
  chatQuick.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-q]");
    if (btn) handleUserMessage(btn.dataset.q);
  });

})();
