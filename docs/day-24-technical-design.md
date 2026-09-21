## 1. Teknik Mimari

Projeyi frontend, backend, database ve Gemini API olmak
üzere temel bileşenlere ayırdım.

Kullanıcı işlemleri frontend üzerinden gerçekleştirilecek.
Frontend doğrudan Gemini API ile iletişim kurmayacak.
İstekler backend'e gönderilecek ve Gemini API çağrıları
backend üzerinden gerçekleştirilecek.

Kullanıcı, konuşma, mesaj ve kullanım bilgileri database
üzerinde saklanacak.

Genel sistem akışı:

Kullanıcı
↓
Frontend
↓
Backend
↓
Gemini API
↓
Backend
↓
Database
↓
Frontend
↓
Kullanıcı

## 2. Kullanıcı Akışı

1. Kullanıcı uygulamayı açar.
2. Hesabı yoksa kayıt olur.
3. Hesabı varsa giriş yapar.
4. Başarılı girişten sonra chat ekranına yönlendirilir.
5. Yeni bir conversation oluşturabilir.
6. Kullanıcı Gemini'ye mesaj gönderir.
7. Backend kullanıcının isteğini alır.
8. Gemini API üzerinden cevap oluşturulur.
9. Cevap kullanıcıya stream edilerek gösterilir.
10. Mesajlar database'e kaydedilir.
11. Token kullanımı alınır.
12. İsteğin maliyeti hesaplanır.
13. Kullanım bilgileri database'e kaydedilir.
14. Kullanıcı mesajın token ve maliyet bilgisini görebilir.
15. Kullanıcı eski konuşmalarını tekrar görüntüleyebilir.


## 3. Veritabanı Tasarımı

### Users

Kullanıcı hesaplarının tutulacağı tablo.

- id
- email
- password_hash
- monthly_budget_usd
- created_at

### Conversations

Kullanıcıların oluşturduğu sohbetlerin tutulacağı tablo.

- id
- user_id
- title
- created_at
- updated_at

### Messages

Conversation içerisindeki mesajların tutulacağı tablo.

- id
- conversation_id
- role
- content
- prompt_tokens
- candidate_tokens
- cost_usd
- created_at


### Usage Logs

Gemini kullanım kayıtlarının tutulacağı tablo.

- id
- user_id
- message_id
- model
- prompt_tokens
- candidate_tokens
- cost_usd
- created_at


## 4. Tablo İlişkileri

USERS
  │
  │ 1:N
  ▼
CONVERSATIONS
  │
  │ 1:N
  ▼
MESSAGES
  │
  │
  ▼
USAGE_LOGS

Bir kullanıcı birden fazla conversation oluşturabilir.

Bir conversation birden fazla message içerebilir.

Mesajların Gemini kullanımı sonucunda oluşan token ve
maliyet bilgileri kullanım kayıtlarında takip edilebilir.


## 5. API Endpoint Taslağı

### Authentication

POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me

### Conversations

GET /api/conversations
POST /api/conversations
GET /api/conversations/:id
DELETE /api/conversations/:id

### Messages

POST /api/conversations/:id/messages

### Usage

GET /api/usage



## 6. Gemini Mesaj Akışı

Kullanıcı mesaj yazar
        ↓
Frontend
        ↓
POST /api/conversations/:id/messages
        ↓
Backend
        ↓
Kullanıcı doğrulanır
        ↓
Conversation kullanıcıya ait mi kontrol edilir
        ↓
Aylık bütçe kontrol edilir
        ↓
Conversation history alınır
        ↓
Gemini API çağrısı
        ↓
Streaming response
        ↓
Frontend cevabı gösterir
        ↓
usageMetadata alınır
        ↓
Token miktarı çıkarılır
        ↓
USD maliyeti hesaplanır
        ↓
Message kaydedilir
        ↓
Usage log kaydedilir


## 7. Authentication Akışı
REGISTER

email + password
      ↓
Backend
      ↓
Validation
      ↓
Password hash
      ↓
Users tablosuna kaydet


LOGIN

email + password
      ↓
Backend
      ↓
Kullanıcıyı bul
      ↓
Password doğrula
      ↓
Session / token oluştur
      ↓
Kullanıcı giriş yaptı


## 8. Güvenlik Kararları

- Gemini API key frontend tarafında tutulmayacak.
- Gemini API çağrıları backend üzerinden yapılacak.
- Kullanıcı şifreleri düz metin olarak saklanmayacak.
- Her conversation isteğinde kullanıcı sahipliği kontrol edilecek.
- Kullanıcı yalnızca kendi conversation ve message verilerine erişebilecek.
- Kullanıcının bütçesi Gemini isteğinden önce kontrol edilecek.
- Hassas bilgiler Git repository içerisine eklenmeyecek.
## 2. Kullanıcı Akışı

1. Kullanıcı uygulamayı açar.
2. Hesabı yoksa kayıt olur.
3. Hesabı varsa giriş yapar.
4. Başarılı girişten sonra chat ekranına yönlendirilir.
5. Yeni bir conversation oluşturabilir.
6. Kullanıcı Gemini'ye mesaj gönderir.
7. Backend kullanıcının isteğini alır.
8. Gemini API üzerinden cevap oluşturulur.
9. Cevap kullanıcıya stream edilerek gösterilir.
10. Mesajlar database'e kaydedilir.
11. Token kullanımı alınır.
12. İsteğin maliyeti hesaplanır.
13. Kullanım bilgileri database'e kaydedilir.
14. Kullanıcı mesajın token ve maliyet bilgisini görebilir.
15. Kullanıcı eski konuşmalarını tekrar görüntüleyebilir.


