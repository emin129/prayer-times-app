import { Component, inject } from '@angular/core';
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
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent
} from "@ionic/angular/standalone";
import { addIcons } from 'ionicons';
import { shareSocialOutline, refreshOutline, leafOutline } from 'ionicons/icons';
import { Share } from '@capacitor/share';
import { TEFEUL_POOL } from 'src/app/beta';

@Component({
  selector: 'app-tefeul',
  templateUrl: './tefeul.page.html',
  styleUrls: ['./tefeul.page.scss'],
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
    IonButton,
    IonIcon,
    IonCard,
    IonCardContent,
    TranslateModule
  ]
})
export class TefeulPage {
  public isOpened = false;
  public currentNasihat: any = null;

  constructor() {
    addIcons({
      'share-social-outline': shareSocialOutline,
      'refresh-outline': refreshOutline,
      'leaf-outline': leafOutline
    });
  }

  acTefeul() {
    if (this.isOpened) return;

    // beta.ts içindeki 90 tane tefeülden rastgele seçiyoruz
    const randomIndex = Math.floor(Math.random() * TEFEUL_POOL.length);
    this.currentNasihat = TEFEUL_POOL[randomIndex];
    this.isOpened = true;
  }

  sifirla(event: Event) {
    event.stopPropagation();
    this.isOpened = false;
    // Küçük bir gecikmeyle null yapalım ki animasyon bozulmasın
    setTimeout(() => {
      this.currentNasihat = null;
    }, 300);
  }

  // HomePage'deki gibi sağlam paylaşım metodu
  async paylas(event: Event) {
    event.stopPropagation();
    if (!this.currentNasihat) return;

    const shareMessage = `"${this.currentNasihat.text}"\n\n— ${this.currentNasihat.source}`;

    try {
      const canShare = await Share.canShare();
      if (canShare.value) {
        await Share.share({
          title: 'Gönül Tefeülü',
          text: shareMessage,
          dialogTitle: 'Hayra Vesile Ol...',
        });
      } else if (navigator.share) {
        await navigator.share({
          title: 'Gönül Tefeülü',
          text: shareMessage,
        });
      }
    } catch (err) {
      console.log("Paylaşım iptal edildi.");
    }
  }
}
