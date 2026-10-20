# Perfüzyon yerel çalışma merkezi

Kullanıcının talebi: tüm erişilebilir ders notlarını ve görsellerini kalıcı Mac klasöründe birleştirmek, localhost:3000 üzerinde çalıştırmak, Chrome’da açmak ve sonraki dersleri aynı yapıya eklemek.

Kararlar: mevcut boş çalışma klasörü kalıcı proje köküdür. Harici bağımlılık gerektirmeyen Node.js sunucusu ve HTML/CSS/JavaScript arayüz kullanılır. Tüm içerik data/lessons ve assets altında tutulur. Yeni ders, görsel/dosya ekleme, kişisel notlar, favoriler ve tamamlama bilgisi diske kaydedilir. Kaynak PDF/PPTX özgün halleri korunur; sunum metinleri ve gömülü görseller ders içinde yer alır; PDF sayfaları görsel olarak da gösterilir. Arama Türkçe harfleri destekler. Yedek indirme ve çift tıklanan Mac başlatıcısı sağlanır. Sunucu yalnızca yerel arayüzde çalışır.

İçerik doğruluğu: erişilen dosyalar aktarılır, ders bilgisi uydurulmaz. Geçmiş sohbetlerde yalnızca içerik başvurusu olarak dönen yanıtlar ve sandbox bağlantıları yerel dosya sayılmaz. Kaynak raporunda bu sınırlama gösterilir. Önceki Perf-zyon soru bankası ayrı, kaynak belirtilen bir bölüm olarak eklenebilir.

Arayüz: koyu kenar çubuğu, açık okuma yüzeyi, petrol yeşili vurgu. Kütüphane, görseller, favoriler ve kaynaklar sekmeleri; konu filtresi; metin ve görseli birlikte sunan ders okuyucu. Mobil genişliklere uyum ve klavye kullanımı.
