import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader, TRANSLATE_HTTP_LOADER_CONFIG } from '@ngx-translate/http-loader';
import { IonicStorageModule } from '@ionic/storage-angular';

// 🔥 FIREBASE MODÜLLERİ 👇
import { initializeApp, provideFirebaseApp, getApps } from '@angular/fire/app';
import { getFirestore, provideFirestore, initializeFirestore } from '@angular/fire/firestore';

export function createTranslateLoader() {
  return new TranslateHttpLoader();
}

// 🔑 Senin Getirdiğin Gerçek Firebase Bilgileri Burada
const firebaseConfig = {
  apiKey: "AIzaSyD4WEOM4ukj7HmWE6A7LUGnxmZSxAC4TU8",
  authDomain: "quiz-dini.firebaseapp.com",
  projectId: "quiz-dini",
  storageBucket: "quiz-dini.firebasestorage.app",
  messagingSenderId: "30601030862",
  appId: "1:30601030862:web:71ff6fa42e50f4dce9f49f"
};

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(),

    // 🎯 Firebase Uygulamasını Başlatma (Hata Vermemesi İçin getApps Kontrolü Eklendi)
    provideFirebaseApp(() => {
      const apps = getApps();
      return apps.length ? apps[0] : initializeApp(firebaseConfig);
    }),

    // 🎯 Firestore Sağlayıcısı (Bağlantıyı Zorlayan Ayar Eklendi)
    provideFirestore(() => initializeFirestore(initializeApp(firebaseConfig), {
      experimentalAutoDetectLongPolling: true
    })),

    importProvidersFrom(
      IonicStorageModule.forRoot(),
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: createTranslateLoader,
          deps: []
        }
      })
    ),

    {
      provide: TRANSLATE_HTTP_LOADER_CONFIG,
      useValue: {
        prefix: '/assets/i18n/',
        suffix: '.json'
      }
    }
  ],
}).catch(err => console.error(err));
