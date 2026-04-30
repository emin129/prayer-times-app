import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PrayerService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'https://api.aladhan.com/v1';

  getTimes(latitude: number, longitude: number): Observable<any> {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const dateStr = `${day}-${month}-${year}`;

    // Metot 13 (Diyanet) kalsın, tune parametresini risk almamak için sildik.
    const url = `${this.baseUrl}/timings/${dateStr}?latitude=${latitude}&longitude=${longitude}&method=13`;

    return this.http.get(url).pipe(
      map((res: any) => {
        if (!res?.data?.timings) return null;

        const t = res.data.timings;

        // ✅ Sadece dakika ekleyip çıkaran güvenli yardımcı fonksiyon
        const adjustTime = (timeStr: string, minutesToAdd: number): string => {
          const [hours, minutes] = timeStr.split(':').map(Number);
          const date = new Date();
          date.setHours(hours);
          date.setMinutes(minutes + minutesToAdd);

          const h = String(date.getHours()).padStart(2, '0');
          const m = String(date.getMinutes()).padStart(2, '0');
          return `${h}:${m}`;
        };

        return {
          Fajr: t.Fajr,       // İmsak (Dokunmadık)
          Sunrise: t.Sunrise, // Güneş (Dokunmadık)
          Dhuhr: t.Dhuhr,     // Öğle (Dokunmadık)
          // ✅ Sadece İkindi 1 dk ileri
          Asr: adjustTime(t.Asr, 1),
          // ✅ Sadece Akşam 1 dk geri
          Maghrib: adjustTime(t.Maghrib, -1),
          Isha: t.Isha       // Yatsı (Dokunmadık)
        };
      }),
      catchError(err => {
        console.error('Vakit çekme hatası:', err);
        return of(null);
      })
    );
  }
}
