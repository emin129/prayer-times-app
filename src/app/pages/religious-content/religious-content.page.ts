import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ReligiousService } from 'src/app/services/religious';
import { SettingsService } from 'src/app/services/settings';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonList, IonItem, IonLabel, IonIcon, IonBadge, IonDatetime,
  IonDatetimeButton, IonModal, IonCard, IonCardHeader, IonCardTitle,
  IonCardContent, IonSpinner, IonGrid, IonRow, IonCol
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  moonOutline, sunnyOutline, cloudOutline, partlySunnyOutline,
  pizzaOutline, starOutline, timeOutline, calendarOutline,
  bookOutline, informationCircleOutline, chevronForwardOutline
} from 'ionicons/icons';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-religious-content',
  templateUrl: './religious-content.page.html',
  styleUrls: ['./religious-content.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonToolbar,
    IonTitle, IonButtons, IonBackButton, IonList, IonItem, IonLabel,
    IonIcon, IonBadge, IonDatetime, IonDatetimeButton, IonModal,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonSpinner,
    IonGrid, IonRow, IonCol,TranslateModule
  ]
})
export class ReligiousContentPage implements OnInit {
  private route = inject(ActivatedRoute);
  private religiousService = inject(ReligiousService);
  private settingsService = inject(SettingsService);

  contentId: string = '';
  pageTitle: string = '';
  items: any = null;
  today = new Date();
  selectedDate: string = new Date().toISOString();
  convertedHicri: string = '';

  constructor() {
    addIcons({
      moonOutline, sunnyOutline, cloudOutline, partlySunnyOutline,
      pizzaOutline, starOutline, timeOutline, calendarOutline,
      bookOutline, informationCircleOutline, chevronForwardOutline
    });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.contentId = params.get('id') || '';
      this.setupPage();
    });
  }

  setupPage() {
    const titleMap: { [key: string]: string } = {
      'tasbihat': 'Sabah Tesbihatı',
      'holy-days': 'Dini Günler Ajandası',
      'esmaul-husna': 'Esmaül Hüsna',
      'imsakiye': '3 Aylık İmsakiye',
      'converter': 'Takvim Dönüştürücü'
    };
    this.pageTitle = titleMap[this.contentId] || 'Detaylar';

    if (this.contentId === 'imsakiye') {
      this.loadImsakiye();
    } else if (this.contentId === 'converter') {
      this.items = {};
      this.convert();
    } else {
      this.religiousService.getDataById(this.contentId).subscribe((res: any) => {
        this.items = res;
      });
    }
  }

  convert() {
    const dateObj = new Date(this.selectedDate);
    this.convertedHicri = new Intl.DateTimeFormat('tr-TR-u-ca-islamic-uma', {
      day: 'numeric', month: 'long', year: 'numeric'
    }).format(dateObj);
  }

  loadImsakiye() {
    const lat = this.settingsService.currentLat;
    const lng = this.settingsService.currentLon;
    this.religiousService.getThreeMonthCalendar(lat, lng).subscribe({
      next: (allDays) => {
        this.items = allDays.map((day: any) => ({
          tarih: this.translateDateToTR(day.date.readable),
          hicri: `${day.date.hijri.day} ${day.date.hijri.month.tr || day.date.hijri.month.en}`,
          vakitler: [
            { label: 'İmsak', time: day.timings.Imsak.split(' ')[0] },
            { label: 'Güneş', time: day.timings.Sunrise.split(' ')[0] },
            { label: 'Öğle', time: day.timings.Dhuhr.split(' ')[0] },
            { label: 'İkindi', time: day.timings.Asr.split(' ')[0] },
            { label: 'Akşam', time: day.timings.Maghrib.split(' ')[0] },
            { label: 'Yatsı', time: day.timings.Isha.split(' ')[0] }
          ]
        }));
      }
    });
  }

  isUpcoming(dateStr: string): boolean {
    if (this.contentId !== 'holy-days' || !dateStr) return false;
    try {
      const itemDate = this.parseTurkishDate(dateStr);
      const diffTime = itemDate.getTime() - this.today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 30;
    } catch { return false; }
  }

  private parseTurkishDate(dateStr: string): Date {
    const months: any = { "Ocak": 0, "Şubat": 1, "Mart": 2, "Nisan": 3, "Mayıs": 4, "Haziran": 5, "Temmuz": 6, "Ağustos": 7, "Eylül": 8, "Ekim": 9, "Kasım": 10, "Aralık": 11 };
    const parts = dateStr.split(' ');
    const year = parts[2] ? parseInt(parts[2]) : new Date().getFullYear();
    return new Date(year, months[parts[1]], parseInt(parts[0]));
  }

  private translateDateToTR(dateStr: string): string {
    const months: any = { 'Jan': 'Oca', 'Feb': 'Şub', 'Mar': 'Mar', 'Apr': 'Nis', 'May': 'May', 'Jun': 'Haz', 'Jul': 'Tem', 'Aug': 'Ağu', 'Sep': 'Eyl', 'Oct': 'Eki', 'Nov': 'Kas', 'Dec': 'Ara' };
    let translated = dateStr;
    Object.keys(months).forEach(enMonth => {
      translated = translated.replace(new RegExp(enMonth, 'g'), months[enMonth]);
    });
    return translated;
  }

  getVakitIcon(label: string): string {
    const icons: { [key: string]: string } = { 'İmsak': 'moon-outline', 'Güneş': 'sunny-outline', 'Öğle': 'cloud-outline', 'İkindi': 'partly-sunny-outline', 'Akşam': 'pizza-outline', 'Yatsı': 'star-outline' };
    return icons[label] || 'time-outline';
  }
}
