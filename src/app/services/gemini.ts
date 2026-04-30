import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GeminiService {
  private http = inject(HttpClient);

  // ✅ Senin curl komutundaki url ve key
  private apiKey: string = 'AIzaSyDoI7Nxl5hy3ZipPjG3Q58tciddieNNmSk';
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

  async interpretDream(dreamDescription: string) {
    // ✅ URL'nin sonuna senin key'ini ekliyoruz
    const fullUrl = `${this.baseUrl}?key=${this.apiKey}`;

    const promptData = {
      contents: [{
        parts: [{
          // ✅ Senin istediğin o detaylı prompt metni
          text: `Sen 20 yıllık bir rüya analistisin ve İslam alimisin.
          Kullanıcı sana rüyasını sorduğunda, onu yargılamadan dinle, sonra psikolojik ve dini bir yorum yap.
          Kısa ama derin konuş. Asla 'Ben bir yapay zekayım' deme.
          Ayrıca yorumu bitirirken kişiye soru sorma ya da onu konuşturmaya veya bilgi vermeye teşvik eden şeyler söyleme.
          Önemli simgeleri kesinlikle kalın (bold) yap.
          Rüya: ${dreamDescription}`
        }]
      }]
    };

    try {
      return await firstValueFrom(this.http.post<any>(fullUrl, promptData));
    } catch (error: any) {
      // Hata objesini string'e çevirip fırlatıyoruz ki ekranda [object Object] çıkmasın
      const errMsg = error.error?.error?.message || error.message || "Bağlantı hatası";
      console.error("Gemini Hatası:", errMsg);
      throw new Error(errMsg);
    }
  }
}
