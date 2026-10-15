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
- YesSirPOS gibi sidebar'ın kendi sayısal genişliğini 300 ms boyunca geçir; içerik flex ile birlikte daralsın. İkon rayının yatay konumu ve alt düğmelerin düzeni sabit kalsın. Metni `display:none` ile aniden kaldırma; genişlik/opacity/padding geçişleri kullan. Açılma sırasında `justify-content` veya `flex-direction` değiştirerek sıçrama oluşturma.
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

## Küçük etkileşimlerde sadelik

- Kişinin adı, ilgili pencerede belirgin bir başlık olsun; formun arasında küçük ve bağlamsız bir metin olarak durmasın.
- Salt okunur bağlantının sağındaki tek kopyalama ikonu yeterlidir. Kısa `Keçid` etiketi kullan; ayrı büyük kopyalama butonu, işlem için gerekmeyen ID ve tekrar eden açıklamalar ekleme. Kopyalamada ikon kısa süre onay işaretine dönüşebilir.
- Dahili kimlik değerini kullanıcıya taşımak yerine gerekli akışı otomatik bağla; MyMath öğrenci davetinden girişe geçerken hesabı seçili götürür. ID gizlemek yetkilendirme değildir; sunucu kontrolü korunur.
- Tema ayarında renk sıfırlama ve tüm ayarları sıfırlama gibi belirsiz, tekrarlayan kontroller oluşturma. Düğmenin neyi sıfırladığı erişilebilir adından açık olsun.
- Popover tetikleyiciye tekrar basmadan, dışarı tıklamayla ve Escape ile kapanmalı. Üst bileşen olay yayılımını durdurabiliyorsa dışarı tıklamayı capture aşamasında yakala. Dışarı tıklamada odağı zorla tetikleyiciye geri taşıma; Escape ile kapatmada geri döndürülebilir.
- Dar sidebar'da gizli yazıların flex gap/padding'i ikonları kaydırmasın. Aktif menü ve tema modu göstergeleri konum değişimini yumuşakça animasyonlasın; reduced-motion korunmalı.

## Veri ve doğrulama sınırları

- Küçük bir bildirim için bütün panoyu periyodik çekme. Yalnız gerekli veriyi sorgula; gizli sekmede durdur, eşzamanlı aynı sorguları birleştir. Hızlı filtre değişiminde eski istek yeni görünümü ezmesin; iptal veya sıra kontrolü kullan.
- İstemci tarafı sayfalama, sunucudan kademeli yükleme değildir. Gerçek veri yükleme davranışını açıkça belirt; büyük veri/yük testi yapılmadıysa ölçek garantisi verme. Liste cevabına kullanılmayan ağır JSON veya gizli alanlar koyma.
- JSON boyutunu yalnız Content-Length'e veya parse sonrası uzunluğa göre sınırlama; akış sırasında da belleği sınırla. Yetki, origin/CSRF ve durum geçişlerini gerçek HTTP/veritabanı kontrolleriyle doğrula.
- Güncel bağımlılık taramasındaki açık bulguları saklama. Başarılı test/derleme, sıfır güvenlik sorunu veya tarayıcıda görsel doğrulama iddiası değildir.

## SPA ve önbellek

- Nuxt istemci router/NuxtLink ile gezin; normal bölüm geçişinde tam sayfa yenileme yapma. İlk HTML'in SSR gelmesi SPA gezinmesini engellemez. Sırf cache isteniyor diye SSR'yi veya auth kontrolünü kapatma; PWA/service worker'ı ayrıca istenmeden ekleme.
- Bölümü ilk ziyaretinde oluştur; ziyaret edilmiş bölümleri tekrar kurmadan gizle/göster. Filtre, seçim, kaydırma/sayfalama gibi durumu bölüm bazında koru. Cache kullanırken tüm gizli bölümleri başlangıçta ağır verileriyle yükleme.
- Veri cache'i ile DOM/görünüm korunmasını ayrı ele al. Aynı anahtardaki eşzamanlı istekler birleşsin; başarılı ve süresi geçmemiş veri tekrar kullanılsın. Süre/kapasite sınırı açık olsun; MyMath'te liste/profil 5 dakika ve en çok 32 kaynak, bildirim 15 saniye kullanılır.
- Ekleme/düzenleme/silme/transfer/sonuç/onay sonrası ilgili liste, profil ve sayacı güncelle veya geçersizleştir; ilgisiz kaynakları sebepsiz yenileme. Kullanıcıya küçük bir manuel yenileme kontrolü ver.
- Eski/iptal edilmiş yanıt yeni veriyi ezmesin. Cache temizleme devam eden isteği de geçersizleştirsin; hata yanıtları cache'e alınmasın. Hızlı farklı filtrelerde gereksiz eski isteği iptal et; aynı isteği yeniden başlatma.
- Kişisel veriyi localStorage, Cache Storage, paylaşımlı sunucu cache'i veya service worker'a otomatik yazma. Çıkışta/oturum geçersizliğinde ilgili bellek ve Nuxt payload verisini temizle. Gizli sayfa ve API yanıtlarının `no-store` politikası, uygulama içi oturum belleği cache'inden ayrıdır.
- Kimlik doğrulama, şifre ve izin/onay mutasyonlarını cache'leme; statik hash'li JS/CSS/font varlıklarının cache'ini bunlardan ayır. Gerçekte uygulanmayan çevrimdışı destek veya sunucu sayfalaması iddiasında bulunma.
