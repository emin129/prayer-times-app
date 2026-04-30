import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import {
  IonContent, IonButton, IonIcon, IonInput, IonSelect, IonSelectOption,
  IonDatetime, IonDatetimeButton, IonModal
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  calendarOutline, moonOutline, swapHorizontalOutline, syncOutline,
  chevronDownCircle, shieldCheckmarkOutline, moon, calendar
} from 'ionicons/icons';

@Component({
  selector: 'app-converter',
  templateUrl: './converter.component.html',
  styleUrls: ['./converter.component.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonButton, IonIcon, IonInput,
    IonSelect, IonSelectOption, IonDatetime, IonDatetimeButton, IonModal, TranslateModule
  ]
})
export class ConverterComponent implements OnInit {

  isMiladiToHicri = true;
  isRotating = false;

  selectedMiladiDate: string = new Date().toISOString().split('T')[0];

  hDay = 1;
  hMonth = 11; // Zilkade varsayılan
  hYear = 1447;

  convertedResult = '';

  monthsHicri = [
    'Muharrem', 'Safer', 'Rebiülevvel', 'Rebiülahir',
    'Cemaziyelevvel', 'Cemaziyeilahir',
    'Recep', 'Şaban', 'Ramazan',
    'Şevval', 'Zilkade', 'Zilhicce'
  ];

  constructor() {
    addIcons({
      calendarOutline, moonOutline, swapHorizontalOutline, syncOutline,
      chevronDownCircle, shieldCheckmarkOutline, moon, calendar
    });
  }

  ngOnInit() {
    this.convert();
  }

  onDateChange(event: any) {
    const value = event.detail.value;
    if (!value) return;
    this.selectedMiladiDate = value.split('T')[0];
    this.convert();
  }

  toggleMode() {
    this.isRotating = true;
    this.isMiladiToHicri = !this.isMiladiToHicri;
    setTimeout(() => {
      this.convert();
      this.isRotating = false;
    }, 200);
  }

  convert() {
    this.isMiladiToHicri ? this.convertToHicri() : this.convertToMiladi();
  }

  // =========================
  // MILADI -> HICRI
  // =========================
  private convertToHicri() {
    try {
      const d = new Date(this.selectedMiladiDate);
      const jd = this.miladiToJulian(d.getFullYear(), d.getMonth() + 1, d.getDate());

      // 10633 sabiti ile +1 gün düzeltmesi yapıldı (8 Zilkade için)
      let l = Math.floor(jd) - 1948440 + 10633;
      let n = Math.floor((l - 1) / 10631);
      l = l - 10631 * n + 354;
      let j = (Math.floor((10985 - l) / 5316)) * (Math.floor((50 * l) / 17719)) +
              (Math.floor(l / 5670)) * (Math.floor((43 * l) / 15238));
      l = l - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) -
          (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;

      let m = Math.floor((24 * l) / 709);
      let day = l - Math.floor((709 * m) / 24);
      let month = m;
      let year = 30 * n + j - 30;

      this.convertedResult = `${day} ${this.monthsHicri[month - 1]} ${year}`;

    } catch (e) {
      this.convertedResult = 'Geçersiz Tarih';
    }
  }

  // =========================
  // HICRI -> MILADI
  // =========================
  private convertToMiladi() {
    try {
      const jd = this.hicriToJulian(Number(this.hYear), Number(this.hMonth), Number(this.hDay));
      const date = this.julianToMiladi(jd);

      this.convertedResult = new Intl.DateTimeFormat('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(date);
    } catch (e) {
      this.convertedResult = 'Geçersiz Tarih';
    }
  }

  private miladiToJulian(year: number, month: number, day: number): number {
    if (month <= 2) { year -= 1; month += 12; }
    const a = Math.floor(year / 100);
    const b = 2 - a + Math.floor(a / 4);
    return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + b - 1524.5;
  }

  private hicriToJulian(y: number, m: number, d: number): number {
    // Hicri -> Miladi kısmında da uyum için -10633 mantığı kullanılır
    return d + Math.ceil(29.5 * (m - 1)) + (y - 1) * 354 + Math.floor((3 + 11 * y) / 30) + 1948440 - 2;
  }

  private julianToMiladi(jd: number): Date {
    const z = Math.floor(jd + 0.5);
    const a = Math.floor((z - 1867216.25) / 36524.25);
    const b = z + 1 + a - Math.floor(a / 4) + 1524;
    const c = Math.floor((b - 122.1) / 365.25);
    const d = Math.floor(365.25 * c);
    const e = Math.floor((b - d) / 30.6001);
    const day = b - d - Math.floor(30.6001 * e);
    const month = e < 14 ? e - 1 : e - 13;
    const year = month > 2 ? c - 4716 : c - 4715;
    return new Date(year, month - 1, day);
  }

  setToToday() {
    this.selectedMiladiDate = new Date().toISOString().split('T')[0];
    this.isMiladiToHicri = true;
    this.convert();
  }
}
