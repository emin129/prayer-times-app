import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Clipboard as CapClipboard } from '@capacitor/clipboard';
import { Share } from '@capacitor/share';

@Component({
  selector: 'app-library-detail',
  templateUrl: './library-detail.component.html',
  styleUrls: ['./library-detail.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, HttpClientModule]
})
export class LibraryDetailComponent implements OnInit {
  @ViewChild('zoomContainer', { read: ElementRef }) zoomContainer!: ElementRef;

  bookId = '';
  isLoading = false;
  chapters: any[] = [];
  selectedChapter: any = null;
  zoomLevel = 1.0;
  private initialDistance = 0;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.bookId = this.route.snapshot.paramMap.get('id') || '';
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.http.get(`./assets/data/${this.bookId}.json`).subscribe({
      next: (res: any) => {
        const rawData = res.data ? res.data : res;
        if (this.bookId === 'kuran') {
          this.chapters = rawData.map((sura: any) => ({ name: sura.translation, content: sura.verses }));
        } else {
          const baseName = this.getBookTitle();
          this.chapters = [];
          for (let i = 0; i < rawData.length; i += 20) {
            this.chapters.push({ name: `${baseName} (Bölüm ${(i / 20) + 1})`, content: rawData.slice(i, i + 20) });
          }
        }
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  selectChapter(ch: any) {
    this.selectedChapter = ch;
    window.scrollTo(0, 0);
    setTimeout(() => this.initReaderZoom(), 500);
  }

  initReaderZoom() {
    const el = this.zoomContainer?.nativeElement;
    if (!el) return;

    el.ontouchstart = (ev: TouchEvent) => {
      if (ev.touches.length === 2) {
        this.initialDistance = this.calculateDistance(ev.touches);
      }
    };

    el.ontouchmove = (ev: TouchEvent) => {
      if (ev.touches.length === 2 && this.initialDistance > 0) {
        const currentDist = this.calculateDistance(ev.touches);
        const delta = currentDist / this.initialDistance;
        let newZoom = this.zoomLevel * delta;

        // Okuma için ideal sınır 1.0 ile 2.2 arasıdır
        if (newZoom >= 1.0 && newZoom <= 2.2) {
          this.zoomLevel = newZoom;
          this.initialDistance = currentDist;
        }
      }
    };

    el.ontouchend = () => { this.initialDistance = 0; };
  }

  private calculateDistance(touches: TouchList): number {
    return Math.sqrt(Math.pow(touches[0].clientX - touches[1].clientX, 2) + Math.pow(touches[0].clientY - touches[1].clientY, 2));
  }

  getText(item: any, type: 'head' | 'body') {
    return type === 'head' ? (item.arabic || item.word || item.title || item.question || item.head || item.text || '') : (item.translation || item.answer || item.meaning || item.turkish || item.meal || item.content || '');
  }

  getSafeHtml(text: string): SafeHtml {
    if(!text) return '';
    return this.sanitizer.bypassSecurityTrustHtml(text.replace(/\\n/g, '<br>').trim());
  }

  colorizeArabic(text: string): SafeHtml {
    if(!text) return '';
    const colored = text.replace(/([\u064B-\u065F\u0670])/g, '<span class="haraka">$1</span>')
                        .replace(/([\u0615\u06D6-\u06DC\u06DF-\u06E4\u06E7-\u06E8\u06EA-\u06EB])/g, '<span class="sign">$1</span>')
                        .replace(/ٱللَّه/g, '<span class="lafzatullah">$&</span>');
    return this.sanitizer.bypassSecurityTrustHtml(colored);
  }

  goBack() { this.selectedChapter = null; }
  getBookTitle() {
    const titles: any = { kuran: "Kur'an-ı Kerim", hadis: 'Hadis-i Şerifler', cevşen: 'Cevşen-ül Kebir', ilmihal: 'Temel Dini Bilgiler', tabirler: 'Rüya Tabirleri' };
    return titles[this.bookId] || 'Kütüphane';
  }

  async copyItem(item: any) {
    const txt = this.getText(item, 'head') + "\n\n" + this.getText(item, 'body');
    await CapClipboard.write({ string: txt.replace(/<[^>]*>/g, '').trim() });
  }

  async shareItem(item: any) {
    const txt = this.getText(item, 'head') + "\n\n" + this.getText(item, 'body');
    await Share.share({ title: this.getBookTitle(), text: txt.replace(/<[^>]*>/g, '').trim() });
  }
}
