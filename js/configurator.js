/* ===== Forma Mobilya — Oda Tasarlayıcı ===== */
/* Fotoğraf yükle, mobilya yerleştir, malzeme/boya seç, Türkiye fiyatlarıyla teklif al. */

(function () {
  "use strict";

  /* --- Fiyat verileri --- */
  /* Öncelik js/fiyatlar.js dosyasındadır; o dosya yoksa aşağıdaki
     varsayılan değerler yedek olarak kullanılır. */
  var DATA = window.FORMA_FIYATLAR || {};

  var MATERIALS = DATA.malzemeler || [
    { id: "suntalam", name: "Suntalam (Melamin Yonga Levha)", price: 450 },
    { id: "mdf", name: "MDF (Ham)", price: 600 },
    { id: "mdflam", name: "MDF Lam (Laminize)", price: 750 },
    { id: "cam", name: "Masif Çam", price: 1400 },
    { id: "mese", name: "Masif Meşe", price: 2400 }
  ];

  var FINISHES = DATA.yuzeyler || [
    { id: "melamin", name: "Melamin Kaplama (hazır)", price: 0 },
    { id: "pvc", name: "PVC Membran Kaplama", price: 400 },
    { id: "matlake", name: "Mat Lake Boya", price: 950 },
    { id: "parlaklake", name: "Parlak Lake Boya", price: 1250 },
    { id: "vernik", name: "Doğal Vernik", price: 300 }
  ];

  /* Ekstralar (₺, sabit / ürün başına) */
  var EXTRAS = DATA.ekstralar || [
    { id: "mentese", name: "Yumuşak Kapanır Menteşe", price: 400 },
    { id: "led", name: "LED Aydınlatma", price: 700 },
    { id: "camkapak", name: "Cam Kapak", price: 950 },
    { id: "kulp", name: "Gizli Kulp", price: 250 },
    { id: "kilit", name: "Kilit Sistemi", price: 300 }
  ];

  var COLORS = DATA.renkler || [
    { id: "beyaz", name: "Beyaz", hex: "#f4f1ec" },
    { id: "krem", name: "Krem", hex: "#e7dcc8" },
    { id: "mese", name: "Meşe", hex: "#c8a877" },
    { id: "ceviz", name: "Ceviz", hex: "#7a5230" },
    { id: "antrasit", name: "Antrasit", hex: "#3b3f44" },
    { id: "adacayi", name: "Adaçayı", hex: "#9caa8e" },
    { id: "lacivert", name: "Lacivert", hex: "#34415e" },
    { id: "siyah", name: "Siyah", hex: "#1c1c1c" }
  ];

  /* Odaya özel mobilya ön ayarları (ölçü: cm — en × yükseklik × derinlik) */
  var PIECES = DATA.mobilyalar || {
    salon: [
      { name: "TV Ünitesi", w: 180, h: 50, d: 40 },
      { name: "Kitaplık", w: 120, h: 200, d: 35 },
      { name: "Orta Sehpa", w: 110, h: 45, d: 60 },
      { name: "Konsol", w: 120, h: 80, d: 40 },
      { name: "Vitrin Dolabı", w: 100, h: 190, d: 40 }
    ],
    mutfak: [
      { name: "Alt Mutfak Dolabı", w: 100, h: 85, d: 60 },
      { name: "Üst Mutfak Dolabı", w: 100, h: 70, d: 35 },
      { name: "Ada Tezgâhı", w: 120, h: 90, d: 80 },
      { name: "Kiler Dolabı", w: 60, h: 210, d: 60 },
      { name: "Yemek Masası", w: 160, h: 75, d: 90 }
    ],
    cocuk: [
      { name: "Gardırop", w: 120, h: 200, d: 60 },
      { name: "Çalışma Masası", w: 120, h: 75, d: 60 },
      { name: "Kitaplık / Raf", w: 80, h: 180, d: 30 },
      { name: "Komodin", w: 45, h: 55, d: 40 },
      { name: "Genç Karyola", w: 100, h: 70, d: 200 }
    ],
    calisma: [
      { name: "Çalışma Masası", w: 140, h: 75, d: 70 },
      { name: "Kitaplık", w: 100, h: 200, d: 35 },
      { name: "Dosya Dolabı", w: 45, h: 110, d: 50 },
      { name: "Raf Sistemi", w: 120, h: 30, d: 25 },
      { name: "Toplantı Masası", w: 180, h: 75, d: 90 }
    ]
  };

  /* --- Yardımcılar --- */
  var TL = new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0
  });

  function money(n) {
    return TL.format(n);
  }

  // Kutu yüzey alanı (m²) — panel kullanımı için yaklaşık
  function panelArea(w, h, d) {
    var W = w / 100, H = h / 100, D = d / 100;
    return 2 * (W * H + W * D + H * D);
  }

  function findById(list, id) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return list[0];
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* --- İzometrik 3D model üretimi --- */
  var ISO_C = 0.866, ISO_S = 0.5;

  function isoPt(x, y, z) {
    return [(x - y) * ISO_C, (x + y) * ISO_S - z];
  }

  function polyStr(pts) {
    return pts
      .map(function (p) {
        return p[0].toFixed(1) + "," + p[1].toFixed(1);
      })
      .join(" ");
  }

  // Bir kutunun görünen üç yüzünün köşe noktaları
  function boxPolys(x0, y0, z0, w, dep, h) {
    return {
      top: [
        isoPt(x0, y0, z0 + h),
        isoPt(x0 + w, y0, z0 + h),
        isoPt(x0 + w, y0 + dep, z0 + h),
        isoPt(x0, y0 + dep, z0 + h)
      ],
      left: [
        isoPt(x0, y0 + dep, z0),
        isoPt(x0 + w, y0 + dep, z0),
        isoPt(x0 + w, y0 + dep, z0 + h),
        isoPt(x0, y0 + dep, z0 + h)
      ],
      right: [
        isoPt(x0 + w, y0, z0),
        isoPt(x0 + w, y0 + dep, z0),
        isoPt(x0 + w, y0 + dep, z0 + h),
        isoPt(x0 + w, y0, z0 + h)
      ]
    };
  }

  // Hex rengi yüzdeye göre açar (+) veya koyulaştırır (-)
  function shade(hex, pct) {
    hex = String(hex).replace("#", "");
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    var r = parseInt(hex.slice(0, 2), 16);
    var g = parseInt(hex.slice(2, 4), 16);
    var b = parseInt(hex.slice(4, 6), 16);
    var f = pct / 100;
    function adj(v) {
      return Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f);
    }
    return "rgb(" + adj(r) + "," + adj(g) + "," + adj(b) + ")";
  }

  function classify(name) {
    var n = name.toLowerCase();
    if (/masa|tezg|ada|sehpa|toplant/.test(n)) return "table";
    if (/kitapl|raf|vitrin/.test(n)) return "shelf";
    if (/karyola|yatak/.test(n)) return "bed";
    if (/sandalye|tabure/.test(n)) return "seat";
    return "box";
  }

  // piece (w,h,d cm) ve renk hex'inden izometrik 3D SVG modeli üretir
  function buildModel(piece, hex) {
    var type = classify(piece.name);
    var k = 58 / Math.max(piece.w, piece.h, piece.d);
    var W = piece.w * k, H = piece.h * k, D = piece.d * k;
    var parts = [];

    function part(x0, y0, z0, w, dep, h) {
      return { x0: x0, y0: y0, z0: z0, w: w, dep: dep, h: h };
    }

    if (type === "table") {
      var slabH = Math.max(3, H * 0.12);
      var legT = Math.max(2.5, Math.min(W, D) * 0.14);
      parts.push(part(0, 0, H - slabH, W, D, slabH));
      parts.push(part(0, 0, 0, legT, legT, H - slabH));
      parts.push(part(W - legT, 0, 0, legT, legT, H - slabH));
      parts.push(part(0, D - legT, 0, legT, legT, H - slabH));
      parts.push(part(W - legT, D - legT, 0, legT, legT, H - slabH));
    } else if (type === "bed") {
      var hb = Math.max(3, W * 0.08);
      parts.push(part(0, 0, 0, hb, D, H));
      parts.push(part(hb, 0, 0, W - hb, D, H * 0.42));
    } else if (type === "seat") {
      var seatH = H * 0.5;
      var slab = Math.max(3, H * 0.1);
      var lt = Math.max(2, Math.min(W, D) * 0.12);
      parts.push(part(0, 0, seatH - slab, W, D, slab));
      if (!/tabure/.test(piece.name.toLowerCase())) {
        parts.push(part(0, 0, seatH, Math.max(3, W * 0.12), D, H - seatH));
      }
      parts.push(part(0, 0, 0, lt, lt, seatH - slab));
      parts.push(part(W - lt, 0, 0, lt, lt, seatH - slab));
      parts.push(part(0, D - lt, 0, lt, lt, seatH - slab));
      parts.push(part(W - lt, D - lt, 0, lt, lt, seatH - slab));
    } else {
      parts.push(part(0, 0, 0, W, D, H));
    }

    parts.sort(function (a, b) {
      return a.x0 + a.y0 + a.z0 - (b.x0 + b.y0 + b.z0);
    });

    var pts = [];
    var svg = "";
    var faceShades = [["right", -26], ["left", -8], ["top", 20]];
    parts.forEach(function (pp) {
      var f = boxPolys(pp.x0, pp.y0, pp.z0, pp.w, pp.dep, pp.h);
      faceShades.forEach(function (fs) {
        var poly = f[fs[0]];
        poly.forEach(function (p) {
          pts.push(p);
        });
        svg +=
          '<polygon points="' + polyStr(poly) + '" fill="' + shade(hex, fs[1]) +
          '" stroke="rgba(0,0,0,.28)" stroke-width="0.6" stroke-linejoin="round"/>';
      });
    });

    // Raf/vitrin: ön yüze yatay raf çizgileri
    if (type === "shelf") {
      var ff = boxPolys(0, 0, 0, W, D, H);
      var bl = ff.left[0], br = ff.left[1], tr = ff.left[2], tl = ff.left[3];
      for (var i = 1; i < 4; i++) {
        var t = i / 4;
        svg +=
          '<line x1="' + (bl[0] + (tl[0] - bl[0]) * t).toFixed(1) +
          '" y1="' + (bl[1] + (tl[1] - bl[1]) * t).toFixed(1) +
          '" x2="' + (br[0] + (tr[0] - br[0]) * t).toFixed(1) +
          '" y2="' + (br[1] + (tr[1] - br[1]) * t).toFixed(1) +
          '" stroke="rgba(0,0,0,.3)" stroke-width="0.8"/>';
      }
    }

    // Dolap: ön yüze kapak ayrım çizgisi
    if (type === "box") {
      var bf = boxPolys(0, 0, 0, W, D, H);
      var mb = [(bf.left[0][0] + bf.left[1][0]) / 2, (bf.left[0][1] + bf.left[1][1]) / 2];
      var mt = [(bf.left[3][0] + bf.left[2][0]) / 2, (bf.left[3][1] + bf.left[2][1]) / 2];
      svg +=
        '<line x1="' + mb[0].toFixed(1) + '" y1="' + mb[1].toFixed(1) +
        '" x2="' + mt[0].toFixed(1) + '" y2="' + mt[1].toFixed(1) +
        '" stroke="rgba(0,0,0,.22)" stroke-width="0.8"/>';
    }

    var xs = pts.map(function (p) { return p[0]; });
    var ys = pts.map(function (p) { return p[1]; });
    var minX = Math.min.apply(null, xs) - 2;
    var maxX = Math.max.apply(null, xs) + 2;
    var minY = Math.min.apply(null, ys) - 2;
    var maxY = Math.max.apply(null, ys) + 2;

    return (
      '<svg viewBox="' + minX.toFixed(1) + " " + minY.toFixed(1) + " " +
      (maxX - minX).toFixed(1) + " " + (maxY - minY).toFixed(1) +
      '" xmlns="http://www.w3.org/2000/svg">' + svg + "</svg>"
    );
  }

  /* --- Render iskeleti --- */
  function template(pieces) {
    var pieceOpts = pieces
      .map(function (p, i) {
        return '<option value="' + i + '">' + escapeHtml(p.name) + "</option>";
      })
      .join("");

    var matOpts = MATERIALS.map(function (m) {
      return (
        '<option value="' + m.id + '">' +
        escapeHtml(m.name) + " — " + money(m.price) + "/m²</option>"
      );
    }).join("");

    var finOpts = FINISHES.map(function (f) {
      return (
        '<option value="' + f.id + '">' +
        escapeHtml(f.name) +
        (f.price ? " — +" + money(f.price) + "/m²" : "") +
        "</option>"
      );
    }).join("");

    var colorSwatches = COLORS.map(function (c, i) {
      return (
        '<button type="button" class="cfg-swatch' +
        (i === 0 ? " selected" : "") +
        '" data-color="' + c.id + '" title="' + escapeHtml(c.name) +
        '" style="background:' + c.hex + '"></button>'
      );
    }).join("");

    var extraChecks = EXTRAS.map(function (e) {
      return (
        '<label class="cfg-check"><input type="checkbox" value="' + e.id + '">' +
        "<span>" + escapeHtml(e.name) + "</span>" +
        '<span class="cfg-extra-price">+' + money(e.price) + "</span></label>"
      );
    }).join("");

    return (
      '<div class="cfg">' +
      // Canlı ürün önizlemesi (gerçek ürün fotoğrafı)
      '<div class="cfg-preview">' +
      '<div class="cfg-preview-stage" data-preview>' +
      '<img class="cfg-preview-img" data-preview-img alt="" />' +
      '<span class="cfg-preview-badge" data-preview-price></span>' +
      "</div>" +
      '<div class="cfg-preview-meta">' +
      '<span class="cfg-preview-name" data-preview-name></span>' +
      '<span class="cfg-preview-dims" data-preview-dims></span>' +
      "</div>" +
      '<div class="cfg-preview-spec" data-preview-spec></div>' +
      '<p class="cfg-preview-hint">Müşteri görünümü — gerçek ürün. Seçtiğin ölçü, malzeme ve renk anlık yansır.</p>' +
      "</div>" +
      // Fiyatlandırma paneli
      '<div class="cfg-panel">' +
      '<div class="cfg-field"><label>Mobilya</label><select class="cfg-select" data-piece>' + pieceOpts + "</select></div>" +
      '<div class="cfg-field"><label>Ölçü (cm)</label><div class="cfg-dims">' +
      '<div><small>En</small><input class="cfg-input" type="number" min="10" data-w></div>' +
      '<div><small>Yükseklik</small><input class="cfg-input" type="number" min="10" data-h></div>' +
      '<div><small>Derinlik</small><input class="cfg-input" type="number" min="5" data-d></div>' +
      "</div></div>" +
      '<div class="cfg-field"><label>Gövde Malzemesi</label><select class="cfg-select" data-material>' + matOpts + "</select></div>" +
      '<div class="cfg-field"><label>Yüzey / Boya</label><select class="cfg-select" data-finish>' + finOpts + "</select></div>" +
      '<div class="cfg-field"><label>Renk</label><div class="cfg-colors">' + colorSwatches + "</div></div>" +
      '<div class="cfg-field"><label>Ekstralar</label><div class="cfg-extras">' + extraChecks + "</div></div>" +
      '<div class="cfg-field cfg-qty-row"><div><label>Adet</label><input class="cfg-input" type="number" min="1" value="1" data-qty></div>' +
      '<div class="cfg-unit"><span class="cfg-unit-label">Birim</span><span class="cfg-unit-price" data-unit>₺0</span></div></div>' +
      '<button type="button" class="btn btn--primary cfg-add" data-add>Listeye Ekle</button>' +
      "</div>" +
      "</div>" +
      // Sepet
      '<div class="cfg-cart">' +
      '<div class="cfg-cart-head">Teklif Listesi</div>' +
      '<div data-cart-body><div class="cfg-cart-empty">Henüz ürün eklenmedi. Yukarıdan mobilya seçip “Listeye Ekle”ye bas.</div></div>' +
      '<div class="cfg-quote" data-quote></div>' +
      '<p class="cfg-note">Fiyatlar tahmini olup malzeme, ölçü ve işçiliğe göre değişebilir. KDV dahil değildir. Kesin fiyat için bizimle iletişime geçin.</p>' +
      "</div>"
    );
  }

  /* --- Tek bir tasarlayıcıyı başlat --- */
  function init(root) {
    var roomId = root.getAttribute("data-room") || "salon";
    var pieces = PIECES[roomId] || PIECES.salon;
    root.innerHTML = template(pieces);

    var $ = function (sel) {
      return root.querySelector(sel);
    };

    var photo = $("[data-drop]");
    var fileInput = $("[data-file]");
    var changeBtn = $("[data-change]");
    var clearBtn = $("[data-clear]");
    var pieceSel = $("[data-piece]");
    var wIn = $("[data-w]"), hIn = $("[data-h]"), dIn = $("[data-d]");
    var matSel = $("[data-material]");
    var finSel = $("[data-finish]");
    var qtyIn = $("[data-qty]");
    var unitEl = $("[data-unit]");
    var addBtn = $("[data-add]");
    var cartBody = $("[data-cart-body]");
    var quoteEl = $("[data-quote]");
    var previewHost = $("[data-preview]");
    var previewImg = $("[data-preview-img]");
    var previewNameEl = $("[data-preview-name]");
    var previewDimsEl = $("[data-preview-dims]");
    var previewSpecEl = $("[data-preview-spec]");
    var previewPriceEl = $("[data-preview-price]");

    var state = {
      pieceIndex: 0,
      color: COLORS[0].id,
      extras: []
    };
    var cart = [];
    var seq = 0;

    /* Ölçüyü seçili mobilyadan doldur */
    function fillDims() {
      var p = pieces[state.pieceIndex];
      wIn.value = p.w;
      hIn.value = p.h;
      dIn.value = p.d;
    }

    function currentExtras() {
      var ids = [];
      root.querySelectorAll(".cfg-extras input:checked").forEach(function (c) {
        ids.push(c.value);
      });
      return ids;
    }

    function calcUnit() {
      var w = parseFloat(wIn.value) || 0;
      var h = parseFloat(hIn.value) || 0;
      var d = parseFloat(dIn.value) || 0;
      var mat = findById(MATERIALS, matSel.value);
      var fin = findById(FINISHES, finSel.value);
      var area = panelArea(w, h, d);
      var price = area * (mat.price + fin.price);
      currentExtras().forEach(function (eid) {
        price += findById(EXTRAS, eid).price;
      });
      return Math.round(price);
    }

    function refreshUnit() {
      unitEl.textContent = money(calcUnit());
      refreshPreview();
    }

    /* --- Canlı ürün önizlemesi (gerçek ürün fotoğrafı) --- */
    function renderPreviewNow() {
      if (!previewHost) return;
      var p = pieces[state.pieceIndex];
      var w = parseFloat(wIn.value) || p.w;
      var h = parseFloat(hIn.value) || p.h;
      var d = parseFloat(dIn.value) || p.d;
      var mat = findById(MATERIALS, matSel.value);
      var fin = findById(FINISHES, finSel.value);
      var color = findById(COLORS, state.color);

      if (previewImg && p.gorsel && previewImg.getAttribute("src") !== p.gorsel) {
        previewImg.onerror = function () { previewHost.classList.add("img-broken"); };
        previewImg.onload = function () { previewHost.classList.remove("img-broken"); };
        previewImg.src = p.gorsel;
        previewImg.alt = p.name;
      }
      if (previewNameEl) previewNameEl.textContent = p.name;
      if (previewDimsEl) previewDimsEl.textContent = w + " × " + h + " × " + d + " cm";
      if (previewSpecEl) previewSpecEl.textContent = mat.name + " · " + fin.name + " · " + color.name;
      if (previewPriceEl) previewPriceEl.textContent = money(calcUnit());
    }

    function refreshPreview() {
      renderPreviewNow();
    }

    /* --- Fotoğraf yükleme --- */
    function setPhoto(file) {
      if (!file || !/^image\//.test(file.type)) return;
      var url = URL.createObjectURL(file);
      photo.style.backgroundImage = 'url("' + url + '")';
      photo.classList.add("has-photo");
      changeBtn.hidden = false;
      clearBtn.hidden = false;
      // Fotoğraf yoktan eklendiyse, listedeki ürünler için modelleri oluştur
      cart.forEach(function (it) {
        if (!it.marker) addModel(it);
      });
    }

    function clearPhoto() {
      photo.style.backgroundImage = "";
      photo.classList.remove("has-photo");
      fileInput.value = "";
      changeBtn.hidden = true;
      clearBtn.hidden = true;
      // etiketleri koru ya da temizle — koruyoruz; sadece arka plan kalkar
    }

    if (photo) {
    photo.addEventListener("click", function (e) {
      if (e.target.closest(".cfg-marker, .cfg-model")) return;
      if (!photo.classList.contains("has-photo")) fileInput.click();
    });
    changeBtn.addEventListener("click", function () {
      fileInput.click();
    });
    clearBtn.addEventListener("click", clearPhoto);
    fileInput.addEventListener("change", function () {
      if (fileInput.files[0]) setPhoto(fileInput.files[0]);
    });
    ["dragenter", "dragover"].forEach(function (ev) {
      photo.addEventListener(ev, function (e) {
        e.preventDefault();
        photo.classList.add("dragover");
      });
    });
    ["dragleave", "drop"].forEach(function (ev) {
      photo.addEventListener(ev, function (e) {
        e.preventDefault();
        photo.classList.remove("dragover");
      });
    });
    photo.addEventListener("drop", function (e) {
      var f = e.dataTransfer && e.dataTransfer.files[0];
      if (f) setPhoto(f);
    });
    }

    /* --- Etiket sürükleme --- */
    function makeDraggable(el) {
      var dragging = false, offX = 0, offY = 0;
      el.addEventListener("pointerdown", function (e) {
        if (e.target.closest(".cfg-model-resize, .cfg-model-del")) return;
        dragging = true;
        el.setPointerCapture(e.pointerId);
        var r = el.getBoundingClientRect();
        offX = e.clientX - r.left;
        offY = e.clientY - r.top;
        el.classList.add("dragging");
      });
      el.addEventListener("pointermove", function (e) {
        if (!dragging) return;
        var cr = photo.getBoundingClientRect();
        var x = e.clientX - cr.left - offX;
        var y = e.clientY - cr.top - offY;
        x = Math.max(0, Math.min(x, cr.width - el.offsetWidth));
        y = Math.max(0, Math.min(y, cr.height - el.offsetHeight));
        el.style.left = x + "px";
        el.style.top = y + "px";
        el.style.right = "auto";
      });
      function end() {
        dragging = false;
        el.classList.remove("dragging");
      }
      el.addEventListener("pointerup", end);
      el.addEventListener("pointercancel", end);
    }

    /* --- 3D model boyutlandırma --- */
    function makeResizable(el) {
      var handle = el.querySelector(".cfg-model-resize");
      if (!handle) return;
      var resizing = false, startX = 0, startW = 0;
      handle.addEventListener("pointerdown", function (e) {
        e.stopPropagation();
        resizing = true;
        handle.setPointerCapture(e.pointerId);
        startX = e.clientX;
        startW = el.offsetWidth;
      });
      handle.addEventListener("pointermove", function (e) {
        if (!resizing) return;
        var nw = Math.max(60, Math.min(360, startW + (e.clientX - startX)));
        el.style.width = nw + "px";
      });
      function end() {
        resizing = false;
      }
      handle.addEventListener("pointerup", end);
      handle.addEventListener("pointercancel", end);
    }

    /* Sadece bir tutamaçtan taşıma (3D modelde gövde döndürme içindir) */
    function makeMovable(el, handle) {
      var moving = false, offX = 0, offY = 0;
      handle.addEventListener("pointerdown", function (e) {
        e.stopPropagation();
        moving = true;
        handle.setPointerCapture(e.pointerId);
        var r = el.getBoundingClientRect();
        offX = e.clientX - r.left;
        offY = e.clientY - r.top;
        el.classList.add("dragging");
      });
      handle.addEventListener("pointermove", function (e) {
        if (!moving) return;
        var cr = photo.getBoundingClientRect();
        var x = Math.max(0, Math.min(e.clientX - cr.left - offX, cr.width - el.offsetWidth));
        var y = Math.max(0, Math.min(e.clientY - cr.top - offY, cr.height - el.offsetHeight));
        el.style.left = x + "px";
        el.style.top = y + "px";
        el.style.right = "auto";
      });
      function end() {
        moving = false;
        el.classList.remove("dragging");
      }
      handle.addEventListener("pointerup", end);
      handle.addEventListener("pointercancel", end);
    }

    function makeResizable3D(el, item) {
      var handle = el.querySelector(".cfg-model-resize");
      if (!handle) return;
      var resizing = false, startX = 0, startW = 0;
      handle.addEventListener("pointerdown", function (e) {
        e.stopPropagation();
        resizing = true;
        handle.setPointerCapture(e.pointerId);
        startX = e.clientX;
        startW = el.offsetWidth;
      });
      handle.addEventListener("pointermove", function (e) {
        if (!resizing) return;
        var nw = Math.max(90, Math.min(420, startW + (e.clientX - startX)));
        el.style.width = nw + "px";
        if (item.three) item.three.setSize(nw, nw);
      });
      function end() {
        resizing = false;
      }
      handle.addEventListener("pointerup", end);
      handle.addEventListener("pointercancel", end);
    }

    /* Fotoğraf üzerine modeli yerleştir (Three.js varsa gerçek 3D) */
    function addModel(item) {
      var idx = cart.indexOf(item);
      if (idx < 0) idx = cart.length;
      var wrap = document.createElement("div");
      wrap.className = "cfg-model";
      wrap.dataset.id = item.id;
      wrap.style.left = 24 + ((idx * 28) % 160) + "px";
      wrap.style.top = 24 + ((idx * 32) % 150) + "px";

      var use3D = window.Furniture3D && window.Furniture3D.available();

      if (use3D) {
        wrap.classList.add("cfg-model--3d");
        wrap.style.width = "180px";
        wrap.innerHTML =
          '<span class="cfg-model-badge">' + item.no + "</span>" +
          '<button type="button" class="cfg-model-del" title="Kaldır">×</button>' +
          '<button type="button" class="cfg-model-move" title="Taşı">✥</button>' +
          '<div class="cfg-model-canvas"></div>' +
          '<span class="cfg-model-name">' + escapeHtml(item.name) + "</span>" +
          '<span class="cfg-model-resize" title="Boyutlandır"></span>';
        photo.appendChild(wrap);
        var host = wrap.querySelector(".cfg-model-canvas");
        item.three = window.Furniture3D.create(host, item.piece, {
          color: item.hex,
          finish: item.finishId,
          size: 180
        });
        makeMovable(wrap, wrap.querySelector(".cfg-model-move"));
        makeResizable3D(wrap, item);
      } else {
        wrap.style.width = "130px";
        wrap.innerHTML =
          '<span class="cfg-model-badge">' + item.no + "</span>" +
          '<button type="button" class="cfg-model-del" title="Kaldır">×</button>' +
          buildModel(item.piece, item.hex) +
          '<span class="cfg-model-name">' + escapeHtml(item.name) + "</span>" +
          '<span class="cfg-model-resize" title="Boyutlandır"></span>';
        photo.appendChild(wrap);
        makeDraggable(wrap);
        makeResizable(wrap);
      }

      wrap.querySelector(".cfg-model-del").addEventListener("click", function (e) {
        e.stopPropagation();
        removeItem(item.id);
      });
      item.marker = wrap;
    }

    /* --- Sepet --- */
    function renderCart() {
      if (!cart.length) {
        cartBody.innerHTML =
          '<div class="cfg-cart-empty">Henüz ürün eklenmedi. Yukarıdan mobilya seçip “Listeye Ekle”ye bas.</div>';
        quoteEl.classList.remove("show");
        return;
      }
      var total = 0;
      var rows = cart
        .map(function (it) {
          total += it.total;
          return (
            "<tr>" +
            '<td class="cfg-num-cell"><span class="cfg-item-num">' + it.no + "</span></td>" +
            "<td><div class=\"cfg-item-name\">" + escapeHtml(it.name) + "</div>" +
            '<div class="cfg-item-spec">' + escapeHtml(it.spec) + "</div></td>" +
            "<td>" + it.qty + " adet</td>" +
            '<td class="price-cell">' + money(it.total) + "</td>" +
            '<td><button class="cfg-remove" data-remove="' + it.id + '" title="Kaldır">✕</button></td>' +
            "</tr>"
          );
        })
        .join("");

      cartBody.innerHTML =
        '<table class="cfg-table"><thead><tr>' +
        "<th>#</th><th>Ürün</th><th>Adet</th><th>Tutar</th><th></th>" +
        "</tr></thead><tbody>" + rows + "</tbody></table>" +
        '<div class="cfg-cart-foot">' +
        '<div class="cfg-total"><div class="cfg-total-label">Toplam (tahmini)</div>' +
        '<div class="cfg-total-price">' + money(total) + "</div></div>" +
        '<button type="button" class="btn btn--primary" data-quotebtn>Teklifi Oluştur</button>' +
        "</div>";

      cartBody.querySelectorAll("[data-remove]").forEach(function (b) {
        b.addEventListener("click", function () {
          removeItem(b.getAttribute("data-remove"));
        });
      });
      cartBody.querySelector("[data-quotebtn]").addEventListener("click", buildQuote);
    }

    function removeItem(id) {
      cart = cart.filter(function (it) {
        if (it.id === id) {
          if (it.three) it.three.dispose();
          if (it.marker && it.marker.parentNode) it.marker.parentNode.removeChild(it.marker);
          return false;
        }
        return true;
      });
      // numaraları yeniden sırala
      cart.forEach(function (it, i) {
        it.no = i + 1;
        if (it.marker) {
          var badge = it.marker.querySelector(".cfg-model-badge");
          if (badge) badge.textContent = it.no;
        }
      });
      renderCart();
    }

    function addItem() {
      var p = pieces[state.pieceIndex];
      var mat = findById(MATERIALS, matSel.value);
      var fin = findById(FINISHES, finSel.value);
      var color = findById(COLORS, state.color);
      var extras = currentExtras().map(function (eid) {
        return findById(EXTRAS, eid).name;
      });
      var qty = Math.max(1, parseInt(qtyIn.value, 10) || 1);
      var unit = calcUnit();
      var spec =
        (wIn.value || "?") + "×" + (hIn.value || "?") + "×" + (dIn.value || "?") + " cm · " +
        mat.name + " · " + fin.name + " · " + color.name +
        (extras.length ? " · " + extras.join(", ") : "");

      seq += 1;
      var item = {
        id: "i" + seq,
        no: cart.length + 1,
        name: p.name,
        spec: spec,
        qty: qty,
        unit: unit,
        total: unit * qty,
        piece: { name: p.name, w: parseFloat(wIn.value) || p.w, h: parseFloat(hIn.value) || p.h, d: parseFloat(dIn.value) || p.d },
        hex: color.hex,
        finishId: fin.id
      };
      cart.push(item);
      if (photo && photo.classList.contains("has-photo")) addModel(item);
      renderCart();
    }

    function buildQuote() {
      if (!cart.length) return;
      var lines = ["FORMA MOBİLYA — Tahmini Teklif", "Bölüm: " + capitalize(roomId), ""];
      var total = 0;
      cart.forEach(function (it) {
        total += it.total;
        lines.push(it.no + ". " + it.name + " (" + it.qty + " adet) — " + money(it.total));
        lines.push("   " + it.spec);
      });
      lines.push("");
      lines.push("TOPLAM (tahmini, KDV hariç): " + money(total));
      var text = lines.join("\n");
      quoteEl.textContent = text;
      quoteEl.classList.add("show");

      var mail = document.createElement("a");
      mail.href =
        "mailto:merhaba@formamobilya.com?subject=" +
        encodeURIComponent("Teklif Talebi — " + capitalize(roomId)) +
        "&body=" + encodeURIComponent(text);
      mail.className = "btn btn--ghost";
      mail.style.marginTop = "14px";
      mail.style.display = "inline-flex";
      mail.textContent = "E-posta ile Gönder";
      quoteEl.appendChild(document.createElement("br"));
      quoteEl.appendChild(mail);
      quoteEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function capitalize(s) {
      var map = {
        salon: "Salon",
        mutfak: "Mutfak",
        cocuk: "Çocuk Odası",
        calisma: "Çalışma Odası"
      };
      return map[s] || s;
    }

    /* --- Olaylar --- */
    pieceSel.addEventListener("change", function () {
      state.pieceIndex = parseInt(pieceSel.value, 10) || 0;
      fillDims();
      refreshUnit();
    });
    [wIn, hIn, dIn, matSel, finSel, qtyIn].forEach(function (el) {
      el.addEventListener("input", refreshUnit);
      el.addEventListener("change", refreshUnit);
    });
    root.querySelectorAll(".cfg-extras input").forEach(function (c) {
      c.addEventListener("change", refreshUnit);
    });
    root.querySelectorAll(".cfg-swatch").forEach(function (sw) {
      sw.addEventListener("click", function () {
        root.querySelectorAll(".cfg-swatch").forEach(function (s) {
          s.classList.remove("selected");
        });
        sw.classList.add("selected");
        state.color = sw.getAttribute("data-color");
        refreshPreview();
      });
    });
    addBtn.addEventListener("click", addItem);

    /* --- İlk durum --- */
    fillDims();
    refreshUnit();
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-room]").forEach(init);
  });
})();
