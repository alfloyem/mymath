# Tema ve tipografi

Tema işi yapılırken kullan. Başka projeye tüm YesSirPOS CSS'ini veya iş mantığını kopyalamak yerine mevcut ortak tasarım değişkenlerine uyum sağla.

## Ortak değişkenler

| Amaç | Değişken |
| --- | --- |
| Ana renk | `--brand-hue`, `--brand-sat`, `--brand-lit`, `--brand-lit-dark` |
| Uygulama / sidebar / kart | `--bg-app`, `--bg-sidebar`, `--card-bg` |
| Form yüzeyi | `--input-bg` |
| Ana / ikincil metin | `--text-app`, `--text-muted` |
| Marka metni ve ikon | `--text-primary`, `--text-secondary` |
| Kenarlık | `--border-app` |
| Marka üzerinde metin | `--text-on-primary-light`, `--text-on-primary-dark`, `--text-on-primary` |
| Ana düğme | `--btn-primary-bg`, `--btn-primary-text`; yoksa ana tema değişkenlerinden türet |

Yeni projede örnek yüzey ilişkileri: açık modda uygulama zemini `hsl(var(--brand-hue), 24%, 94.5%)`, sidebar/kart `hsl(var(--brand-hue), 20%, 98.5%)`; koyu modda sırasıyla `hsl(var(--brand-hue), 14%, 6%)` ve `hsl(var(--brand-hue), 16%, 8.5%)`. Bunlar referans değerlerdir; mevcut projenin tokenları önceliklidir. Varsayılan marka rengi YesSirPOS'ta 255'tir; sıfırlamada bu değeri kaydetmek yerine özel tercihi kaldır.

## Davranış

- Renk ayarı için YesSirPOS görünüm ekranındaki sade düzeni kullan: sürekli gökkuşağı hue şeridi ve yanında mevcut ana renkte küçük yuvarlak sıfırlama düğmesi. Sıfırlama ikonu hover/focus'ta belirir; dokunmatik ekranda görünür kalır. Her renk için ayrı kart veya geniş dekoratif palet ekleme.
- Referans hesap: ana doygunluk %85, açık ana parlaklık %50, koyu ana parlaklık %58. RGB ağırlıklı parlaklık 135'i geçerse açık mod metin doygunluğu %97, metin parlaklığı `max(30, round(50 - (brightness - 120) * .28))`; koyu mod %85/%58 kalır. CSS varsayılanı ile kullanıcı rengi seçildiğindeki hesap farklı olabilir; sıfırlamada inline override'ları sil.

- Renk değişince yalnız düğme değil bütün arayüz tutarlı şekilde değişsin. Açık/koyu mod yüzeylerini aynı hue ailesinden türet.
- Marka rengi üzerinde beyaz metni, kontrast en az 4.5:1 ise koru; yetmiyorsa siyaha geç. Kararı HSL -> RGB -> sRGB bağıl parlaklık üzerinden hesapla. Normal durumlarda beyaz yazıyı gereksiz yere siyaha dönüştürme.
- Açık modda çok parlak hue'lar için marka metni/ikon rengini okunabilir olacak şekilde ayarla. Mevcut `computeBrandColors` ve kontrast yardımcıları varsa onları kullan.
- Tercih kalıcılığında mevcut uygulama düzenini izle. Çalışan sunucu tabanlı kullanıcı ayarları varsa ikinci bir localStorage sistemi ekleme. Yeni SSR projede çerez uygundur; bu bir tüm projeleri çereze taşıma talimatı değildir.
- İlk yüklemede kaydedilen tema doğru uygulansın. Sıfırlama özel tercihi ve inline tema override'larını kaldırıp CSS varsayılanlarına dönsün; varsa bekleyen debounce/RAF kaydını da iptal et.
- Hover, focus, disabled, seçili ve hata durumlarını her iki modda tokenlarla tanımla. Başarılı derleme görsel doğrulamanın yerine geçmez.

## SF Pro Display

Önce uygulamanın mevcut font varlıklarını veya importunu kullan. YesSirPOS şu kaynağı kullanır:

```css
@import url('https://fonts.cdnfonts.com/css/sf-pro-display');
```

Örnek font zinciri:

```css
--font-sans: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

Font ailesini sadece bir bileşene değil ortak tipografi katmanına bağla. Uzak kaynak kullanılıyorsa ağ bağımlılığı vardır; fontun yüklendiğini ölçmeden görsel olarak doğrulandığını söyleme. Dağıtılacak yerel font dosyaları için lisansı varsayma.
