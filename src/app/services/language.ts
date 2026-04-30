import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http'; // API için lazım

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private translate = inject(TranslateService);
  private storage = inject(Storage);
  private http = inject(HttpClient);

  // --- GOOGLE API AYARLARI ---
  private apiKey = 'AIzaSyCQYz-UkiprZxNsqASumN8pLmkJkla7arU';
  private apiUrl = 'https://translation.googleapis.com/language/translate/v2';

  private _language = new BehaviorSubject<string>('tr');
  selectedLanguage$ = this._language.asObservable();

  async initLanguage() {
    const storedLang = await this.storage.get('appLang') || 'tr';
    await this.setLanguage(storedLang);
  }

  async setLanguage(lang: string) {
    this.translate.setDefaultLang('tr');
    try {
      await firstValueFrom(this.translate.use(lang));
      await this.storage.set('appLang', lang);
      this._language.next(lang);
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    } catch (e) {
      console.error("Dil dosyası hatası:", e);
    }
  }

  // --- YENİ: GOOGLE API ÇEVİRİ METODU ---
  // Zikirmatik sayfasında bunu çağıracaksın aga
  async translateWithApi(text: string): Promise<string> {
    const currentLang = this._language.value;

    // Eğer dil zaten Türkçeyse boşuna API'ye gitme, direkt metni dön
    if (currentLang === 'tr') return text;

    try {
      const url = `${this.apiUrl}?key=${this.apiKey}`;
      const res: any = await firstValueFrom(
        this.http.post(url, {
          q: text,
          target: currentLang,
          source: 'tr'
        })
      );
      return res.data.translations[0].translatedText;
    } catch (e) {
      console.error("Google API hatası:", e);
      return text; // Hata olursa orijinalini göster ki ekran boş kalmasın
    }
  }

  instant(key: string): string {
    return this.translate.instant(key);
  }
}
