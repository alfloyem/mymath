# Ortak arayüz desenleri

Bu tercihler MyMath çalışmasında kullanıcı tarafından istendi ve YesSirPOS kodundan karşılaştırıldı. Yeni görevde yalnız ilgili bölümü uygula; gereksiz özellik/kontrol ekleme.

## Tablolar

- Tek bir ortak tablo bileşeni kullan. Hücre ve işlem slotlarıyla işlevi sayfada tut; aynı tablo altyapısını her sayfada tekrar yazma.
- Tek, hafif kenarlıklı, yaklaşık 12 px köşeli yüzey. Başlık uygulama zemininde ve kaydırmada sabit. Normal satır yaklaşık 52–56 px; kontrol/aksiyonlar satırı gereksiz büyütmesin.
- Metin/sayı sıralaması gereken sütunlarda başlık düğmesi ve yön ikonu. Sıralama döngüsü artan/azalan/orijinal. Kullanıcının elle sıraladığı grupların dizilişi varsayılan kalır.
- Uzun listelerde sayfalama/sayfa boyutu; arama ve filtrelerle sayfa numarası geçerli aralığa çekilsin. Çoklu seçim ve transfer sayfa değişiminden dolayı sessizce kaybolmasın.
- Satır hover/klavye odağı temadan hafif renk alsın. İşlem ikonları masaüstünde hafifçe sönük, hover/focus'ta belirgin olabilir; dokunmatikte görünür ve kullanılabilir kalsın.
- Mobilde tablo kendi alanında yatay kayabilsin; tüm sayfayı taşırmasın. Boş/yükleniyor durumları kısa olsun. Ağır gölge veya her satır için ayrı kart ekleme.

## Sidebar ve mobil

- Masaüstü: yaklaşık 240–256 px tam, 76–80 px ikon modu; açılma/daralma tercihi saklanır. Marka/menü düğmesiyle geçiş; ikon modunda erişilebilir isimler ve tooltip korunur.
- 1024 px altı: üstte kısa menü çubuğu; soldan açılan drawer, arkasında perde. Link seçimi, Escape ve perde tıklaması menüyü kapatır. Mobil drawer, masaüstünde daraltılmış olsa da tam genişlikte açılır.
- Açık drawer arka plan kaymasını engeller, klavye odağını içinde tutar; kapanınca odağı açan düğmeye döndürür. Gizliyken kontroller odaklanamaz.
- Sayfanın içerik alanı `min-width:0` ile daralır; sidebar ve tablo birlikte taşma üretmez. Mobil modal gerektiğinde alttan sheet olarak açılır; içeriği ve güvenli alan boşluğu korunur.

## Hareket

- Hareket yalnız renk anlık değişimi değildir: hover/focus için 180–240 ms; sidebar, modal ve düzen geçişleri için 250–320 ms yumuşak easing kullan.
- Basışta küçük scale, hover'da ölçülü hareket uygundur. Animasyon büyük mesafelerde zıplama, ağır blur veya yoğun gölge gerektirmez.
- Elle satır sıralama değişiminde kimliği sabit satırlarla `TransitionGroup`/FLIP kullan; veriyi başka sırayla basıp geçme. Filtre/sayfa değişimlerinde seçimi koru.
- `prefers-reduced-motion` için animasyon ve geçişleri kapat. Dokunmatikte hover'a bağımlı işlem bırakma.

## i18n

- Nuxt projelerinde mevcut `@nuxtjs/i18n` desenini izle. MyMath varsayılan dili Azərbaycan dili, diğer seçenekleri English ve Русский; başka projede kullanıcının istediği diller esas. Dil seçeneğinin kendi adı "Azərbaycan dili" yazılır; Türkçe kalıpları doğrudan aktarmak yerine doğal Azerbaycan dili kullanılır.
- Butonlar, başlıklar, boş durumlar, hata metinleri, aria-label/title, placeholder ve tablo kontrollerini çevir. Dil tercihini sakla ve HTML `lang` değerini güncelle.
- Kullanıcının grup/öğrenci adı, soru konusu, ID, şifre ve API enum anahtarlarını çevirme. Tarih ve doğal metin sıralamasında aktif locale'i kullan. Backend hatalarını güvenli, anlaşılır çeviri anahtarlarına eşle.
- Sözlük anahtarları ve interpolasyon değişkenleri diller arasında eşleşsin. i18n eklemek için uygulama içeriğini veya iş akışını yeniden tasarlama.

Kaynak noktaları: YesSirPOS `app/components/ui/DataTable.vue`, `app/components/layout/Sidebar.vue`, `app/pages/settings/appearance.vue`, `app/utils/brandTheme.ts`, `nuxt.config.ts`. Bunlar örnek desenlerdir; kaynak projeyi değiştirme yetkisi değildir.

MyMath hesap güvenliği: şifre bağlantısı ve bekleyen şifre onayları öğrencinin kalkan ikonlu tek Təhlükəsizlik penceresinde toplanır; bekleyen talep ikon üzerinde noktayla belirtilir. Bu küçük akış için ayrı bir onay sayfası/menüsü açılmaz.
