# Gemini Web Chat

Google Gemini API kullanan, çok kullanıcılı ve kullanım maliyeti takip edilebilen web tabanlı yapay zekâ sohbet uygulamasıdır.

## Özellikler

- Kullanıcı kayıt ve giriş sistemi
- JWT tabanlı kimlik doğrulama
- Kullanıcıya özel sohbetler
- Gemini API entegrasyonu
- SSE ile streaming yanıtlar
- Markdown ve kod bloğu desteği
- Mesaj bazında token ve maliyet gösterimi
- Aylık kullanım ve bütçe takibi
- PostgreSQL üzerinde sohbet ve kullanım kayıtları
- Kullanıcılar arası yetkisiz erişime karşı IDOR kontrolleri

## Kullanılan Teknolojiler

### Backend

- Node.js
- Express
- PostgreSQL
- JWT
- Google Gemini API

### Frontend

- React
- Vite
- React Markdown
- remark-gfm

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

Bu değerler backend tarafındaki maliyet servisi tarafından hesaplanır ve kullanım kayıtları PostgreSQL üzerindeki `usage_logs` tablosunda saklanır.

Kullanıcının aylık toplam kullanımı bütçe servisi üzerinden takip edilir.

## Güvenlik

- Gemini API anahtarı yalnızca backend tarafında tutulur.
- Frontend içerisinde Gemini API anahtarı bulunmaz.
- JWT ile korunan endpoint'lerde kullanıcı kimliği doğrulanır.
- Sohbet sorgularında kullanıcı sahipliği kontrol edilir.
- `.env` dosyaları Git tarafından takip edilmez.
- Hassas bilgiler `.env.example` dosyalarında gerçek değerlerle paylaşılmaz.

## Test ve QA

Proje üzerinde aşağıdaki kontroller uygulanmıştır:

- IDOR / kullanıcı sahipliği kontrolleri
- Streaming hata senaryoları
- Gemini servis hatası ve retry kontrolü
- 0 token maliyet testi
- Büyük token değeri maliyet testi
- `usage_logs` ve mesaj maliyetlerinin tutarlılık kontrolü
- Production frontend build kontrolü
- Environment ve API key Git güvenlik kontrolleri

## Deployment

Frontend production build'i Cloudflare Pages üzerinde yayınlanmak üzere hazırlanmıştır.

Production ortamında `VITE_API_BASE_URL`, public backend adresini göstermelidir.

Gemini API anahtarı frontend'e eklenmemeli ve yalnızca backend environment değişkeni olarak saklanmalıdır.
