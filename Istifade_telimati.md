# Qayda və İmtahan mühərriki — İstifadə təlimatı

Bu alətlə iki cür A4 sənəd hazırlaya bilərsiniz:

- **Qayda vərəqi**: mövzu qaydaları, düsturlar, şəkillər, qeydlər.
- **İmtahan vərəqi**: nömrələnmiş suallar, variantlar (A–E), yazı üçün boş yer.

Sənədi **mətn kimi** yazırsınız, alət onu A4 səhifələrə düzür. Sonra **Çap / PDF** ilə çıxarırsınız. Proqramlaşdırma bilmək lazım deyil: aşağıdakı hazır nümunələri götürüb məzmunu dəyişmək kifayətdir.

---

## 1. Beş dəqiqəyə başlayın

1. `senedleshdirme_muherriki.html` faylını **Chrome**-da açın. **İnternet lazımdır** (düsturlar internetdən yüklənən MathJax ilə çəkilir).
2. Sağ aşağıdakı **Sənəd redaktoru** panelini açın (telefon və planşetdə panel bağlı başlayır).
3. Yuxarıdan rejimi seçin: **Qayda mühərriki** və ya **İmtahan mühərriki**.
4. Mətn qutusundakı nümunənin üzərində dəyişiklik edin.
5. **Tətbiq et** düyməsini basın. Səhifə yenilənir.
6. Alt sətirdə **yaşıl** yazı ("2 səhifə, 14 blok") hər şeyin qaydasında olduğunu, **qırmızı** yazı isə xəta və ya xəbərdarlıq olduğunu göstərir.
7. Hazır olanda **Çap / PDF** basın (ayarlar bölmə 9-da).

Düymələr: **Tətbiq et** (yeniləyir), **Çap / PDF**, **Sıfırla** (cari rejimin nümunəsini geri qaytarır, sizin yazdığınız silinir).

> **Vacib:** Sənədiniz brauzerdə avtomatik yadda qalır, amma brauzer məlumatı silinsə itər. Hər sənədin mətnini (qutudakı hamısını) ayrıca `.json` və ya `.txt` faylına kopyalayıb saxlayın. Başqasına göndərmək üçün də həmin mətni göndərin, o da öz redaktoruna yapışdırıb **Tətbiq et** basır.

---

## 2. JSON-u 2 dəqiqəyə öyrənin

Sənəd JSON adlanan sadə mətn formatında yazılır. Dörd qayda bilmək kifayətdir:

1. **Mətn həmişə dırnaq içindədir:** `"Salam"`. Dırnaq işarəsi düz olmalıdır (`"`), əyri (`“ ”`) olmaz. Word-dən kopyalayanda diqqət edin.
2. **Hər blok `{ ... }` içindədir** və blokların arasında **vergül** var. **Sonuncu blokdan sonra vergül yoxdur.**
3. **Hər blok ayrı sətirdə** yazılır (oxumaq asan olsun deyə).
4. **Tərs xətt `\` iki dəfə yazılır:** `\\`. Düsturlarda hər `\` əvəzinə `\\` yazın:

| LaTeX-də | Burada |
|---|---|
| `\frac{a}{b}` | `\\frac{a}{b}` |
| `\sqrt{2}` | `\\sqrt{2}` |
| `\mathbb{R}` | `\\mathbb{R}` |
| `90^\circ` | `90^\\circ` |

Ən çox edilən səhv: vergül unutmaq (blokların arasında) və ya sonuncu blokdan sonra vergül qoymaq. Redaktor bunu "JSON sintaksis xətası" ilə bildirir.

---

## 3. Sənədin başlıq hissəsi

Hər sənədin ən üstündə ümumi parametrlər olur:

```json
{
 "mode": "qayda",
 "title": "Həqiqi ədədlər",
 "watermark": "GÜNEL QASIMOVA",
 "blocks": [
  ...
 ]
}
```

| Sahə | Məcburi? | Nə edir |
|---|---|---|
| `mode` | bəli | `"qayda"` və ya `"imtahan"` |
| `title` | xeyr | Birinci səhifənin qırmızı başlığı. Qaydada ortada, imtahanda solda |
| `info` | xeyr | İmtahanda başlıqla eyni sətirdə **sağda** (məs., `Ad, soyad: ____`). Qaydada başlığın altında |
| `watermark` | xeyr | Bütün səhifələrdə şəffaf yazı |
| `startAt` | xeyr | Sual nömrələməsi bu rəqəmdən başlasın (ilkin: 1) |
| `cols` | xeyr | Sütun sayı (qayda: 1, imtahan: 2) |
| `letters` | xeyr | Variant hərfləri: `"ABCDE"` (ilkin) və ya `"abcde"` |
| `space` | xeyr | Hər sualın altında boşluq, piksellə (imtahan: 57) |
| `perCol` | xeyr | Sütunda sabit sual sayı. **Adətən istifadə etməyin** (bölmə 7) |
| `fs` | xeyr | Şrift ölçüsü, piksellə (qayda: 13.5, imtahan: 14) |
| `blocks` | bəli | Məzmun blokları siyahısı |

---

## 4. Mətn və düsturlar

Bütün mətn sahələrində (`t`, `items`) bunlar işləyir:

| Yazın | Nəticə |
|---|---|
| `**mətn**` | **qalın** |
| `//mətn//` | *kursiv* |
| `$x^2+1$` | sətrin içində düstur |

