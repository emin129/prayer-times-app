import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonButton } from '@ionic/angular/standalone';

import 'cordova-plugin-purchase';

@Component({
  selector: 'app-premium',
  templateUrl: './premium.component.html',
  styleUrls: ['./premium.component.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonButton, CommonModule, FormsModule]
})
export class PremiumPage implements OnInit {

  aylikFiyat: string = 'Yükleniyor...';
  yillikFiyat: string = 'Yükleniyor...';

  ngOnInit() {
    this.satinalmaSisteminiBaslat();
  }

  satinalmaSisteminiBaslat() {
    CdvPurchase.store.register([{
      id: 'ezancep_aylik_premium',
      type: CdvPurchase.ProductType.PAID_SUBSCRIPTION,
      platform: CdvPurchase.Platform.GOOGLE_PLAY
    }, {
      id: 'ezancep_yillik_premium',
      type: CdvPurchase.ProductType.PAID_SUBSCRIPTION,
      platform: CdvPurchase.Platform.GOOGLE_PLAY
    }]);

    CdvPurchase.store.when()
      .approved((p: any) => p.verify())
      .verified((p: any) => {
        p.finish();

        // 🎯 KULLANICIYI PREMIUM YAPAN KRİTİK SATIR BURASI AGA!
        localStorage.setItem('isPremium', 'true');

        alert('Tebrikler! Premium aktif edildi.');
      })
      .updated((p: any) => {
        if (p.id === 'ezancep_aylik_premium' && p.offers && p.offers[0]) {
          const pricing = p.offers[0].pricingPhases?.[0];
          if (pricing) {
            this.aylikFiyat = pricing.formattedPrice || pricing.price;
          }
        }
        if (p.id === 'ezancep_yillik_premium' && p.offers && p.offers[0]) {
          const pricing = p.offers[0].pricingPhases?.[0];
          if (pricing) {
            this.yillikFiyat = pricing.formattedPrice || pricing.price;
          }
        }
      });

    CdvPurchase.store.initialize([CdvPurchase.Platform.GOOGLE_PLAY]);
  }

  aylikSatinAl() {
    const product = CdvPurchase.store.get('ezancep_aylik_premium');
    if (product && product.offers && product.offers[0]) {
      CdvPurchase.store.order(product.offers[0]);
    } else {
      console.error('Aylık ürün veya teklif bulunamadı');
    }
  }

  yillikSatinAl() {
    const product = CdvPurchase.store.get('ezancep_yillik_premium');
    if (product && product.offers && product.offers[0]) {
      CdvPurchase.store.order(product.offers[0]);
    } else {
      console.error('Yıllık ürün veya teklif bulunamadı');
    }
  }
}
