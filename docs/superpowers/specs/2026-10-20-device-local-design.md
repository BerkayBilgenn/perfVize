# Her cihazda yerel Perfüzyon merkezi

Kullanıcının onayladığı hedef: tek Perfüzyon projesinin Mac, tablet ve telefonda bağımsız yerel kopyaları; çevrimdışı ders okuma, not yazma ve görsel ekleme; internet geri geldiğinde eşitleme; Mac kapalıyken çalışma; sohbet sonunda tüm çalışılanları aynı merkeze ekleyebilme.

Uygulama kararları: mevcut arayüz ve veri korunur. IndexedDB cihazdaki kalıcı dersleri, dosyaları ve gönderilmeyi bekleyen işlemleri tutar. Service worker uygulama dosyalarını ve indirilen görselleri çevrimdışı açar. iOS/Android/masaüstünde ana ekrana eklenebilen PWA kullanılır. İlk kurulum internet gerektirir. Tarayıcının depolama sınırı veya silinen uygulama verisi saklanan kopyayı etkileyebilir; kalıcı depolama talebi ve yedekleme sunulur.

Mac’ten bağımsız eşitleme için yalnızca sahibine açık Sites yayını, D1 ders deposu, R2 dosya deposu kullanılır. Çakışan kişisel notlar ayrı kopyada korunur; hiçbir eski not sessizce silinmez. İşlemler benzersiz kimlikleriyle tekrar gönderilebilir. Aynı kayıtlar bütün cihazlarda aynı HTTPS adresi üzerinden açılır. Mac localhost uyumluluğu sürer; localhost ve HTTPS kökenlerinin cihaz depoları ayrıdır.

Sohbetten kayıt için Site MCP araçları list_lessons, add_study_lesson, append_to_lesson ve upload_study_file sağlanır. Bunların ChatGPT’de kullanılabilmesi için kişisel bağlantının kurulması gerekir; sırf aynı proje adıyla açılan her sohbetin bu araçlara sahip olduğu varsayılmaz. İnternetsiz sohbetten buluta yazıldığı iddia edilmez. Site özel erişim sınırı değiştirilmez, kaynaklar herkese açık yayınlanmaz.

Kabul: eski dosyalarda kayıp yok; ilk açılıştan sonra ağ yokken kütüphane ve kayıt çalışır; çevrimdışı oluşturulan ders/görsel çevrimiçi olduğunda ikinci cihazda görünür; çakışan iki not korunur; özel yayının URL’si ve sohbet bağlantısı sağlanır. Gerçek tablet testi yapılamadıysa açıkça belirtilir.
