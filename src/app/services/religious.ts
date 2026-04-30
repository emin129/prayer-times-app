import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
// Eski importlarını da buraya ekle (Esma, Holidays vb.)
import { ESMAUL_HUSNA } from '../esma';
import { HOLY_DAYS } from '../holidays';

@Injectable({
  providedIn: 'root'
})
export class ReligiousService {
  // Diyanet uyumlu vakit hesaplayan ücretsiz API
  private prayerApiUrl = 'https://api.aladhan.com/v1/timings';

  constructor(private http: HttpClient) { }

  // 1. Statik Veriler (Esma, Dini Günler)
  getEsmaulHusna() { return ESMAUL_HUSNA; }
  getHolyDays() { return HOLY_DAYS; }

  // 2. Dinamik Veri: Konuma Göre İmsakiye
  // lat: Enlem, lng: Boylam (Kullanıcıdan gelecek)
  getImsakiyeByLocation(lat: number, lng: number): Observable<any> {
    // method=13 Diyanet İşleri Başkanlığı hesaplama yöntemidir
    const url = `${this.prayerApiUrl}?latitude=${lat}&longitude=${lng}&method=13`;

    return this.http.get<any>(url).pipe(
      map(res => {
        const t = res.data.timings;
        return {
          tarih: res.data.date.readable,
          hicri: res.data.date.hijri.day + ' ' + res.data.date.hijri.month.tr,
          vakitler: [
            { label: 'İmsak', time: t.Imsak, icon: 'moon-outline' },
            { label: 'Güneş', time: t.Sunrise, icon: 'sunny-outline' },
            { label: 'Öğle', time: t.Dhuhr, icon: 'cloud-outline' },
            { label: 'İkindi', time: t.Asr, icon: 'partly-sunny-outline' },
            { label: 'Akşam', time: t.Maghrib, icon: 'pizz-outline', isIftar: true },
            { label: 'Yatsı', time: t.Isha, icon: 'star-outline' }
          ]
        };
      }),
      catchError(err => {
        console.error("API Hatası:", err);
        return of(null);
      })
    );
  }
  convertMiladiToHicri(date: Date): string {
  return new Intl.DateTimeFormat('tr-TN-u-ca-islamic-uma', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
 }

  // religious.service.ts içindeki ilgili kısım

getDataById(id: string): Observable<any> {
  switch (id) {
    case 'esmaul-husna':
      return of(ESMAUL_HUSNA);
    case 'holy-days':
      return of(HOLY_DAYS);
    case 'converter':
      // Dönüştürücü sayfası için statik bir veri yok ama
      // sayfanın yüklenmesi için boş bir obje döndürüyoruz
      return of({});
    case 'imsakiye':
      // İmsakiye sayfası açıldığında "yükleniyor" demek için
      // başlangıçta boş dönüyoruz (loadImsakiye zaten veriyi ezecek)
      return of({ vakitler: [] });
    default:
      return of([]);
  }
}
  // religious.service.ts
getThreeMonthCalendar(lat: number, lng: number): Observable<any[]> {
  const currentYear = 2026;
  const currentMonth = 3; // Mart'tan başlasın

  // Mart, Nisan ve Mayıs aylarını birleştirip 3 aylık liste yapıyoruz
  const months = [currentMonth, currentMonth + 1, currentMonth + 2];

  const requests = months.map(month => {
    const url = `https://api.aladhan.com/v1/calendar/${currentYear}/${month}?latitude=${lat}&longitude=${lng}&method=13`;
    return this.http.get<any>(url).pipe(map(res => res.data));
  });


  return forkJoin(requests).pipe(
    map(allMonths => [].concat(...allMonths))
  );
}
}
