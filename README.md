# Perfüzyon kişisel çalışma merkezi

Kalıcı proje: `/Users/kberkaybilgenn/Documents/ChatGPT/Perfüzyon`

GitHub deposu: [BerkayBilgenn/perfVize](https://github.com/BerkayBilgenn/perfVize). Kullanıcının güncel tercihi bu depoyu Vercel’e bağlayıp sonraki ders güncellemelerini push ile yayınlamaktır. Dersler, görseller ve kaynak arşivi projeyle birlikte depoya dahil edilir. Vercel bağlantısı ve Vercel’e uygun kalıcı kayıt altyapısı henüz kurulmadı; aşağıdaki Sites hazırlığı önceki, yayımlanmamış alternatiftir.

Mac uygulaması **http://localhost:3000** üzerinden çalışır. **Baslat.command** dosyasına çift tıklamak sunucuyu arka planda başlatır ve Chrome’u açar. Mac yeniden başladıktan sonra başlatıcıyı yeniden açabilirsin. Node.js 22 veya üzeri dışında kurulum gerekmez.

## Şu anki durum

- Ders kütüphanesi, yeni ders ekleme, kişisel notlar, favoriler ve tekrar kartları çalışıyor.
- Uygulama ve ders metinleri tarayıcıda da saklanıyor. Bağlantı olmadan yeni ders ve not kaydedilebilir; yerel sunucu tekrar geldiğinde bekleyen değişiklikler kalıcı Mac arşivine aktarılır.
- **Cihazlar ve çevrimdışı → Tüm dersleri ve görselleri bu cihaza indir**, görselleri ve özgün dosyaları o tarayıcıya indirir. Chrome ve Safari’nin yerel kopyaları ayrıdır; her cihazda ve tarayıcıda bir kez indirmek gerekir.
- Cihazlar arası internet eşitlemesinin kodu ve özel yayın paketi hazırlandı; **yayın ve dışarı içerik aktarımı henüz yapılmadı**. Tablet/telefon bağlantısı ve ChatGPT’den kayıt aracı henüz etkinleştirilmiş sayılmaz.

Özel yayın için ayrılan adres: `https://perfuzyon-kisisel-calisma-merkezi.earlymouse1.chatgpt.site`. Bu adres yayın onayına kadar çalışır bir uygulama olarak sunulmamalıdır. İçerik envanteri `artifacts/publish-inventory.json` içindedir. Otomatik onay incelemesi bu belirli hedefe özel ders verilerini yüklemek için ayrıca kullanıcı onayı istedi.

## Sonraki dersleri eklemek

**Yeni ders ekle** ile başlık, konu ve notlarını gir; ders dosyalarını seç; **Dersi kaydet** düğmesine bas. PDF/PPTX özgün dosya olarak, yeni görseller notların arasında açılır. TXT/MD metni nota eklenir. Dosya başına 60 MB, bölüm metni başına bir milyon karakter sınırı vardır.

**Kendi notların** alanında **Notlarımı kaydet** düğmesine bas. Yazarken taslak ayrıca saklanır. Kayıt önce cihazda yapılır; eşitleme durumu üstte görünür. İki cihaz aynı kişisel notu farklı değiştirdiyse eski sürüm silinmez; diğer sürüm ayrı ders kopyasına kaydedilir. Reddedilen bir dosya veya kayıt diğer derslerin aktarımını durdurmaz; cihazlar ekranından düzeltilebilir.

Özel yayın açıldıktan sonra her cihaz aynı özel adresi kullanacak. iPad/iPhone’da Safari → Paylaş → Ana Ekrana Ekle ile yüklenebilir. İlk açılış ve görsellerin ilk indirilmesi bağlantı ister; sonrasında indirilmiş içerik cihazda çalışır. İnternet geri geldiğinde cihazın bekleyen kayıtları özel merkeze gönderilir. Mac’in açık kalması gerekmeyecek. Gerçek iPad/iPhone kurulumu ve yayımlanmış özel hesaba giriş henüz bu Mac’te doğrulanamadı.

## Sohbette çalışmak ve gün sonunda kaydetmek

Kullanıcı “bugün çalıştıklarımızı Perfüzyon kişisel çalışma merkezine ekle” dediğinde aynı kütüphaneye kaydet. Yeni uygulama oluşturma. Konu, çalışma tarihi, açıklamalar, soru ve cevaplar, düzeltmeler, ders görselleri birlikte korunmalı.

Özel yayın ve kişisel ChatGPT bağlantısı tamamlandığında bağlantı şu araçları sağlar: `list_lessons`, `read_lesson`, `upload_study_file`, `add_study_lesson`, `append_to_lesson`. Kayıt bağlantısı ilgili sohbetin araçlarında kullanılabilir olmalıdır. Aynı ChatGPT hesabına veya sohbetine girmek tek başına bir cihazdaki dosya araçlarını açmaz. Araca erişmeden veya kaydı doğrulamadan “kaydedildi” denmez. Kalıcı yönergeler `AGENTS.md` içindedir.

## Saklama ve yedek

- `data/lessons/*.json`: Mac arşivindeki dersler, kişisel notlar ve çalışma durumu.
- `assets/`: özgün dosyalar, sayfa görselleri ve yüklemeler.
- `sources/`: aktarım raporu, erişilmiş sohbetler ve önceki soru bankası.
- Tarayıcıda IndexedDB: derslerin cihaz kopyası, dosyalar ve bekleyen işlemler. Cache Storage: uygulama ve indirilmiş dosyalar.
- `public/`: ortak web uygulaması; `server.mjs`: Mac sunucusu; `cloud/worker.mjs`: özel eşitleme ve sohbet bağlantısı; `drizzle/`: veritabanı şeması.

**Notları yedekle**, tüm ders metinlerini ve kişisel notları JSON olarak indirir; görseller bu JSON’a gömülmez. Mac’in ders, dosya ve kaynaklarını birlikte yedeklemek için yerel `/api/backup` adresinden arşiv indirilebilir veya proje klasörü kopyalanabilir. Tarayıcı verilerini silmeden önce bekleyen kayıtları eşitle ve yedekle. Mac’teki proje klasörü tarayıcı temizliğinden etkilenmez; henüz eşitlenmemiş tarayıcı kayıtları etkilenebilir.

## İçerik ve aktarım sınırı

Erişilebilen özgün PDF/PPTX dosyaları, Perfüzyon rehberleri ve önceki yerel tekrar kartları korundu. Taranmış PDF sayfalarının metni aramaya dahil değildir. Bazı eski ChatGPT yanıtları ve üretilen dosyalar yalnızca içerik başvurusu/geçici bağlantı olarak döndüğü için alınamadı. **Kaynaklar ve aktarım** ekranı bu eksikleri ve kaynak sohbetleri gösterir. Ulaşılamayan notlar veya görseller uydurulmaz.

## Geliştirme ve yayın durumu

`npm test`: eşitlemenin tekrar deneme ve çakışma koruması, sohbet araçları, dosya doğrulama, yerel HTTP güvenliği, yedek ve çevrimdışı dosya yanıtları.

`node scripts/build-cloud.mjs`: yalnızca yerel özel yayın paketini derler. `node scripts/publish-inventory.mjs`: aktarılacak dosyaların boyut ve içerik özetlerini yerel envantere yazar. Bu işlemler dışarıya dosya göndermez.

Özel Site kaydı zaten var: `appgprj_6ad7d6079d508191a2a6ed7e6798d828`. Yeniden Site oluşturma. Kullanıcı belirli özel adresi ve envanteri onayladıktan sonra Sites kaynak/yayın iş akışı tamamlanmalı; `scripts/import-cloud.mjs` yalnızca bu onaydan sonra çağrılmalı. Erişim anahtarı sadece standart girdiden alınır; dosyaya veya komut argümanına yazılmaz. Yayın, özel erişim, veri aktarımı ve kişisel sohbet bağlantısı doğrulanmadan cihazlar arası kullanım tamamlandı denmez.
