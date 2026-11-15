# SealForge ürün sitesi

Build adımı, framework veya backend gerektirmeyen statik site.

- `index.html`: kısa ürün tanıtımı, gerçek uygulama görüntüsü, akış ve başlangıç.
- `details.html`: mimari, güvenlik sınırları, API, host gereksinimleri ve kanıt görselleri.
- `brand.html`: logo galerisi, format bazlı indirme ve e-posta imzası.
- `assets/brand/`: uygulamayla aynı kaynaktan gelen hazır SVG, PNG, PDF, ICO ve HTML dosyaları.
- `assets/downloads/sealforge-brand-kit.zip`: kullanım kılavuzu ve font lisansı dahil marka paketi.
- `assets/fonts/`: yerelde sunulan Inter Latin variable fontu ve SIL OFL lisansı.
- `tests/site.test.cjs`: Playwright ile responsive, tema, bağlantı ve asset kontrolleri.

## Yerelde açma

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

Tarayıcıda `http://127.0.0.1:4173/` adresini aç. Site dosyaları doğrudan da
açılabilir; HTTP sunucusu, font ve sayfalar arası tema saklama davranışını daha
sadık test eder. E-posta imzasındaki logo kalıcı public HTTPS adresini kullanır.

## Marka kaynağı

Kanonik kaynak **SealForge uygulama deposundaki** `tools/branding/mark.py` ve
aynı klasördeki lisanslı Inter fontudur. `SealForge/branding/` bütün hazır
çıktıları ve kullanım kılavuzunu içerir. Site kopyalarını elle değiştirme:

```bash
# SealForge deposunda; yalnız geliştirici tooling'i
python -m pip install -r tools/branding/requirements.txt
python tools/branding/mark.py --site ../sealforge-site
python tools/branding/test_branding.py
```

Uygulama yalnız commit edilmiş statik dosyaları sunar. Logo çizimi runtime'da
yapılmaz. Logolar path'e çevrilmiştir; tüketen uygulamada font kurulumu gerekmez.
Site kendi Inter WOFF2 dosyasını sunar, üçüncü taraf font servisine bağlanmaz.

## Tema ve dil

Varsayılan koyu tema korunur. `localStorage['sealforge.theme']`, stylesheet
boyanmadan önce okunur; düğme, logo sürümü ve tarayıcı tema rengi birlikte
geçiş yapar. Açık/koyu seçim sayfalar arasında ve yenilemede korunur.
Mobilde navigasyon gizlenmez: başlığın ikinci satırındadır.

Dil şimdilik yalnız İngilizce. `data-i18n` metinleri kaynak HTML'de kalır;
`assets/js/site.js` eksik/bilinmeyen dil için bu içeriğe döner. `#lang-select`
bağlıdır ama `hidden`, `aria-hidden` ve `tabindex=-1` ile görünmezdir. İkinci
bir dil eklerken çeviri sözlüğünü tamamlayıp seçiciyi bilinçli olarak görünür yap.
Marka adı, dosya formatları, alt metinler ve meta veriler dil seçimiyle değişmez.

## Kurulum ve repo görünürlüğü

Ürün deposu private; public ziyaretçi için GitHub kurulum/release bağlantısı
404 döner. Bu yüzden ana sayfada başarısız bir curl komutu veya çalışmayan
"Download" butonu yok. Beta erişimi gereksinimi adımlardan önce açıkça yazılıdır.
Teknik rehberde private GitHub bağlantısı yalnız beta kullanıcıları için etiketli
bir disclosure içindedir. Repo görünürlüğünü bu siteyi yayınlamak için değiştirme.
Sabit sürüm rozeti yok; başlangıç metni erişilebilen **latest release**'i önerir.

## Görseller ve doğruluk

Üç WebP, aynı gerçek SealForge demo örneğinde SoftHSM ile yapılan imzalama,
zaman damgası ve doğrulama akışından gelir. Hero yalnız aktivite alanını gösteren
bir kırpımdır; arayüz çizilmedi ve iş sonuçları üretilmedi. Bu görüntüler fiziksel
token/HSM sertifikasyonu veya üretim trafiği kanıtı değildir.

E-posta imzası PNG + tablo + inline stil kullanır; kişisel isim, adres veya rol
uydurmaz. Gerçek Outlook/Gmail gönderimi ve istemcilerin dark-mode dönüşümleri
ayrı kontroldür. Uzaktaki görseller kapalıysa alt metin ve düz bağlantı kalır.

## Tarayıcı doğrulaması

Mevcut bir Playwright kurulumu ve Chromium kullanılır; bunlar site runtime
bağımlılığı değildir. Test 320/390/768/1440 px, iki tema ve üç sayfayı dolaşır:

```bash
# Playwright ortamının node_modules dizini NODE_PATH ile sağlanabilir.
NODE_PATH=/path/to/playwright/node_modules \
CHROMIUM_PATH=/path/to/chrome \
SITE_EVIDENCE=/path/to/output \
node tests/site.test.cjs

# Yayındaki aynı dosyalar için
SITE_URL=https://semihkiroglu.github.io/sealforge-site/ \
NODE_PATH=/path/to/playwright/node_modules \
CHROMIUM_PATH=/path/to/chrome \
SITE_EVIDENCE=/path/to/live-output \
node tests/site.test.cjs
```

Yerel imza önizlemesinde final HTTPS logo adresi aynı gerçek yerel PNG'ye
map edilir; canlı testte yönlendirme yoktur. Diğer kontroller: görseller ve
indirme URL'leri, yatay taşma, tek H1, anchor'lar, kontrast, görünür mobil
navigasyon, JS hataları, tema kalıcılığı, gizli İngilizce seçici ve JS'siz içerik.

## Yayın ve alan adı

GitHub Pages `main` dalının kökünden yayınlar. Push sonrası exact-head Pages
çalışmasını ve HTTPS'ten gelen gerçek dosyaları kontrol et. Özel domain henüz
bağlı değil; bağlanırsa `CNAME`, canonical/OG/Twitter URL'leri ve marka
üreticisindeki e-posta imza URL'si birlikte güncellenmelidir.
