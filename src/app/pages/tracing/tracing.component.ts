import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  addCircle, removeCircleOutline, trashOutline, addOutline,
  createOutline, checkmarkCircle, checkmarkDoneCircle, checkmarkSharp,
  notifications, notificationsOffOutline, todayOutline, timeOutline,
  radioButtonOnOutline, checkmarkDoneCircleOutline
} from 'ionicons/icons';
import { SettingsService } from 'src/app/services/settings';

@Component({
  selector: 'app-tracing',
  templateUrl: './tracing.component.html',
  styleUrls: ['./tracing.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule,TranslateModule]
})
export class TracingComponent implements OnInit {

  isNotificationsEnabled: boolean = true;

  kazaData: any = {
    sabah: { kalan: 0, toplam: 0 },
    ogle: { kalan: 0, toplam: 0 },
    ikindi: { kalan: 0, toplam: 0 },
    aksam: { kalan: 0, toplam: 0 },
    yatsi: { kalan: 0, toplam: 0 },
    vitir: { kalan: 0, toplam: 0 }
  };

  // Vitir eklendi ki otomatik kaza aktarımı onu da yakalasın
  dailyPrayers = [
    { id: 'fajr', label: 'S', full: 'Sabah', kildi: false, color: 'primary' },
    { id: 'dhuhr', label: 'Ö', full: 'Öğle', kildi: false, color: 'secondary' },
    { id: 'asr', label: 'İ', full: 'İkindi', kildi: false, color: 'tertiary' },
    { id: 'maghrib', label: 'A', full: 'Akşam', kildi: false, color: 'success' },
    { id: 'isha', label: 'Y', full: 'Yatsı', kildi: false, color: 'warning' },
    { id: 'vitir', label: 'V', full: 'Vitir', kildi: false, color: 'danger' }
  ];

  vakitler = [
    { id: 'sabah', label: 'Sabah', color: 'primary' },
    { id: 'ogle', label: 'Öğle', color: 'secondary' },
    { id: 'ikindi', label: 'İkindi', color: 'tertiary' },
    { id: 'aksam', label: 'Akşam', color: 'success' },
    { id: 'yatsi', label: 'Yatsı', color: 'warning' },
    { id: 'vitir', label: 'Vitir', color: 'danger' }
  ];

  constructor(
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    public settingsService: SettingsService
  ) {
    addIcons({
      addCircle, removeCircleOutline, trashOutline, addOutline,
      createOutline, checkmarkCircle, checkmarkDoneCircle, checkmarkSharp,
      notifications, notificationsOffOutline, todayOutline, timeOutline,
      radioButtonOnOutline, checkmarkDoneCircleOutline
    });
  }

  ngOnInit() {
    this.loadAllData();
    // Veriler yüklendikten sonra aktarım kontrolü yap
    setTimeout(() => {
      this.checkAndTransferToKaza();
    }, 500);
  }

  loadAllData() {
    // 1. Kaza verilerini yükle
    const kazaSaved = localStorage.getItem('kaza_namazi_v2');
    if (kazaSaved) this.kazaData = JSON.parse(kazaSaved);

    // 2. Günlük eda durumlarını yükle
    const dailySaved = localStorage.getItem('daily_prayer_status');
    if (dailySaved) {
      const parsed = JSON.parse(dailySaved);
      this.dailyPrayers.forEach(p => {
        const found = parsed.find((x: any) => x.id === p.id);
        if (found) p.kildi = found.kildi;
      });
    }

    // 3. Bildirim tercihi (SettingsService ile senkronize)
    const savedNotify = localStorage.getItem('is_daily_notify_enabled');
    this.isNotificationsEnabled = savedNotify !== 'false';
    this.settingsService.isDailyReminderEnabled = this.isNotificationsEnabled;
  }

  async toggleNotifications() {
    this.isNotificationsEnabled = !this.isNotificationsEnabled;
    this.settingsService.isDailyReminderEnabled = this.isNotificationsEnabled;
    localStorage.setItem('is_daily_notify_enabled', this.isNotificationsEnabled.toString());

    if (this.isNotificationsEnabled) {
      await this.settingsService.scheduleDailyPrayerReminder();
      this.presentToast("Hatırlatıcılar açıldı (21:30).");
    } else {
      await this.settingsService.cancelDailyReminder();
      this.presentToast("Hatırlatıcılar kapatıldı.");
    }
  }

  checkAndTransferToKaza() {
    const lastCheckDate = localStorage.getItem('last_check_date');
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD formatı (en güvenlisi)

    if (lastCheckDate && lastCheckDate !== today) {
      let eklenenBorc = 0;

      // Kayıtlı dünkü verileri baz al
      const dailySaved = localStorage.getItem('daily_prayer_status');
      const prayersToCheck = dailySaved ? JSON.parse(dailySaved) : this.dailyPrayers;

      prayersToCheck.forEach((p: any) => {
        if (!p.kildi) {
          const kazaId = this.mapDailyToKaza(p.id);
          if (kazaId && this.kazaData[kazaId]) {
            this.kazaData[kazaId].kalan += 1;
            this.kazaData[kazaId].toplam += 1;
            eklenenBorc++;
          }
        }
        // Objedeki kildi durumunu yeni gün için temizle
        const localPrayer = this.dailyPrayers.find(dp => dp.id === p.id);
        if (localPrayer) localPrayer.kildi = false;
      });

      if (eklenenBorc > 0) {
        this.kazaData = { ...this.kazaData }; // UI Güncelleme tetikle
        this.saveKazaData();
        this.presentToast(`Dünden kılınmayan ${eklenenBorc} vakit kazaya eklendi.`);
      }

      // Yeni günün temiz listesini kaydet
      localStorage.setItem('daily_prayer_status', JSON.stringify(this.dailyPrayers));
    }
    localStorage.setItem('last_check_date', today);
  }

  mapDailyToKaza(dailyId: string): string {
    const mapping: any = {
      'fajr':'sabah',
      'dhuhr':'ogle',
      'asr':'ikindi',
      'maghrib':'aksam',
      'isha':'yatsi',
      'vitir':'vitir'
    };
    return mapping[dailyId];
  }

  toggleDaily(prayer: any) {
    prayer.kildi = !prayer.kildi;
    localStorage.setItem('daily_prayer_status', JSON.stringify(this.dailyPrayers));
    if (prayer.kildi) this.presentToast(`${prayer.full} kılındı.`);
  }

  updateCount(vakitId: string, amount: number) {
    const current = this.kazaData[vakitId];
    if (current.kalan + amount >= 0) {
      current.kalan += amount;
      if (current.kalan > current.toplam) current.toplam = current.kalan;
      this.kazaData = { ...this.kazaData };
      this.saveKazaData();
    }
  }

  saveKazaData() {
    localStorage.setItem('kaza_namazi_v2', JSON.stringify(this.kazaData));
  }

  async editBorc(vakitId: string) {
    const alert = await this.alertCtrl.create({
      header: 'Borç Düzenle',
      inputs: [{ name: 'num', type: 'number', value: this.kazaData[vakitId].kalan }],
      buttons: [
        { text: 'İptal', role: 'cancel' },
        {
          text: 'Kaydet',
          handler: (data) => {
            const val = parseInt(data.num);
            if (!isNaN(val) && val >= 0) {
              this.kazaData[vakitId].toplam = val;
              this.kazaData[vakitId].kalan = val;
              this.kazaData = { ...this.kazaData };
              this.saveKazaData();
            }
          }
        }
      ]
    });
    await alert.present();
  }

  getProgress(vakitId: string): number {
    const v = this.kazaData[vakitId];
    return (v && v.toplam > 0) ? Math.max(0, Math.min(1, (v.toplam - v.kalan) / v.toplam)) : 0;
  }

  async presentToast(msg: string) {
    const toast = await this.toastCtrl.create({ message: msg, duration: 2000, color: 'dark', position: 'bottom' });
    await toast.present();
  }

  async resetAll() {
    const alert = await this.alertCtrl.create({
      header: 'Sıfırla?',
      message: 'Tüm veriler silinecek!',
      buttons: [
        { text: 'Hayır', role: 'cancel' },
        { text: 'Evet', handler: () => { localStorage.clear(); location.reload(); } }
      ]
    });
    await alert.present();
  }
}
