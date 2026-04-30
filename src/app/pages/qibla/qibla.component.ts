import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Geolocation } from '@capacitor/geolocation';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-qibla',
  templateUrl: './qibla.component.html',
  styleUrls: ['./qibla.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule,TranslateModule]
})
export class QiblaComponent implements OnInit, OnDestroy {
  public Math = Math;

  currentHeading: number = 0;
  qiblaAngle: number = 0;
  isAligned: boolean = false;

  private lastHeading: number = 0;
  private smoothingFactor: number = 0.15;

  // Event referansını saklayalım ki OnDestroy'da silebilelim
  private orientationListener: any;

  constructor(private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    await this.initQibla();
  }

  async initQibla() {
    try {
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true
      });

      // Kıble açısını hesapla
      this.qiblaAngle = this.calculateQiblaAngle(
        coordinates.coords.latitude,
        coordinates.coords.longitude
      );

      this.startCompass();
    } catch (e) {
      console.error("Başlatma hatası:", e);
    }
  }

  calculateQiblaAngle(lat: number, lng: number): number {
    const KAABA_LAT = 21.422487;
    const KAABA_LNG = 39.826206;

    const phi1 = lat * (Math.PI / 180);
    const phi2 = KAABA_LAT * (Math.PI / 180);
    const lam1 = lng * (Math.PI / 180);
    const lam2 = KAABA_LNG * (Math.PI / 180);

    const y = Math.sin(lam2 - lam1);
    const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(lam2 - lam1);

    let angle = (Math.atan2(y, x) * (180 / Math.PI) + 360) % 360;

    // 🚀 ÖNEMLİ: Türkiye için Manyetik Sapma Düzeltmesi
    // Pusulalar Manyetik Kuzeyi gösterir, harita Gerçek Kuzeyi.
    // Aradaki farkı (Declination) kompanse ediyoruz.
    return (angle + 1.5) % 360;
  }

  startCompass() {
    const _window = window as any;

    this.orientationListener = (event: any) => {
      let heading = 0;

      // 1. iOS (Safari) Desteği - En Doğru Sonuç
      if (event.webkitCompassHeading !== undefined) {
        heading = event.webkitCompassHeading;
      }
      // 2. Android (Chrome) Absolute Desteği
      else if (event.alpha !== null) {
        // Android'de alpha değeri saat yönünün tersinedir, düzeltiyoruz
        heading = (360 - event.alpha) % 360;
      }

      if (heading !== undefined) {
        this.processHeading(heading);
      }
    };

    if (_window.DeviceOrientationEvent) {
      // Android için absolute modunu zorla
      if ('ondeviceorientationabsolute' in _window) {
        _window.addEventListener('deviceorientationabsolute', this.orientationListener, true);
      } else {
        _window.addEventListener('deviceorientation', this.orientationListener, true);
      }
    }
  }

  processHeading(heading: number) {
    // --- YUMUŞATMA VE 360 GEÇİŞ KORUMASI ---
    let diff = heading - this.lastHeading;
    if (diff > 180) heading -= 360;
    else if (diff < -180) heading += 360;

    this.currentHeading = this.lastHeading + this.smoothingFactor * (heading - this.lastHeading);
    this.currentHeading = (this.currentHeading + 360) % 360;
    this.lastHeading = this.currentHeading;

    this.checkAlignment();
    this.cdr.detectChanges();
  }

  async checkAlignment() {
    const diff = Math.abs(this.currentHeading - this.qiblaAngle);
    // 6 derecelik bir tolerans (el titremesi ve sensör sapması için en sağlıklısı)
    const aligned = diff < 6 || diff > 354;

    if (aligned && !this.isAligned) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    }
    this.isAligned = aligned;
  }

  ngOnDestroy() {
    const _window = window as any;
    if (this.orientationListener) {
      _window.removeEventListener('deviceorientationabsolute', this.orientationListener);
      _window.removeEventListener('deviceorientation', this.orientationListener);
    }
  }
}
