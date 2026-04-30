import { Component, OnInit, OnDestroy, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SettingsService } from './services/settings';
import { LanguageService } from './services/language';

import { AdMob, AdOptions, BannerAdOptions, BannerAdSize, BannerAdPosition, InterstitialAdPluginEvents } from '@capacitor-community/admob';
import { PluginListenerHandle } from '@capacitor/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [CommonModule, IonApp, IonRouterOutlet]
})
export class AppComponent implements OnInit, OnDestroy {
  private settingsService = inject(SettingsService);
  private langService = inject(LanguageService);
  private router = inject(Router);
  private zone = inject(NgZone);

  // 🎯 BANNER AYARLARI
  private otomatikReklamliSayfalar = [
    '/home', '/library', '/applications', '/settings',
    '/radio', '/mosque', '/converter', '/qibla', '/dream-interpretation'
  ];
  public isAdVisible = false;

  // 🚀 KADEMELİ GEÇİŞ REKLAMI SİSTEMİ
  private clickCount = 0;
  private showAdsCount = 0;
  private lastActionTime: number = Date.now();

  private idleTimer: any;
  private isAutoIdleAd: boolean = false;
  private pendingRoute: string | null = null;
  private adDismissedListener: PluginListenerHandle | null = null;

  // 🚀 PREMIUM KONTROLÜ
  get isUserPremium(): boolean {
    return this.settingsService.isPremium;
  }

  get currentClickLimit(): number {
    return this.showAdsCount === 0 ? 4 : 7;
  }

  get currentIdleLimit(): number {
    return 1.5 * 60 * 1000;
  }

  async ngOnInit() {
    try {
      await this.settingsService.init();
      await this.settingsService.requestNotificationPermission();

      // 🌍 AdMob'u HER DURUMDA başlatmak en sağlıklısıdır.
      await AdMob.initialize();

      // Sayfa değişimlerini her zaman dinlemeliyiz (Premium olsun olmasın)
      this.listenRouteChanges();

      // 🚀 Kullanıcı Premium ise diğer reklam hazırlıklarını yapma
      if (this.isUserPremium) {
        console.log("Aga bu kullanıcı Premium! Reklam motorları kilitlendi.");
        return;
      }

      // Reklamları hazırla
      await this.initGlobalBanner();
      await this.prepareInterstitialAd();
      await this.prepareRewardedAd();

      // Boşta Durma Sayacını Başlat
      this.initIdleTimer();

      // 🎬 GEÇİŞ REKLAMI DİNLEYİCİSİ
      this.adDismissedListener = await AdMob.addListener(
        InterstitialAdPluginEvents.Dismissed,
        () => {
          this.zone.run(() => {
            this.clickCount = 0;
            this.showAdsCount++;
            this.prepareInterstitialAd();
            this.resetIdleTimer();

            if (this.isAutoIdleAd) {
              this.isAutoIdleAd = false;
              this.pendingRoute = null;
              return;
            }

            if (this.pendingRoute) {
              this.router.navigate([this.pendingRoute]);
              this.pendingRoute = null;
            }
          });
        }
      );

      console.log("Aga tüm reklam sistemleri mermi gibi hazır!");
    } catch (error) {
      console.error("Uygulama başlatılamadı:", error);
    }
  }

  ngOnDestroy() {
    if (this.adDismissedListener) {
      this.adDismissedListener.remove();
    }
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }
  }

  // --- 🟡 BANNER METODLARI ---
  async initGlobalBanner() {
    if (this.isUserPremium) return;
    try {
      const options: BannerAdOptions = {
        // 🚀 Senin yeni oluşturduğun Banner ID'si
        adId: 'ca-app-pub-9025055765838221/5314116055',
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: false
      };
      await AdMob.showBanner(options);
      this.zone.run(() => { this.isAdVisible = true; });
    } catch (e) { console.error(e); }
  }

  listenRouteChanges() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(async (event: any) => {
      const currentUrl = event.urlAfterRedirects || event.url;
      const baseRoute = currentUrl.split('?')[0];

      this.resetIdleTimer();

      const isAutoPage = this.otomatikReklamliSayfalar.includes(baseRoute);

      if (this.isUserPremium) return;

      if (isAutoPage) {
        try {
          await AdMob.resumeBanner();
          this.zone.run(() => { this.isAdVisible = true; });
          console.log(`${baseRoute} sayfasında banner açıldı.`);
        } catch (e) { console.error(e); }
      } else {
        try {
          await AdMob.hideBanner();
          this.zone.run(() => { this.isAdVisible = false; });
          console.log(`${baseRoute} sayfasında banner gizlendi.`);
        } catch (e) { console.error(e); }
      }
    });
  }

  // --- 🟢 ÖDÜLLÜ REKLAM (REWARDED) METODLARI ---
  async prepareRewardedAd() {
    if (this.isUserPremium) return;
    const options: AdOptions = {
      // ⚠️ Burası eski kaldı çünkü yeni Ödüllü Reklam birimi oluşturmadın
      adId: 'ca-app-pub-9025055765838221/2617049966',
      isTesting: false
    };
    try {
      await AdMob.prepareRewardVideoAd(options);
    } catch (e) { console.error(e); }
  }

  async showRewardedAd(): Promise<boolean> {
    if (this.isUserPremium) {
      console.log("Premium kullanıcıya ödüllü özellik reklamsız sağlandı.");
      return true;
    }

    try {
      const result = await AdMob.showRewardVideoAd();
      return result && result.amount > 0;
    } catch (e) {
      console.error("Ödüllü reklam gösterilemedi:", e);
      return false;
    }
  }

  // --- 🔴 GEÇİŞ REKLAMI METODLARI ---
  async prepareInterstitialAd() {
    if (this.isUserPremium) return;
    const options: AdOptions = {
      // 🚀 Senin yeni oluşturduğun Geçiş Reklamı ID'si buraya çakıldı!
      adId: 'ca-app-pub-9025055765838221/6511647654',
      isTesting: false
    };
    try { await AdMob.prepareInterstitial(options); } catch (e) { console.error(e); }
  }

  initIdleTimer() {
    if (this.isUserPremium) return;
    this.resetIdleTimer();
  }

  resetIdleTimer() {
    if (this.isUserPremium) return;
    this.lastActionTime = Date.now();
    if (this.idleTimer) clearTimeout(this.idleTimer);

    this.idleTimer = setTimeout(() => {
      this.showAutoIdleAd();
    }, this.currentIdleLimit);
  }

  async showAutoIdleAd() {
    if (this.isUserPremium) return;
    try {
      this.isAutoIdleAd = true;
      this.pendingRoute = null;
      await AdMob.showInterstitial();
    } catch (e) {
      this.isAutoIdleAd = false;
      this.resetIdleTimer();
    }
  }

  async showAdAndNavigate(targetRoute: string) {
    if (this.isUserPremium) {
      this.router.navigate([targetRoute]);
      return;
    }

    const now = Date.now();
    const timePassed = now - this.lastActionTime;

    this.clickCount++;

    if (timePassed >= this.currentIdleLimit || this.clickCount >= this.currentClickLimit) {
      this.pendingRoute = targetRoute;
      this.isAutoIdleAd = false;
      try {
        await AdMob.showInterstitial();
      } catch (e) {
        this.clickCount = 0;
        this.router.navigate([targetRoute]);
        this.resetIdleTimer();
      }
      return;
    }

    this.router.navigate([targetRoute]);
  }
}
