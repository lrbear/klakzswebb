(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const page = document.body.dataset.page;
  const db = window.klakzDb;
  const msg = (text, bad = false) => { const el = $("#notice"); if (el) { el.textContent = text; el.className = `notice ${bad ? "bad" : ""}`; } };
  const el = (tag, text, cls) => { const n = document.createElement(tag); if (text != null) n.textContent = text; if (cls) n.className = cls; return n; };
  const makeCard = (item) => {
    const card = el("article", null, "card"); card.append(el("h2", item.name || item.title || item.game || "İsimsiz"));
    if (item.desc || item.description || item.detail) card.append(el("p", item.desc || item.description || item.detail));
    if (item.tag) card.append(el("small", item.tag, "tag"));
    if (item.state || item.status) card.append(el("p", item.state || item.status, "tag"));
    if (item.code && !String(item.code).includes("BURAYA_")) {
      const pre = el("pre", item.code); card.append(pre);
      const copy = el("button", "Kodu kopyala", "button"); copy.type = "button";
      copy.addEventListener("click", async () => { try { await navigator.clipboard.writeText(item.code); copy.textContent = "Kopyalandı"; } catch { msg("Kopyalama tarayıcı izni gerektiriyor.", true); } }); card.append(copy);
    }
    if (item.url && /^https?:\/\//i.test(item.url)) { const a = el("a", "İndir / Aç", "button"); a.href = item.url; a.target = "_blank"; a.rel = "noopener noreferrer"; card.append(a); }
    return card;
  };
  const render = (path, target = "#items", transform) => {
    if (!db) { msg("Firebase bağlantısı kurulamadı. firebase-config.js içindeki ayarları kontrol edin.", true); return; }
    db.ref(path).on("value", snap => {
      const box = $(target); if (!box) return;
      box.replaceChildren(); let value = snap.val();
      if (transform) value = transform(value);
      const list = Array.isArray(value) ? value : (value && typeof value === "object" ? Object.values(value) : []);
      list.filter(x => x && typeof x === "object" && !["a", "BURAYA_SCRIPT_1", "BURAYA_SCRIPT_2"].includes(x.name) && !String(x.code || "").includes("BURAYA_")).forEach(x => box.append(makeCard(x)));
      if (!box.childElementCount) box.append(el("p", "Henüz yayınlanmış içerik yok.", "muted"));
    }, err => msg(`Firebase verisi okunamadı: ${err.message}`, true));
  };
  document.querySelectorAll("[data-menu]").forEach(b => b.addEventListener("click", () => $("nav")?.classList.toggle("open")));
  const signOut = $("#signout"); if (signOut) signOut.addEventListener("click", () => window.klakzAuth?.signOut());
  if (page === "scripts" && window.klakzAuth) {
    const gate = $("#keyGate"), items = $("#items");
    window.klakzAuth.onAuthStateChanged(async user => {
      if (!user || !user.emailVerified) { gate.hidden = false; items.hidden = true; msg("Scriptleri görmek için giriş yapıp e-postanı doğrula.", true); return; }
      try {
        const license = (await db.ref(`licenses/${user.uid}`).once("value")).val();
        const active = license && license.active && Number(license.expiresAt) > Date.now();
        gate.hidden = !!active; items.hidden = !active;
        if (!active) msg("Aktif bir Key gerekli. Key sistemi sayfasından kodunu etkinleştir.", true);
        else render("scripts");
      } catch (err) { gate.hidden = false; items.hidden = true; msg(`Lisans kontrolü yapılamadı: ${err.message}`, true); }
    });
  }
  if (page === "scripts" && !window.klakzAuth) msg("Firebase bağlantısı kurulamadı. Ayarları kontrol edin.", true);
  if (page === "key" && window.klakzAuth) {
    const auth = window.klakzAuth, signedOut = $("#keySignedOut"), signedIn = $("#keySignedIn");
    auth.onAuthStateChanged(async user => {
      signedOut.hidden = !!user; signedIn.hidden = !user;
      if (!user) return;
      $("#keyUser").textContent = user.email || "Oyuncu";
      $("#resendVerification").hidden = !!user.emailVerified;
      if (!user.emailVerified) { $("#licenseState").textContent = "Key kullanmadan önce e-posta adresini doğrula."; msg("E-postanı doğrula, sonra bu sayfayı yenile.", true); return; }
      try {
        const license = (await db.ref(`licenses/${user.uid}`).once("value")).val();
        $("#licenseState").textContent = license && license.active && license.expiresAt > Date.now() ? `Key aktif · ${new Date(license.expiresAt).toLocaleString("tr-TR")}` : "Henüz etkin bir Key yok.";
      } catch (err) { msg(`Lisans okunamadı: ${err.message}`, true); }
    });
    $("#resendVerification")?.addEventListener("click", async () => { try { await auth.currentUser.sendEmailVerification(); msg("Doğrulama bağlantısı e-posta adresine gönderildi."); } catch (err) { msg(`E-posta gönderilemedi: ${err.message}`, true); } });
    $("#keyLogin")?.addEventListener("submit", async e => { e.preventDefault(); try { await auth.signInWithEmailAndPassword($("#keyEmail").value.trim(), $("#keyPassword").value); msg("Giriş başarılı."); } catch (err) { msg(`Giriş yapılamadı: ${err.message}`, true); } });
    $("#keySignOut")?.addEventListener("click", () => auth.signOut());
    $("#redeemForm")?.addEventListener("submit", async e => {
      e.preventDefault(); if (!auth.currentUser?.emailVerified) return msg("Önce e-posta adresini doğrula.", true);
      try { const call = firebase.app().functions("us-central1").httpsCallable("redeemLicenseKey"); const result = await call({ key: $("#keyCode").value.trim() }); $("#licenseState").textContent = `Key etkin · ${new Date(result.data.expiresAt).toLocaleString("tr-TR")}`; e.target.reset(); msg("Key başarıyla etkinleştirildi."); }
      catch (err) { msg(err.message || "Key etkinleştirilemedi.", true); }
    });
  }
  if (page === "downloads") render("downloads");
  if (page === "executors") render("executors");
  if (page === "projects") render("projects");
  if (page === "changelog") render("changelog");
  if (page === "status") render("statuses");
  if (page === "request") {
    const form = $("#requestForm");
    form?.addEventListener("submit", async e => {
      e.preventDefault(); const user = window.klakzAuth?.currentUser;
      if (!user) return msg("İstek göndermek için önce giriş yapın.", true);
      const name = $("#game").value.trim(), detail = $("#detail").value.trim();
      if (!name || !detail) return msg("Oyun adı ve açıklama gerekli.", true);
      try { await db.ref("requests").push({ uid: user.uid, email: user.email, game: name, detail, createdAt: Date.now(), state: "Bekliyor" }); form.reset(); msg("İsteğin gönderildi."); }
      catch (err) { msg(`İstek gönderilemedi: ${err.message}`, true); }
    });
  }
  if (page === "admin") {
    const auth = window.klakzAuth;
    const panel = $("#adminPanel"), login = $("#loginForm");
    if (!auth) return msg("Firebase bağlantısı kurulamadı.", true);
    auth.onAuthStateChanged(user => {
      const allowed = user && user.emailVerified && user.email?.toLowerCase() === window.KLAKZ_ADMIN_EMAIL.toLowerCase() && window.KLAKZ_ADMIN_EMAIL !== "ADMIN_EMAIL_REPLACE_ME";
      panel.hidden = !allowed; login.hidden = !!allowed;
      if (user && !allowed) msg("Yönetim için doğrulanmış yönetici e-postasıyla giriş yapın.", true);
      if (allowed) render("requests", "#requests", v => Object.values(v || {}));
    });
    login?.addEventListener("submit", async e => {
      e.preventDefault(); try { await auth.signInWithEmailAndPassword($("#email").value.trim(), $("#password").value); msg("Giriş yapıldı."); }
      catch (err) { msg(`Giriş başarısız: ${err.message}`, true); }
    });
    $("#logout")?.addEventListener("click", () => auth.signOut());
    $("#publishForm")?.addEventListener("submit", async e => {
      e.preventDefault(); const type = $("#type").value; const data = { name: $("#name").value.trim(), desc: $("#desc").value.trim(), tag: $("#tag").value.trim(), url: $("#url").value.trim(), state: $("#state").value.trim(), code: $("#code").value, createdAt: Date.now() };
      if (!data.name) return msg("Başlık gerekli.", true);
      try { await db.ref(type).push(data); e.target.reset(); msg("İçerik yayınlandı."); } catch (err) { msg(`Kaydedilemedi: ${err.message}`, true); }
    });
    $("#issueKeyForm")?.addEventListener("submit", async e => {
      e.preventDefault();
      try { const call = firebase.app().functions("us-central1").httpsCallable("createLicenseKey"); const result = await call({ days: Number($("#keyDays").value) }); $("#issuedKey").textContent = result.data.key; $("#issuedDays").textContent = `${result.data.days} gün · Bu kodu şimdi kopyalayıp kullanıcıya ilet; tekrar gösterilmez.`; $("#keyResult").hidden = false; }
      catch (err) { msg(err.message || "Key üretilemedi.", true); }
    });
    $("#copyIssuedKey")?.addEventListener("click", async () => { try { await navigator.clipboard.writeText($("#issuedKey").textContent); msg("Key kopyalandı."); } catch { msg("Tarayıcı kopyalamaya izin vermedi.", true); } });
  }
})();