Qaydalar:
- Düsturlar `$ ... $` arasında yazılır və **LaTeX sintaksisidir**. `\\` qaydasını unutmayın.
- Düstur içində `$` işarəsi yazmayın.
- HTML işləmir. Sətir keçidi yoxdur: yeni sətir üçün yeni blok yazın.
- Faiz üçün `$15\\%$`, dərəcə üçün `$30^\\circ$`.
- Sistem tənliyi: `$\\begin{cases} x+y=5, \\\\ x-y=1 \\end{cases}$` (burada `\\\\` sətir keçididir).

---

## 5. Qayda vərəqi blokları

| Blok | Nə üçündür | Nümunə |
|---|---|---|
| `h` | Alt başlıq | `{"type":"h","t":"Bucağın növləri","l":1}` (`l`: 1 böyük, 2 kiçik) |
| `p` | Abzas | `{"type":"p","t":"**Natural ədədlər** sayma üçündür."}` |
| `note` | Qırmızı `*` qeyd | `{"type":"note","t":"$a$-nın əksi $-a$-dır."}` |
| `ps` | P.S. qeydi | `{"type":"ps","n":1,"t":"..."}` → `P.S 1)` |
| `eq` | Ortada ayrıca düstur (burada `$` yazılmır) | `{"type":"eq","t":"\\mathbb{N}\\subset\\mathbb{Z}"}` |
| `list` | Siyahı (`"n":true` nömrəli) | `{"type":"list","items":["Birinci","İkinci"]}` |
| `row` | Yan-yana bloklar (şəkil + mətn) | bax: aşağı |
| `gap` | Boşluq | `{"type":"gap","h":20}` |
| `pb` | Məcburi yeni səhifə | `{"type":"pb"}` |

**`row` (şəkil və mətn yan-yana):** `w` — hər tərəfin nisbi eni.

```json
{"type":"row","w":[1,1.4],"items":[
  {"type":"fig","w":170,"h":80,"items":[["line",10,10,160,10],["line",10,10,130,68]]},
  {"type":"p","t":"90°-dən kiçik bucaq **iti bucaq** adlanır."}
]}
```

Başlıq (`h`) həmişə özündən sonrakı blokla birlikdə qalır, səhifənin sonunda tək qalmır.

---

## 6. Şəkillər

Şəkil `fig` blokudur. Bir neçə əmrdən ibarətdir:

```json
{"type":"fig","w":170,"h":80,"items":[
  ["line",10,10,160,10],
  ["line",10,10,130,68],
  ["arc",10,10,34,0,26],
  ["text",56,22,"α"],
  ["pt",10,10,"O"]
]}
```

**Koordinatlar:** şəklin sol-aşağı küncü `(0,0)`-dır. `x` sağa, **`y` yuxarı** artır (riyaziyyatdakı kimi). Ölçülər pikseldir. Bucaqlar dərəcə ilədir və **saat əqrəbinin əksinə** ölçülür (0° sağa, 90° yuxarı). `w` və `h` şəklin eni və hündürlüyüdür (ilkin 200 × 120). Ətrafında avtomatik boşluq var, yazılar kəsilmir.

