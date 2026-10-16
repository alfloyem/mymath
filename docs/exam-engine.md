# İmtahan və skan mühərriki

## JSON → PDF

Yeni imtahanda qrup/ay seçilir, JSON yüklənir və ya yapışdırılır. `mode: "imtahan"` üçün sual vərəqi, cavab vərəqi və müəllim üçün doldurulmuş cavab açarı yaranır. PDF önizlənir; sual PDF-i avtomatik endirilir, digər sənədlər eyni pəncərədən seçilir. `mode: "qayda"` qayda PDF-i yaradır, imtahan qeydi açmır.

[examples/exam-engine.json](../examples/exam-engine.json) işlək nümunədir. Əsas format göndərilmiş `Istifade_telimati.md` ilə eynidir. Yeni sahələr yalnız `q` bloklarına əlavə olunur:

```json
{"type":"q","t":"$2+3$ neçədir?","o":["3","4","5","6"],"answer":"C","topic":"Toplama"}
```

- Variantlı sual: 2–5 variant, `answer` böyük hərflə A–E və mövcud varianta uyğun olmalıdır. Sual başına `topic` istəyə bağlıdır.
- Açıq sual: `o` və `answer` yoxdur. Müəllim hər açıq suala ayrıca 0–1 bal verir. Yoxlanılmamış sual səssizcə sıfır sayılmır.
- Nömrələr 1-dən ardıcıl artır. Bu mərhələdə xüsusi `start` nömrələməsi və iç-içə suallar qəbul edilmir. 1–200 sual, hər sənəddə ən çox 20 səhifə.
- İlkin `sinaq_20_sual.json` düzgün cavablar ehtiva etmir; tətbiq onları təxmin etmir. İmtahan kimi yükləməzdən əvvəl test suallarına `answer` əlavə edin. Test generatorunun həmin sənədə verdiyi sintetik açarlar yalnız yerləşdirmə testidir, həqiqi cavab açarı deyil.

Kökdəki iki HTML mühərriki dəyişdirilməyib; versiyalanan server nüsxələri `resources/engines/document.html` və `answers.html` altındadır. Adaptasiya redaktoru/localStorage-u işə salmır, MathJax-ı yerli paketdən yükləyir və şəbəkə sorğularını bloklayır. A4 MediaBox dəqiq 210 × 297 mm-dir; mətn, düstur və şəkillər vektor olaraq qalır. Sual sənədinin ölçülmüş mövqeləri, cavab dairələri, açıq sahələr, düzgün cavablar və mühərrik/sənəd izi kalıpla birlikdə saxlanır. Sənəd və kalıp birlikdə dondurulur; sonrakı şablon dəyişiklikləri köhnə imtahanı yenidən yerləşdirmir.

## Skan → nəticə

Şagird profilində mövcud imtahana nəticə yüklənir. Yeni mühərrik imtahanları üçün bütün cavab səhifələri birlikdə PDF, PNG və ya JPEG olaraq verilir. Ən çox 20 fayl/səhifə, cəmi 20 MB; şəkil 600 px-dən kiçik, 30 MP-dən böyük olmamalıdır. Skan PDF səhifələri A4 portret olmalıdır. Sualların ayrıca PDF-i deyil, yaradılmış **cavab vərəqi** skan edilir.

Dörd künc işarəsi perspektiv/dönmə/miqyas uyğunlaşdırması üçündür. QR imtahanı, səhifəni və kalıp izini müəyyən edir. Səhifə sırası dəyişə bilər; yanlış/əskik/təkrar səhifələr və oxunmayan kimlik rədd edilir. Uyğunlaşdırılmış skan boş PDF ilə müqayisə edilir. Dairənin daxili sahəsində əlavə tünd mürəkkəb nisbəti ölçülür; 0,35-dən yuxarı işarə, 0,12–0,35 arası qeyri-müəyyən sayılır. Çap hərfləri və dairə xətləri boş şablonla müqayisədə çıxılır. İki işarə və ya qeyri-müəyyən cavab müəllim təsdiqi olmadan saxlanmır. Müəllim avtomatik cavabı düzəldə bilər; bu, admin səlahiyyəti və nəticə auditinin bir hissəsidir.

Açıq cavab sahələri müəllimə kəsik şəklində göstərilir. Hər açıq sual 0–1 bal alır. Ümumi nəticə `(düzgün test sayı + açıq sualların balları) / bütün sualların sayı × 100` düsturu ilə hesablanır. Yanlış cavablar bal aparmır. Doğru/yanlış/boş sayları yalnız variantlı sualları sayır; açıq ballar ayrıca saxlanır. Mövzu nəticələri, faizlər və aylıq irəliləyiş mövcud profilə bağlanır. Köhnə imtahanların mətn/JSON cavab yükləməsi qorunur.

Önizləmələr bu mərhələdə yoxlama pəncərəsində qalır; mənbə skanları və şəkil önizləmələri daimi saxlanmır. DB-də cavablar, əl balları, işarə statusları/təsdiqləri, fayl adı və nəticə auditi saxlanır. Nəticəni sonradan düzəldərkən açıq ballar yenidən redaktə edilə bilər; şəkil əsasında təkrar baxış üçün skanı yenidən yükləyin.

## İşləmə mühiti

- Node.js/pnpm layihənin mövcud sürümlərindədir.
- Serverdə Chromium/Chrome/Edge tələb olunur. `PDF_CHROMIUM_PATH` ilə yol seçilir; Windows Chrome/Edge və Linux Chromium standart yolları avtomatik yoxlanır. Bu, serverin başsız PDF render prosesidir.
- Python və `resources/engines/requirements.txt` paketləri tələb olunur: `python -m pip install -r resources/engines/requirements.txt`. `OMR_PYTHON` ayrıca virtual mühitdəki icra faylına verilə bilər.
- `pnpm db:deploy`, `pnpm build`, `pnpm start`. Mühərriklər, Python worker və yalnız lazım olan MathJax bundle-ı Nitro server assets kimi paketlənir.
- PDF və skan eyni server prosesində bir ağır işi eyni vaxtda icra edir; artıq sorğu 429 alır. Chromium açılışı 20 saniyə, açıldıqdan sonrakı PDF işi ümumilikdə 60 saniyə, Python worker 90 saniyə ilə məhduddur. Çox instansiyada ayrıca işçi növbəsi bu mərhələyə daxil deyil.
- Bütün sənəd, kalıp, skan və cavab açarı endpoint-ləri admin sessiyası tələb edir; cavablar `no-store` olur. Fayl adları icra əmrlərinə və server yollarına çevrilmir. Müvəqqəti fayllar hər işin sonunda silinir. Normal siyahılara PDF/şəkil baytları əlavə olunmur.

## Yoxlama

```powershell
pnpm test
pnpm typecheck
pnpm test:engine:fixtures
python tests/test_omr.py .local/engine-check
pnpm test:engine
pnpm build
```

HTTP testi işlək server və `.env` admin məlumatları tələb edir. Yalnız öz müvəqqəti qrup/şagird/imtahanını yaradıb təmizləyir. `TEST_BASE_URL` ilə hədəf seçilir. PDF nümunələri `.local/engine-check` altına yazılır. Sinifdə etibarlı istifadədən əvvəl konkret printer, kağız, qələm və skaner/kamera ilə kalibrasiya edilməlidir. Sintetik perspektiv və bulanıqlıq sərhədləri real cihaz dəqiqliyinin zəmanəti deyil. Əl yazısı OCR-i, açıq cavabın AI ilə qiymətləndirilməsi, birbaşa skaner sürücüsü və kütləvi şagird tanıma bu mərhələdə yoxdur.
