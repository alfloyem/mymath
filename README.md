# MyMath

Grup ve öğrenci yönetimi, yönetici onaylı şifre akışı ve aylık matematik sınavları için bağımsız Nuxt uygulaması. YesSirPOS'tan uygulama kodu, iş verisi veya erişim bilgisi kopyalanmadı; yalnızca teknoloji ailesi referans alındı.

## Teknoloji

Node.js 24 LTS, Nuxt 4.6.1, Vue 3.5.43, TypeScript 6, Tailwind CSS 4.3.3, Iconify/Lucide, PostgreSQL 18, Prisma 7.10.1 ve Zod. Gerçek kurulum sürümleri `package-lock.json` ile sabitlenir. ORM 8 ön sürümüne geçilmedi.

## Bu bilgisayarda

- Uygulama: http://localhost:3100
- Yerel admin bilgileri: `.local/access.txt` (Git dışında).
- Bağımsız PostgreSQL kümesi: `.local/postgres`, yalnız localhost:55432.
- YesSirPOS veritabanına bağlantı kurulmaz.

```powershell
npm run local:db:start
npm run dev
```

Node/Nuxt dosya izleyicisi sürücü kökündeki SUBST eşlemesinde hata verebildiğinden komutları projenin gerçek klasöründe çalıştırın. Yerel PostgreSQL bir Windows servisi olarak kurulmadı; bilgisayar yeniden açıldığında yukarıdaki komutla başlatılır.

## Yeni kurulum

1. Node 24.11+ (24 serisi) ve PostgreSQL 18 kurun. Alternatif olarak Docker kullanın.
2. `.env.example` dosyasını `.env` olarak kopyalayın. `DATABASE_URL`, `APP_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` alanlarını doldurun. Admin şifresi en az 12 karakter olmalıdır.
3. Docker kullanıyorsanız `.env` içine `POSTGRES_PASSWORD` ekleyin; URL'deki parola ile eşleştirin. `docker compose up -d database` çalıştırın. Mevcut yerel küme aynı porttaysa önce `npm run local:db:stop` çalıştırın. Docker ve yerel küme birbirine alternatif.
4. `npm ci`, `npm run db:deploy`, `npm run db:seed` çalıştırın.
5. `npm run dev` ile açın.

Seed mevcut adminin şifresini değiştirmez ve ikinci admin oluşturmaz. Tek admin kuralı veritabanında da korunur. Kimlik bilgileri, veritabanı dosyaları, derleme çıktıları ve üretilen Prisma istemcisi Git'e girmez.

## Kullanım

- **Gruplarım:** isimle grup oluşturma, yeniden adlandırma, silme ve oklarla sıralama. Dolu gruplar silinemez; önce öğrencileri taşıyın ve sınav kayıtları hakkında karar verin.
- **Öğrenciler:** yalnız isim zorunlu. Soy isim, doğum tarihi, telefon ve şifre isteğe bağlı. Bir grupta isim vererek ekleme, düzenleme, arama ve çoklu seçimle toplu transfer. Transfer geçmiş sınavları korur.
- **Kişisel bağlantı:** satırdaki bağlantı simgesinden veya profilden oluşturulur. Bağlantı 30 gün boyunca yeniden kullanılabilir. Yenisi oluşturulunca önceki iptal edilir. Öğrenci ID'si ve bağlantı kopyalanabilir.
- **Şifreler:** öğrenci bağlantıdan şifre gönderir; bcrypt özeti bekleyen talep olarak kaydedilir. Admin onaylayana kadar yeni şifreyle giriş yapılamaz. Mevcut şifre varsa onay süresince geçerli kalır. Reddedilen talep onu değiştirmez. Yeni talep önceki bekleyen talebi geçersiz kılar. Admin formundan doğrudan belirlenen şifre hemen etkinleşir; bekleyen talepleri, bağlantıları ve öğrenci oturumlarını iptal eder.
- **Sınavlar:** grup, ay, başlık, A–E cevap anahtarı ve isteğe bağlı soru başına konu. Sınavı kapatma/yeniden açma. Anahtar mevcut sonuçların anlamını korumak için oluşturulduktan sonra değiştirilmez; hatalı sınav silinip yeniden oluşturulabilir.
- **Profil:** açık sınava cevap girme veya TXT/CSV/JSON cevap dosyası yükleme; doğru/yanlış/boş, yüzde başarı, konu analizi ve ay filtresi. Aynı öğrencinin aynı sınav sonucu güncellenir. CSV burada yalnız şık dizisini ifade eder; başlıklı tablo değildir. Örnek: `A B - D E`. JSON: `{ "answers": ["A", "B", null, "D", "E"] }`.
- **Öğrenci girişi:** öğrenci ID + onaylı şifre ile yalnız kendi sonuçlarını görür.

