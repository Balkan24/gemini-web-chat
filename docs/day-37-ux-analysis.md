# Day 37 – Kullanıcı Deneyimi Analizi ve Sohbet Başlığı Ticket'ı

## Amaç

Bugün Gemini Web Chat projesini kullanıcı gözüyle inceleyerek mevcut özelliklerin davranışlarını test ettim. Kullanıcı deneyimini geliştirebileceğim alanları belirledim ve öncelikli bir geliştirme görevi hazırladım.

## Yaptığım Testler ve Gözlemler

1. Giriş ekranında boş alanlarla giriş yapmayı denedim. Tarayıcının zorunlu alan uyarısı verdiğini gördüm.
2. Yanlış giriş bilgileri kullandığımda uygulamanın hata mesajı gösterdiğini kontrol ettim.
3. Kayıt ekranında geçersiz e-posta ve boş alan kontrollerini test ettim. Tarayıcı doğrulamalarının çalıştığını gördüm.
4. Sohbet ana ekranını inceledim. Sohbet listesi, bütçe bilgileri ve çıkış butonunun görüntülendiğini kontrol ettim.
5. Geçmiş bir sohbeti açtım. Önceki mesajların, kod bloklarının ve token/maliyet bilgilerinin yüklendiğini gördüm.
6. Yeni sohbet oluşturdum. Farklı sohbetlerin aynı "Yeni Sohbet" başlığıyla listelendiğini fark ettim.
7. Sayfayı yeniledim. Kullanıcı oturumunun ve sohbet listesinin korunduğunu ancak seçili sohbetin sıfırlandığını gördüm.

## Geliştirme Önerileri

- Sohbet başlıklarının birbirinden ayırt edilebilmesini sağlamak.
- Sayfa yenilendiğinde son seçili sohbeti yeniden açmak.
- Aylık bütçe bilgilerini daha anlaşılır şekilde göstermek.
- Giriş ve kayıt formlarının hizalamasını iyileştirmek.
- Kod bloklarına kopyalama butonu eklemek.

## Öncelikli Problem

Birden fazla sohbet oluşturulduğunda bütün sohbetler "Yeni Sohbet" başlığıyla görünüyor. Bu durum, sohbet sayısı arttıkça kullanıcıların geçmiş konuşmaları bulmasını zorlaştırabilir.

Bu nedenle ilk olarak sohbet başlıklarının iyileştirilmesine karar verdim.

## Değerlendirdiğim Çözümler

- Kullanıcının sohbet başlığını manuel olarak değiştirmesi.
- İlk mesajdan otomatik başlık oluşturulması.
- Her iki yöntemin birlikte kullanılması.

İki yöntemin birlikte kullanılmasını seçtim. Otomatik başlık için ek Gemini API isteği yapmak yerine ilk kullanıcı mesajından kısa bir başlık oluşturulmasına karar verdim. Böylece ek API maliyeti oluşmayacak.

## Kabul Kriterleri

1. Yeni sohbet oluşturulduğunda başlangıç başlığı "Yeni Sohbet" olacak.
2. İlk kullanıcı mesajı başarıyla kaydedildiğinde kısa bir başlık oluşturulacak.
3. Otomatik başlık en fazla 50 karakter olacak ve mümkünse kelime ortasından bölünmeyecek.
4. Başlık oluşturmak için ek Gemini API isteği yapılmayacak.
5. Kullanıcı sohbet başlığını manuel olarak değiştirebilecek.
6. Manuel değiştirilen başlık sonraki mesajlarda korunacak.
7. Boş veya yalnızca boşluk içeren manuel başlık kabul edilmeyecek.
8. Sayfa yenilendiğinde başlıklar veritabanından doğru şekilde yüklenecek.
9. Kullanıcı başka bir kullanıcıya ait sohbetin başlığını değiştiremeyecek.

## Sonuç

Bugün uygulamanın mevcut özelliklerini test ettim ve kullanıcı deneyimi açısından geliştirilmesi gereken noktaları belirledim. Sohbet başlıkları problemini önceliklendirdim. Farklı çözüm yöntemlerini değerlendirerek uygulanacak yöntemi ve kabul kriterlerini netleştirdim. Geliştirme çalışmasını sonraki günün görevine ayırdım.