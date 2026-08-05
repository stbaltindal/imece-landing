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
        var gsapDrivesIt = isDesktop && !reduceMotion && window.gsap && window.ScrollTrigger;
        if (gsapDrivesIt) return;

        var trigger = document.getElementById("neden-imece");
        var overlay = document.getElementById("darkOverlay");
        if (!trigger || !overlay) return;

        function setNight(on) {
            document.body.classList.toggle("dark-active", on);
            overlay.classList.toggle("is-on", on);
        }

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                // Bolumun ustu ekranin alt %25'ine girdiginde gece baslar;
                // yukari cikarken ayni noktada geri doner.
                setNight(entry.isIntersecting || entry.boundingClientRect.top < 0);
            });
        }, { rootMargin: "0px 0px -75% 0px", threshold: 0 });

        io.observe(trigger);

        // Sayfa ortasindan yenilenirse dogru durumla acilsin.
        if (trigger.getBoundingClientRect().top < window.innerHeight * 0.75) {
            setNight(true);
        }
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
        ".calculator-container",
        ".features .section-header",
        ".feature-card",
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
    var PAIN_VISIBLE = 6;

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
            if (!collapsed) {
                // Yeni acilanlar da kaydirma animasyonuna dahil olsun.
                hidden.forEach(function (el, i) {
                    el.style.setProperty("--reveal-delay", Math.min(i, 5) * 60 + "ms");
                });
            } else {
                list.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });

        // Listenin ICINE eklenir: .pain-check-layout iki kolonlu bir grid,
        // kardes olarak eklenirse sag sutundaki sonuc karti alt satira duser.
        list.appendChild(btn);
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
            bar.style.width = visible * 100 + "%";
            bar.style.transform = "translateX(" + (ratio * (100 / visible - 100)) + "%)";
            buttons[0].disabled = grid.scrollLeft <= 2;
            buttons[1].disabled = grid.scrollLeft >= max - 2;
        }

        buttons.forEach(function (b) {
            b.addEventListener("click", function () {
                grid.scrollBy({ left: step() * Number(b.dataset.dir), behavior: "smooth" });
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
                grid.scrollBy({ left: step(), behavior: "smooth" });
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                grid.scrollBy({ left: -step(), behavior: "smooth" });
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

        // "Cozumleri sirayla gor" hedef karta dikey kaydiriyordu; rayda hedef
        // yatayda kalabiliyor. Once rayi hizala, sonra orijinal davranis.
        var originalReveal = window.revealSolution;
        if (typeof originalReveal === "function") {
            window.revealSolution = function (targetId) {
                var target = document.getElementById(targetId);
                if (target && grid.contains(target)) {
                    grid.scrollTo({ left: Math.max(target.offsetLeft - 8, 0), behavior: "smooth" });
                }
                return originalReveal.apply(this, arguments);
            };
        }
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
            '<span class="sticky-cta-copy"><b>İmece Düğün</b><span>Ücretsiz başlayın</span></span>' +
            '<a class="btn btn-primary" href="https://apps.apple.com/tr/app/id6794826834" target="_blank" rel="noopener">Uygulamayı İndir</a>';

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

    ready(function () {
        initNightTheme();
        initPainCollapse();
        initKrizRail();
        initStickyCta();
        // Reveal en sona: ray/liste DOM'u yerine oturduktan sonra baglanir.
        initReveal();
    });
})();
