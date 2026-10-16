# MyMath

Grup ve öğrenci yönetimi, yönetici onaylı şifre akışı ve aylık matematik sınavları için bağımsız Nuxt uygulaması. YesSirPOS'tan uygulama kodu, iş verisi veya erişim bilgisi kopyalanmadı; yalnızca teknoloji ailesi referans alındı.

## Teknoloji

Node.js 24 LTS, Nuxt 4.6.1, Vue 3.5.43, TypeScript 6, Tailwind CSS 4.3.3, Iconify/Lucide, PostgreSQL 18, Prisma 7.10.1 ve Zod. Gerçek kurulum sürümleri `pnpm-lock.yaml` ile sabitlenir. ORM 8 ön sürümüne geçilmedi.

## Bu bilgisayarda

- Uygulama: http://localhost:3000
- Yerel admin bilgileri: `.local/access.txt` (Git dışında).
- Bağımsız PostgreSQL kümesi: `.local/postgres`, yalnız localhost:55432.
- YesSirPOS veritabanına bağlantı kurulmaz.

```powershell
pnpm local:db:start
pnpm dev
```

Node/Nuxt dosya izleyicisi sürücü kökündeki SUBST eşlemesinde hata verebildiğinden komutları projenin gerçek klasöründe çalıştırın. Yerel PostgreSQL bir Windows servisi olarak kurulmadı; bilgisayar yeniden açıldığında yukarıdaki komutla başlatılır.

## Yeni kurulum

1. Node 24.11+ (24 serisi) ve PostgreSQL 18 kurun. Alternatif olarak Docker kullanın.
2. `.env.example` dosyasını `.env` olarak kopyalayın. `DATABASE_URL`, `APP_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` alanlarını doldurun. Admin şifresi en az 12 karakter olmalıdır.
3. Docker kullanıyorsanız `.env` içine `POSTGRES_PASSWORD` ekleyin; URL'deki parola ile eşleştirin. `docker compose up -d database` çalıştırın. Mevcut yerel küme aynı porttaysa önce `pnpm local:db:stop` çalıştırın. Docker ve yerel küme birbirine alternatif.
4. `pnpm install --frozen-lockfile`, `pnpm db:deploy`, `pnpm db:seed` çalıştırın.
5. `pnpm dev` ile açın.

Seed mevcut adminin şifresini değiştirmez ve ikinci admin oluşturmaz. Tek admin kuralı veritabanında da korunur. Kimlik bilgileri, veritabanı dosyaları, derleme çıktıları ve üretilen Prisma istemcisi Git'e girmez.

## Kullanım

- **Gruplarım:** isimle grup oluşturma, yeniden adlandırma, silme ve oklarla sıralama. Dolu gruplar silinemez; önce öğrencileri taşıyın ve sınav kayıtları hakkında karar verin.
- **Öğrenciler:** yalnız isim zorunlu. Soy isim, doğum tarihi, telefon ve şifre isteğe bağlı. Bir grupta isim vererek ekleme, düzenleme, arama ve çoklu seçimle toplu transfer. Transfer geçmiş sınavları korur.
- **Kişisel bağlantı:** öğrencinin kalkan simgeli Təhlükəsizlik penceresinden oluşturulur. Bağlantı 30 gün boyunca yeniden kullanılabilir. Yenisi oluşturulunca önceki iptal edilir. Öğrenci ID'si ve bağlantı kopyalanabilir.
- **Şifreler:** öğrenci bağlantıdan şifre gönderir; bcrypt özeti bekleyen talep olarak kaydedilir. Admin, aynı öğrencinin Təhlükəsizlik penceresinde onaylayana kadar yeni şifreyle giriş yapılamaz. Bekleyen talep kalkan üzerindeki noktayla gösterilir; ayrı onay sayfası yoktur. Mevcut şifre varsa onay süresince geçerli kalır. Reddedilen talep onu değiştirmez. Yeni talep önceki bekleyen talebi geçersiz kılar. Admin formundan doğrudan belirlenen şifre hemen etkinleşir; bekleyen talepleri, bağlantıları ve öğrenci oturumlarını iptal eder.
- **Sınavlar:** grup, ay, başlık, A–E cevap anahtarı ve isteğe bağlı soru başına konu. Sınavı kapatma/yeniden açma. Anahtar mevcut sonuçların anlamını korumak için oluşturulduktan sonra değiştirilmez; hatalı sınav silinip yeniden oluşturulabilir.
- **Profil:** açık sınava cevap girme veya TXT/CSV/JSON cevap dosyası yükleme; doğru/yanlış/boş, yüzde başarı, konu analizi ve ay filtresi. Aynı öğrencinin aynı sınav sonucu güncellenir. CSV burada yalnız şık dizisini ifade eder; başlıklı tablo değildir. Örnek: `A B - D E`. JSON: `{ "answers": ["A", "B", null, "D", "E"] }`.
- **Öğrenci girişi:** öğrenci ID + onaylı şifre ile yalnız kendi sonuçlarını görür.
- **Arayüz:** masaüstünde daralabilen sidebar, mobilde perdeyle açılan menü; ortak tabloda sıralama, sayfalama ve sabit başlık. Grup sırası değişimleri, hover/basış ve modallar animasyonludur; azaltılmış hareket tercihi desteklenir.
- **Görünüm ve dil:** renk şeridi ve renk sıfırlama düğmesi, açık/koyu/sistem modu; Varsayılan dil Azərbaycan dili; English ve Русский seçenekleri de bulunur. Dil ve sidebar tercihi çerezlerde saklanır. Varsayılan ve sıfırlama rengi yeşildir. Yeni öğrenci formunda tarih alanı gösterilmez; önceden kaydedilmiş doğum tarihleri korunur.

