# Forma Mobilya

Mobilya markası için **çok sayfalı tanıtım web sitesi**. Saf HTML, CSS ve JavaScript ile geliştirildi — build aracı veya framework gerektirmez.

## Bölümler
Evin temel bölümleri ayrı sayfalarda tanıtılır:

- **Salon** — `salon.html`
- **Mutfak** — `mutfak.html`
- **Çocuk Odası** — `cocuk-odasi.html`
- **Çalışma Odası** — `calisma-odasi.html`
- **Ana Sayfa** — `index.html`

## Öne Çıkan Özellik: "Odanı Tasarla"
Her oda sayfasında bir konfigüratör bulunur:

- 📷 Oda fotoğrafı yükleme + fotoğraf üzerine sürüklenebilir mobilya etiketleri
- 🪵 Gövde malzemesi seçimi (Suntalam/Melamin, MDF, MDF Lam, Masif Çam/Meşe) — Türkiye m² fiyatlarıyla
- 🎨 Yüzey/Boya (Melamin, PVC membran, Mat/Parlak Lake, Vernik) + renk paleti
- ➕ Ekstralar (LED, cam kapak, yumuşak menteşe, kilit…)
- 📐 Ölçü girişi (en × yükseklik × derinlik) → anlık TL fiyat + teklif listesi

## Proje Yapısı
```
.
├── index.html
├── salon.html
├── mutfak.html
├── cocuk-odasi.html
├── calisma-odasi.html
├── css/
│   ├── style.css           # Ortak tema (CSS değişkenleri)
│   └── configurator.css    # "Odanı Tasarla" stilleri
└── js/
    ├── main.js             # Menü ve animasyonlar
    ├── fiyatlar.js         # Tüm fiyat ve mobilya ayarları (kolay düzenlenebilir)
    └── configurator.js     # Tasarlayıcı motoru
```

## Çalıştırma
Herhangi bir kurulum gerekmez. `index.html` dosyasını tarayıcıda açmanız yeterli.

## Fiyatları Düzenleme
Tüm fiyatlar ve mobilya ölçüleri **`js/fiyatlar.js`** dosyasında toplanmıştır. Kod bilmeden, yalnızca sayıları değiştirip kaydederek güncelleyebilirsiniz.

> Not: Sitedeki fiyatlar tahminidir; malzeme, ölçü ve işçiliğe göre değişebilir.
