/* ==========================================================================
   İmece Düğün — Refresh Layer (davranis)
   index.html icindeki mevcut scriptten SONRA yuklenir; onu degistirmez,
   uzerine biner. Tek is: gece temasini her ekrana tasimak, kaydirma
   tetikli gorunurluk, yogunluk yonetimi ve donusum yuzeyleri.
   ========================================================================== */
(function () {
    "use strict";

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var isDesktop = window.innerWidth >= 768;

    function ready(fn) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", fn);
        } else {
            fn();
        }
    }

    /* ----------------------------------------------------------------------
       1. Gece temasi her ekranda
       Masaustunde GSAP ScrollTrigger zaten body.dark-active ekliyor ve
       #darkOverlay opacity'sini scrub ediyor. Mobilde ve reduced-motion
       yolunda o timeline hic kurulmuyordu; sayfa krem kaliyordu.
       Ayni esik burada IntersectionObserver ile karsilaniyor.
       ---------------------------------------------------------------------- */
    function initNightTheme() {
        document.body.classList.add("dark-active");
        var overlay = document.getElementById("darkOverlay");
        if (overlay) overlay.classList.add("is-on");
    }

    /* ----------------------------------------------------------------------
       2. Kaydirma tetikli gorunurluk
       Yalnizca opacity + transform. Animasyon bitince data-reveal kaldirilir:
       aksi halde .is-in'in transform'u kartlarin hover yukselisini ezerdi.
       ---------------------------------------------------------------------- */
    var REVEAL_SELECTOR = [
        ".pain-check-section .section-header",
        ".pain-item",
        ".pain-result-card",
        ".kriz-cozum-section .section-header",
        ".kriz-rail",
        ".asistan-section .section-header",
        ".asistan-card",
        ".gunici-section .section-header",
        ".gunici-card",
        ".rsvp-showcase-section .section-header",
        ".interactive-calculator .section-header",
        ".calculator-container:not(.demo-content)",
        ".features .section-header",
        ".feature-card",
        ".founder-card",
        ".pricing .section-header",
        ".pricing-card",
        ".faq-section .section-header",
        ".faq-item",
        ".cta-bottom .cta-container > *"
    ].join(",");

    function initReveal() {
        var nodes = Array.prototype.slice.call(document.querySelectorAll(REVEAL_SELECTOR));
        if (!nodes.length) return;

        if (reduceMotion || !("IntersectionObserver" in window)) return;

        nodes.forEach(function (el) {
            el.setAttribute("data-reveal", "");
        });

        function settle(el) {
            el.removeAttribute("data-reveal");
            el.classList.remove("is-in");
            el.style.removeProperty("--reveal-delay");
        }

        var io = new IntersectionObserver(function (entries, obs) {
            // Ayni anda giren kardesler kademeli aksin.
            var visible = entries.filter(function (e) { return e.isIntersecting; });
            visible.forEach(function (entry, i) {
                var el = entry.target;
                el.style.setProperty("--reveal-delay", Math.min(i, 5) * 70 + "ms");
                el.classList.add("is-in");
                obs.unobserve(el);
                window.setTimeout(function () { settle(el); }, 900 + Math.min(i, 5) * 70);
            });
        }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });

        nodes.forEach(function (el) { io.observe(el); });
    }

    /* ----------------------------------------------------------------------
       3. "Tanidik gelenler" listesi: 6 gorunur, 8 istege bagli
       14 madde ayni anda ekranda durunca hicbiri okunmuyordu.
       JS yoksa liste tam haliyle acik kalir.
       ---------------------------------------------------------------------- */
    var PAIN_VISIBLE = window.innerWidth < 768 ? 3 : 6;

    function initPainCollapse() {
        var list = document.getElementById("painCheckList");
        if (!list) return;

        var items = Array.prototype.slice.call(list.querySelectorAll(".pain-item"));
        if (items.length <= PAIN_VISIBLE + 1) return;

        var hidden = items.slice(PAIN_VISIBLE);
        hidden.forEach(function (el) { el.setAttribute("data-overflow", ""); });
        list.classList.add("is-collapsed");

        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "pain-more";
        btn.setAttribute("aria-expanded", "false");
        btn.setAttribute("aria-controls", "painCheckList");
        btn.innerHTML =
            '<span class="pain-more-label">' + hidden.length + " cümle daha göster</span>" +
            '<span class="material-icons-round" aria-hidden="true">expand_more</span>';

        btn.addEventListener("click", function () {
            var collapsed = list.classList.toggle("is-collapsed");
            btn.setAttribute("aria-expanded", String(!collapsed));
            btn.querySelector(".pain-more-label").textContent = collapsed
                ? hidden.length + " cümle daha göster"
                : "Listeyi kısalt";
            hidden.forEach(function (el, i) {
                el.style.display = collapsed ? "none" : "";
                if (!collapsed) {
                    el.style.setProperty("--reveal-delay", Math.min(i, 5) * 60 + "ms");
                }
            });
            if (collapsed) {
                list.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
            }
        });

        // Listenin ICINE eklenir: .pain-check-layout iki kolonlu bir grid,
        // kardes olarak eklenirse sag sutundaki sonuc karti alt satira duser.
        list.appendChild(btn);
    }

    /* Mobilde SSS ilk 5 soruyla baslar; geri kalani tek dokunusla acilir.
       Sorular DOM'da kalir (arama motoru ve FAQPage verisi etkilenmez);
       gizleme yalniz CSS'te ve <768px'te uygulanir. */
    function initFaqCollapse() {
        var acc = document.getElementById("faqAccordion");
        if (!acc) return;
        var items = Array.prototype.slice.call(acc.querySelectorAll(".faq-item"));
        var VISIBLE = 5;
        if (items.length <= VISIBLE + 1) return;
        var hidden = items.slice(VISIBLE);
        hidden.forEach(function (el) { el.setAttribute("data-overflow", ""); });
        acc.classList.add("is-collapsed");

        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "faq-more";
        btn.setAttribute("aria-expanded", "false");
        btn.setAttribute("aria-controls", "faqAccordion");
        btn.innerHTML =
            '<span class="faq-more-label">' + hidden.length + " soru daha göster</span>" +
            '<span class="material-icons-round" aria-hidden="true">expand_more</span>';
        acc.insertAdjacentElement("afterend", btn);

        function expand() {
            acc.classList.remove("is-collapsed");
            if (btn.parentNode) btn.remove();
        }
        // Tek handler: once gorunur yap, sonra odakla (gizli oge odak alamaz).
        btn.addEventListener("click", function () {
            expand();
            var first = hidden[0] && hidden[0].querySelector(".faq-question");
            if (!first) return;
            first.scrollIntoView({ block: "center", behavior: "instant" });
            first.focus({ preventScroll: true });
        });

        // Ertelenmis odak yalniz hala ayni hash gecerliyse ve kullanici arada
        // etkilesime girmediyse uygulanir.
        var pendingFocus = 0;
        function cancelPendingFocus() { pendingFocus++; }
        ["keydown", "pointerdown", "wheel", "touchstart"].forEach(function (ev) {
            window.addEventListener(ev, cancelPendingFocus, { capture: true, passive: true });
        });

        // #faq-answer-N (veya soru ogesi) hedeflenirse: gizliyse ac, cevabi
        // goster, odagi soruya ver. Hem ilk yuklemede hem hashchange'de calisir.
        function revealFromHash() {
            cancelPendingFocus();
            var raw = (location.hash || "").slice(1);
            if (!raw) return;
            var target;
            try { target = document.getElementById(decodeURIComponent(raw)); } catch (err) { return; }
            var item = target && target.closest ? target.closest(".faq-item") : null;
            if (!item || !acc.contains(item)) return;
            expand();
            var q = item.querySelector(".faq-question");
            if (q && !item.classList.contains("active") && typeof window.toggleFaq === "function") {
                window.toggleFaq(q);
            }
            item.scrollIntoView({ block: "center", behavior: "instant" });
            if (!q) return;
            if (document.readyState === "complete") { q.focus({ preventScroll: true }); return; }
            // Ilk yuklemede tarayici odagi belgeye geri verir; odak load sonrasi.
            var token = pendingFocus;
            var hashAtQueue = location.hash;
            window.addEventListener("load", function () {
                setTimeout(function () {
                    if (token !== pendingFocus || location.hash !== hashAtQueue) return;
                    q.focus({ preventScroll: true });
                }, 0);
            }, { once: true });
        }
        window.addEventListener("hashchange", revealFromHash);
        revealFromHash();
    }

    /* ----------------------------------------------------------------------
       4. 12 cozum karti: uc satirlik izgara yerine yatay ray
       Mobilde parmakla, masaustunde ok dugmeleri ve klavyeyle gezilir.
       ---------------------------------------------------------------------- */
    function initKrizRail() {
        var grid = document.querySelector("#neden-imece .kriz-cozum-grid");
        if (!grid) return;

        var rail = document.createElement("div");
        rail.className = "kriz-rail";
        grid.parentNode.insertBefore(rail, grid);

        var nav = document.createElement("div");
        nav.className = "kriz-rail-nav";
        nav.innerHTML =
            '<span class="kriz-rail-hint">Kaydırın · karta dokununca çözüm açılır</span>' +
            '<span class="kriz-rail-progress"><i></i></span>' +
            '<button type="button" class="kriz-rail-btn" data-dir="-1" aria-label="Önceki çözüm">' +
            '<span class="material-icons-round" aria-hidden="true">arrow_back</span></button>' +
            '<button type="button" class="kriz-rail-btn" data-dir="1" aria-label="Sonraki çözüm">' +
            '<span class="material-icons-round" aria-hidden="true">arrow_forward</span></button>';

        rail.appendChild(nav);
        rail.appendChild(grid);

        grid.setAttribute("tabindex", "0");
        grid.setAttribute("role", "region");
        grid.setAttribute("aria-label", "Kritik zorluklar ve çözümleri");

        var bar = nav.querySelector(".kriz-rail-progress i");
        var buttons = Array.prototype.slice.call(nav.querySelectorAll(".kriz-rail-btn"));

        function step() {
            var card = grid.querySelector(".flip-card");
            if (!card) return grid.clientWidth * 0.8;
            return card.getBoundingClientRect().width + 20;
        }

        function sync() {
            var max = grid.scrollWidth - grid.clientWidth;
            var ratio = max > 0 ? grid.scrollLeft / max : 0;
            // Cubuk genisligi = gorunen oran; kaydigi mesafe kendi genisliginin katı.
            var visible = Math.max(grid.clientWidth / grid.scrollWidth, 0.08);
            bar.style.transformOrigin = "left center";
            bar.style.transform = "scaleX(" + visible + ") translateX(" + (ratio * (100 / visible - 100)) + "%)";
            buttons[0].disabled = grid.scrollLeft <= 2;
            buttons[1].disabled = grid.scrollLeft >= max - 2;
        }

        buttons.forEach(function (b) {
            b.addEventListener("click", function () {
                grid.scrollBy({ left: step() * Number(b.dataset.dir), behavior: reduceMotion ? "auto" : "smooth" });
            });
        });

        grid.addEventListener("scroll", function () {
            window.requestAnimationFrame(sync);
        }, { passive: true });

        window.addEventListener("resize", sync);
        sync();

        // Ray yatay kayarken dikey tekerlek olayini calmayalim; ok tuslari yeter.
        grid.addEventListener("keydown", function (e) {
            if (e.key === "ArrowRight") {
                e.preventDefault();
                grid.scrollBy({ left: step(), behavior: reduceMotion ? "auto" : "smooth" });
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                grid.scrollBy({ left: -step(), behavior: reduceMotion ? "auto" : "smooth" });
            }
        });

        // Mevcut "scroll tease" tum ray icin ayni anda tetikleniyordu:
        // rayda dort kart birden donuyordu. Yalnizca ilk kart tanitim yapsin.
        Array.prototype.slice.call(grid.querySelectorAll(".flip-card"))
            .slice(1)
            .forEach(function (card) { card.dataset.teased = "true"; });

        // Ac-kapat: bir karta dokununca digerleri geri donsun (ray dar, ust uste
        // acik kart okunmuyor).
        grid.addEventListener("click", function (e) {
            var card = e.target.closest ? e.target.closest(".flip-card") : null;
            if (!card) return;
            Array.prototype.slice.call(grid.querySelectorAll(".flip-card.flipped"))
                .forEach(function (other) {
                    if (other !== card) other.classList.remove("flipped");
                });
        });
    }

    /* ----------------------------------------------------------------------
       5. Sabit mobil indirme cubugu
       Kahraman alandan sonra belirir, kapanis CTA'sinda geri cekilir.
       ---------------------------------------------------------------------- */
    function initStickyCta() {
        if (window.innerWidth >= 768) return;
        var footer = document.querySelector("footer");
        var closing = document.getElementById("indirin");
        if (!footer) return;

        var bar = document.createElement("div");
        bar.className = "sticky-cta";
        bar.innerHTML =
            '<img src="assets/img/logo_wax_seal_96.png" width="34" height="34" alt="İmece Düğün" class="sticky-cta-seal" style="width:34px;height:34px;object-fit:contain;flex-shrink:0;border-radius:8px;filter:drop-shadow(0 2px 6px rgba(212,175,55,0.4));">' +
            '<span class="sticky-cta-copy"><b>İmece Düğün</b><span>Ücretsiz Mobil Uygulama</span></span>' +
            '<a class="btn btn-primary" href="https://apps.apple.com/tr/app/i-mece-d%C3%BC%C4%9F%C3%BCn/id6794826834" target="_blank" rel="noopener">Hemen İndir</a>';

        footer.parentNode.insertBefore(bar, footer);
        document.body.classList.add("has-sticky-cta");

        var pastHero = false;
        var atClosing = false;

        function apply() {
            bar.classList.toggle("is-visible", pastHero && !atClosing);
        }

        window.addEventListener("scroll", function () {
            var next = window.scrollY > window.innerHeight * 0.9;
            if (next !== pastHero) {
                pastHero = next;
                apply();
            }
        }, { passive: true });

        if (closing && "IntersectionObserver" in window) {
            new IntersectionObserver(function (entries) {
                atClosing = entries[0].isIntersecting;
                apply();
            }, { threshold: 0.15 }).observe(closing);
        }
    }

    /* ----------------------------------------------------------------------
       6. Mobil navigasyon cekmecesi
       index.html'de zaten var olan #navToggle / #navDrawer markup'ini
       kablolar: ac/kapa, govde kilidi, odak tuzagi, disari tiklama/Escape/
       resize ile kapanma.
       ---------------------------------------------------------------------- */
    function initNavDrawer() {
        var toggle = document.getElementById("navToggle");
        var drawer = document.getElementById("navDrawer");
        if (!toggle || !drawer) return;

        var panel = drawer.querySelector(".nav-drawer-panel");
        var scrim = drawer.querySelector(".nav-drawer-scrim");
        var closers = Array.prototype.slice.call(drawer.querySelectorAll("[data-nav-close]"));
        var lockedOverflow = null;
        var isOpen = false;

        function focusableItems() {
            if (!panel) return [];
            return Array.prototype.slice.call(
                panel.querySelectorAll('a[href], button:not([disabled])')
            );
        }

        function trapFocus(e) {
            if (e.key !== "Tab") return;
            var items = focusableItems();
            if (!items.length) return;
            var first = items[0];
            var last = items[items.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }

        function onKeydown(e) {
            if (e.key === "Escape") {
                close();
            } else {
                trapFocus(e);
            }
        }

        function onResize() {
            if (isOpen && window.innerWidth >= 1024) close();
        }

        function open() {
            if (isOpen) return;
            isOpen = true;
            drawer.removeAttribute("hidden");
            // Bir sonraki frame'de sinif eklenir; aksi halde hidden -> is-open
            // ayni frame'de olur ve gecis calismaz (baslangic durumu boyanmaz).
            window.requestAnimationFrame(function () {
                drawer.classList.add("is-open");
            });
            toggle.setAttribute("aria-expanded", "true");
            toggle.setAttribute("aria-label", "Menüyü kapat");

            lockedOverflow = document.body.style.overflow;
            document.body.style.overflow = "hidden";

            document.addEventListener("keydown", onKeydown);
            window.addEventListener("resize", onResize);

            var items = focusableItems();
            if (items.length) items[0].focus();
        }

        function close() {
            if (!isOpen) return;
            isOpen = false;
            drawer.classList.remove("is-open");
            toggle.setAttribute("aria-expanded", "false");
            toggle.setAttribute("aria-label", "Menüyü aç");

            document.body.style.overflow = lockedOverflow || "";
            lockedOverflow = null;

            document.removeEventListener("keydown", onKeydown);
            window.removeEventListener("resize", onResize);

            var finished = false;
            function hide() {
                if (finished) return;
                finished = true;
                drawer.setAttribute("hidden", "");
            }
            if (panel && !reduceMotion) {
                panel.addEventListener("transitionend", hide, { once: true });
                window.setTimeout(hide, 400);
            } else {
                hide();
            }

            toggle.focus();
        }

        toggle.addEventListener("click", function () {
            if (isOpen) close(); else open();
        });

        closers.forEach(function (el) {
            el.addEventListener("click", function () {
                // Ankor linkleri: once cekmece kapansin, sonra kaydirma olsun —
                // govde kilitliyken (overflow:hidden) ankor kaydirmasi calismaz.
                close();
            });
        });
        if (scrim) {
            scrim.addEventListener("click", close);
        }
    }

    /* ----------------------------------------------------------------------
       7. Okuma ilerleme cubugu
       navbar'in altina ince bir cizgi ekler; scaleX ile kaydirma oranini
       gosterir. rAF ile throttle edilir, width degil transform yazilir.
       ---------------------------------------------------------------------- */
    function initReadProgress() {
        var navbar = document.querySelector(".navbar");
        if (!navbar) return;

        var wrap = document.createElement("div");
        wrap.className = "read-progress";
        wrap.setAttribute("aria-hidden", "true");
        wrap.innerHTML = "<i></i>";
        navbar.appendChild(wrap);

        var bar = wrap.querySelector("i");
        var ticking = false;

        function update() {
            ticking = false;
            var max = document.documentElement.scrollHeight - window.innerHeight;
            var ratio = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
            bar.style.transform = "scaleX(" + ratio + ")";
        }

        window.addEventListener("scroll", function () {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(update);
        }, { passive: true });
        window.addEventListener("resize", function () {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(update);
        });

        update();
    }

    /* ----------------------------------------------------------------------
       8. Scroll-spy — aktif bolum vurgusu
       Gorunur bolume karsilik gelen nav linkine (hem ust menu hem cekmece)
       aria-current="true" ekler.
       ---------------------------------------------------------------------- */
    var SPY_SECTIONS = ["interactive-rsvp-showcase", "neden-imece", "paketler", "sss"];

    function initScrollSpy() {
        if (!("IntersectionObserver" in window)) return;

        var sections = SPY_SECTIONS
            .map(function (id) { return document.getElementById(id); })
            .filter(Boolean);
        if (!sections.length) return;

        function linksFor(id) {
            return Array.prototype.slice.call(
                document.querySelectorAll('.nav-links a[href="#' + id + '"], .nav-drawer-panel a[href="#' + id + '"]')
            );
        }

        function setActive(id) {
            SPY_SECTIONS.forEach(function (sid) {
                linksFor(sid).forEach(function (a) {
                    if (sid === id) {
                        a.setAttribute("aria-current", "true");
                    } else {
                        a.removeAttribute("aria-current");
                    }
                });
            });
        }

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) setActive(entry.target.id);
            });
        }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });

        sections.forEach(function (el) { io.observe(el); });
    }

    /* ----------------------------------------------------------------------
       9. "Basa don" butonu
       ---------------------------------------------------------------------- */
    function initToTop() {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "to-top";
        btn.setAttribute("aria-label", "Sayfa başına dön");
        btn.innerHTML = '<span class="material-icons-round" aria-hidden="true">arrow_upward</span>';
        document.body.appendChild(btn);

        var visible = false;
        function apply() {
            var next = window.scrollY > window.innerHeight * 2;
            if (next !== visible) {
                visible = next;
                btn.classList.toggle("is-visible", visible);
            }
        }

        window.addEventListener("scroll", function () {
            window.requestAnimationFrame(apply);
        }, { passive: true });

        btn.addEventListener("click", function () {
            window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
        });

        apply();
    }

    /* --------------------------------------------------------------------------
       10. Analitik & Dönüşüm Takibi (GA4 & Meta Pixel)
       App Store indirme butonlarını ve dönüşümleri GA4 ve Meta Pixel'e aktarır.
       -------------------------------------------------------------------------- */
    function initAnalyticsTracking() {
        document.addEventListener("click", function (e) {
            var appStoreLink = e.target.closest('a[href*="apps.apple.com"]');
            if (appStoreLink) {
                var label = appStoreLink.getAttribute("aria-label") || appStoreLink.textContent.trim() || "app_store_download";
                // Google Analytics 4 Event
                if (typeof window.gtag === "function") {
                    window.gtag("event", "app_store_click", {
                        event_category: "conversion",
                        event_label: label.substring(0, 60),
                        link_url: appStoreLink.href
                    });
                }
                // Meta Pixel (Facebook & Instagram) Conversion Event
                if (typeof window.fbq === "function") {
                    window.fbq("track", "Lead", {
                        content_name: label.substring(0, 60),
                        content_category: "App Store Download",
                        source: "imece_landing"
                    });
                }
            }
        });
    }

    // Uzun demolar istege bagli acilir; JS yoksa tum icerik gorunur kalir.
    function initDemoDisclosures() {
        var pain = document.querySelector("#tanidik > .container");
        var solutions = document.getElementById("neden-imece");
        if (pain && solutions) {
            var fold = document.createElement("details");
            fold.className = "demo-disclosure solution-disclosure";
            var heading = document.createElement("summary");
            heading.textContent = "Bu sorunları nasıl çözüyoruz? · Çözümleri keşfedin";
            fold.appendChild(heading);
            pain.appendChild(fold);
            fold.appendChild(solutions);
            // Bir bolum linki kapali detay icine denk gelirse hedefi gorunur kil.
            function revealLinkedSection() {
                if (location.hash === "#neden-imece") fold.open = true;
            }
            revealLinkedSection();
            window.addEventListener("hashchange", revealLinkedSection);
        }
        [
            [".rsvp-sim-wrapper", "Davetiyenizi birlikte deneyelim", "İsimleri değiştirin, katılım yanıtının çiftin ekranına düşmesini görün."],
            [".calculator-container", "Size uygun paketi hesaplayın", "Misafir sayınızı seçin, bütçenize uygun öneriyi anında görün."]
        ].forEach(function (config) {
            var content = document.querySelector(config[0]);
            if (!content) return;
            var details = document.createElement("details");
            details.className = "demo-disclosure";
            var summary = document.createElement("summary");
            var title = document.createElement("strong");
            title.textContent = config[1];
            var text = document.createElement("span");
            text.textContent = config[2];
            summary.appendChild(title);
            summary.appendChild(text);
            details.appendChild(summary);
            content.parentNode.insertBefore(details, content);
            details.appendChild(content);
            // Gizliyken reveal olcumu yapilmasin; acilinca demo hemen kullanilabilir.
            content.classList.add("demo-content");
        });
    }

    function initScenarioKeyboard() {
        var tabs = Array.prototype.slice.call(document.querySelectorAll(".scenario-tab"));
        tabs.forEach(function (tab, index) {
            tab.tabIndex = tab.getAttribute("aria-selected") === "true" ? 0 : -1;
            tab.addEventListener("keydown", function (event) {
                var next;
                if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % tabs.length;
                else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index + tabs.length - 1) % tabs.length;
                else if (event.key === "Home") next = 0;
                else if (event.key === "End") next = tabs.length - 1;
                else return;
                event.preventDefault();
                tabs[next].click();
                tabs[next].focus();
            });
        });
    }

    // Yalnizca hassas isaretci ve hareket izniyle hafif derinlik hissi.
    function initPhoneDepth() {
        var phone = document.getElementById("phoneMockup");
        var allowed = window.matchMedia("(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
        if (!phone) return;
        var frame = 0;
        function reset() {
            cancelAnimationFrame(frame);
            phone.style.removeProperty("rotate");
        }
        phone.addEventListener("pointermove", function (event) {
            if (!allowed.matches) return reset();
            var rect = phone.getBoundingClientRect();
            var x = (event.clientX - rect.left) / rect.width - 0.5;
            var y = (event.clientY - rect.top) / rect.height - 0.5;
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(function () {
                phone.style.rotate = (-y) + " " + x + " 0 " + (Math.hypot(x, y) * 5) + "deg";
            });
        });
        phone.addEventListener("pointerleave", reset);
        if (allowed.addEventListener) allowed.addEventListener("change", reset);
    }

    ready(function () {
        initNightTheme();
        initDemoDisclosures();
        document.querySelectorAll(".pricing-grid, .guide-vitrin-grid").forEach(function (grid) {
            grid.tabIndex = 0;
            grid.setAttribute("role", "region");
            grid.setAttribute("aria-label", grid.classList.contains("pricing-grid") ? "Paketler · yatay kaydırarak karşılaştırın" : "Ücretsiz rehberler · yatay kaydırın");
        });
        initScenarioKeyboard();
        initPhoneDepth();
        initPainCollapse();
        initFaqCollapse();
        initKrizRail();
        initStickyCta();
        initNavDrawer();
        initReadProgress();
        initScrollSpy();
        initToTop();
        initAnalyticsTracking();
        // Reveal en sona: ray/liste DOM'u yerine oturduktan sonra baglanir.
        initReveal();
        initHashSettle();
    });

    /* ----------------------------------------------------------------------
       Paylasilan /#bolum linkleri: tarayici hedefe ilk boyamada kayiyor,
       ardindan liste daraltma ve gorseller yerlesip icerik kayiyordu
       (mobilde hedef 300-600px yukarida kaliyordu). Yerlesim oturunca
       hedefe yeniden hizala; kullanici bu arada kaydirdiysa dokunma.
       ---------------------------------------------------------------------- */
    function initHashSettle() {
        function currentTarget() {
            var raw = (location.hash || "").slice(1);
            if (!raw) return null;
            var id;
            try { id = decodeURIComponent(raw); } catch (err) { id = raw; }
            return document.getElementById(id);
        }
        if (!currentTarget()) return;
        var cancelled = false;
        var timer = 0;
        var events = ["wheel", "touchstart", "keydown", "mousedown"];
        function cancel() {
            if (cancelled) return;
            cancelled = true;
            clearTimeout(timer);
            events.forEach(function (ev) { window.removeEventListener(ev, cancel, true); });
        }
        // Kullanici kendisi kaydirir/tiklarsa duzeltme hemen biter.
        events.forEach(function (ev) {
            window.addEventListener(ev, cancel, { capture: true, passive: true });
        });
        // Hedef her seferinde guncel hash'ten okunur: yukleme sirasinda
        // fragment degisirse eski hedefe geri kaydirilmaz.
        function settle() {
            if (cancelled) return;
            var target = currentTarget();
            if (!target) return cancel();
            target.scrollIntoView({ block: "start", behavior: "auto" });
        }
        requestAnimationFrame(settle);
        function onLoad() {
            settle();
            timer = setTimeout(function () { settle(); cancel(); }, 350);
        }
        if (document.readyState === "complete") onLoad();
        else window.addEventListener("load", onLoad, { once: true });
    }
})();
