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
      // Sol: fotoğraf sahnesi
      '<div class="cfg-stage">' +
      '<div class="cfg-photo" data-drop>' +
      '<input type="file" accept="image/*" hidden data-file>' +
      '<div class="cfg-photo-empty">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 16V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10"/><path d="m3 16 5-5 4 4 3-3 6 6"/><circle cx="9" cy="9" r="1.5"/></svg>' +
      "<strong>Odanın fotoğrafını yükle</strong>" +
      "Sürükle bırak ya da tıklayarak seç (JPG / PNG)</div>" +
      "</div>" +
      '<div class="cfg-photo-actions">' +
      '<button type="button" class="cfg-link" data-change hidden>Fotoğrafı değiştir</button>' +
      '<button type="button" class="cfg-link" data-clear hidden>Kaldır</button>' +
      "</div>" +
      '<p class="cfg-hint">İpucu: Mobilya ekledikçe fotoğraf üzerinde numaralı etiketler belirir — sürükleyerek konumlandırabilirsin.</p>' +
      "</div>" +
      // Sağ: panel
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
    }

    /* --- Fotoğraf yükleme --- */
    function setPhoto(file) {
      if (!file || !/^image\//.test(file.type)) return;
      var url = URL.createObjectURL(file);
      photo.style.backgroundImage = 'url("' + url + '")';
      photo.classList.add("has-photo");
      changeBtn.hidden = false;
      clearBtn.hidden = false;
    }

    function clearPhoto() {
      photo.style.backgroundImage = "";
      photo.classList.remove("has-photo");
      fileInput.value = "";
      changeBtn.hidden = true;
      clearBtn.hidden = true;
      // etiketleri koru ya da temizle — koruyoruz; sadece arka plan kalkar
    }

    photo.addEventListener("click", function (e) {
      if (e.target.closest(".cfg-marker")) return;
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

    /* --- Etiket sürükleme --- */
    function makeDraggable(el) {
      var dragging = false, offX = 0, offY = 0;
      el.addEventListener("pointerdown", function (e) {
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

    function addMarker(item) {
      var m = document.createElement("div");
      m.className = "cfg-marker";
      m.dataset.id = item.id;
      m.style.left = 30 + ((cart.length * 18) % 120) + "px";
      m.style.top = 30 + ((cart.length * 22) % 120) + "px";
      m.innerHTML =
        '<span class="num">' + item.no + "</span>" + escapeHtml(item.name);
      photo.appendChild(m);
      makeDraggable(m);
      item.marker = m;
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
          if (it.marker && it.marker.parentNode) it.marker.parentNode.removeChild(it.marker);
          return false;
        }
        return true;
      });
      // numaraları yeniden sırala
      cart.forEach(function (it, i) {
        it.no = i + 1;
        if (it.marker) it.marker.querySelector(".num").textContent = it.no;
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
        total: unit * qty
      };
      cart.push(item);
      if (photo.classList.contains("has-photo")) addMarker(item);
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
