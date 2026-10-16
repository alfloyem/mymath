# Motorlar ve yapay zekâya geçiş

MyMath çalışmasından gelen mühendislik tercihleri. Genel web işlerine PDF/OMR veya AI ekleme gereği çıkarma; yalnız ilgili özellik istendiğinde uygula.

## JSON ve belge motorları

- Kullanıcının verdiği motorun gerçek dosya/girdi/çıktı biçimini incele; HTML motorunu XML veya tarayıcıdaki “yazdır” düğmesini otomatik PDF API'si sanma. Kabul edilen tasarımını koru; uygulamaya uyarlamayı ayrı tut.
- Şema ve öğretmen kılavuzu aynı davranışı anlatsın. Doğru cevabı örnekte yoksa uydurma. Açık sorunun henüz verilmemiş puanını sıfır kabul etme. AI çıktısı da sunucuda aynı doğrulamadan geçsin.
- Baskı ve ölçülmüş konum kalıbını aynı render'dan üret; belgeyi, anahtarı, koordinatları ve sürüm izini birlikte sakla. Kaydedilmiş sınavı yeni motor sürümüyle fark ettirmeden yeniden yerleştirme. Gizli cevapları öğrenci PDF'ine yazma.
- Konum/optik okuma tahminine güvenerek sessiz puanlama yapma. Kimlik, sayfa bütünlüğü ve hizalamayı kontrol et; belirsiz/çift işaretler öğretmen incelemesi gerektirsin. Gerçek cihaz kalibrasyonunu sentetik testle eşdeğer sunma.
- Ağır render/tarama sunucuda sınırlı eşzamanlılık, boyut/süre sınırı ve temizlenen geçici dosyalarla çalışsın. Normal liste/profil sorgularına PDF veya görsel baytlarını yükleme. Büyük özellik arayüzlerini ilk kullanımda yükle.

## AI kısayolları

- Öğretmen JSON'u elle öğrenmek zorunda kalmasın: mevcut formda kısa sağlayıcı düğmeleri, kılavuzla konuşmayı başlatma, ardından tek JSON kopyalayıp yapıştırma yeterlidir. İstenen bu akıştan ücretli API entegrasyonu, sohbet ekranı veya hesap bağlantısı çıkarma.
- Mesaj parametrelerini URL-encode et ve uzunluğu sınırla. Uzun kılavuzu versiyonlanan açık Markdown dosyasında tut; gerekiyorsa gerçek public GitHub raw URL'siyle bağla. Repo/dal/yol uydurma; henüz yayımlanmamış dosyayı erişilebilir diye sunma.
- Sağlayıcıların URL/draft/otomatik gönderim davranışları aynı değildir. Doğrulanmamış parametreler ekleme veya otomatik gönderim garantisi verme. Kılavuzu panoya kopyalayıp sağlayıcıyı açma, izin reddinde seçilebilir metin gösterme gibi açık bir geri dönüş yolu kullan. URL üzerinden ön doldurma yardımcı bir kolaylıktır.
- Tam kılavuz uygulamayla da gelsin; sağlayıcı linki okuyamazsa kullanıcı hazır metni yapıştırabilsin. Panoya yazma ve yeni sekme açma kullanıcı tıklamasından başlasın; asenkron işlemden sonra açarak popup engeline düşürme. Yeni sekmede opener/referrer bağını kapat.
- AI'ya yalnız genel format kılavuzu gönder. Öğrenci, şifre, özel sınav cevabı veya oturum bilgilerini bir kısayola otomatik ekleme. Kılavuz kısa bir ilk yanıt, az soru ve sonunda tek tam JSON istesin; uygulama şemasını aşan alanlar önermesin.

## Doğrulama ve teslim

- Kullanıcı testi kendisi yapacağını veya test çalıştırılmamasını söylediyse uygulamayı, tarayıcıyı veya motoru deneme. Değişiklikleri kaynak/diff üzerinden gözden geçir, commit et ve çalıştırılmayan kontrolleri açıkça belirt. Önceki başarılı testleri yeni değişikliğin doğrulaması olarak kullanma.
- Kaynak motorları, motor entegrasyonunu, arayüzü ve dokümantasyonu gerektiği kadar anlamlı commit'lere ayır. GitHub adresi verilmesi tek başına push veya yayınlama yetkisi değildir.
