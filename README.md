# sealforge-site

SealForge ürün sitesi. Tek sayfa, statik HTML + CSS; build adımı ve harici bağımlılık yok.

## Yapı

```
index.html                 # sayfanın tamamı
assets/css/style.css       # tema (uygulamanın indigo token'larıyla uyumlu)
assets/img/mark.svg        # logo işareti (currentColor)
assets/img/favicon.svg     # favicon (koyu zemin, indigo işaret)
assets/img/favicon-32.png  # 32 px PNG favicon
assets/img/apple-touch-icon.png
assets/img/icon-512.png    # uygulama/mağaza ikonu
assets/img/og.png          # 1200×630 sosyal kart
assets/img/screenshots/    # gerçek SealForge UI görüntüleri (WebP)
```

## Yerelde açma

`index.html` dosyasını tarayıcıda açmak yeterli; herhangi bir sunucu gerekmez.

## Yayın

GitHub Pages, `main` dalının kök dizininden yayınlar. Her push sonrası Pages
workflow'u birkaç dakika içinde güncellenir.

## Görseller

Ekran görüntüleri yerel bir SealForge örneğinden alındı: SoftHSM token,
`Northwind.*` adlı dört yapay artifact, gerçek imzalama + zaman damgası +
doğrulama akışı. Tarayıcı 1920×1200, DPR 2 (3840×2400) ile çekildi,
WebP'ye 1600–1920 px genişlikte küçültüldü.

## Marka

Logo işareti: düz tepeli altıgen (somun/seal) içinde onay işareti. Renk
uygulamadaki `--sf-accent` (#4f46e5) ailesinin açık zemin varyantı (#8b7dff).

## Özel alan adı

Alan adı bağlandığında depo köküne `CNAME` dosyası eklenir ve DNS'te
`A`/`CNAME` kayıtları GitHub Pages hedefine yönlendirilir. `og:image`,
`og:url` ve `twitter:image` şu an `https://semihkiroglu.github.io/sealforge-site/`
adresini gösterir; özel alan adına geçince bu üç değer güncellenmelidir.
