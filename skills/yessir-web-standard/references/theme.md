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
