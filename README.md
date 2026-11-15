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
assets/img/screenshots/    # 3 gerçek SealForge UI görüntüsü (WebP)
```

## Yerelde açma

`index.html` dosyasını tarayıcıda açmak yeterli; herhangi bir sunucu gerekmez.

## Yayın

GitHub Pages, `main` dalının kök dizininden yayınlar. Her push sonrası Pages
workflow'u birkaç dakika içinde güncellenir.

## Görseller

Üç görüntü, aynı yerel SealForge örneğinden alındı (SoftHSM token, yapay
`Northwind.*` artifact'ları, gerçek imzalama + zaman damgası + zincir
doğrulaması):

| Dosya | Ne gösteriyor |
|-------|----------------|
| `dashboard.webp` | Genel durum: iş sayacıları, sistem özeti, algılanan token |
| `signing-result.webp` | Tamamlanmış iş: `ReadyForDownload`, doğrulama sonrası teslim |
| `token-state.webp` | Token detayı: sertifika, PIN durumu, worker'ın gördüğü operasyonel durum |

Tarayıcı 1920×1200, DPR 2 ile çekildi; WebP'ye 1200–1920 px genişlikte
küçültüldü. Demo örneğinde kişisel veri yok (operatör adı `Operations`).

## Marka

Logo işareti: düz tepeli altıgen (somun/seal) içinde onay işareti.
`mark.svg` ve `favicon.svg` uygulama deposundaki üreticiden
(`SealForge/tools/branding/mark.py`) kopyadır — geometri orada tanımlı,
orada değiştirilir; bu depodaki dosyalar elle düzenlenmez.

## Özel alan adı

Alan adı bağlandığında depo köküne `CNAME` dosyası eklenir ve DNS'te
`A`/`CNAME` kayıtları GitHub Pages hedefine yönlendirilir. `og:image`,
`og:url` ve `twitter:image` şu an `https://semihkiroglu.github.io/sealforge-site/`
adresini gösterir; özel alan adına geçince bu üç değer güncellenmelidir.
