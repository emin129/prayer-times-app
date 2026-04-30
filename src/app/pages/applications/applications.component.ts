import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { TranslateModule } from '@ngx-translate/core';

// Tüm gerekli ikonlar (IslamAI ve Kazalar dahil)
import {
  fingerPrintOutline,
  compassOutline,
  calculatorOutline,
  listCircleOutline,
  sparklesOutline,       // IslamAI için
  calendarClearOutline,
  calendarNumberOutline,  // Kazalar için
  bookOutline,
  shieldCheckmarkOutline,
  notificationsOutline,
  cloudOutline,
  banOutline,
  settingsOutline,
  timeOutline,           // İmsakiye için
  swapHorizontalOutline, // Çevirici için
  videocamOutline,       // Canlı Yayın için
  radioOutline,          // Radyo için
  megaphoneOutline,
  bulbOutline,
  layersOutline,
  scanOutline,
  locationOutline,
  navigateOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-applications',
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, IonicModule,TranslateModule]
})
export class ApplicationsComponent implements OnInit {
  constructor() {
    addIcons({
      'finger-print': fingerPrintOutline,
      'compass': compassOutline,
      'calculator': calculatorOutline,
      'list-circle-outline': listCircleOutline,
      'sparkles-outline': sparklesOutline,
      'calendar-clear-outline': calendarClearOutline,
      'calendar-number-outline': calendarNumberOutline,
      'book': bookOutline,
      'shield-checkmark-outline': shieldCheckmarkOutline,
      'notifications-outline': notificationsOutline,
      'cloud-outline': cloudOutline,
      'ban': banOutline,
      'settings-outline': settingsOutline,
      'time-outline': timeOutline,
      'swap-horizontal-outline': swapHorizontalOutline,
      'videocam-outline': videocamOutline,
      'radio-outline': radioOutline,
      'megaphone-outline': megaphoneOutline,
      'intellectual-outline': bulbOutline,
      'layers-outline': layersOutline,

      // 🔥 HTML'DE ÇAĞIRACAĞIN İSİMLERİ DE BURAYA TANIMLADIK
      'scan-outline': scanOutline,
      'location-outline': locationOutline,
      'navigate-outline': navigateOutline
    });
  }

  ngOnInit() {}

  // Boykot linkini dış tarayıcıda açar
  openBoykot() {
    window.open('https://boykotdedektifi.com/', '_system');
  }

  openLive() {
    window.open('https://youtu.be/7pA7vU3JTAw', '_system'); // URL sonundaki tırnağı da temizledim aga
  }

  // Reklam kaldırma mantığı
  askAI() {
    console.log('IslamAI tıklandı');
    alert('Bu özellik yakında eklenecek!');
  }
}
