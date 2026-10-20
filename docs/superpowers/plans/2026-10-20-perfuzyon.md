# Perfüzyon Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement inline.

**Goal:** Kalıcı yerel ders merkezi oluşturmak ve Chrome’da localhost:3000 açmak.
**Architecture:** Bağımlılıksız Node HTTP sunucusu, JSON dosya deposu, statik arayüz, Python ile bir seferlik kaynak aktarımı.
**Tech Stack:** Node.js 24, HTML, CSS, JavaScript; kaynak okuma için pypdf ve XML/ZIP.
**Spec:** docs/superpowers/specs/2026-10-20-perfuzyon-design.md

## Global Constraints
- Kalıcı kök /Users/kberkaybilgenn/Documents/ChatGPT/Perfüzyon.
- Port 3000; yalnızca loopback.
- Erişilemeyen eski içerik aktarılmış gibi gösterilmez.
- Yeni dersler ve dosyalar diske kaydedilir.

## Review Focus
- Sunucu yeniden başladığında derslerin ve kişisel notların korunması.
- Dosya yollarının proje dışına çıkamaması ve betik yüklemelerinin reddedilmesi.
- Türkçe arama ve taranmış PDF’lerde metin eksikliğinin açık gösterilmesi.
- Mevcut derslerin yanlışlıkla üstüne yazılmaması.
- Bozuk JSON ve başarısız yüklemelerin arayüzde anlaşılır hata vermesi.

### Task 1: Kalıcı depo ve yerel sunucu
**Files:** server.mjs, lib/store.mjs, tests/server.test.mjs, package.json.
**Interfaces:** GET/POST /api/lessons, PATCH /api/lessons/:id, GET /api/library, POST /api/uploads, GET /api/backup.
- [x] Kalıcılık, doğrulama, dosya güvenliği ve API sınırları için testleri yaz ve başarısız koşuyu gör.
- [x] Atomik dosya yazımı, kaynak servis etme, yükleme ve yedek indirmeyi uygula.
- [x] node --test ile doğrula.

### Task 2: Kaynak aktarımı ve arayüz
**Files:** scripts/import_sources.py, public/index.html, public/styles.css, public/app.js, data/lessons/*.json, assets/*, sources/*.
**Interfaces:** ders {id,title,category,tags,sections:[{title,text,images}],attachments,personalNotes,favorite,completed}.
- [x] PDF/PPTX ve önceki yerel notları tekilleştirerek aktar; özgün dosyaları koru ve kaynak raporu üret.
- [x] Kütüphane, okuyucu, galeri, arama, yeni ders formu ve kalıcı durum kontrollerini uygula.
- [x] Gerçek veride dosya bağlantıları ve görsel varlığını doğrula; tarayıcıda ana akışları dene.

### Task 3: Başlatma ve teslim
**Files:** Baslat.command, scripts/start.mjs, README.md, AGENTS.md.
- [x] Yeniden açılabilir Mac başlatıcısını ve sonraki ders ekleme talimatını oluştur.
- [x] localhost:3000 yanıtını ve kalıcılığı doğrula; Chrome’da aç.