Yeni sınavlar JSON’dan A4 soru/cavap PDF’leri ve konum kalıbı üretir. PDF/PNG/JPEG cevap taramaları hizalanıp optik olarak okunur; belirsiz işaretleri öğretmen onaylar. Açık soruların her biri öğretmenden 0–1 puan alır. Başarı = (doğru test sayısı + açık soru puanları) / toplam soru × 100. Yanlışlar doğruları götürmez. Eski sınavların metin/JSON değerlendirmesi korunur. El yazısı OCR’i veya otomatik açık cevap çözümü yoktur. Kurulum, JSON ve sınırlar: [docs/exam-engine.md](docs/exam-engine.md).

## Yapı

- `app/pages`: yönetim, giriş, öğrenci hesabı, kişisel bağlantı.
- `app/components/AppTable.vue`, `AppSidebar.vue`: ortak tablo ve responsive gezinme.
- `i18n/locales`: arayüz sözlükleri; kullanıcı verileri ve API enum değerleri çevrilmez.
- `app/assets/css`: YesSirPOS ile aynı HSL tema değişkenleri ve SF Pro Display yazı tipi. Açık/koyu/sistem modu ve renk seçimi `ThemeControls` içinde; tercihler çerezle saklanır. Sıfırlama özel rengi kaldırır. Yüzeyler, kenarlıklar ve metinler ortak değişkenlerden türetilir; buton yazısı kontrast yeterliyse beyaz kalır.
- `server/api/[...path].ts`: REST isteklerini doğrulayan controller/router.
- `server/utils/security.ts`: oturum, şifre, token ve giriş sınırlandırma.
- `server/services/grading.ts`: bağımsız değerlendirme servisi.
- `prisma/schema.prisma`, `prisma/migrations`: veri modeli ve sürümlü SQL.
- `tests`, `scripts/test-integration.ts`: anlamlı hesaplama ve gerçek HTTP/PostgreSQL testleri.

## Kontroller

```powershell
pnpm test
pnpm typecheck
pnpm test:integration
pnpm build
```

Entegrasyon testi çalışan sunucu + `.env` admin bilgilerini kullanır, kendi TEST-* kayıtlarını oluşturup temizler. `TEST_BASE_URL` ile test hedefi seçilebilir. Test ortamında çalıştırın; giriş deneme sınırları ardışık çok sayıda çalıştırmayı geçici engelleyebilir. Derleme gerçek üretim hizmetine dağıtım anlamına gelmez.

## Üretim

`APP_URL` gerçek HTTPS adresi olmalı; `NODE_ENV=production`, `DATABASE_URL`, `PORT`, `HOST` işletim ortamından verilmelidir. `pnpm db:deploy` ve tek sefer `pnpm db:seed` sonrası `pnpm build`, `pnpm start` kullanılır. Başlatıcı Nitro'nun modüller yüklenmeden önce gerçek dosya URL'sini görmesini sağlar; Windows'ta Prisma'nın `file:///_entry.js` hatasını önler. `.env` geliştirme/CLI içindir; üretim Node sunucusu ortam değişkenlerini servis yöneticisinden almalıdır. HTTPS reverse proxy, PostgreSQL yedeği ve kısıtlı uygulama DB rolü kurulmalıdır.

