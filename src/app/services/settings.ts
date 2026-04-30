import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Geolocation } from '@capacitor/geolocation';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { registerPlugin } from '@capacitor/core';
import { CITIES } from '../city';

// --- PLUGIN TANIMI ---
const PrayerPlugin = registerPlugin<any>('PrayerPlugin');

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private http = inject(HttpClient);
  private storage = inject(Storage);
  private translate = inject(TranslateService);
  private _storage: Storage | null = null;

  // 🎯 DÜZELTME: Capacitor watchPosition için doğru tip tanımı
  private watchId: string | null = null;

  private langSubject = new BehaviorSubject<string>(localStorage.getItem('appLang') || 'tr');
  lang$ = this.langSubject.asObservable();

  private defaultCoords = { lat: 36.8841, lng: 30.7056 };
  private locationSubject = new BehaviorSubject<{ lat: number, lng: number }>(this.defaultCoords);
  location$ = this.locationSubject.asObservable();

  public isDarkMode: boolean = false;
  public locationEnabled: boolean = false;
  public isLocationLoading: boolean = false;
  public currentLang: string = 'tr';
  public selectedCityName: string = 'Antalya';
  public isLiveNotificationEnabled: boolean = true;
  public isDailyReminderEnabled: boolean = true;

  public customReminders: any[] = [];
  public cityList = CITIES;

  public ezanSoundsList = [
    { id: 'ezan', name: 'Kabe İmamı', desc: 'Mekke Usulü' },
    { id: 'medine_ezan', name: 'Mescid-i Nebevi', desc: 'Medine Usulü' },
    { id: 'ayasofya_ezan', name: 'Ayasofya-i Kebir', desc: 'İstanbul Makamı' }
  ];

  public prayerSettings: any = {
    FAJR: { sound: true, notify: true, preNotifyMinutes: 0, ezanSound: 'ezan' },
    DHUHR: { sound: true, notify: true, preNotifyMinutes: 0, ezanSound: 'ezan' },
    ASR: { sound: true, notify: true, preNotifyMinutes: 0, ezanSound: 'ezan' },
    MAGHRIB: { sound: true, notify: true, preNotifyMinutes: 0, ezanSound: 'ezan' },
    ISHA: { sound: true, notify: true, preNotifyMinutes: 0, ezanSound: 'ezan' }
  };

  private currentAudio: HTMLAudioElement | null = null;

  constructor() {
    this.init().catch(err => console.error("Başlatma Hatası:", err));
  }

  // 🚀 PREMIUM GETTER METODU
  // Bu metod sayesinde uygulama anlık olarak premium durumunu yakalayacak.
  get isPremium(): boolean {
    return localStorage.getItem('isPremium') === 'true';
  }

  get currentLat(): number { return this.locationSubject.value.lat; }
  get currentLon(): number { return this.locationSubject.value.lng; }

  async init() {
    if (this._storage) return;
    const storage = await this.storage.create();
    this._storage = storage;

    this.isDarkMode = (await this._storage.get('isDarkMode')) ?? false;
    this.locationEnabled = (await this._storage.get('locationEnabled')) ?? false;
    this.currentLang = (await this._storage.get('appLang')) ?? 'tr';
    this.prayerSettings = (await this._storage.get('prayerSettings')) ?? this.prayerSettings;
    this.selectedCityName = (await this._storage.get('selectedCityName')) ?? 'Antalya';
    this.isLiveNotificationEnabled = (await this._storage.get('isLiveNotificationEnabled')) ?? true;

    // 🚀 PREMIUM DURUMUNU SENKRONİZE EDİYORUZ
    const storedPremium = (await this._storage.get('isPremium')) ?? false;
    if (storedPremium) {
      localStorage.setItem('isPremium', 'true');
    }

    const savedDailyNotify = localStorage.getItem('is_daily_notify_enabled');
    this.isDailyReminderEnabled = savedDailyNotify !== 'false';

    this.customReminders = (await this._storage.get('customReminders')) ?? [];

    const savedCoords = await this._storage.get('manualCoords');
    if (savedCoords) this.locationSubject.next(savedCoords);

    await this.setLanguage(this.currentLang, false);
    this.applyTheme(this.isDarkMode);
    await this.createAllEzanChannels();

    if (this.locationEnabled) {
      await this.startLocationWatch();
    } else {
      await this.scheduleAllPrayers();
    }

    await this.rescheduleCustomReminders();

    if (this.isDailyReminderEnabled) {
      await this.scheduleDailyPrayerReminder();
    } else {
      await this.cancelDailyReminder();
    }

    if (this.isLiveNotificationEnabled) {
      this.startPrayerService(this.currentLat, this.currentLon);
    }
  }

  // 🚀 PREMIUM DURUMUNU GÜNCELLEME VE KAYDETME FONKSİYONU
  async setPremiumStatus(status: boolean) {
    if (status) {
      localStorage.setItem('isPremium', 'true');
    } else {
      localStorage.removeItem('isPremium');
    }

    if (this._storage) {
      await this._storage.set('isPremium', status);
    }
    console.log(`💎 Premium durumu güncellendi: ${status}`);
  }

  // --- NATIVE PLUGIN ÇAĞRILARI ---
  async startPrayerService(lat: number, lon: number) {
    try {
      await PrayerPlugin.startService({ lat, lon });
    } catch (e) { console.error("Java başlatılamadı:", e); }
  }

  async stopPrayerService() {
    try {
      await PrayerPlugin.stopService();
    } catch (e) { console.error("Java durdurulamadı:", e); }
  }

  async setLiveNotification(enabled: boolean) {
    this.isLiveNotificationEnabled = enabled;
    if (this._storage) await this._storage.set('isLiveNotificationEnabled', enabled);
    enabled ? await this.startPrayerService(this.currentLat, this.currentLon) : await this.stopPrayerService();
  }

  async updatePrayerSetting(prayer: string, key: string, value: any) {
    if (this.prayerSettings[prayer]) {
      this.prayerSettings[prayer][key] = value;
      if (this._storage) {
        await this._storage.set('prayerSettings', this.prayerSettings);
      }

      const prayerIds: any = { 'FAJR': 1, 'DHUHR': 2, 'ASR': 3, 'MAGHRIB': 4, 'ISHA': 5 };
      const id = prayerIds[prayer];

      if (key === 'notify') {
        if (value === false) {
          try {
            await PrayerPlugin.cancelAlarm({ id: id });
            await LocalNotifications.cancel({ notifications: [{ id: id }] });
            console.log(`${prayer} bildirimi susturuldu.`);
          } catch (e) { console.error("Kapatma hatası:", e); }
        } else {
          try {
            await PrayerPlugin.cancelAlarm({ id: id });
            await this.scheduleAllPrayers();
            console.log(`${prayer} bildirimi geri açıldı ve kuruldu.`);
          } catch (e) { console.error("Geri açma hatası:", e); }
        }
      } else {
        await this.scheduleAllPrayers();
      }
    }
  }

  async updatePrayerEzanSound(prayer: string, soundId: string) {
    if (this.prayerSettings[prayer]) {
      this.prayerSettings[prayer].ezanSound = soundId;
      if (this._storage) await this._storage.set('prayerSettings', this.prayerSettings);
      await this.scheduleAllPrayers();
    }
  }

  // --- EZAN PLANLAMA ---
  async scheduleAllPrayers() {
    if (!this._storage) return;
    try {
      const coords = this.locationSubject.value;
      const date = new Date();
      const today = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
      const url = `https://api.aladhan.com/v1/timings/${today}?latitude=${coords.lat}&longitude=${coords.lng}&method=13`;

      const res: any = await firstValueFrom(this.http.get(url));
      if (!res || !res.data) return;

      const timings = res.data.timings;
      const prayers = [
        { id: 1, key: 'FAJR', jsonKey: 'Fajr', time: timings.Fajr },
        { id: 2, key: 'DHUHR', jsonKey: 'Dhuhr', time: timings.Dhuhr },
        { id: 3, key: 'ASR', jsonKey: 'Asr', time: timings.Asr },
        { id: 4, key: 'MAGHRIB', jsonKey: 'Maghrib', time: timings.Maghrib },
        { id: 5, key: 'ISHA', jsonKey: 'Isha', time: timings.Isha }
      ];

      const now = new Date().getTime();

      for (const p of prayers) {
        const config = this.prayerSettings[p.key];

        if (!config || !config.notify) {
          await PrayerPlugin.cancelAlarm({ id: p.id });
          continue;
        }

        const [hours, minutes] = p.time.split(':');
        const sDate = new Date();
        sDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        if (sDate.getTime() <= now) sDate.setDate(sDate.getDate() + 1);

        const prayerName = await firstValueFrom(this.translate.get(`PRAYERS.${p.jsonKey}`));
        const selectedSoundId = config.sound ? (config.ezanSound || 'ezan') : 'silent';

        await PrayerPlugin.setAlarm({
          id: p.id,
          time: sDate.getTime(),
          title: `${prayerName} Vakti`,
          body: `${prayerName} ezanı okunuyor...`,
          sound: selectedSoundId,
          channelId: 'ezan_channel_v17' + (config.ezanSound || 'ezan')
        });
      }
    } catch (e) { console.error("Planlama Hatası:", e); }
  }

  async scheduleDailyPrayerReminder() {
    await this.cancelDailyReminder();
    const hasPermission = await this.requestNotificationPermission();
    if (!hasPermission) return;

    const reminderTime = new Date();
    reminderTime.setHours(21, 30, 0, 0);

    if (new Date().getTime() > reminderTime.getTime()) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    try {
      await PrayerPlugin.setAlarm({
        id: 999,
        time: reminderTime.getTime(),
        title: 'Günün Muhasebesi 🌙',
        body: 'Bugünkü namazlarını kıldın mı? Kılmadıklarını kaza listesine ekleyebilirsin.',
        sound: 'default',
        channelId: 'ezan_channel_v17ezan'
      });
      console.log("21:30 Hatırlatıcısı kuruldu: " + reminderTime.toString());
    } catch (e) { console.error("Hatırlatıcı kurulamadı:", e); }
  }

  async cancelDailyReminder() {
    try {
      await PrayerPlugin.cancelAlarm({ id: 999 });
      console.log("21:30 Hatırlatıcısı iptal edildi.");
    } catch (e) { }
  }

  async snoozeReminder(minutes: number) {
    const snoozeTime = new Date(new Date().getTime() + minutes * 60000);
    try {
      await PrayerPlugin.setAlarm({
        id: 1000,
        time: snoozeTime.getTime(),
        title: 'Namaz Hatırlatıcı (Ertelenen)',
        body: 'Hadi aga, vakit geçiyor!',
        sound: 'ezan',
        channelId: 'ezan_channel_v17ezan'
      });
    } catch (e) { }
  }

  async addCustomReminder(title: string, timeStr: string) {
    const id = Math.floor(Math.random() * 10000) + 2000;
    const newReminder = { id, title, time: timeStr, isActive: true };
    this.customReminders.push(newReminder);
    await this.saveReminders();
    await this.scheduleSingleReminder(newReminder);
  }

  async toggleCustomReminder(reminder: any) {
    reminder.isActive = !reminder.isActive;
    await this.saveReminders();
    if (reminder.isActive) {
      await this.scheduleSingleReminder(reminder);
    } else {
      await PrayerPlugin.cancelAlarm({ id: reminder.id });
    }
  }

  async deleteCustomReminder(id: number) {
    this.customReminders = this.customReminders.filter(r => r.id !== id);
    await this.saveReminders();
    await PrayerPlugin.cancelAlarm({ id });
    await LocalNotifications.cancel({ notifications: [{ id }] });
  }

  private async saveReminders() {
    if (this._storage) await this._storage.set('customReminders', this.customReminders);
  }

  async rescheduleCustomReminders() {
    for (const r of this.customReminders) {
      if (r.isActive) await this.scheduleSingleReminder(r);
    }
  }

  private async scheduleSingleReminder(reminder: any) {
    const [hours, minutes] = reminder.time.split(':');
    const sDate = new Date();
    sDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    if (sDate.getTime() <= new Date().getTime()) sDate.setDate(sDate.getDate() + 1);

    try {
      await PrayerPlugin.setAlarm({
        id: reminder.id,
        time: sDate.getTime(),
        title: 'Hatırlatıcı',
        body: reminder.title,
        sound: 'ezan',
        channelId: 'ezan_channel_v17ezan'
      });
    } catch (e) { console.error("Özel hatırlatıcı kurulamadı:", e); }
  }

  async setManualLocation(city: any) {
    await this.updateDefaultCity(city.name, city.lat, city.lng);
  }

  async updateDefaultCity(cityName: string, lat: number, lng: number) {
    this.locationEnabled = false;
    this.selectedCityName = cityName;
    const coords = { lat, lng };
    this.locationSubject.next(coords);

    if (this._storage) {
      await this._storage.set('locationEnabled', false);
      await this._storage.set('selectedCityName', cityName);
      await this._storage.set('manualCoords', coords);
    }
    await this.scheduleAllPrayers();
    if (this.isLiveNotificationEnabled) this.startPrayerService(lat, lng);
  }

  playPreview(soundId: string) {
    if (this.currentAudio) this.currentAudio.pause();
    const audioPath = `assets/sounds/${soundId}.mp3`;
    this.currentAudio = new Audio(audioPath);
    this.currentAudio.onloadedmetadata = () => {
      if (this.currentAudio) {
        this.currentAudio.currentTime = 10;
        this.currentAudio.play().catch(err => console.error("Oynatma hatası:", err));
      }
    };
  }

  stopPreview() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
  }

  async setLanguage(lang: string, reschedule = true) {
    this.currentLang = lang;
    this.langSubject.next(lang);
    try {
      await firstValueFrom(this.translate.use(lang));
      if (this._storage) await this._storage.set('appLang', lang);
      document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';
      if (reschedule) await this.scheduleAllPrayers();
    } catch (e) { console.error("Dil hatası", e); }
  }

  async setDarkMode(val: boolean) {
    this.isDarkMode = val;
    if (this._storage) await this._storage.set('isDarkMode', val);
    this.applyTheme(val);
  }

  private applyTheme(dark: boolean) {
    document.body.classList.toggle('dark-theme', dark);
  }

  async createAllEzanChannels() {
    try {
      for (const ses of this.ezanSoundsList) {
        await LocalNotifications.createChannel({
          id: 'ezan_channel_v17' + ses.id,
          name: 'Ezan: ' + ses.name,
          importance: 5,
          sound: ses.id,
          visibility: 1
        });
      }
    } catch (e) { console.error("Kanal oluşturma hatası:", e); }
  }

  async toggleLocation(enable: boolean) {
    this.locationEnabled = enable;
    if (this._storage) await this._storage.set('locationEnabled', enable);
    enable ? await this.startLocationWatch() : await this.stopLocationWatch();
  }

  private async startLocationWatch() {
    this.isLocationLoading = true;
    try {
      const perm = await Geolocation.requestPermissions();
      if (perm.location !== 'granted') {
        this.locationEnabled = false;
        return;
      }

      const callbackId = await Geolocation.watchPosition(
        { enableHighAccuracy: true, timeout: 10000 },
        (position) => {
          if (position) {
            const current = this.locationSubject.value;
            const dist = Math.abs(current.lat - position.coords.latitude) + Math.abs(current.lng - position.coords.longitude);
            if (dist > 0.01) {
              const newCoords = { lat: position.coords.latitude, lng: position.coords.longitude };
              this.locationSubject.next(newCoords);
              this.scheduleAllPrayers();
              if (this.isLiveNotificationEnabled) this.startPrayerService(newCoords.lat, newCoords.lng);
            }
          }
        }
      );
      this.watchId = callbackId;
    } catch (err) { this.locationEnabled = false; }
    finally { this.isLocationLoading = false; }
  }

  private async stopLocationWatch() {
    if (this.watchId) {
      await Geolocation.clearWatch({ id: this.watchId });
      this.watchId = null;
    }
    const savedCoords = await this._storage?.get('manualCoords');
    if (savedCoords) this.locationSubject.next(savedCoords);
    await this.scheduleAllPrayers();
  }

  async requestNotificationPermission(): Promise<boolean> {
    try {
      const status = await LocalNotifications.checkPermissions();
      if (status.display !== 'granted') {
        const res = await LocalNotifications.requestPermissions();
        return res.display === 'granted';
      }
      return true;
    } catch (e) { return false; }
  }
}
