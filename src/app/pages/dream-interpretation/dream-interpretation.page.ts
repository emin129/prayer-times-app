import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonLabel,
  IonTextarea, IonButton, IonSpinner, IonButtons, IonBackButton, IonIcon, AlertController
} from "@ionic/angular/standalone";
import { addIcons } from 'ionicons';
import {
  moonOutline, sparklesOutline, sparkles, sparklesSharp, refreshOutline, arrowBackOutline, videocamOutline, refreshCircleOutline
} from 'ionicons/icons';
import { GeminiService } from 'src/app/services/gemini';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AppComponent } from 'src/app/app.component';
import { SettingsService } from 'src/app/services/settings';

import { initializeApp, getApps } from 'firebase/app';
// @ts-ignore
import { getAuth, signInAnonymously } from "firebase/auth";
// @ts-ignore
import { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

if (!getApps().length) {
  initializeApp({
    apiKey: "AIzaSyD4WEOM4ukj7HmWE6A7LUGnxmZSxAC4TU8",
    authDomain: "quiz-dini.firebaseapp.com",
    projectId: "quiz-dini",
    storageBucket: "quiz-dini.firebasestorage.app",
    messagingSenderId: "30601030862",
    appId: "1:30601030862:web:71ff6fa42e50f4dce9f49f"
  });
}

@Component({
  selector: 'app-dream-interpretation',
  templateUrl: './dream-interpretation.page.html',
  styleUrls: ['./dream-interpretation.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, TranslateModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonLabel,
    IonTextarea, IonButton, IonSpinner, IonButtons, IonBackButton, IonIcon
  ]
})
export class DreamInterpretationPage implements OnInit {
  public dreamInput: string = '';
  public result: string = '';
  public isLoading: boolean = false;

  public remainingRights: number = 0;
  public watchedAdsCount: number = 0;

  private userId: string = '';
  private db: any = getFirestore();
  private auth: any = getAuth();

  private geminiService = inject(GeminiService);
  private translate = inject(TranslateService);
  private appComponent = inject(AppComponent);
  private alertCtrl = inject(AlertController);
  private settingsService = inject(SettingsService);

  get isPremium(): boolean {
    return this.settingsService.isPremium;
  }

  constructor() {
    addIcons({
      'moon-outline': moonOutline,
      'sparkles-outline': sparklesOutline,
      'sparkles': sparkles,
      'sparkles-sharp': sparklesSharp,
      'refresh-outline': refreshOutline,
      'arrow-back-outline': arrowBackOutline,
      'videocam-outline': videocamOutline,
      'refresh-circle-outline': refreshCircleOutline
    });
  }

  ngOnInit() {}

  async ionViewWillEnter() {
    if (!this.isPremium) {
      this.appComponent.prepareRewardedAd();
    }
    await this.initializeUserAndRights();
  }

  getTRDateString(): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Istanbul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
  }

  async initializeUserAndRights() {
    try {
      if (!this.userId) {
        const userCredential = await signInAnonymously(this.auth);
        this.userId = userCredential.user.uid;
      }
      await this.checkAndLoadRights();
    } catch (error: any) {
      console.error("Firebase Auth Hatası:", error);
    }
  }

  async checkAndLoadRights() {
    if (!this.userId) return;

    const userDocRef = doc(this.db, "users", this.userId);
    const docSnap = await getDoc(userDocRef);

    const todayStr = this.getTRDateString();
    const defaultRights = this.isPremium ? 6 : 1;

    if (!docSnap.exists()) {
      await setDoc(userDocRef, {
        rights: defaultRights,
        adsCount: 0,
        isPremiumRecord: this.isPremium,
        lastResetDay: todayStr
      });
      this.remainingRights = defaultRights;
      this.watchedAdsCount = 0;
    } else {
      const data: any = docSnap.data();
      const dbWasPremium = data['isPremiumRecord'] || false;
      const lastResetDay = data['lastResetDay'] || '';

      if (this.isPremium && !dbWasPremium) {
        await updateDoc(userDocRef, {
          rights: 6,
          adsCount: 0,
          isPremiumRecord: true,
          lastResetDay: todayStr
        });
        this.remainingRights = 6;
        this.watchedAdsCount = 0;
      }
      else if (!lastResetDay || todayStr !== lastResetDay) {
        await updateDoc(userDocRef, {
          rights: defaultRights,
          adsCount: 0,
          lastResetDay: todayStr,
          isPremiumRecord: this.isPremium
        });
        this.remainingRights = defaultRights;
        this.watchedAdsCount = 0;
      }
      else {
        this.remainingRights = data['rights'] ?? 0;
        this.watchedAdsCount = data['adsCount'] || 0;
      }
    }
  }

  async onInterpret() {
    if (!this.dreamInput.trim() || this.isLoading) return;

    if (this.remainingRights <= 0) {
      await this.checkAndShowAlert();
      return;
    }

    this.isLoading = true;
    this.result = '';

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      const response: any = await this.geminiService.interpretDream(this.dreamInput);
      const interpretation = response?.candidates?.[0]?.content?.parts?.[0]?.text || response?.text;

      if (interpretation) {
        this.remainingRights--;

        const userDocRef = doc(this.db, "users", this.userId);
        await updateDoc(userDocRef, {
          rights: this.remainingRights
        });

        this.result = interpretation.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

        if (this.remainingRights === 0) {
          setTimeout(() => { this.checkAndShowAlert(); }, 500);
        }
      } else {
        throw new Error('API format hatası');
      }
    } catch (error: any) {
      console.error("Yorumlama Hatası:", error);
      this.result = "Şu an rüya yorumlanamıyor. Lütfen internetinizi kontrol edip tekrar deneyiniz.";
    } finally {
      this.isLoading = false;
    }
  }

  async checkAndShowAlert() {
    const header = this.remainingRights <= 0 ? 'Hakkınız Bitti' : 'Bilgi';
    let message = '';
    let buttons: any[] = [{ text: 'Tamam', role: 'cancel' }];

    if (this.isPremium) {
      message = 'Günlük 6 rüya yorumlatma hakkınız dolmuştur. Yarın tekrar bekleriz!';
    } else if (this.watchedAdsCount < 2) {
      message = `Bugünlük hakkınız doldu. Reklam izleyerek +1 hak kazanmak ister misiniz? (Kalan Reklam: ${2 - this.watchedAdsCount})`;
      buttons.push({
        text: 'İzle ve Kazan',
        handler: () => { this.watchAdForReward(); }
      });
    } else {
      message = 'Bugünlük tüm haklarınız bitmiştir. Yarın tekrar bekleriz.';
    }

    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons,
      mode: 'ios'
    });
    await alert.present();
  }

  async watchAdForReward() {
    if (this.isPremium || !this.userId) return;

    this.isLoading = true;
    try {
      const rewardEarned = await this.appComponent.showRewardedAd();
      if (rewardEarned) {
        this.remainingRights++;
        this.watchedAdsCount++;

        const userDocRef = doc(this.db, "users", this.userId);
        await updateDoc(userDocRef, {
          rights: this.remainingRights,
          adsCount: this.watchedAdsCount
        });

        this.appComponent.prepareRewardedAd();
        this.result = "<b>Tebrikler!</b> 1 yeni hak kazandınız. Rüyanızı şimdi yorumlatabilirsiniz.";
      }
    } catch (e) {
      console.error("Reklam hatası:", e);
    } finally {
      this.isLoading = false;
    }
  }

  public clearPage() {
    this.dreamInput = '';
    this.result = '';
  }
}
