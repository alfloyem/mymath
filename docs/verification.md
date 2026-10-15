# 16 Ekim 2026 kontrolü

## Yapılan düzeltmeler

- Güvenlik penceresinde açık kişi başlığı, kısa Keçid etiketi ve input içinde kopyalama ikonu. Öğrenci davetinden girişte hesap otomatik seçilir; dahili ID göstermek gerekmez.
- Tema penceresi dışarı pointer/focus olaylarını capture aşamasında dinler. Sidebar ikon hizası ve aktif menü/tema göstergelerinin kayma geçişleri düzeltildi. Reduced-motion korunur.
- 30 saniyelik sorgu tüm panoyu değil yalnız bekleyen şifre taleplerini alır. Gizli sekmede çalışmaz; aynı anda başlayan sorgular tek istekte birleşir. Öğrenci filtresinde eski yükleme iptal edilir.
- Pano sınav listesine cevap anahtarı ve konu JSON'u yerine yalnız soru sayısı gönderilir. Oturum sorgusunda şifre özetleri okunmaz. Öğrenci/grup, davet/öğrenci ve sonuç/öğrenci sorguları için indeks migration'ı eklendi.
- JSON gövdesi akış sırasında 256 KB ile sınırlanır; chunked isteklerde de geçerlidir. Bozuk JSON 400, boyut aşımı 413, JSON dışı gövde 415 döner.

## Kanıt ve sınırlar

- 16 birim testi: değerlendirme, çeviri anahtarları/yer tutucular, origin, tablo sıralaması, tema kontrastı, parçalı JSON/boyut sınırı.
- Tip kontrolü başarılı. HTTP üzerinden admin girişi, yetkisiz istek 401, yabancı origin 403, bozuk JSON 400, chunked gövde 413, hafif pano/bildirim yanıtları ve ID göstermeyen öğrenci giriş ekranı kontrol edildi.
- Tarayıcı kullanılmadı. Dışarı tıklama, görsel hizalama ve hareketler gerçek tarayıcıda gözle doğrulanmadı; kod düzeyinde düzeltildi.
- Grup/sınav listeleri ilk pano yüklemesinde, öğrenci listesi seçilen grup açılırken alınır. Sayfalama şu an istemcidedir; bütün listeler sunucu tarafında sayfalanmış değildir. Büyük veri/hacim/yük testi yapılmadı.
- Giriş sınırlandırması tek süreç belleğinde. Çok sunuculu üretimde ortak depoya taşınması gerekir. Üretim HTTPS, DB yetkileri/yedekleri bu kontrolde doğrulanmadı.
- Güncel pnpm taraması iki yüksek önem bulgusu bildiriyor: `braces@3.0.3` ([GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)) ve `node-forge@1.4.0` ([GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv)). Registry'de en yeni yayımlanmış sürümler kontrol sırasında hâlâ bunlardı; önerilen 3.0.4 / 1.4.1 henüz yayımlanmış değildi. Dolaylı Nuxt/Nitro bağımlılıklarıdır. Güvenlik riski yoktur iddiası yapılmaz.