Başarı = doğru / toplam soru × 100. Yanlışlar doğruları götürmez. Bu ilk sürümde PDF/görselden soru çözme, OCR, açık uçlu cevap değerlendirme ve sembolik matematik motoru yoktur. Dosya yüklemesi cevap verilerini okur; orijinal dosya içeriği saklanmaz, sonuçla birlikte dosya adı saklanır. İkinci aşama motoru `server/services` altına eklenebilir; veri modeli ve arayüz temel akışları hazırdır.

## Yapı

- `app/pages`: yönetim, giriş, öğrenci hesabı, kişisel bağlantı.
- `app/assets/css`: responsive ortak tasarım.
- `server/api/[...path].ts`: REST isteklerini doğrulayan controller/router.
- `server/utils/security.ts`: oturum, şifre, token ve giriş sınırlandırma.
- `server/services/grading.ts`: bağımsız değerlendirme servisi.
- `prisma/schema.prisma`, `prisma/migrations`: veri modeli ve sürümlü SQL.
- `tests`, `scripts/test-integration.ts`: anlamlı hesaplama ve gerçek HTTP/PostgreSQL testleri.

## Kontroller

```powershell
npm test
npm run typecheck
npm run test:integration
npm run build
```

Entegrasyon testi çalışan sunucu + `.env` admin bilgilerini kullanır, kendi TEST-* kayıtlarını oluşturup temizler. `TEST_BASE_URL` ile test hedefi seçilebilir. Test ortamında çalıştırın; giriş deneme sınırları ardışık çok sayıda çalıştırmayı geçici engelleyebilir. Derleme gerçek üretim hizmetine dağıtım anlamına gelmez.

## Üretim

`APP_URL` gerçek HTTPS adresi olmalı; `NODE_ENV=production`, `DATABASE_URL`, `PORT`, `HOST` işletim ortamından verilmelidir. `npm run db:deploy` ve tek sefer `npm run db:seed` sonrası `npm run build`, `npm start` kullanılır. `.env` geliştirme/CLI içindir; üretim Node sunucusu ortam değişkenlerini servis yöneticisinden almalıdır. HTTPS reverse proxy, PostgreSQL yedeği ve kısıtlı uygulama DB rolü kurulmalıdır.

Oturumlar HttpOnly/SameSite=Lax çerezlerinde, SHA-256 token özetiyle DB'de tutulur; üretimde Secure çerezi kullanılır. Şifre onayları, transfer, sonuç kaydı ve silmeler denetim kaydı bırakır. Şifre taleplerinde öğrenci satırı kilidi ve tek bekleyen talep indeksi eşzamanlı işlemleri korur. Bu ilk sürümde giriş sınırlandırma tek süreç belleğindedir; çok sunuculu dağıtımda paylaşımlı Redis benzeri depoya geçirilmelidir. Denetim günlüğü/sona eren oturumlar için saklama ve temizleme süresi üretim ihtiyacına göre belirlenmelidir.

16 Ekim 2026 bağımlılık taramasında `braces@3.0.3` ve `node-forge@1.4.0` için henüz yayımlanmış düzeltme bulunmadı. `npm audit` bağımlılık zinciriyle birlikte 11 yüksek önem kaydı bildiriyor. Prisma'nın düzeltme sürümü 7.10.1 uygulandı. Kalanlar Nuxt/Nitro'nun dosya eşleme ve geliştirme HTTPS yardımcılarına bağlıdır; bu durum güvenlik açısından üretime hazır olduğumuz iddiası değildir. Üretim öncesi güncel tarama ve üst paket düzeltmeleri tekrar kontrol edilmelidir. Kaynaklar: https://github.com/advisories/GHSA-vfj7-8cjw-p6xm ve https://github.com/advisories/GHSA-86w9-cpqp-85rv.
