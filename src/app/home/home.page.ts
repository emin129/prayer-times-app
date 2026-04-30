import { Component, OnInit, OnDestroy, inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { IonicModule, AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { Share } from '@capacitor/share';
import { LocalNotifications } from '@capacitor/local-notifications';
import { TranslateModule } from '@ngx-translate/core';

import localeTr from '@angular/common/locales/tr';
import localeEn from '@angular/common/locales/en';
import localeAr from '@angular/common/locales/ar';

import {
  locationSharp, homeOutline, ellipsisHorizontalCircleOutline,
  bookOutline, optionsOutline, timeOutline,
  bookmarksOutline, chatbubbleEllipsesOutline, rainyOutline,
  cloudyOutline, sunnyOutline, partlySunnyOutline,
  thunderstormOutline, snowOutline, moonOutline,
  compassOutline, shareSocialOutline, calculatorOutline,
  sparklesOutline, handRightOutline, trashOutline, radioOutline, closeOutline,
  playCircleOutline, stopCircleOutline,
  fingerPrintOutline,
  calendarNumberOutline
} from 'ionicons/icons';

import { PrayerService } from '../services/prayer';
import { WeatherService } from '../services/weather';
import { SettingsService } from '../services/settings';
import { VERSE_POOL, HADITH_POOL, ZIKIR_REHBERI } from '../data';
import { CHILD_NAMES } from '../child'; // 🎯 Senin dosyan
import { HIKMETLI_SOZLER } from '../beta';
import { AppComponent } from '../app.component';

registerLocaleData(localeTr, 'tr');
registerLocaleData(localeEn, 'en');
registerLocaleData(localeAr, 'ar');

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule, TranslateModule]
})
export class HomePage implements OnInit, OnDestroy {
  private zone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);
  public router = inject(Router);
  private prayerService = inject(PrayerService);
  private weatherService = inject(WeatherService);
  public settingsService = inject(SettingsService);
  private alertCtrl = inject(AlertController);
  private appComponent = inject(AppComponent);

  prayerTimes: any = null;
  nextPrayerName: string = 'Fajr';
  remainingTime: string = '00:00:00';
  backgroundImage: string = 'assets/night.jpg';
  locationName: string = 'ANTALYA';
  districtName: string = 'MERKEZ';
  hicriDate: string = '';
  now: Date = new Date();
  dailyForecast: any[] = [];

  dailyVerse = { text: '', source: '' };
  dailyHadith = { text: '', source: '' };
  dailyHikmet = { text: '', source: '' };
  dailyDua = { ad: '', arapca: '', meal: '', fazilet: '' };

  // 🎯 Senin objendeki "name" ve "meaning" alanlarına göre güncellendi
  dailyNames = { boy: { name: '', meaning: '' }, girl: { name: '', meaning: '' } };

  private timer: any;
  prayerKeys = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  private isNotificationReady = false;

  get isAdVisible(): boolean {
    return this.appComponent.isAdVisible;
  }

  constructor() {
    addIcons({
      'location-sharp': locationSharp, 'home-outline': homeOutline,
      'ellipsis-horizontal-circle-outline': ellipsisHorizontalCircleOutline,
      'book-outline': bookOutline, 'options-outline': optionsOutline,
      'time-outline': timeOutline, 'bookmarks-outline': bookmarksOutline,
      'chatbubble-ellipses-outline': chatbubbleEllipsesOutline,
      'rainy-outline': rainyOutline, 'cloudy-outline': cloudyOutline,
      'sunny-outline': sunnyOutline, 'partly-sunny-outline': partlySunnyOutline,
      'thunderstorm-outline': thunderstormOutline, 'snow-outline': snowOutline,
      'moon-outline': moonOutline, 'compass-outline': compassOutline,
      'share-social-outline': shareSocialOutline, 'calculator-outline': calculatorOutline,
      'sparkles-outline': sparklesOutline, 'hand-right-outline': handRightOutline,
      'trash-outline': trashOutline, 'radio-outline': radioOutline, 'close-outline': closeOutline,
      'play-circle-outline': playCircleOutline, 'stop-circle-outline': stopCircleOutline,
      'finger-print': fingerPrintOutline,
      'calendar-number-outline': calendarNumberOutline
    });
  }

  async ngOnInit() {
    this.setDailyContent();
    this.initApp();
    await this.initNotifications();
    this.startTimer();
  }

  async initNotifications() {
    try {
      const permission = await LocalNotifications.checkPermissions();
      if (permission.display !== 'granted') {
        await LocalNotifications.requestPermissions();
      }

      await LocalNotifications.createChannel({
        id: 'prayer_widget_channel',
        name: 'Namaz Vakitleri Takibi',
        importance: 3,
        visibility: 1,
        sound: '',
        vibration: false
      });
      this.isNotificationReady = true;
    } catch (e) { console.error("Bildirim kanalı hatası", e); }
  }

  initApp() {
    this.settingsService.location$.subscribe(coords => {
      if (!coords) return;
      this.zone.run(() => {
        if (!this.settingsService.locationEnabled) {
          this.locationName = (this.settingsService.selectedCityName || 'ANTALYA').toUpperCase();
          this.districtName = 'MERKEZ';
          this.loadData(coords.lat, coords.lng);
        } else {
          this.getLocationDetails(coords.lat, coords.lng);
          this.loadData(coords.lat, coords.lng);
        }
      });
    });
  }

  loadData(lat: number, lng: number) {
    this.prayerService.getTimes(lat, lng).subscribe(t => {
      this.zone.run(() => {
        if (t && t.Fajr) {
          this.prayerTimes = t;
          this.updateUI();
        }
      });
    });

    this.weatherService.getWeather(lat, lng).subscribe((d: any) => {
      this.zone.run(() => {
        if (d && d.daily) this.dailyForecast = d.daily.slice(0, 7);
      });
    });
  }

  async getLocationDetails(lat: number, lon: number) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=${this.settingsService.currentLang}`);
      const data = await res.json();
      this.zone.run(() => {
        this.locationName = (data.address.province || data.address.city || 'ANTALYA').toUpperCase();
        this.districtName = (data.address.district || data.address.town || 'KEPEZ').toUpperCase();
      });
    } catch (e) {
      this.locationName = (this.settingsService.selectedCityName || 'ANTALYA').toUpperCase();
    }
  }

  updateUI() {
    if (!this.prayerTimes) return;
    const now = new Date();
    let found = false;

    for (const key of this.prayerKeys) {
      const timeStr = this.prayerTimes[key];
      if (!timeStr) continue;
      const [h, m] = timeStr.split(':');
      const target = new Date();
      target.setHours(+h, +m, 0, 0);

      if (target > now) {
        this.nextPrayerName = key;
        this.calculateRemaining(target, now);
        found = true;
        break;
      }
    }

    if (!found) {
      const [h, m] = this.prayerTimes['Fajr'].split(':');
      const target = new Date();
      target.setDate(target.getDate() + 1);
      target.setHours(+h, +m, 0, 0);
      this.nextPrayerName = 'Fajr';
      this.calculateRemaining(target, now);
    }
    this.backgroundImage = (now.getHours() >= 19 || now.getHours() <= 5) ? 'assets/night.jpg' : 'assets/monday.jpg';
  }

  calculateRemaining(target: Date, now: Date) {
    const diff = target.getTime() - now.getTime();
    const s = Math.max(0, Math.floor(diff / 1000));
    const hours = Math.floor(s / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const seconds = (s % 60).toString().padStart(2, '0');
    this.remainingTime = `${hours}:${minutes}:${seconds}`;
  }

  setDailyContent() {
    const now = new Date();
    const jd = Math.floor(now.getTime() / 86400000) + 2440588;
    const l = jd - 1948440 + 10632;
    const n = Math.floor((l - 1) / 10631);
    const l_new = l - 10631 * n + 354;
    const j = (Math.floor((10985 - l_new) / 5316)) * (Math.floor((50 * l_new) / 17719)) +
              (Math.floor(l_new / 5670)) * (Math.floor((43 * l_new) / 15238));
    const l_final = l_new - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) -
                    (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;

    const m = Math.floor((24 * l_final) / 709);
    const d = l_final - Math.floor((709 * m) / 24);
    const y = 30 * n + j - 30;

    const islamicMonths = ["Muharrem", "Safer", "Rebiülevvel", "Rebiülahir", "Cemaziyelevvel", "Cemaziyelahir", "Recep", "Şaban", "Ramazan", "Şevval", "Zilkade", "Zilhicce"];
    this.hicriDate = `${d} ${islamicMonths[m - 1]} ${y}`;

    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);

    this.dailyVerse = VERSE_POOL[dayOfYear % VERSE_POOL.length];
    this.dailyHadith = HADITH_POOL[dayOfYear % HADITH_POOL.length];
    this.dailyDua = ZIKIR_REHBERI.gunlukDualar[dayOfYear % ZIKIR_REHBERI.gunlukDualar.length];

    // 🎯 BURASI SENİN DOSYANA GÖRE GÜNCELLENDİ (boys ve girls)
    if (CHILD_NAMES.boys && CHILD_NAMES.boys.length > 0) {
      this.dailyNames.boy = CHILD_NAMES.boys[dayOfYear % CHILD_NAMES.boys.length];
    }
    if (CHILD_NAMES.girls && CHILD_NAMES.girls.length > 0) {
      this.dailyNames.girl = CHILD_NAMES.girls[dayOfYear % CHILD_NAMES.girls.length];
    }

    let hikmetIndex = dayOfYear * 2;
    if (now.getHours() >= 12) hikmetIndex += 1;
    this.dailyHikmet = HIKMETLI_SOZLER[hikmetIndex % HIKMETLI_SOZLER.length];
  }

  startTimer() {
    this.zone.runOutsideAngular(() => {
      this.timer = setInterval(() => {
        this.zone.run(() => {
          this.now = new Date();
          this.updateUI();
          this.cdr.detectChanges();
        });
      }, 1000);
    });
  }

  getWeatherIcon(day: any): string {
    const code = day.weathercode ?? 0;
    if (code === 0) return 'sunny-outline';
    if (code >= 1 && code <= 3) return 'partly-sunny-outline';
    if (code >= 45 && code <= 48) return 'cloudy-outline';
    if (code >= 51 && code <= 67) return 'rainy-outline';
    if (code >= 71 && code <= 77) return 'snow-outline';
    if (code >= 80 && code <= 99) return 'thunderstorm-outline';
    return 'partly-sunny-outline';
  }

  async shareContent(title: string, text: string, source: string) {
    const shareMessage = `"${text}"\n\n— ${source}`;
    try {
      await Share.share({ title, text: shareMessage, dialogTitle: 'Paylaş' });
    } catch (err) { console.log("Paylaşım iptal edildi."); }
  }

  getJsonKey(p: string): string { return p ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : p; }

  goToApp() { this.appComponent.showAdAndNavigate('/applications'); }
  goToZikirmatik() { this.appComponent.showAdAndNavigate('/zikirmatik'); }
  goToQibla() { this.appComponent.showAdAndNavigate('/qibla'); }
  goToDream() { this.appComponent.showAdAndNavigate('/dream-interpretation'); }
  goToLibrary() { this.appComponent.showAdAndNavigate('/library'); }
  goToSettings() { this.appComponent.showAdAndNavigate('/settings'); }
  goToTefeul() { this.appComponent.showAdAndNavigate('/tefeul'); }
  goToRadio() { this.appComponent.showAdAndNavigate('/radio'); }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
}
