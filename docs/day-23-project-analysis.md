# Gün 23 - Proje Analizi

## 1. Projenin Amacı

Bu projede birden fazla kullanıcının kayıt olup giriş yapabileceği ve Gemini ile sohbet edebileceği bir web uygulaması geliştireceğim.

Gemini API çağrıları doğrudan frontend üzerinden
yapılmayacak. İstekler backend üzerinden Gemini API'ye iletilecek.

Gemini tarafından dönen token kullanım bilgileri
kullanılarak her mesajın maliyeti hesaplanacak ve
kullanıcıya gösterilecek.

## 2. Ana Özellikler

- Kullanıcı kayıt sistemi
- Kullanıcı giriş sistemi
- Kullanıcı oturumu
- Yeni sohbet oluşturma
- Eski sohbetleri görüntüleme
- Gemini'ye mesaj gönderme
- Gemini cevabını stream olarak gösterme
- Sohbet geçmişini kaydetme
- Prompt token miktarını takip etme
- Output token miktarını takip etme
- Mesaj maliyetini hesaplama
- Kullanıcının toplam maliyetini gösterme
- Kullanıcı bütçe/kota kontrolü

## 3. Sistem Bileşenleri

### Frontend

Kullanıcının gördüğü arayüz.

Görevleri:
- Login/Register ekranları
- Chat ekranı
- Conversation listesi
- Mesajları göstermek
- Token/maliyet bilgilerini göstermek
- Kullanıcının toplam kullanımını göstermek


### Backend

Frontend ile Gemini arasında çalışacak katman.

Görevleri:
- Kullanıcı doğrulama
- Gemini API çağrısı
- API key'i gizlemek
- Streaming
- Token bilgilerini almak
- Maliyet hesaplamak
- Database işlemleri


### Database

Sistemde kalıcı olarak tutulması gereken verileri saklayacak.

Örneğin:
- users
- conversations
- messages
- usage_logs


### Gemini API

Kullanıcının mesajını alacak ve yapay zekâ cevabını
oluşturacak dış servis.

## 4. Veri Modeli

USER
 │
 │ 1
 │
 └──────── N CONVERSATIONS
                 │
                 │ 1
                 │
                 └──────── N MESSAGES
                                │
                                │
                                └──── USAGE LOG



## 5. Mesaj Gönderme Akışı

1. Kullanıcı chat ekranına mesaj yazar.

             ↓

2. Frontend mesajı backend'e gönderir.

             ↓

3. Backend kullanıcının yetkisini kontrol eder.

             ↓

4. Backend gerekli konuşma geçmişini toplar.

             ↓

5. Backend Gemini API'ye isteği gönderir.

             ↓

6. Gemini cevabı stream olarak döner.

             ↓

7. Backend cevabı frontend'e iletir.

             ↓

8. Gemini usageMetadata döndürür.

             ↓

9. Token miktarları alınır.

             ↓

10. Maliyet hesaplanır.

             ↓

11. Mesaj ve maliyet database'e kaydedilir.

             ↓

12. Frontend kullanıcıya cevap + maliyeti gösterir.


## 6. Token ve Maliyet Mantığı

prompt token
      +
candidate token
      ↓
Gemini usageMetadata
      ↓
model fiyatları
      ↓
maliyet

## 7. Güvenlik

- Gemini API key frontend'e gönderilmemeli.
- API çağrıları backend üzerinden yapılmalı.
- Şifreler düz metin olarak saklanmamalı.
- Kullanıcı yalnızca kendi conversation'larını görebilmeli.
- Kullanıcının bütçe limiti kontrol edilmeli.


## 8. Henüz Anlamadığım 10 Şey

1. Gemini API'den dönen usageMetadata bilgisinin tam olarak nasıl alındığını ve hangi aşamada işlendiğini henüz tam olarak bilmiyorum.

2. Gemini'den gelen cevabın SSE (Server-Sent Events) kullanılarak kullanıcıya parça parça nasıl aktarıldığını öğrenmem gerekiyor.

3. Kullanıcı giriş yaptıktan sonra session veya JWT kullanılarak oturumun nasıl güvenli bir şekilde yönetileceğini tam olarak bilmiyorum.

4. Bir kullanıcının başka bir kullanıcıya ait conversation verilerine erişmesini backend tarafında nasıl engelleyeceğimi öğrenmem gerekiyor.

5. Gemini API key'inin Cloudflare ortamında güvenli bir şekilde nasıl saklanacağını ve backend tarafından nasıl kullanılacağını öğrenmem gerekiyor.

6. Conversations ve Messages tabloları arasındaki ilişkinin backend sorgularında nasıl yönetileceğini daha detaylı öğrenmem gerekiyor.

7. Gemini'ye yeni bir mesaj gönderilirken önceki konuşma geçmişinin hangi formatta hazırlanıp API'ye gönderileceğini öğrenmem gerekiyor.

8. Prompt ve candidate token sayılarından gerçek USD maliyetinin kod tarafında nasıl hesaplanacağını ve model fiyatlarının nasıl yönetileceğini öğrenmem gerekiyor.

9. Kullanıcının belirlenen aylık bütçeye ulaşıp ulaşmadığının her Gemini isteğinden önce nasıl kontrol edileceğini öğrenmem gerekiyor.

10. Cloudflare üzerinde frontend, backend, database ve environment variable/secret yapılandırmalarının production ortamında birlikte nasıl çalışacağını daha detaylı öğrenmem gerekiyor.


## 9. Gün Sonu Özeti

Bugün mentorüm tarafından verilen Gemini tabanlı web chat projesini inceleyerek projenin genel yapısını ve gereksinimlerini anlamaya çalıştım. Projede kullanıcıların kayıt olup giriş yapabileceği ve Gemini ile sohbet edebileceği bir sistem geliştirileceğini öğrendim.

Uygulamanın frontend, backend, database ve Gemini API olmak üzere temel bölümlerini inceledim. Gemini API anahtarının güvenlik nedeniyle frontend tarafında tutulmaması ve API isteklerinin backend üzerinden gönderilmesi gerektiğini öğrendim.

Ayrıca kullanıcıların konuşmalarının ve mesajlarının database üzerinde nasıl tutulacağını, Gemini tarafından dönen token kullanım bilgilerinin maliyet hesabında kullanılacağını ve bu maliyetlerin kullanıcı bazında takip edileceğini inceledim.

Mesajın kullanıcıdan başlayarak frontend, backend ve Gemini API üzerinden ilerleyip tekrar kullanıcıya dönmesine kadar olan genel veri akışını çıkardım. Projenin ilerleyen aşamalarında daha detaylı öğrenmem gereken authentication, streaming, token hesaplama, kullanıcı yetkilendirmesi ve Cloudflare yapılandırması gibi konuları da belirledim.





