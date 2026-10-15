# Klakz Hub Firebase ve Key kurulumu

Bu proje Firebase Auth, Realtime Database ve Cloud Functions kullanır. Web API ayarları `firebase-config.js` içindedir. Key üretme/doğrulama sunucu tarafındaki `functions/index.js` içinde yapılır; lisanslar kullanıcı tarayıcısından yazılamaz.

## Firebase Console'da bir kez yap

1. Firebase Console'da `klakz-database` projesini aç.
2. **Authentication → Sign-in method** bölümünde **Email/Password** ve **Google** girişlerini aç.
3. **Authentication → Settings → Authorized domains** bölümüne sitenin gerçek alan adını ekle. `file://` adresinde oturum açma çalışmaz; siteyi HTTPS üzerinden yayımla.
4. Yönetici olacak kullanıcı hesabını oluştur ve e-posta adresini doğrula.
5. Projenin Realtime Database'i bu repodaki `database.rules.json` kurallarını kullanacak şekilde dağıtılmalı. Bu kurallar script listesini yalnızca doğrulanmış hesabı ve süresi dolmamış Key'i olan kullanıcılara açar.

## Yönetici e-postası

Aşağıdaki üç dosyada `ADMIN_EMAIL_REPLACE_ME` metnini yönetici hesabının e-postasıyla değiştir:

- `firebase-config.js` içindeki `KLAKZ_ADMIN_EMAIL`
- `database.rules.json`
- `storage.rules`

E-posta adresi doğrulanmış yönetici hesabıyla aynı olmalı. Bu değer bir parola değildir; yönetici girişinde Firebase Auth doğrulaması da zorunludur.

## Functions ve kuralları yayımla

Cloud Functions dağıtımı için Firebase projesi Blaze faturalandırma planında olmalıdır. Bu, faturalandırma hesabı bağlamak demektir; kullanım ücretsiz kotalar içinde kalabilir ama kota aşımı ücret doğurabilir. Dağıtımdan önce Firebase/Google Cloud bütçe uyarısı ayarla.

Bilgisayarında Node.js 22 ve Firebase CLI kurulu olmalı. Proje klasöründe terminal açıp şu adımları uygula:

1. `npm install -g firebase-tools`
2. `firebase login`
3. `functions` klasörüne girip `npm install` çalıştır; sonra proje köküne dön.
4. `firebase deploy --only functions,database,storage,hosting` komutunu çalıştır.
5. İlk dağıtımda sorulursa `KLAKZ_ADMIN_EMAIL` için yukarıda belirlediğin doğrulanmış yönetici e-postasını gir.

`.firebaserc` varsayılan Firebase projesi olarak `klakz-database` seçer. Başka bir Firebase projesi kullanacaksan önce bu dosyadaki proje kimliğini ve `firebase-config.js` ayarlarını kendi projenle değiştir.

## Key kullanımı

1. Dağıtımdan sonra yönetici hesabıyla `admin.html` sayfasına gir.
2. Yönetim panelindeki **Tek kullanımlık Key üret** alanından 1–365 gün süreli kod oluştur. Kod ekranda bir kez görünür; kopyalayıp kullanıcıya ilet.
3. Kullanıcı hesabına giriş yapıp e-postasını doğrular, `key.html` sayfasında kodu girer.
4. Kod bir hesaba bağlanır ve ikinci kez başka bir hesapta kullanılamaz. Süresi dolunca `script.html` içeriğine erişim otomatik olarak kapanır.

Function'lar deploy edilmeden Key üretme/etkinleştirme çalışmaz. Console'da canlı ayarları bu paket kendiliğinden değiştirmez; dağıtım adımları proje sahibinin hesabında tamamlanmalıdır.

## Resmî Firebase belgeleri

- [Callable Cloud Functions](https://firebase.google.com/docs/functions/callable)
- [Functions ortam değişkenleri ve parametreleri](https://firebase.google.com/docs/functions/config-env)
- [Firebase planları ve faturalandırma](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans)
- [Realtime Database güvenlik kuralları](https://firebase.google.com/docs/database/security)
