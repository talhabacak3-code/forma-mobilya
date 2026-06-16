/* ============================================================
   FORMA MOBİLYA — FİYAT & MOBİLYA AYARLARI
   ------------------------------------------------------------
   Bu dosya, "Odanı Tasarla" sistemindeki tüm fiyatları ve
   mobilya ölçülerini içerir. Kod bilmene gerek yok:
   sadece "price" (fiyat) ve ölçü sayılarını değiştir, kaydet.

   • Fiyatlar Türk Lirası (₺) cinsindendir.
   • Malzeme ve yüzey fiyatları METREKARE (m²) başınadır.
   • Ekstra fiyatları ürün başına SABİT tutardır.
   • Ölçüler santimetre (cm): w = en, h = yükseklik, d = derinlik.

   Yeni bir malzeme/mobilya eklemek için satırı kopyalayıp
   araya yapıştırman yeterli. Virgülleri silme!
   ============================================================ */

window.FORMA_FIYATLAR = {
  /* --- Gövde malzemeleri (₺/m²) --- */
  malzemeler: [
    { id: "suntalam", name: "Suntalam (Melamin Yonga Levha)", price: 450 },
    { id: "mdf",      name: "MDF (Ham)",                       price: 600 },
    { id: "mdflam",   name: "MDF Lam (Laminize)",              price: 750 },
    { id: "cam",      name: "Masif Çam",                       price: 1400 },
    { id: "mese",     name: "Masif Meşe",                      price: 2400 }
  ],

  /* --- Yüzey / Boya (₺/m², gövdeye eklenir) --- */
  yuzeyler: [
    { id: "melamin",    name: "Melamin Kaplama (hazır)", price: 0 },
    { id: "pvc",        name: "PVC Membran Kaplama",     price: 400 },
    { id: "matlake",    name: "Mat Lake Boya",           price: 950 },
    { id: "parlaklake", name: "Parlak Lake Boya",        price: 1250 },
    { id: "vernik",     name: "Doğal Vernik",            price: 300 }
  ],

  /* --- Ekstralar (₺, ürün başına sabit) --- */
  ekstralar: [
    { id: "mentese",  name: "Yumuşak Kapanır Menteşe", price: 400 },
    { id: "led",      name: "LED Aydınlatma",          price: 700 },
    { id: "camkapak", name: "Cam Kapak",               price: 950 },
    { id: "kulp",     name: "Gizli Kulp",              price: 250 },
    { id: "kilit",    name: "Kilit Sistemi",           price: 300 }
  ],

  /* --- Renk paleti (fiyatı etkilemez, sadece görsel) --- */
  renkler: [
    { id: "beyaz",    name: "Beyaz",    hex: "#f4f1ec" },
    { id: "krem",     name: "Krem",     hex: "#e7dcc8" },
    { id: "mese",     name: "Meşe",     hex: "#c8a877" },
    { id: "ceviz",    name: "Ceviz",    hex: "#7a5230" },
    { id: "antrasit", name: "Antrasit", hex: "#3b3f44" },
    { id: "adacayi",  name: "Adaçayı",  hex: "#9caa8e" },
    { id: "lacivert", name: "Lacivert", hex: "#34415e" },
    { id: "siyah",    name: "Siyah",    hex: "#1c1c1c" }
  ],

  /* --- Odaya özel mobilya ön ayarları (ölçü: cm) --- */
  mobilyalar: {
    salon: [
      { name: "TV Ünitesi",    w: 180, h: 50,  d: 40 },
      { name: "Kitaplık",      w: 120, h: 200, d: 35 },
      { name: "Orta Sehpa",    w: 110, h: 45,  d: 60 },
      { name: "Konsol",        w: 120, h: 80,  d: 40 },
      { name: "Vitrin Dolabı", w: 100, h: 190, d: 40 }
    ],
    mutfak: [
      { name: "Alt Mutfak Dolabı", w: 100, h: 85,  d: 60 },
      { name: "Üst Mutfak Dolabı", w: 100, h: 70,  d: 35 },
      { name: "Ada Tezgâhı",       w: 120, h: 90,  d: 80 },
      { name: "Kiler Dolabı",      w: 60,  h: 210, d: 60 },
      { name: "Yemek Masası",      w: 160, h: 75,  d: 90 }
    ],
    cocuk: [
      { name: "Gardırop",        w: 120, h: 200, d: 60 },
      { name: "Çalışma Masası",  w: 120, h: 75,  d: 60 },
      { name: "Kitaplık / Raf",  w: 80,  h: 180, d: 30 },
      { name: "Komodin",         w: 45,  h: 55,  d: 40 },
      { name: "Genç Karyola",    w: 100, h: 70,  d: 200 }
    ],
    calisma: [
      { name: "Çalışma Masası",  w: 140, h: 75,  d: 70 },
      { name: "Kitaplık",        w: 100, h: 200, d: 35 },
      { name: "Dosya Dolabı",    w: 45,  h: 110, d: 50 },
      { name: "Raf Sistemi",     w: 120, h: 30,  d: 25 },
      { name: "Toplantı Masası", w: 180, h: 75,  d: 90 }
    ]
  }
};
