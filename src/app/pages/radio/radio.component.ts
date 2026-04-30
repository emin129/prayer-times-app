import { Component, OnDestroy, inject, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
  IonBackButton, IonIcon, IonSpinner, IonList, IonLabel, IonText, IonItem
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  playOutline, pauseOutline, radioOutline, volumeHighOutline,
  bookOutline, micOutline, heartOutline, pauseCircle, playCircleOutline
} from 'ionicons/icons';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-radio-player',
  templateUrl: './radio.component.html',
  styleUrls: ['./radio.component.scss'],
  standalone: true,
  imports: [
    CommonModule, IonContent, IonHeader, IonToolbar, IonTitle,
    IonButtons, IonBackButton, IonIcon, IonSpinner, IonList, IonLabel, IonText, IonItem,TranslateModule
  ]
})
export class RadioComponent implements OnInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);

  public isPlaying = false;
  public isLoading = false;
  public currentRadio: any = null;

  // Sadece senin telefonun sevdiği .m3u8 formatındaki Dini Radyolar
  public radioList = [
    {
      name: "Diyanet Radyo",
      url: 'https://eustr76.mediatriple.net/videoonlylive/mtikoimxnztxlive/broadcast_5e3c1171d7d2a.smil/playlist.m3u8',
      icon: 'mic-outline',
      sub: 'Diyanet İşleri Başkanlığı Resmi Yayını'
    },
    {
      name: "Risale Radyo",
      url: 'https://eustr76.mediatriple.net/videoonlylive/mtikoimxnztxlive/broadcast_5e3c1520b2626.smil/playlist.m3u8',
      icon: 'radio-outline',
      sub: 'Risale-i Nur Dersleri ve Yayınları'
    }
  ];

  constructor() {
    addIcons({ playOutline, pauseOutline, radioOutline, volumeHighOutline, bookOutline, micOutline, heartOutline, pauseCircle, playCircleOutline });
  }

  ngOnInit() {}

  async toggleRadio(radio: any) {
    if (this.currentRadio?.url === radio.url && this.isPlaying) {
      this.stop();
      return;
    }
    this.currentRadio = radio;
    this.playStream(radio.url);
  }

  private playStream(url: string) {
    this.stop();
    this.isLoading = true;
    this.cdr.detectChanges();

    try {
      const audio = document.querySelector('audio');
      if (!audio) {
        this.isLoading = false;
        this.cdr.detectChanges();
        return;
      }

      // 1. Önce kaynağı temizleyelim ki eski kilitlenmeler çözülsün
      audio.pause();
      audio.removeAttribute('src');
      audio.load();

      // 2. Yeni radyoyu yüklüyoruz
      audio.src = url;
      audio.load();

      // 3. O gıcık DOMException hatasını yememek için çalma işlemini "Promise" yöntemiyle yapıyoruz
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise.then(() => {
          // Başarıyla çaldıysa burası çalışır
          this.isPlaying = true;
          this.isLoading = false;
          this.cdr.detectChanges();
        }).catch(error => {
          // İşte o meşhur [object DOMException] buraya düşerse hemen hileyi devreye sokuyoruz:
          console.log('Hata yakalandı, otomatik kurtarma deneniyor...', error);

          // 1 saniye bekleyip tekrar çalmayı zorluyoruz
          setTimeout(() => {
            audio.play().then(() => {
              this.isPlaying = true;
              this.isLoading = false;
              this.cdr.detectChanges();
            }).catch(e => {
              this.isLoading = false;
              this.cdr.detectChanges();
            });
          }, 1000);
        });
      }

    } catch (e) {
      console.error('Genel hata:', e);
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  public stop() {
    this.isPlaying = false;
    this.isLoading = false;
    const audio = document.querySelector('audio');
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    this.stop();
  }
}
