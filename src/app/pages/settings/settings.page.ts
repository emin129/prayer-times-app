import { Component, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; // 🚀 Premium sayfasına yönlendirme için eklendi
import {
  ActionSheetController, AlertController,
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonIcon, IonButton, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonSpinner, IonSelect, IonSelectOption,
  IonList, IonItem, IonLabel, IonNote, IonToggle, IonModal, IonButtons,
  IonAlert
} from '@ionic/angular/standalone';
import { SettingsService } from 'src/app/services/settings';
import { addIcons } from 'ionicons';
import {
  locationOutline, moonOutline, chevronForward,
  languageOutline, volumeHighOutline, volumeMuteOutline,
  notificationsOutline, timeOutline, musicalNotesOutline,
  checkmarkCircle, radioButtonOff, radioButtonOn, ellipseOutline,
  musicalNote, informationCircleOutline, closeCircleOutline,
  logoGithub, logoLinkedin, playCircleOutline, mapOutline, lockClosedOutline,
  diamondOutline
} from 'ionicons/icons';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, TranslateModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonIcon, IonButton, IonCard, IonCardHeader,
    IonCardTitle, IonCardContent, IonSpinner,
    IonSelect, IonSelectOption, IonList, IonItem,
    IonLabel, IonNote, IonToggle, IonModal, IonButtons
  ]
})
export class SettingsPage {
  public settingsService = inject(SettingsService);
  private actionSheetCtrl = inject(ActionSheetController);
  private alertCtrl = inject(AlertController);
  private translate = inject(TranslateService);
  private zone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router); // 🚀 Router inject edildi

  public prayers = ['FAJR', 'DHUHR', 'ASR', 'MAGHRIB', 'ISHA'];
  public isEzanModalOpen = false;
  public isAboutModalOpen = false;
  public selectedPrayerForSound: string = '';

  constructor() {
    addIcons({
      locationOutline, moonOutline, chevronForward,
      languageOutline, volumeHighOutline, volumeMuteOutline,
      notificationsOutline, timeOutline, musicalNotesOutline,
      checkmarkCircle, radioButtonOff, radioButtonOn, ellipseOutline,
      musicalNote, informationCircleOutline, closeCircleOutline,
      logoGithub, logoLinkedin, playCircleOutline, mapOutline, lockClosedOutline,
      diamondOutline
    });
  }

  // 🚀 Kullanıcı ayarlar kartına bastığında bu fonksiyon tetiklenecek
  buyPremium() {
    this.router.navigate(['/premium']);
  }

  getJsonKey(p: string): string {
    if (!p) return p;
    return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
  }

  // --- CANLI BİLDİRİM TOGGLE ---
  async toggleLiveNotification(event: any) {
    const isEnabled = event.target.checked;

    this.zone.run(async () => {
      if (isEnabled) {
        const hasPermission = await this.settingsService.requestNotificationPermission();

        if (!hasPermission) {
          event.target.checked = false;
          await this.settingsService.setLiveNotification(false);
          this.cdr.detectChanges();
          return;
        }
      }
      await this.settingsService.setLiveNotification(isEnabled);
      this.cdr.detectChanges();
    });
  }

  // --- ADHAN (EZAN) METHODS ---
  openEzanModal(prayerKey: string) {
    this.selectedPrayerForSound = prayerKey;
    this.isEzanModalOpen = true;
  }

  async selectEzan(soundId: string) {
    if (!this.selectedPrayerForSound) return;
    this.settingsService.stopPreview();
    this.zone.run(async () => {
      await this.settingsService.updatePrayerEzanSound(this.selectedPrayerForSound, soundId);
      this.isEzanModalOpen = false;
      this.selectedPrayerForSound = '';
      this.cdr.detectChanges();
    });
  }

  playEzanPreview(soundId: string, event: Event) {
    event.stopPropagation();
    this.settingsService.playPreview(soundId);
  }

  getActiveEzanName(prayerKey: string) {
    const soundId = this.settingsService.prayerSettings[prayerKey]?.ezanSound || 'ezan';
    return this.settingsService.ezanSoundsList.find(s => s.id === soundId)?.name || 'Kabe';
  }

  ionViewWillLeave() {
    this.settingsService.stopPreview();
  }

  // --- CORE TOGGLES & LOCATION ---
  async toggleDarkTheme(event: any) {
    const isDark = event.target.checked;
    this.zone.run(async () => {
      await this.settingsService.setDarkMode(isDark);
      this.cdr.detectChanges();
    });
  }

  async onLocationToggleNative(event: any) {
    const isEnabled = event.target.checked;
    this.zone.run(async () => {
      await this.settingsService.toggleLocation(isEnabled);
      this.cdr.detectChanges();
    });
  }

  async openCityPicker() {
    const buttons = this.settingsService.cityList.map(city => ({
      text: city.name,
      handler: () => {
        this.settingsService.setManualLocation(city);
        this.cdr.detectChanges();
      }
    }));
    const actionSheet = await this.actionSheetCtrl.create({
      header: this.translate.instant('SETTINGS.SELECT_CITY'),
      buttons: [...buttons, { text: this.translate.instant('CANCEL'), role: 'cancel' }]
    });
    await actionSheet.present();
  }

  // --- LANGUAGE PICKER ---
  async openLanguagePicker() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: this.translate.instant('SELECT_LANGUAGE'),
      mode: 'ios',
      buttons: [
        { text: 'Türkçe', handler: () => this.deferredLangChange('tr') },
        { text: 'English', handler: () => this.deferredLangChange('en') },
        { text: 'العربية', handler: () => this.deferredLangChange('ar') },
        { text: this.translate.instant('CANCEL'), role: 'cancel' }
      ]
    });
    await actionSheet.present();
  }

  private deferredLangChange(lang: string) {
    setTimeout(() => {
      this.zone.run(async () => {
        await this.settingsService.setLanguage(lang);
        this.cdr.detectChanges();
      });
    }, 70);
  }

  async updatePrayer(prayer: string, key: string, value: any) {
    this.zone.run(async () => {
      await this.settingsService.updatePrayerSetting(prayer, key, value);
      this.cdr.detectChanges();

      if (key === 'notify' && value === true) {
        await this.settingsService.scheduleAllPrayers();
      }
    });
  }

  openSocial(url: string) {
    window.open(url, '_system');
  }
}
