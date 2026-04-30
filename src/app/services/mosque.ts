import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Mosque {
  name: string;
  lat: number;
  lon: number;
  distance?: string;
  staticMapUrl?: string; // Harita görseli için
}

@Injectable({
  providedIn: 'root'
})
export class MosqueService {
  private http = inject(HttpClient);

  async getNearbyMosques(lat: number, lon: number): Promise<Mosque[]> {
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"="place_of_worship"]["religion"="muslim"](${lat - 0.05},${lon - 0.05},${lat + 0.05},${lon + 0.05});
        way["amenity"="place_of_worship"]["religion"="muslim"](${lat - 0.05},${lon - 0.05},${lat + 0.05},${lon + 0.05});
      );
      out center;
    `;

    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    try {
      const response: any = await firstValueFrom(this.http.get(url));
      const mosques: Mosque[] = [];

      if (response && response.elements) {
        response.elements.forEach((element: any) => {
          const itemLat = element.lat || (element.center ? element.center.lat : null);
          const itemLon = element.lon || (element.center ? element.center.lon : null);

          if (element.tags && element.tags.name && itemLat && itemLon) {
            const distanceInKm = this.calculateDistance(lat, lon, itemLat, itemLon);

            // 🔥 BURASI DEĞİŞTİ: Tamamen ücretsiz ve sınırsız OSM Statik Harita linki
            const staticMapUrl = `https://static-maps.yandex.ru/1.x/?ll=${itemLon},${itemLat}&z=15&size=150,150&l=map&pt=${itemLon},${itemLat},pm2gnm`;

            mosques.push({
              name: element.tags.name,
              lat: itemLat,
              lon: itemLon,
              distance: distanceInKm.toFixed(2) + ' km',
              staticMapUrl: staticMapUrl
            });
          }
        });
      }

      // Yakından uzağa sıralama
      return mosques.sort((a, b) => parseFloat(a.distance!) - parseFloat(b.distance!));
    } catch (error) {
      console.error('Camiler çekilemedi:', error);
      return [];
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}
