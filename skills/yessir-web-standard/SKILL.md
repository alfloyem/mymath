---
name: yessir-web-standard
description: Apply the user's preferred Nuxt/Vue technology stack, pnpm workflow, SF Pro Display typography, theme system and minimal UI when creating or modifying their web applications. Use for new web projects, admin panels and related frontend work; preserve an existing project's stack unless migration is requested. Not a marketing-page, document or logo-design style guide.
---

# YESSIR Web Standardı

Bu kullanıcının web uygulamalarında tercih ettiği teknoloji ve tasarım standardıdır. Kullanıcının güncel isteği önceliklidir. Bu belgeyi uygulamak mevcut bir projeyi başka teknolojiye taşıma veya kapsam dışı özellik ekleme yetkisi vermez.

## Teknoloji çizelgesi

| Alan | Varsayılan tercih | Uygulama kuralı |
| --- | --- | --- |
| Uygulama | Nuxt, Vue, TypeScript | Yeni benzer projelerde Nuxt 4 / Vue 3 ailesi; mevcut projede kendi manifesti esas. |
| Gezinme | SPA, istemci router | Tam belge yüklemesi yerine istemci geçişleri; bölüm durumunu ve gerekli görünüm örneklerini koru. İlk yanıtın SSR olması bu davranışla uyumludur. |
| Önbellek | Oturum belleğinde sınırlı kaynak cache'i | Tekrarlayan aynı isteği birleştir, geçerli veriyi tekrar kullan, mutasyonda ilgili kaynağı geçersizleştir ve çıkışta temizle. |
| Çalışma ortamı | Node.js LTS | Nuxt ve diğer bağımlılıklarla uyumlu sürümü `engines` içinde belirt. |
| Paket yöneticisi | pnpm | İlk kurulumdan itibaren kullan; `packageManager` alanı ve `pnpm-lock.yaml` ekle. npm/yarn kilit dosyaları oluşturma. |
| Stil | Tailwind CSS | Nuxt ile uyumlu entegrasyonu ve ortak CSS değişkenlerini kullan. |
| İkon | Iconify, `@nuxt/icon` | Uygulamanın mevcut ikon koleksiyonunu kullan; yeni benzer projelerde Lucide uygundur. |
| Veritabanı | PostgreSQL | Yeni uygulamaya bağımsız DB, Prisma modeli ve sürümlü migration kur. |
| Veri erişimi | Prisma | İstemci, adaptör ve CLI sürümlerini uyumlu tut. |
| Sunucu | Nuxt/Nitro sunucu katmanı | API/controller, servis, doğrulama ve DB erişimini sorumluluklarına göre ayır; gereksiz ikinci backend kurma. |
| Ortam ayarları | `.env` ve `.env.example` | Örnek dosyada anahtarlar/yer tutucular; gerçek şifre ve tokenlar Git dışında. |
| Yazı tipi | SF Pro Display | Gerçek font kaynağını bağla; yalnızca adını CSS'e yazıp bırakma. Mevcut YesSirPOS font kaynağı referans alınabilir. |
| Tema | YesSirPOS tema mantığı | Açık/koyu/sistem modu, ortak renk değişkenleri, dinamik kontrast ve gerçek sıfırlama. |
| Dil | `@nuxtjs/i18n` | Görünen arayüz metinleri ve erişilebilirlik etiketleri çeviri anahtarlarından gelsin; veri anahtarları çevrilmesin. |
| Sürüm kontrolü | Git | İşlevsel ve doğrulanmış çalışma parçalarını düzenli commit et. |

Sürüm numaralarını bu belgeden ezbere kopyalama. Mevcut `package.json`, kilit dosyası ve çalışma ortamını kontrol et; yeni projede uyumlu kararlı sürümleri seç. Referans proje bir sürüm kataloğu değildir.

## Minimal tasarım

