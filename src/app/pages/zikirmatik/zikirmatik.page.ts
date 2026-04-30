import { Component, OnInit } from '@angular/core';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { ZIKIR_REHBERI } from '../../data';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-zikirmatik',
  templateUrl: './zikirmatik.page.html',
  styleUrls: ['./zikirmatik.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, TranslateModule]
})
export class ZikirmatikPage implements OnInit {
  zikirListesi: any[] = [];
  ozelZikirler: any[] = [];
  aktifDua: any = null;
  seciliZikir: any = null;
  count: number = 0;

  constructor(
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.duayiVakteGoreAyarla();
    this.listeyiHazirla();
    this.veriyiYukle();
  }

  listeyiHazirla() {
    const kaydedilmis = localStorage.getItem('custom_zikirler');
    this.ozelZikirler = kaydedilmis ? JSON.parse(kaydedilmis) : [];
    // Sabit zikirler ile kullanıcının eklediklerini birleştir
    this.zikirListesi = [...this.ozelZikirler, ...ZIKIR_REHBERI.zikirler];
  }

  // --- SİLME FONKSİYONU BURADA ---
  async zikirSil(event: Event, zikir: any) {
    event.stopPropagation(); // Tıklayınca zikri seçmesini engelle, sadece silme çalışsın

    const alert = await this.alertController.create({
      header: 'Zikri Sil',
      message: `"${zikir.ad}" zikrini silmek istediğine emin misin?`,
      buttons: [
        { text: 'Vazgeç', role: 'cancel' },
        {
          text: 'Sil',
          role: 'destructive',
          handler: () => {
            // Listeden temizle
            this.ozelZikirler = this.ozelZikirler.filter(z => z.id !== zikir.id);
            // LocalStorage güncelle
            localStorage.setItem('custom_zikirler', JSON.stringify(this.ozelZikirler));
            // Listeyi yeniden oluştur
            this.listeyiHazirla();
            // Eğer silinen zikir seçili olan ise, listenin başına dön
            if (this.seciliZikir?.id === zikir.id) {
              this.selectZikir(this.zikirListesi[0]);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async increment() {
    this.count++;
    await Haptics.impact({ style: ImpactStyle.Light });

    const hedef = this.seciliZikir?.hedef || 33;
    if (this.count === hedef) {
      await Haptics.notification({ type: NotificationType.Success });
      this.AllahKabulEtsinMesaji();
    }
    this.kaydet();
  }

  // zikirmatik.page.ts içindeki metodun şu şekilde olsun:
async AllahKabulEtsinMesaji() {
  const toast = await this.toastController.create({
    message: `✨ Allah Kabul Etsin! "${this.seciliZikir.ad}" bitti.`,
    duration: 3000,
    position: 'bottom', // Middle yerine Bottom mobilde daha sağlıklıdır
    cssClass: 'kabul-toast', // global.scss'deki isimle birebir aynı
    buttons: [
      {
        text: 'Sıfırla',
        role: 'cancel',
        handler: () => {
          this.reset();
        }
      }
    ]
  });
  await toast.present();
}

  // Yeni Zikir Ekleme Modalı
  async zikirEkleModal() {
    const alert = await this.alertController.create({
      header: 'Yeni Zikir Ekle',
      inputs: [
        { name: 'ad', type: 'text', placeholder: 'Zikir Adı' },
        { name: 'hedef', type: 'number', placeholder: 'Hedef (Örn: 99)', min: 1 }
      ],
      buttons: [
        { text: 'İptal', role: 'cancel' },
        {
          text: 'Ekle',
          handler: (data) => {
            if (data.ad && data.hedef) {
              const yeni = { id: 'c_' + Date.now(), ad: data.ad, hedef: Number(data.hedef), isCustom: true, fayda: 'Özel Zikrin' };
              this.ozelZikirler.unshift(yeni);
              localStorage.setItem('custom_zikirler', JSON.stringify(this.ozelZikirler));
              this.listeyiHazirla();
              this.selectZikir(yeni);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  duayiVakteGoreAyarla() {
    const simdi = new Date();
    const saat = simdi.getHours();
    const gunIndex = Math.floor((simdi.getTime() - new Date(simdi.getFullYear(), 0, 0).getTime()) / 86400000);
    const sabahHavuzu = ZIKIR_REHBERI.gunlukDualar.filter(d => d.vakit === 'sabah');
    const aksamHavuzu = ZIKIR_REHBERI.gunlukDualar.filter(d => d.vakit === 'aksam');
    this.aktifDua = (saat >= 5 && saat < 17) ? sabahHavuzu[gunIndex % sabahHavuzu.length] : aksamHavuzu[gunIndex % aksamHavuzu.length];
  }

  selectZikir(z: any) { this.seciliZikir = z; this.count = 0; this.kaydet(); }
  reset() { this.count = 0; this.kaydet(); }
  kaydet() {
    localStorage.setItem('active_zikir_id', this.seciliZikir?.id.toString());
    localStorage.setItem('zikir_count', this.count.toString());
  }
  veriyiYukle() {
    const id = localStorage.getItem('active_zikir_id');
    const sayi = localStorage.getItem('zikir_count');
    this.seciliZikir = this.zikirListesi.find(z => z.id.toString() === id) || this.zikirListesi[0];
    if (sayi) this.count = Number(sayi);
  }
}




