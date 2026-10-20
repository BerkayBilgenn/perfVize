# Her cihazda yerel kütüphane planı

Goal: Onaylanan cihaz bağımsız, çevrimdışı ve eşitlenen Perfüzyon merkezini mevcut projede tamamlamak.
Spec: ../specs/2026-10-20-device-local-design.md
Execution: Bu oturumda doğrudan uygulama; son aşamada bağımsız kod incelemesi.

- [x] Eşitleme işlemleri ve çakışma koruması için davranış testlerini yaz; ardından D1/R2 Worker ve MCP uçlarını uygula.
- [x] IndexedDB deposunu, çevrimdışı işlem kuyruğunu, dosya önbelleğini ve yeniden bağlanınca eşitlemeyi ekle.
- [x] Mevcut arayüzü yerel depoya bağla; kurulum, eşitleme durumu ve tüm görselleri indirme kontrollerini ekle.
- [ ] Özel Site kaydını koruyarak kaynakları paketle, yayınla; özgün dersleri ve dosyaları özel depoya aktar.
- [ ] Yerel sunucu uyumluluğunu, kayıt kalıcılığını, ağ kesintisi davranışını, özel yayın ve MCP bağlantısını doğrula; kalıcı kullanım yönergelerini güncelle.

Yerel doğrulama tamamlandı: 13 test, sunucu kapalıyken yeni ders kaydı ve yeniden açılışta kalıcılık, tekrar bağlanınca Mac arşivine aktarım, 685 dosyanın çevrimdışı indirilmesi, açık editör arkasında başka cihazdan gelen nota karşı iki sürümü de koruma. Yönergeler güncellendi. Bağımsız incelemenin bulguları giderildi.

Kalan: özel yayın, dosya/veri aktarımı, gerçek özel hesapla erişim ve kişisel ChatGPT bağlantısı. Otomatik onay incelemesi, özel ders içeriğinin belirli Sites hedefine yüklenmesine ayrıca kullanıcı onayı istedi. İçerik aktarılmadı. Envanter: artifacts/publish-inventory.json. Aynı Site kimliği korunuyor; onaydan sonra buradan devam edilmeli.