- Her sayfada işi anlatan tek ana başlık kullan: `Gruplar`, `Öğrenciler`, `Sınavlar` gibi.
- Başlığın üzerine slogan/eyebrow, altına tekrar eden açıklama ekleme. İşlem için gerçekten gerekli kısa yardım ve hata metinleri kalabilir.
- Gereksiz özet/KPI kartları, dekoratif ikon blokları, alıntı/slogan kutuları, pazarlama footer'ları ve iç içe container'lar ekleme.
- Yönetim ekranlarında sade liste/tablo, kısa araç çubuğu ve gereken işlem düğmeleriyle başla. Veri/işlev gerektiriyorsa görselleştirme ekle.
- Aynı bilgiyi başlık, breadcrumb, alt başlık ve kart içinde tekrar etme.
- Mevcut bileşen, modal, arama ve API desenlerini kullan. Aynı iş için paralel bir akış oluşturma.
- Yalnız görsel sadeleştirme istendiğinde mevcut işlevleri koru.
- Tüm yüzeyler, kenarlıklar, metinler, ikonlar ve etkileşim durumları ortak temaya bağlı olsun; sayfa içinde bağımsız sabit bir palet kurma.
- Tema uygularken [references/theme.md](references/theme.md) dosyasını oku. Başka işlerde bu ayrıntıyı yüklemene gerek yok.
- Tablo, sidebar, mobil görünüm, animasyon veya i18n işinde [references/interface.md](references/interface.md) dosyasını oku. Düşük gölge kullanımı, ortak tablo bileşeni ve açılır/kapanır responsive sidebar bu dilin parçalarıdır.
- Gezinme/önbellek işinde [references/interface.md](references/interface.md) içindeki SPA bölümünü uygula. Cache'i PWA, service worker veya kalıcı hassas veri depolamasıyla karıştırma.
- JSON/PDF motoru, tarama/değerlendirme veya dış AI uygulamasına yönlendirme işinde [references/engineering.md](references/engineering.md) içindeki üretim, doğrulama ve sade kullanım kurallarını uygula.

## Çalışma düzeni

1. Başlangıçta Git durumunu, `packageManager`/kilit dosyasını, sürümleri ve mevcut ortak bileşenleri kontrol et. Kullanıcının değişikliklerini kendi işinle karıştırma.
2. Yeni projeyi pnpm ile başlat. `pnpm install`, `pnpm dev`, `pnpm build` ve projenin mevcut komutlarını kullan. Başka yöneticiden pnpm'e geçiş gerekiyorsa bunu açık bir geçiş olarak yap; kilidi içe aktar, kurulumu doğrula, sonra önceki kilidi kaldır. Sıradan bir görev sırasında başka projelerin paket yöneticisini kendiliğinden değiştirme.
3. Tekrarlayan işlerde önce bu skill'de kaydedilen desenleri kullan; her görevde YesSirPOS'u baştan tarama. Kullanıcı yeniden örnek alınmasını isterse, yeni bir davranış gerekiyorsa veya belge güncel kodla çelişirse `C:/Users/Lenov/Videos/yessirpos` içindeki yalnız ilgili manifest/bileşen/yardımcıyı incele. Yeni kabul edilen ortak kuralları skill'e ve kişisel kopyasına işle. Kaynak yoksa bu standardı uygula; incelediğini iddia etme. İş verilerini, ortam şifrelerini veya POS'a özgü iş kurallarını yeni projeye taşıma.
4. Tarayıcıyı varsayılan olarak kullanma. Kullanıcı tarayıcı/gerçek arayüz testi istediğinde kullan; aksi halde terminal, tip kontrolü, uygun testler ve gerekirse HTTP kontrolleriyle ilerle. Bunları görsel doğrulama diye sunma.
5. Değişikliğe uygun kontrolleri çalıştır; sonuçları kısa bildir. Sadece belge/skill değişikliğinde uygulamayı yeniden derleme. Gereksiz tekrar test ve uzun araç çıktılarından kaçın.
6. Kapsama ait diff'i kontrol edip anlamlı bir commit at. Kullanıcının ilgisiz değişikliklerini topluca stage etme. Push/dağıtım yetkisini bu skill'den çıkarma.

## Teslim

Kısa Türkçe yanıt ver: değişen ana noktalar, yapılan doğrulama ve commit. Uygulamadaki metinler gibi raporu da gereksiz açıklama ve sloganlarla uzatma.
