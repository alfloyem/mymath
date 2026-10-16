# AI ilə JSON hazırlama

Yeni imtahan pəncərəsində ChatGPT, Gemini və Claude keçidləri var. Keçid ümumi MyMath kılavuzunu panoya kopyalayır və seçilən xidməti yeni səhifədə açır. Müəllim sual/mövzu tələblərini həmin söhbətdə yazır; yekun JSON-u MyMath sahəsinə yapışdırır və PDF yaradır. Əlavə API açarı və tətbiqdaxili söhbət tələb olunmur.

## Kılavuz

[ai-exam-guide.md](ai-exam-guide.md) AI üçün müstəqil, versiyalanan format kılavuzudur. Sxem `shared/examDocument.ts` ilə uyğun saxlanmalıdır. İlk cavab qısadır; yalnız ehtiyac olduqda bir sual verilir. Yekun cavab bir tam JSON blokudur. Kılavuzda testlər üçün `answer`, açıq suallar, mövzular, riyazi mətn, həndəsi şəkillər, səhifə və ölçü limitləri izah olunur.

Tətbiq kılavuzun öz nüsxəsini bundle-dan kopyalayır; GitHub oxunmasa da tam mətn panoda qalır. Seçilmiş qrup, şagirdlər, tarixçə və formadakı JSON avtomatik olaraq AI-ya göndərilmir. Clipboard icazəsi verilmədikdə seçilib kopyalana bilən mətn göstərilir.

Raw keçid: `https://raw.githubusercontent.com/alfloyem/mymath/main/docs/ai-exam-guide.md`. Bu yeni faylın GitHub-da olması üçün həmin commit-in `main` dalına göndərilməsi lazımdır. Yerli commit yaratmaq push/yayım deyil. URL `NUXT_PUBLIC_AI_GUIDE_URL` ilə dəyişdirilə və ya boş verilə bilər.

## Xidmət fərqləri

- ChatGPT üçün `https://chatgpt.com/?q=...` hazır mesaj keçidi köməkçi üsul kimi istifadə olunur; bunun bütün müştərilərdə işləyən sabit, sənədləşdirilmiş müqavilə olduğu iddia edilmir. 2000 simvoldan uzun kodlanmış URL yaradılmır. Tam mətn uzun olduqda qısa kılavuz URL-si, o da uyğun olmadıqda əsas formatı izah edən yığcam mesaj istifadə olunur. Panoda həmişə tam kılavuz qalır.
- Gemini və Claude web üçün yoxlanmış ümumi prompt URL parametri tapılmadığı üçün belə parametr uydurulmur: xidmət açılır, hazır təlimat panodan yapışdırılır. Avtomatik göndərmə və ya linki mütləq oxuma vədi verilmir. İstifadəçi xidmətin tələb etdiyi göndərmə/giriş addımını tamamlayır.
- Claude Desktop üçün rəsmi ayrıca deep-link var: [Open Claude Desktop with a link](https://support.claude.com/en/articles/14729294-open-claude-desktop-with-a-link). Bu sənəd `claude://` sxeminə aiddir; eyni parametri Claude web üçün təsdiq kimi istifadə etmirik. Hazır interfeys veb keçidini seçir, masaüstü tətbiqin quraşdırılmasına bağlı qalmır.
- [OpenAI — Searching the web with ChatGPT](https://help.openai.com/en/articles/9237897-searching-the-web-with-chatgpt) və [Google — Use Gemini in Chrome](https://support.google.com/gemini/answer/16283624?hl=en) hazır mesajı hər platformada avtomatik göndərmə zəmanəti vermir. Bu səbəbdən kopyalama yolu əsas geri dönüşdür.

Bu dəyişiklikdə istifadəçinin tələbi ilə tətbiq, brauzer və motor testləri işlədilməyib. Yalnız mənbə/diff baxışı aparılıb. Əvvəlki motor testlərinin nəticələri bu yeni UI keçidlərinin yoxlanılması kimi təqdim edilmir.