Oturumlar HttpOnly/SameSite=Lax çerezlerinde, SHA-256 token özetiyle DB'de tutulur; üretimde Secure çerezi kullanılır. Şifre onayları, transfer, sonuç kaydı ve silmeler denetim kaydı bırakır. Şifre taleplerinde öğrenci satırı kilidi ve tek bekleyen talep indeksi eşzamanlı işlemleri korur. Bu ilk sürümde giriş sınırlandırma tek süreç belleğindedir; çok sunuculu dağıtımda paylaşımlı Redis benzeri depoya geçirilmelidir. Denetim günlüğü/sona eren oturumlar için saklama ve temizleme süresi üretim ihtiyacına göre belirlenmelidir.

16 Ekim 2026 bağımlılık taramasında `braces@3.0.3` ve `node-forge@1.4.0` için henüz yayımlanmış düzeltme bulunmadı. İlk `npm audit` taraması bağımlılık zinciriyle birlikte 11 yüksek önem kaydı bildirdi. Prisma'nın düzeltme sürümü 7.10.1 uygulandı. Kalanlar Nuxt/Nitro'nun dosya eşleme ve geliştirme HTTPS yardımcılarına bağlıdır; bu durum güvenlik açısından üretime hazır olduğumuz iddiası değildir. Üretim öncesi güncel tarama ve üst paket düzeltmeleri tekrar kontrol edilmelidir. Kaynaklar: https://github.com/advisories/GHSA-vfj7-8cjw-p6xm ve https://github.com/advisories/GHSA-86w9-cpqp-85rv.

Güncel arayüz, veri yükleme ve güvenlik kontrolünün kapsamı/sınırları: [docs/verification.md](docs/verification.md).

## SPA ve veri önbelleği

Nuxt ilk sayfayı sunucuda oluşturur; sonraki gezinme istemcide gerçekleşir. Yönetim bölümleri ilk açılışta kurulur ve tekrar ziyaretlerde filtre, sıralama ve sayfa durumunu korur. Öğrenci listeleri/profiller 5 dakika, şifre bildirimleri 15 saniye süreyle yalnız oturum belleğinde tutulur (en fazla 32 kaynak). Aynı kaynağın eşzamanlı istekleri birleştirilir; kayıt değişiklikleri ilgili önbelleği geçersizleştirir. Başlıktaki yenileme düğmesi güncel bölümü yeniden sorgular. Çıkışta önbellek temizlenir; kişisel veriler disk önbelleğine yazılmaz. PWA/offline desteği eklenmemiştir. Listelerin sayfalaması halen istemcidedir.

Yönetim rotaları Nuxt `pages/[section].vue` üzerinden `/groups`, `/students` ve `/exams` yollarını kullanır. Ortak page key görünümü korur; grup kapsamı `/students?group=...` ile paylaşılabilir. `/` gruplara yönlenir. Giriş `/login`, öğrenci hesabı `/account`, kişisel davet `/invite/:token` yolundadır; eski Türkçe yollar yönlendirilir.

Giriş yalnız kullanıcı adı ve şifre alır; rol sunucuda belirlenir. Öğrenci kullanıcı adı ayrı ve benzersizdir. Öğrenci formunda boş bırakılırsa otomatik üretilir; güvenlik penceresi ve kişisel davette gösterilir. Kullanıcı adı değişikliği mevcut öğrenci ID'sini, sınavlarını veya şifresini değiştirmez. Mevcut öğrencilerin kullanıcı adları migration ile doldurulur. Rota/giriş HTTP kontrolü: çalışan yerel sunucuda `pnpm exec tsx scripts/test-routing-auth.ts` (yalnız kendi geçici kayıtlarını oluşturur/temizler).

JSON hazırlamak için yeni sınav penceresindeki ChatGPT/Gemini/Claude kısayolları kullanılabilir. Hazır kılavuz kopyalanır; sonuç JSON olarak forma yapıştırılır. [AI akışı ve public kılavuz](docs/ai-assist.md).