### Əmrlər

| Əmr | Yazılış | Nə çəkir |
|---|---|---|
| Xətt | `["line",x1,y1,x2,y2]` | İki nöqtə arasında parça |
| Qövs | `["arc",cx,cy,r,a1,a2]` | Mərkəz `(cx,cy)`, radius `r`, `a1`-dən `a2`-yə qədər (bucaq qövsü) |
| Dairə | `["circle",cx,cy,r]` | Tam dairə |
| Çoxbucaqlı | `["poly",[[x,y],[x,y],[x,y]],true]` | Üçbucaq, dördbucaqlı (sonda `true` = qapalı) |
| Düz bucaq | `["right",x,y,açı,ölçü]` | Təpə `(x,y)`, birinci tərəfin istiqaməti `açı` (ölçü ilkin 10) |
| Yazı | `["text",x,y,"α"]` | Mərkəzləşdirilmiş yazı (`α`, `β`, `x`, `40°`) |
| Nöqtə + ad | `["pt",x,y,"A"]` | Qara nöqtə, adı sol-aşağıda |
| Oxlar | `["axes",x1,x2,y1,y2]` | Koordinat oxları (qrafik üçün) |
| Qrafik | `["plot","ifadə",x1,x2]` | Funksiya qrafiki |

**Nümunə (üçbucaq, dik bucaqla):**

```json
{"type":"fig","w":160,"h":100,"items":[
  ["poly",[[10,10],[140,10],[10,85]],true],
  ["right",10,10,0,10],
  ["pt",10,10,"A"],["pt",140,10,"B"],["pt",10,85,"C"]
]}
```

### Funksiya qrafikləri

Qrafik üçün şəkildə `"o":[ox,oy,k]` yazın: `(ox,oy)` başlanğıc nöqtəsinin yeri, `k` isə 1 vahidin neçə piksel olduğudur. Sonra `axes` və `plot` işləyir.

```json
{"type":"fig","w":130,"h":130,"o":[65,65,24],"items":[
  ["axes",-2.5,2.5,-2.5,2.5],
  ["text",126,57,"x"],["text",75,126,"y"],["text",57,57,"0"],
  ["plot","1/x",0.4,2.3],
  ["plot","1/x",-2.3,-0.4]
]}
```

- Funksiyada `x`, `+ - * / ^ ( )`, `sqrt`, `abs`, `sin`, `cos`, `tan`, `exp`, `ln`, `pi` yazıla bilər.
- Mənfi işarəli qüvvətdə mötərizə qoyun: `-(x^2)`.
- `1/x` kimi kəsilən qrafiki iki ayrı `plot` ilə çəkin (yuxarıdakı kimi).
- Oxların adlarını (`x`, `y`, `0`) və nöqtə qiymətlərini `text` ilə özünüz əlavə edin. Mövqeyi belə hesablayın: `piksel x = ox + k·x`, `piksel y = oy + k·y`.

**Məsləhət:** əvvəl kağızda nöqtələri koordinat kimi yazın, sonra əmrlərə çevirin. Şəkil çıxmayanda və ya yanlış görünəndə əmrləri bir-bir silib yoxlayın.

---

## 7. İmtahan sualları

### Sual növləri

Hamısı `q` blokudur:

```json
{"type":"q","t":"$\\sqrt{49}+3^2$ ifadəsinin qiymətini tapın.","o":["14","16","18","20","25"]}
```

| Sahə | Nə edir |
|---|---|
| `t` | Sualın mətni |
| `o` | Variantlar (5 ədəd). **Yazsanız test sualı, yazmasanız yalnız sual** |
| `space` | Bu sualın altında boşluq (piksel). Verilməsə sənədin `space` dəyəri |
| `fig` | Sualın içində şəkil (bölmə 6-dakı `fig` obyekti) |
| `oc` | Variantların sütun sayı (məcburi etmək istəsəniz). **Adətən yazmayın** |
| `start` | Nömrələməni bu sualdan başlayaraq bu rəqəmdən davam etdir |

