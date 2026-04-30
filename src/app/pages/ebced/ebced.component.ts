import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonInput,
  IonItem,
  IonButton,
  IonIcon,
  IonLabel
} from "@ionic/angular/standalone";
import { addIcons } from 'ionicons';
import { trashOutline, colorWandOutline, calculatorOutline } from 'ionicons/icons';

@Component({
  selector: 'app-ebced',
  templateUrl: './ebced.component.html',
  styleUrls: ['./ebced.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonInput,
    IonItem,
    IonButton,
    IonIcon,
    IonLabel,
    TranslateModule
  ]
})
export class Ebced {
  public inputText: string = '';
  public totalValue: number = 0;
  public charAnalysis: { char: string, val: number }[] = [];

  // Ebced Haritası (Arapça Karşılıklar)
  private ebcedMap: { [key: string]: number } = {
    'ا': 1, 'أ': 1, 'إ': 1, 'آ': 1, 'ب': 2, 'ج': 3, 'د': 4, 'ه': 5, 'ة': 5,
    'و': 6, 'ز': 7, 'ح': 8, 'ط': 9, 'ي': 10, 'ى': 10, 'ك': 20, 'ل': 30,
    'م': 40, 'ن': 50, 'س': 60, 'ع': 70, 'ف': 80, 'ص': 90, 'ق': 100,
    'ر': 200, 'ش': 300, 'ت': 400, 'ث': 500, 'خ': 600, 'ذ': 700,
    'ض': 800, 'ظ': 900, 'غ': 1000
  };

  // Latin -> Arapça Eşleşmesi
  private latinToArabicMap: { [key: string]: string } = {
    'a': 'ا', 'b': 'ب', 'c': 'ج', 'ç': 'ج', 'd': 'د', 'e': 'ا', 'f': 'ف',
    'g': 'غ', 'ğ': 'غ', 'h': 'ه', 'ı': 'ي', 'i': 'ي', 'j': 'ج', 'k': 'ك',
    'l': 'ل', 'm': 'م', 'n': 'ن', 'o': 'و', 'ö': 'و', 'u': 'و', 'ü': 'و',
    'p': 'ب', 'r': 'ر', 's': 'س', 'ş': 'ش', 't': 'ت', 'v': 'و', 'y': 'ي', 'z': 'ز'
  };

  constructor() {
    addIcons({
      'trash-outline': trashOutline,
      'color-wand-outline': colorWandOutline,
      'calculator-outline': calculatorOutline
    });
  }

  calculateEbced() {
    this.totalValue = 0;
    this.charAnalysis = [];

    if (!this.inputText || !this.inputText.trim()) return;

    const text = this.inputText.toLowerCase();

    for (const char of text) {
      if (char === ' ') continue;

      let targetChar = char;
      // Eğer karakter direkt Ebced map'inde yoksa Latin'den çevir
      if (!this.ebcedMap[char]) {
        targetChar = this.latinToArabicMap[char] || '';
      }

      const val = this.ebcedMap[targetChar] || 0;

      if (val > 0) {
        this.totalValue += val;
        this.charAnalysis.push({
          char: char === targetChar ? char : `${char} (${targetChar})`,
          val: val
        });
      }
    }
  }

  public temizle() {
    this.inputText = '';
    this.totalValue = 0;
    this.charAnalysis = [];
  }
}
