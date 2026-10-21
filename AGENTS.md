# Perfüzyon kişisel çalışma merkezi

Bu klasör kullanıcının tek kalıcı Perfüzyon uygulamasıdır. Kullanıcı “ekle”, “dersi ekle”, “çalıştıklarımızı kaydet” dediğinde yeni uygulama/proje oluşturma; mevcut kütüphaneye ekle. Kullanıcı her cihazında bağımsız yerel kopya, çevrimdışı çalışma ve bağlantı gelince aynı kütüphaneye eşitleme istiyor.

## Güncel dağıtım durumu

- Kullanıcının güncel yayın tercihi GitHub + Vercel’dir. Yetkilendirdiği herkese açık depo: https://github.com/BerkayBilgenn/perfVize. Dersler, görseller ve kaynak arşivi de depoya dahil edilmelidir. Gün sonunda yeni içeriği aynı projeye ekleyip kullanıcı push istediğinde bu depoya gönder; yeni proje üretme.
- Vercel yayını kuruldu: **https://perf-vize.vercel.app**. `main` dalına push otomatik yayın üretir (`vercel.json`, `scripts/build-vercel.mjs`, `api/library.mjs`). Yayın **salt okunur katalog** olarak çalışır: dersler ve görseller tüm cihazlarda açılır; yeni ders, kişisel not ve dosyalar yalnızca o cihazın tarayıcısında (IndexedDB) saklanır. Cihazlar arası canlı eşitleme yayında YOKTUR; bunu çalışıyor gibi sunma. Kalıcı yazma için Vercel Blob/Neon gibi bir depolama bağlanmalı ve `readOnly` akışı güncellenmelidir. Mac sunucusu (`localhost:3000`) yazılabilir arşiv olarak korunur.
- Mac: http://localhost:3000. Başlatıcı Baslat.command; arka planda `node scripts/start.mjs --no-open`.
- Cihaz içi IndexedDB, çevrimdışı kayıt/kuyruk, dosya indirme, çakışma koruması uygulanmış durumda.
- Özel Site kaydı var: appgprj_6ad7d6079d508191a2a6ed7e6798d828. Ayrılan adres: https://perfuzyon-kisisel-calisma-merkezi.earlymouse1.chatgpt.site.
- Özel yayın ve içerik aktarımı HENÜZ YAPILMADI. Otomatik onay incelemesi, bu belirli dış hedefe özel ders notları/dosyaları yüklemek için ayrıca kullanıcı onayı istedi. Yayın/aktarım, belirtilen hedef ve artifacts/publish-inventory.json içeriği onaylanmadan yapılmamalı. Bu engeli başka araçla aşma. Onaydan sonra aynı Site kaydını kullan; yeni Site oluşturma.
- Yayın sonrası bu durum metnini, README’yi ve public/app.js içindeki CLOUD_PUBLISHED durumunu doğrulanmış sonuca göre güncelle. Özel kimlik doğrulama ve kişisel ChatGPT bağlantısı ayrıca doğrulanmalı. Tablet veya telefondaki sohbetin, Mac dosyalarına erişimi kendiliğinden olduğu varsayılmaz.

## Gün sonu ders kaydı

- “Çalıştıklarımızı ekle” komutunu geldiğinde uygula; zamanlanmış/otomatik ekleme varsayma. Erişilebilir anlatımları, terimleri, soru ve cevapları, düzeltmeleri ve görselleri birlikte koru. İçeriği konuya ve Europe/Istanbul çalışma gününe göre düzenle; kaynak sohbeti/tarihi tut.
- Merkezin kişisel kayıt bağlantısı bu sohbette araç olarak kullanılabiliyorsa önce list_lessons ve read_lesson ile mevcut dersi oku. Yeni konu için add_study_lesson, mevcut konuyu genişletmek için append_to_lesson kullan. Tekrar denemelerde aynı benzersiz operation_id kullan. Görselleri önce upload_study_file ile kalıcı sakla; dönen /assets/ yolunu ilgili bölümde kullan. Eski bölümleri ve kişisel notları silme.
- Kaydı read_lesson ile doğrula; görsellerin varlığını kontrol et. Başarılı araç sonucu veya dosya doğrulaması olmadan “kaydedildi” deme. Bağlantı bu sohbette yoksa varmış gibi konuşma; aktarılmayı bekleyen içeriği açıkça belirt. Kullanıcıya her seferinde yeni kurulum/Terminal komutu verme.
- Sadece Mac dosya araçları varsa mevcut yerel arşive kaydet ve bunun Mac kaydı olduğunu belirt. Aktif özel merkez varsa Mac klasörüne dosya yazmanın özel merkeze otomatik yüklendiğini varsayma: uygulamanın eşitleme API’sini veya kayıt bağlantısını kullan.

## Yerel veri ve API

- data/lessons/ içinde her ders ayrı JSON dosyasıdır. Gerekli alanlar: id, title, category, kind, sections, attachments, createdAt, updatedAt. Durum alanları: personalNotes, favorite, completed. Yeni dosya için UUID kullan.
- sections: {title,text,images:[{url:'/assets/...',alt:'...'}]}. Kaynak açıklama ve görselleri yan yana koru. assets/ altında kalıcı dosya sakla; geçici/sandbox URL’lerine bağlama. Erişilemeyen eski içeriği uydurma, sources/report.json raporunda belirt.
- Yerel JSON API: POST /api/uploads {name,base64}; POST /api/lessons {title,category,tags,kind,sections,attachments}; PATCH /api/lessons/:id {personalNotes,favorite,completed}.
- Ortak eşitleme: POST /api/sync {operations:[{id,lessonId,type:'create',lesson} veya {id,lessonId,type:'patch',before,patch} veya {id,lessonId,type:'append',sections}]}. Kişisel not yaması before.personalNotes ile editörde görülen başlangıç sürümünü taşımalı; güncel veritabanı değerini kullanıp açık eski editörün çakışma kontrolünü atlama. Aynı işlem kimliği tekrar gönderilebilir.
- PUT /api/assets/uploads/:uuid.ext ham dosya aktarımıdır; doğrulama ve kalıcı kayıt tamamlanmadan başarılı sayılmaz. İstemci, dosyaları ders kaydından önce eşitler. Bozuk bir dosya ilgisiz notların aktarımını engellememeli.
- Kullanıcı verisini değiştirmeden önce oku; kişisel notları, favorileri, tamamlanma bilgisini koru. Yedek almadan veri silme. scripts/import_sources.py ilk aktarımın sabit kaynakları içindir; yeni derslerde körlemesine yeniden çalıştırma.
- Yeni PDF/PPTX ek olarak korunabilir; kullanıcı not içinde sayfa isterse görsellerini çıkar. PDF metni taranmışsa aranabilir metin varmış gibi gösterme.
- Uygulamanın JS/şema değişikliklerinden sonra uygun testleri ve yerel derlemeyi çalıştır. Kaydı API’den ve dosyalardan doğrula; mevcut uygulamayı Chrome’da CUA ile aç.

## Yerel kopya ve özel merkez

Her cihazın/tarayıcının IndexedDB kaydı ve dosya önbelleği ayrıdır. İlk açılış ve ilk görsel indirmesi bağlantı ister. Tarayıcı temizliği eşitlenmemiş veriyi silebilir. Not yedeği JSON’u görsel dosyaları içermez; tam Mac arşivi /api/backup ile alınabilir. Özel merkezin D1/R2 verileri, Mac’in kapalı olduğu zamanlarda da cihazlar arasında eşitleme içindir; yayımlanmadan bu davranışı çalışıyor diye sunma.