**DİM quruluşu:**
- Qapalı test (məs., 1–15): `o` yazın.
- Kodlaşdırılan və açıq suallar (məs., 16–24): `o` yazmayın. Yalnız sual və yazı üçün boş yer qalır. Cavab kartı ayrıdır, vərəqdə xana çəkilmir.

### Variantlar avtomatik düzülür

Sütun sayını yazmaq lazım deyil. Alət ən geniş variantı ölçüb özü seçir:

- Hamısı qısa (`14, 16, 18, 20, 25`) → **tək sətir, 5 sütun**.
- Bir az uzun → **3 sütun**.
- Daha uzun → **2 sütun**.
- Çox uzun → **alt-alta, 1 sütun**.

### Boşluq və sütun keçidi (LaTeX `multicols` kimi)

- Hər sual öz hündürlüyünü alır, altına `space` qədər boşluq qalır. Sütun dolanda növbəti sütuna, sonra növbəti səhifəyə keçir.
- Bir sual **heç vaxt ikiyə bölünmür**.
- Boşluğu bir sualda dəyişmək üçün: `"space":38`.
- **Sm → piksel:** 1 sm ≈ 38, 1,5 sm ≈ 57, 2 sm ≈ 76, 3 sm ≈ 113, 4 sm ≈ 151.
- Yazı üçün çox yer lazım olan açıq suallara böyük `space` yazın (məs., `"space":150`).
- `perCol` yalnız hər suala **eyni** yer vermək istəyəndə lazımdır. Şəkilli suallar olanda sütunlar boş qala bilər, ona görə tövsiyə olunmur.

---

## 8. LaTeX-dən keçid cədvəli

Əvvəl LaTeX ilə işləyirdinizsə, bu cədvəl köhnə sənədi çevirmək üçündür:

