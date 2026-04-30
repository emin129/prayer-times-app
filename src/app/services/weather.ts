import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class WeatherService {
  private http = inject(HttpClient);
  private apiUrl = 'https://api.open-meteo.com/v1/forecast';

  getWeather(lat: number, lon: number) {
    // forecast_days=7 eklendi, böylece API 7 günlük veri gönderecek
    const url = `${this.apiUrl}?latitude=${lat}&longitude=${lon}&current_weather=true&daily=weathercode,temperature_2m_max&timezone=auto&forecast_days=7`;

    return this.http.get(url).pipe(
      map((res: any) => {
        // Daily verisini map'liyoruz
        const forecast = res.daily.time.map((t: string, index: number) => {
          return {
            dt: new Date(t).getTime() / 1000,
            temp: { max: Math.round(res.daily.temperature_2m_max[index]) },
            // ÖNEMLİ: weathercode'u direkt sayı olarak gönderiyoruz
            weathercode: res.daily.weathercode[index]
          };
        });

        return {
          current: res.current_weather,
          daily: forecast
        };
      })
    );
  }
}
