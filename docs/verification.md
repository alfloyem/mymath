# 16 Ekim 2026 kontrolü

## Yapılan düzeltmeler

- Güvenlik penceresinde açık kişi başlığı, kısa Keçid etiketi ve input içinde kopyalama ikonu. Öğrenci davetinden girişte hesap otomatik seçilir; dahili ID göstermek gerekmez.
- Tema penceresi dışarı pointer/focus olaylarını capture aşamasında dinler. Sidebar ikon hizası ve aktif menü/tema göstergelerinin kayma geçişleri düzeltildi. Reduced-motion korunur.
- 30 saniyelik sorgu tüm panoyu değil yalnız bekleyen şifre taleplerini alır. Gizli sekmede çalışmaz; aynı anda başlayan sorgular tek istekte birleşir. Öğrenci filtresinde eski yükleme iptal edilir.
- Pano sınav listesine cevap anahtarı ve konu JSON'u yerine yalnız soru sayısı gönderilir. Oturum sorgusunda şifre özetleri okunmaz. Öğrenci/grup, davet/öğrenci ve sonuç/öğrenci sorguları için indeks migration'ı eklendi.
- JSON gövdesi akış sırasında 256 KB ile sınırlanır; chunked isteklerde de geçerlidir. Bozuk JSON 400, boyut aşımı 413, JSON dışı gövde 415 döner.

## Kanıt ve sınırlar

- Nuxt 4.6.1 dosya tabanlı rotalar: `/groups`, `/students`, `/exams`, `/login`, `/account`, `/invite/:token`. `scripts/test-routing-auth.ts` geliştirme ve yerel üretim sunucusunda başarılı: doğrudan rota/grup query render'ı, eski adres yönlendirmeleri, rol seçimsiz admin/öğrenci girişi, ID ile girişin reddi, otomatik/benzersiz kullanıcı adları, istemci rolünün yetki vermemesi ve öğrenci/admin yetki ayrımı. Kullanıcı adı migration'ı yerel PostgreSQL'e uygulandı. Windows'ta Nitro/Prisma dosya URL'si başlangıç hatası `scripts/start.mjs` ile düzeltildi; üretim sunucusu geçici 3101 portunda, o adrese eşleşen APP_URL ile test edilip kapatıldı. Tarayıcı geri/ileri etkileşimi gözle denenmedi.

- 23 birim testi: değerlendirme, çeviri anahtarları/yer tutucular, origin, tablo sıralaması, tema kontrastı, parçalı JSON/boyut sınırı ve kaynak önbelleği; ayrıca motor JSON doğrulaması, açık soru puanları ve güvenli konu anahtarları. Önbellek testleri ortak istek, süre aşımı, hedefli geçersizleştirme, eski yanıtın engellenmesi, hata sonrası yeniden deneme ve kapasite sınırını kontrol eder. Tip kontrolü ve üretim derlemesi başarılı.
- Tip kontrolü başarılı. HTTP üzerinden admin girişi, yetkisiz istek 401, yabancı origin 403, bozuk JSON 400, chunked gövde 413, hafif pano/bildirim yanıtları ve ID göstermeyen öğrenci giriş ekranı kontrol edildi.
- Tarayıcı kullanılmadı. Dışarı tıklama, görsel hizalama ve hareketler gerçek tarayıcıda gözle doğrulanmadı; kod düzeyinde düzeltildi.
- Grup/sınav listeleri ilk pano yüklemesinde, öğrenci listesi seçilen grup açılırken alınır. Sayfalama şu an istemcidedir; bütün listeler sunucu tarafında sayfalanmış değildir. Büyük veri/hacim/yük testi yapılmadı.
- SPA bölümleri ilk ziyaretlerinde kurulur, sonraki geçişlerde filtre/sıralama/sayfalama durumuyla korunur. Öğrenci listeleri ve profiller oturum belleğinde 5 dakika, bildirimler 15 saniye tutulur; en fazla 32 kaynak saklanır. Eşzamanlı aynı istekler birleşir; değişiklikler ilgili kaynakları geçersizleştirir. Elle yenileme mevcut veriyi yeniden alır. Çıkışta bellek ve Nuxt verileri temizlenir. Kişisel sayfa/API yanıtları kalıcı HTTP önbelleğine alınmaz. Gerçek tarayıcı ağ sayımı yapılmadı.
- Giriş sınırlandırması tek süreç belleğinde. Çok sunuculu üretimde ortak depoya taşınması gerekir. Üretim HTTPS, DB yetkileri/yedekleri bu kontrolde doğrulanmadı.
- Güncel pnpm taraması iki yüksek önem bulgusu bildiriyor: `braces@3.0.3` ([GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)) ve `node-forge@1.4.0` ([GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv)). Registry'de en yeni yayımlanmış sürümler kontrol sırasında hâlâ bunlardı; önerilen 3.0.4 / 1.4.1 henüz yayımlanmış değildi. Dolaylı Nuxt/Nitro bağımlılıklarıdır. Güvenlik riski yoktur iddiası yapılmaz.

## İmtahan mühərriki — 16 Ekim

- Gönderilen iki HTML motoruyla JSON → A4 PDF/soru konumları/cevap kalıbı → doldurulmuş PDF taraması → 0–1 manuel puan → profil sonucunun %50 olması HTTP testiyle kontrol edildi. Geliştirme ve yerel üretim sunucusunda çalıştı; test kayıtları temizlendi. Soru ve cevap PDF sayfaları render edilip görsel olarak incelendi.
- Python/OpenCV kontrolleri: boş, doğru işaret, çift işaret, küçük/silik işaret, hafif perspektif, 90° dönüş, sayfa sırası, eksik sayfa ve yanlış sınav kimliği. Ölçüler PDF MediaBox üzerinden 210 × 297 mm olarak kontrol edildi. Yanıt anahtarı bulunmayan örnekte cevap uydurulmadı; yerleşim testindeki cevaplar yalnız sentetik test verisidir.
- Gerçek cihazla çekim/tarama, gerçek kalem/silgi/kağıt ve toplu sınıf yükü bu kontrolde denenmedi. Doğruluk oranı veya bütün fotoğrafları okuma garantisi verilmez. [Kurulum ve kapsam](exam-engine.md).
