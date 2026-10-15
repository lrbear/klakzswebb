# Klakz Hub Firebase ayarları

Projede kullanılan Firebase projesi `klakz-database` olarak ayarlandı. Web API anahtarı web uygulamalarında istemci yapılandırmasının parçasıdır; veriyi koruyan şey aşağıdaki sunucu tarafı kurallarıdır.

## Bir kez yapılacaklar

1. Firebase Console'da `klakz-database` projesini açın.
2. **Authentication → Sign-in method** bölümünde **Email/Password** ve **Google** sağlayıcılarını etkinleştirin. Yönetici hesabını kullanıcılar bölümünden oluşturun ve e-postasını doğrulayın. Ana sayfadaki hesap akışı her iki yöntemi de kullanır.
3. `firebase-config.js` içindeki `ADMIN_EMAIL_REPLACE_ME` değerini kendi doğrulanmış yönetici e-postanızla değiştirin. Aynı e-postayı `database.rules.json` ve `storage.rules` içindeki yer tutucuyla da değiştirin. E-posta harfleri tam eşleşmelidir.
4. **Realtime Database → Rules** alanına `database.rules.json` içeriğini yapıştırın ve **Publish**'e basın.
5. **Storage → Rules** alanına `storage.rules` içeriğini yapıştırın ve **Publish**'e basın. Storage kullanmayacaksanız bu adımı geçebilirsiniz.
6. **Authentication → Settings → Authorized domains** bölümünde sitenizin yayın adresini ekleyin (ör. GitHub Pages alan adınız). `localhost` geliştirme için kullanılabilir. `file://` üzerinden Firebase Authentication güvenilir şekilde çalışmaz; siteyi GitHub Pages/Netlify/Vercel gibi HTTPS adresinde açın.
7. Firebase Authentication **Users** listesinde yönetici hesabını oluşturup doğrulayın. Yönetim paneli yalnızca bu doğrulanmış e-posta ile yazma işlemi yapar.

## Veri yolları

`scripts`, `downloads`, `executors`, `projects`, `changelog`, `statuses` herkese açık okunur; yalnız doğrulanmış yönetici yazabilir. `requests` oturum açmış kullanıcı tarafından kendi UID'si ile gönderilebilir ve yalnız yönetici okuyabilir. Diğer yollar varsayılan olarak kapalıdır.

Bu klasör, yüklenen ZIP içindeki kaynakların düzeltilmiş sürümüdür. Bu çalışma ortamının Firebase Console oturumuna erişimi bulunmadığından canlı projede kuralları yayımlamadım; yukarıdaki adımlar hesap sahibinin Console'da uygulaması içindir. Kuralları canlıya almadan önce alan adını ve yönetici e-postasını kendinize göre ayarlayın.
