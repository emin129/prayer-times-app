import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MosqueService, Mosque } from 'src/app/services/mosque';
import { SettingsService } from '../../services/settings';
import { NavController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
  IonBackButton, IonList, IonItem, IonLabel, IonIcon, IonSpinner, IonText, IonButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  locateOutline, navigateOutline, business, arrowForwardOutline, locationOutline,
  syncOutline, chevronBackOutline, speedometerOutline, timeOutline, arrowRedoOutline, scanOutline, thunderstormOutline, navigate, location
} from 'ionicons/icons';

@Component({
  selector: 'app-mosques',
  templateUrl: './mosque.component.html',
  styleUrls: ['./mosque.component.scss'],
  standalone: true,
  imports: [
    IonButton, CommonModule, IonContent, IonHeader, IonToolbar, IonTitle,
    IonButtons, IonBackButton, IonList, IonItem, IonLabel, IonIcon, IonSpinner, IonText,TranslateModule
  ]
})
export class MosquesComponent implements OnInit {
  private mosqueService = inject(MosqueService);
  private settingsService = inject(SettingsService);
  private navCtrl = inject(NavController);

  public mosqueList: Mosque[] = [];
  public isLoading = false;

  constructor() {
    addIcons({
      locateOutline, navigateOutline, business, arrowForwardOutline, locationOutline,
      syncOutline, chevronBackOutline, speedometerOutline, timeOutline, arrowRedoOutline,
      scanOutline, thunderstormOutline, navigate, location
    });
  }

  async ngOnInit() {
    // Sayfa açılır açmaz konumu isteyip yükleme yapıyoruz aga
    this.loadNearbyMosques();
  }

  async loadNearbyMosques() {
    this.isLoading = true;

    // 1. Varsayılan olarak senin o eski sabit koordinatları tutuyoruz
    let lat = this.settingsService.currentLat || 36.8841;
    let lon = this.settingsService.currentLon || 30.7056;

    // 2. Cihazda GPS özelliği var mı diye kontrol ediyoruz
    if ('geolocation' in navigator) {
      try {
        // Kullanıcıdan konum izni isteyen o meşhur tarayıcı penceresini açar
        const position = await this.getCurrentLocation();
        lat = position.coords.latitude;
        lon = position.coords.longitude;
        console.log('Canlı konum alındı:', lat, lon);
      } catch (error) {
        // Kullanıcı izin vermezse veya GPS kapalıysa buraya düşer
        console.warn('Konum alınamadı, sabit koordinatlara dönülüyor.', error);
      }
    }

    // 3. İster canlı konum olsun ister sabit, servise gönderip camileri çekiyoruz
    this.mosqueList = await this.mosqueService.getNearbyMosques(lat, lon);
    this.isLoading = false;
  }

  // Tarayıcının konum sorma işlemini Promise'e çeviren yardımcı fonksiyon
  private getCurrentLocation(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 } // Yüksek doğruluk ve 5 sn zaman aşımı
      );
    });
  }

  goBack() {
    this.navCtrl.back();
  }

  openMap(mosque: Mosque) {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 30, 50]);
    }

    const lat = mosque.lat;
    const lon = mosque.lon;

    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
    window.open(url, '_system');
  }
}