| LaTeX | Bu alətdə |
|---|---|
| `\textbf{...}` | `**...**` |
| `\textit{...}` | `//...//` |
| `$...$` | `$...$` (amma `\` → `\\`) |
| `\[ ... \]` | `{"type":"eq","t":"..."}` |
| `\textbf{1.}` + sual mətni | `{"type":"q","t":"..."}` (nömrə avtomatik) |
| `\begin{tasks}(3) ... \end{tasks}` | `"o":[...]` (sütun sayı avtomatik) |
| `\vspace{1.5cm}` | `"space":57` (və ya sənəd səviyyəsində `"space"`) |
| `\newpage` | `{"type":"pb"}` |
| `\begin{multicols}{2}` | `"cols":2` |
| `{\color{red}*}` | `{"type":"note",...}` |
| `{\color{red}P.S 1)}` | `{"type":"ps","n":1,...}` |
| `\begin{itemize}` | `{"type":"list",...}` |
| TikZ `\draw (0,0)--(3,0);` | `["line",0,0,3,0]` |
| TikZ `\draw ... plot` | `["plot","ifadə",x1,x2]` |
| `\SetWatermarkText{...}` | `"watermark":"..."` |

---

## 9. Çap və PDF

**Çap / PDF** düyməsini basdıqdan sonra Chrome-un çap pəncərəsində:

| Ayar | Seçim |
|---|---|
| Printer / Destination | PDF kimi saxla (və ya printeriniz) |
| Paper size | **A4** |
| Scale | **Default / 100%** ("Fit to page" **seçməyin**) |
| Margins | **None** |
| Headers and footers | **söndürün** |
| Background graphics | **işə salın** (çəhrayı fon və su nişanı üçün) |

Kağıza düzgün çıxması üçün bu ayarlar vacibdir. Miqyas 100% olmasa ölçülər sürüşür.

**Planşetdə:** sənədi redaktə etmək mümkündür, səhifə ekrana sığacaq qədər kiçildilir. Çap isə həmişə tam A4 ölçüdə çıxır.

---

## 10. Xətalar və həlləri

| Mesaj və ya problem | Səbəb və həll |
|---|---|
| **JSON sintaksis xətası** | Vergül, dırnaq və ya mötərizə səhvi. Blokların arasında vergül olsun, sonuncudan sonra olmasın. Dırnaq düz (`"`) olsun |
| **Struktur xətası** | `blocks` yoxdur və ya `[ ]` içində deyil |
| **naməlum tip "..."** | `type` yazılışı səhvdir. Mümkün olanlar: `h p note ps eq list gap pb row fig q` |
| **blok N səhifədən hündürdür** | Bir blok bütöv səhifəyə sığmır. Onu iki hissəyə bölün |
| **MathJax yüklənmədi** | İnternet yoxdur. Düsturlar ham mətn görünür. Bağlantını yoxlayıb səhifəni yeniləyin |
| Düstur səhv və ya xam görünür | `\` bir dəfə yazılıb (`\\` olmalıdır) və ya `{ }` bağlanmayıb |
| Şəkil çıxmır və ya yanlışdır | Koordinatlar `w` və `h` hüdudundan kənardadır, ya da `y` aşağı artır sanırsınız (burada yuxarı artır) |
| Sütunun sonunda boş yer var | Növbəti sual sığmır, o növbəti sütuna keçir. Bu normaldır. İstəsəniz `space`-i azaldın |
| Çapda ölçülər fərqlidir | Çap ayarlarında Scale 100% və Margins None olsun |
| Sənəd itdi | Brauzer məlumatı silinib. Mətni faylda saxladığınız halda yenidən yapışdırın |

---

## 11. Hazır nümunələr

### Qayda vərəqi

Redaktorda rejimi **Qayda** seçib bunu yapışdırın:

```json
{
 "mode": "qayda",
 "title": "Bucaqlar",
 "watermark": "MƏKTƏB ADI",
 "blocks": [
  {"type":"p","t":"Bir nöqtədən çıxan iki şüa **bucaq** əmələ gətirir."},
  {"type":"h","t":"Bucağın növləri"},
  {"type":"row","w":[1,1.4],"items":[
   {"type":"fig","w":170,"h":80,"items":[["line",10,10,160,10],["line",10,10,130,68],["arc",10,10,34,0,26],["text",56,22,"α"],["pt",10,10,"O"]]},
   {"type":"p","t":"90°-dən kiçik bucaqlar **iti bucaq** adlanır: $0^\\circ<\\alpha<90^\\circ$"}
  ]},
  {"type":"eq","t":"\\alpha+\\beta=180^\\circ"},
  {"type":"note","t":"Qonşu bucaqların cəmi $180^\\circ$-dir."},
  {"type":"ps","n":1,"t":"Düz bucaq $90^\\circ$-dir."}
 ]
}
```

### İmtahan vərəqi

Redaktorda rejimi **İmtahan** seçib bunu yapışdırın:

```json
{
 "mode": "imtahan",
 "title": "9-cu sinif · Riyaziyyat",
 "info": "Ad, soyad: ______________________",
 "watermark": "MƏKTƏB ADI",
 "startAt": 1,
 "cols": 2,
 "letters": "abcde",
 "blocks": [
  {"type":"q","t":"$5^2-2\\cdot 3$ ifadəsinin qiymətini tapın.","o":["16","19","20","22","25"]},
  {"type":"q","t":"$\\dfrac{3}{4}+\\dfrac{1}{6}$ ifadəsinin qiymətini tapın.","o":["$\\dfrac{7}{12}$","$\\dfrac{11}{12}$","$\\dfrac{5}{6}$","$\\dfrac{13}{12}$","$1$"]},
  {"type":"q","t":"$3x=27$ tənliyinin kökünü tapın."},
  {"type":"q","t":"$x^2-9=0$ tənliyini həll edin. Həllin gedişini yazın.","space":150}
 ]
}
```

Tam 20 sualdan ibarət real nümunə (şəkillərlə və qrafiklərlə) `sinaq_20_sual.json` faylındadır.

---

## 12. Qısa yaddaş kartı

```
Qalın: **...**     Kursiv: //...//     Düstur: $...$ ($\\frac{a}{b}$)
Blok növləri: h p note ps eq list gap pb row fig q
Şəkil:  line arc circle poly right text pt axes plot   (y yuxarı, bucaq saat əqrəbinin əksinə)
Sual:   q + "o":[5 variant] = test | "o" yoxdur = boş yer qalır
Boşluq: "space":57 (1,5 sm)   1 sm ≈ 38 px
Çap:    A4 · Scale 100% · Margins None · Background graphics ON
```
