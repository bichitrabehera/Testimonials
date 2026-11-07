/*! Proofly widget — renders verified reviews in a shadow root. */
(function () {
  "use strict";

  var script = document.currentScript;
  if (!script) return;

  var slug = script.getAttribute("data-space");
  if (!slug) {
    console.warn("[Proofly] Add data-space=\"your-slug\" to the script tag.");
    return;
  }

  var origin = script.src ? new URL(script.src, window.location.href).origin : window.location.origin;
  var targetId = script.getAttribute("data-target") || "proofly";

  var overrides = {
    layout: script.getAttribute("data-layout"),
    theme: script.getAttribute("data-theme"),
    accent: script.getAttribute("data-accent"),
    max: parseInt(script.getAttribute("data-max") || "", 10) || 0,
    branded: script.getAttribute("data-branded"),
    showVerified: script.getAttribute("data-verified"),
    showDates: script.getAttribute("data-dates"),
    showReplies: script.getAttribute("data-replies"),
  };

  var host = document.getElementById(targetId);
  if (!host) {
    host = document.createElement("div");
    host.id = targetId;
    if (script.parentNode) script.parentNode.insertBefore(host, script.nextSibling);
  }

  var root = host.shadowRoot || host.attachShadow({ mode: "open" });
  host.style.minHeight = "120px";
  host.setAttribute("data-proofly", "loading");

  var style = document.createElement("style");
  style.textContent = [
    ":host{display:block;contain:content}",
    "*{box-sizing:border-box}",
    ".wrap{font-family:Inter,ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;-webkit-font-smoothing:antialiased}",
    ".grid{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}",
    ".row{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:4px}",
    ".row>*{flex:0 0 262px;scroll-snap-align:start}",
    ".card{border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:9px;height:100%}",
    ".stars{display:inline-flex;gap:2px}",
    ".quote{margin:0;font-size:14px;line-height:1.55;display:-webkit-box;-webkit-line-clamp:6;-webkit-box-orient:vertical;overflow:hidden}",
    ".meta{margin-top:auto;display:flex;align-items:center;gap:8px}",
    ".avatar{width:28px;height:28px;border-radius:999px;display:grid;place-items:center;font-size:11px;font-weight:700;flex:0 0 auto}",
    ".name{display:flex;align-items:center;gap:4px;font-size:13px;font-weight:600}",
    ".sub{font-size:11px;opacity:.75}",
    ".reply{border-radius:10px;padding:8px 10px;font-size:12px;line-height:1.5}",
    ".badge{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:8px 14px;font-size:13px;font-weight:600}",
    ".list{display:flex;flex-direction:column;gap:10px}",
    ".listItem{display:grid;grid-template-columns:120px 1fr;gap:12px;border-radius:12px;padding:14px}",
    ".brand{margin-top:10px;display:flex;justify-content:flex-end;font-size:11px;text-decoration:none}",
    ".empty{border-radius:14px;padding:24px;text-align:center;font-size:13px}",
    "@media (max-width:420px){.listItem{grid-template-columns:1fr}}",
  ].join("");

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function starRow(rating, size) {
    var wrap = el("span", "stars");
    wrap.setAttribute("role", "img");
    wrap.setAttribute("aria-label", rating + " out of 5");
    for (var i = 1; i <= 5; i++) {
      var star = el("span", null, "\u2605");
      star.setAttribute("aria-hidden", "true");
      star.style.fontSize = (size || 14) + "px";
      star.style.lineHeight = "1";
      star.style.color = i <= Math.round(rating) ? "#F5A623" : "#cbd5e1";
      wrap.appendChild(star);
    }
    return wrap;
  }

  function verifiedMark(accent) {
    var mark = el("span", null, "\u2714");
    mark.title = "Verified customer";
    mark.setAttribute("aria-label", "Verified customer");
    mark.style.color = accent;
    mark.style.fontSize = "12px";
    return mark;
  }

  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return "";
    }
  }

  function resolveTheme(pref) {
    if (pref === "dark") return "dark";
    if (pref === "light") return "light";
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function palette(theme) {
    return theme === "dark"
      ? { card: "#16203a", border: "#26324f", text: "#e8eefc", muted: "#9aa9c4", reply: "#111a2b", shadow: "none" }
      : {
          card: "#ffffff",
          border: "#e7ecf3",
          text: "#0f172a",
          muted: "#64748b",
          reply: "#f8fafc",
          shadow: "0 1px 2px rgba(15,23,42,.05),0 10px 28px -18px rgba(15,23,42,.25)",
        };
  }

  function flag(value, fallback) {
    if (value === null || value === undefined) return fallback;
    return value === "1" || value === "true" || value === "yes";
  }

  function render(data) {
    var config = data.config || {};
    var space = data.space || {};
    var reviews = data.reviews || [];
    var layout = overrides.layout || config.layout || "wall";
    var themeName = resolveTheme(overrides.theme || config.theme || "auto");
    var paletteSet = palette(themeName);
    var accent = overrides.accent || config.accent || space.brand_color || "#0A7C66";
    var showVerified = flag(overrides.showVerified, config.show_verified !== false);
    var showDates = flag(overrides.showDates, config.show_dates !== false);
    var showReplies = flag(overrides.showReplies, config.show_replies !== false);
    var branded = flag(overrides.branded, config.branded !== false);
    var max = overrides.max || config.max_reviews || 20;
    reviews = reviews.slice(0, max);

    var wrap = el("div", "wrap");
    wrap.style.color = paletteSet.text;

    if (!reviews.length) {
      var empty = el("div", "empty", "Reviews are being collected — check back soon.");
      empty.style.border = "1px dashed " + paletteSet.border;
      empty.style.color = paletteSet.muted;
      wrap.appendChild(empty);
      root.replaceChildren(style, wrap);
      host.style.minHeight = "";
      return;
    }

    if (layout === "badge") {
      var badge = el("span", "badge");
      badge.style.border = "1px solid " + paletteSet.border;
      badge.style.background = paletteSet.card;
      badge.style.boxShadow = paletteSet.shadow;
      badge.style.color = paletteSet.text;
      badge.appendChild(starRow(data.space.avg_rating || 5, 13));
      badge.appendChild(el("span", null, (space.avg_rating || 0).toFixed(1) + " \u00b7 " + space.count + " reviews"));
      if (showVerified) {
        var v = el("span", null, "\u2714 verified");
        v.style.color = accent;
        v.style.fontWeight = "600";
        badge.appendChild(v);
      }
      wrap.appendChild(badge);
      root.replaceChildren(style, wrap);
      host.style.minHeight = "";
      return;
    }

    function card(review) {
      var node = el("figure", "card");
      node.style.background = paletteSet.card;
      node.style.border = "1px solid " + paletteSet.border;
      node.style.boxShadow = paletteSet.shadow;
      node.style.margin = "0";
      node.appendChild(starRow(review.rating, 14));
      if (review.body) node.appendChild(el("blockquote", "quote", review.body));

      var meta = el("figcaption", "meta");
      var avatar = el("span", "avatar", (review.name || "?").slice(0, 1).toUpperCase());
      avatar.style.background = accent + "1a";
      avatar.style.color = accent;
      meta.appendChild(avatar);

      var body = el("span");
      var nameRow = el("span", "name");
      var nameText = el("span", null, review.name);
      nameText.style.overflow = "hidden";
      nameText.style.textOverflow = "ellipsis";
      nameText.style.whiteSpace = "nowrap";
      nameRow.appendChild(nameText);
      if (showVerified && review.verified) nameRow.appendChild(verifiedMark(accent));
      body.appendChild(nameRow);
      var sub = el("span", "sub", (review.role ? review.role + " \u00b7 " : "") + (showDates ? formatDate(review.created_at) : "Customer"));
      sub.style.display = "block";
      body.appendChild(sub);
      meta.appendChild(body);
      node.appendChild(meta);

      if (showReplies && review.reply) {
        var reply = el("div", "reply");
        reply.style.background = paletteSet.reply;
        reply.style.border = "1px solid " + paletteSet.border;
        reply.style.color = paletteSet.muted;
        var label = el("strong", null, "Owner replied: ");
        label.style.color = accent;
        reply.appendChild(label);
        reply.appendChild(document.createTextNode(review.reply));
        node.appendChild(reply);
      }
      return node;
    }

    if (layout === "list") {
      var list = el("div", "list");
      reviews.forEach(function (review) {
        var item = el("div", "listItem");
        item.style.background = paletteSet.card;
        item.style.border = "1px solid " + paletteSet.border;
        var left = el("div");
        left.appendChild(starRow(review.rating, 13));
        var name = el("div", null, review.name);
        name.style.fontSize = "12px";
        name.style.fontWeight = "600";
        name.style.marginTop = "6px";
        left.appendChild(name);
        if (showVerified && review.verified) {
          var vlist = verifiedMark(accent);
          vlist.style.fontSize = "11px";
          vlist.appendChild(document.createTextNode(" Verified"));
          left.appendChild(vlist);
        }
        item.appendChild(left);
        var right = el("div", null, review.body || "Rated without a comment.");
        right.style.fontSize = "13px";
        right.style.lineHeight = "1.55";
        item.appendChild(right);
        list.appendChild(item);
      });
      wrap.appendChild(list);
    } else if (layout === "carousel") {
      var row = el("div", "row");
      row.setAttribute("role", "list");
      reviews.forEach(function (review) {
        var holder = el("div");
        holder.setAttribute("role", "listitem");
        holder.appendChild(card(review));
        row.appendChild(holder);
      });
      wrap.appendChild(row);
    } else {
      var grid = el("div", "grid");
      reviews.forEach(function (review) {
        grid.appendChild(card(review));
      });
      wrap.appendChild(grid);
    }

    if (branded) {
      var brand = el("a", "brand", "Powered by Proofly");
      brand.href = origin;
      brand.target = "_blank";
      brand.rel = "noopener";
      brand.style.color = paletteSet.muted;
      wrap.appendChild(brand);
    }

    root.replaceChildren(style, wrap);
    host.removeAttribute("data-proofly");
    host.style.minHeight = "";

    if (config.jsonLd || data.config.jsonLd) injectJsonLd(data);
  }

  function injectJsonLd(data) {
    try {
      if (document.querySelector('script[data-proofly-jsonld="' + slug + '"]')) return;
      var node = document.createElement("script");
      node.type = "application/ld+json";
      node.setAttribute("data-proofly-jsonld", slug);
      node.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: data.space.name,
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: data.space.avg_rating,
          reviewCount: data.space.count,
        },
        review: (data.reviews || []).slice(0, 10).map(function (review) {
          return {
            "@type": "Review",
            author: { "@type": "Person", name: review.name },
            datePublished: review.created_at,
            reviewBody: review.body,
            reviewRating: { "@type": "Rating", ratingValue: review.rating, bestRating: 5 },
          };
        }),
      });
      document.head.appendChild(node);
    } catch {
      /* structured data is best-effort */
    }
  }

  fetch(origin + "/api/public/spaces/" + encodeURIComponent(slug) + "/reviews?limit=" + (overrides.max || 20), {
    headers: { Accept: "application/json" },
  })
    .then(function (response) {
      if (!response.ok) throw new Error("Proofly: " + response.status);
      return response.json();
    })
    .then(render)
    .catch(function (error) {
      host.removeAttribute("data-proofly");
      var wrap = el("div", "wrap");
      var message = el("div", "empty", "Reviews could not be loaded.");
      message.style.color = "#64748b";
      message.style.border = "1px dashed #e2e8f0";
      wrap.appendChild(message);
      root.replaceChildren(style, wrap);
      if (window.console) console.warn(error);
    });
})();
