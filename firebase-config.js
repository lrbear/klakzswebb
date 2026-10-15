/* Klakz Hub Firebase (compat SDK). Replace the admin email before publishing. */
(function () {
  const config = {
    apiKey: "AIzaSyAJuMNSxWFuNTO0xGriUo8QoaC9g-ie8WM",
    authDomain: "klakz-database.firebaseapp.com",
    databaseURL: "https://klakz-database-default-rtdb.firebaseio.com",
    projectId: "klakz-database",
    storageBucket: "klakz-database.firebasestorage.app",
    messagingSenderId: "437747915577",
    appId: "1:437747915577:web:f4ffa2f76d6d7a923966e8"
  };
  window.KLAKZ_ADMIN_EMAIL = "ADMIN_EMAIL_REPLACE_ME";
  try {
    if (!window.firebase) throw new Error("Firebase SDK yüklenemedi");
    const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(config);
    window.klakzAuth = app.auth();
    window.klakzDb = app.database();
    window.klakzStorage = app.storage();
  } catch (error) {
    console.error(error);
    window.klakzFirebaseError = error.message;
  }
})();
