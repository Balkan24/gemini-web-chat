# Gemini Web Chat

Google Gemini API kullanan, çok kullanıcılı ve kullanım maliyeti takip edilebilen web tabanlı yapay zekâ sohbet uygulamasıdır.

## Canlı Bağlantılar

- **Canlı Frontend:** [https://gemini-web-chat.pages.dev](https://gemini-web-chat.pages.dev)
- **Backend Sağlık Kontrolü (Health Endpoint):** [https://gemini-web-chat.onrender.com/api/health](https://gemini-web-chat.onrender.com/api/health)

## Özellikler

- **Kullanıcı Yönetimi ve Güvenlik:**
  - Kullanıcı kayıt ve giriş sistemi
  - JWT tabanlı kimlik doğrulama
  - Kullanıcılar arası yetkisiz erişime karşı IDOR kontrolleri
- **Sohbet Deneyimi:**
  - Gemini tarafından otomatik oluşturulan sohbet başlıkları
  - Manuel sohbet başlığı düzenleme
  - Sohbet geçmişinde arama ve filtreleme
  - Sohbet silme
  - Kullanıcıya özel bağımsız sohbetler
  - Server-Sent Events (SSE) ile anlık streaming yanıtlar
  - Zengin Markdown ve kod bloğu desteği
- **Maliyet ve Bütçe Takibi:**
  - Mesaj bazında prompt ve çıktı token takibi
  - Gerçek zamanlı mesaj maliyeti hesaplama ve gösterimi
  - Kullanıcı bazlı aylık bütçe ve kullanım takibi
  - PostgreSQL üzerinde sohbet, mesaj ve kullanım kayıtları (`usage_logs`)

## Canlı Dağıtım Mimarisi

Uygulamanın canlı ortam mimarisi aşağıdaki bileşenlerden oluşmaktadır:

- **Frontend:** Cloudflare Pages (React + Vite)
- **Backend:** Render (Node.js + Express)
- **Veritabanı:** Neon PostgreSQL (Serverless PostgreSQL)
- **Yapay Zekâ Modeli:** Google Gemini (`gemini-3.5-flash-lite`)

## Kullanılan Teknolojiler

### Backend

- Node.js
- Express
- PostgreSQL (`pg`)
- JWT (`jsonwebtoken`)
- Google Gen AI SDK (`@google/genai`)

### Frontend

- React
- Vite
- React Markdown
- remark-gfm

## Model ve Fiyatlandırma

Uygulamada varsayılan olarak **`gemini-3.5-flash-lite`** modeli kullanılmaktadır.

Model fiyatlandırma tarifesi:

- **Girdi (Input):** Milyon token başına $0.30
- **Çıktı (Output):** Milyon token başına $2.50

Her mesaj sonrasında Gemini API tarafından sağlanan token sayıları (`promptTokenCount`, `candidatesTokenCount`) üzerinden anlık maliyet hesaplanır ve veritabanına kaydedilir.

## Proje Yapısı

```text
gemini-web-chat/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── services/
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   ├── .env.example
│   └── package.json
└── README.md
```

## Gereksinimler

Projeyi yerel ortamda çalıştırmak için aşağıdakiler gereklidir:

- Node.js
- npm
- PostgreSQL
- Google Gemini API anahtarı

## Backend Kurulumu

Backend klasörüne geçin:

```bash
cd backend
```

Bağımlılıkları yükleyin:

```bash
npm install
```

`backend/.env.example` dosyasını örnek alarak `backend/.env` dosyasını oluşturun.

Gerekli environment değişkenleri:

```env
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
JWT_SECRET=your_jwt_secret_here
GEMINI_API_KEY=your_gemini_api_key_here
FRONTEND_URL=https://your-project.pages.dev
```

Gerçek API anahtarları ve diğer gizli bilgiler Git'e eklenmemelidir.

## Veritabanı Kurulumu

PostgreSQL üzerinde proje için kullanılacak veritabanını oluşturun.

Ardından aşağıdaki schema dosyasını PostgreSQL veritabanına uygulayın:

```text
backend/src/db/schema.sql
```

Bu schema proje için gerekli kullanıcı, sohbet, mesaj ve kullanım kayıtlarının saklanacağı tabloları oluşturur.

## Backend'i Çalıştırma

Normal çalıştırma:

```bash
npm start
```

Geliştirme modu:

```bash
npm run dev
```

Backend varsayılan olarak aşağıdaki adreste çalışır:

```text
http://localhost:3000
```

## Frontend Kurulumu

Proje ana dizininden frontend klasörüne geçin:

```bash
cd frontend
```

Bağımlılıkları yükleyin:

```bash
npm install
```

`frontend/.env.example` dosyasını örnek alarak `frontend/.env` dosyasını oluşturun.

Frontend için API adresi:

```env
VITE_API_BASE_URL=http://localhost:3000
```

## Frontend'i Çalıştırma

Geliştirme modunda çalıştırma:

```bash
npm run dev
```

Production build oluşturmak için:

```bash
npm run build
```

Build çıktısı `frontend/dist` klasöründe oluşturulur.

## Maliyet Takibi

Gemini API tarafından döndürülen kullanım bilgileri kullanılarak prompt ve cevap token değerleri alınır.

Bu değerler backend tarafındaki maliyet servisi (`costService.js`) tarafından hesaplanır ve kullanım kayıtları PostgreSQL üzerindeki `usage_logs` tablosunda saklanır.

Kullanıcının aylık toplam kullanımı bütçe servisi üzerinden takip edilir.

## Güvenlik

- Gemini API anahtarı yalnızca backend tarafında tutulur.
- Frontend içerisinde Gemini API anahtarı bulunmaz.
- JWT ile korunan endpoint'lerde kullanıcı kimliği doğrulanır.
- Sohbet sorgularında kullanıcı sahipliği kontrol edilir (IDOR koruması).
- `.env` dosyaları Git tarafından takip edilmez.
- Hassas bilgiler `.env.example` dosyalarında gerçek değerlerle paylaşılmaz.

## Test ve QA

Proje kapsamında yapılan kontroller otomasyon testleri ve üretim ortamında manuel olarak doğrulanan özellikler olarak ayrılmıştır:

### Otomasyon Kontrolleri

- **IDOR / Yetkilendirme Testleri:** Kullanıcıların yalnızca kendi sohbet ve kullanım verilerine erişebildiğinin test edilmesi.
- **Maliyet Hesaplama Testleri:** 0 token ve büyük token değerleri için maliyet hesaplama fonksiyonlarının doğrulanması.
- **Veri Tutarlılığı:** `usage_logs` tablosundaki kayıtlar ile mesaj maliyetlerinin tutarlılık kontrolleri.
- **Production Build:** `npm run build` ile frontend üretim derlemesinin hatasız oluşturulabilmesi.
- **Git ve Hassas Veri Kontrolleri:** API anahtarları ve gizli anahtarların `.gitignore` kurallarına uygunluğunun denetimi.

### Üretim Ortamında Manuel Doğrulanan Özellikler

- **Canlı Dağıtım Erişilebilirliği:** Cloudflare Pages frontend'i ve Render backend sağlık uç noktasının (`/api/health`) canlı ortamda doğrulanması.
- **Kimlik Doğrulama Akışları:** Canlı ortamda kullanıcı kayıt, giriş ve oturum yönetimi.
- **Akışlı Yanıtlar (Streaming):** Gemini API'den SSE üzerinden iletilen yanıtların arayüzde anlık ve kesintisiz akışı.
- **Sohbet Yönetimi:**
  - Gemini tarafından otomatik anlamlı sohbet başlığı oluşturulması
  - Kullanıcı tarafından manuel sohbet başlığı düzenleme
  - Sohbet geçmişi arama / filtreleme
  - Sohbet silme işlemleri
- **Servis Hata Toleransı:** Gemini API yoğunluk (503) anlarında arka plandaki retry mekanizmasının çalışması.
- **Bütçe Takibi:** Gerçek mesajlaşmalarda oluşan maliyetlerin Neon PostgreSQL'e kaydedilip aylık bütçe durumuna yansıması.

## Deployment

Projenin üretim ortamı dağıtımı tamamlanmıştır:

- **Frontend:** Cloudflare Pages üzerinde yayınlanmaktadır (`https://gemini-web-chat.pages.dev`).
- **Backend:** Render üzerinde Node.js servisi olarak barındırılmaktadır (`https://gemini-web-chat.onrender.com`).
- **Veritabanı:** Neon PostgreSQL üzerinde barındırılmaktadır.
- **Environment Değişkenleri:** Production ortamında frontend `VITE_API_BASE_URL` değişkeni Render backend adresini (`https://gemini-web-chat.onrender.com`) göstermektedir.
- Gemini API anahtarı frontend'e eklenmemeli, yalnızca backend ortam değişkeni olarak saklanmalıdır.
