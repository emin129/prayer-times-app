package io.ionic.ezancepte;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import android.app.NotificationManager;
import android.app.NotificationChannel;

public class NotificationReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String title = intent.getStringExtra("title");
        String body = intent.getStringExtra("body");
        String sound = intent.getStringExtra("sound");
        int id = intent.getIntExtra("id", 0);

        boolean isEzanKapali = (sound == null || sound.isEmpty() || sound.equalsIgnoreCase("off") || sound.equalsIgnoreCase("silent"));

        if (isEzanKapali) {
            // 🔔 DURUM 1: Ezan Kapalı! (Yalnızca basit bildirim)
            NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            String channelId = "ezan_sessiz_kanal"; // Tek ve sabit bir kanal adı kullanıyoruz

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel = new NotificationChannel(
                        channelId,
                        "Ezan Vakti Hatırlatıcıları",
                        NotificationManager.IMPORTANCE_HIGH // Ekrana düşmesi için gerekli
                );
                channel.enableLights(true);
                channel.enableVibration(true);
                channel.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);

                if (manager != null) {
                    manager.createNotificationChannel(channel);
                }
            }

            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, channelId)
                    .setContentTitle(title != null ? title : "Ezan Vakti")
                    .setContentText(body != null ? body : "Vakit Geldi.")
                    .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .setAutoCancel(true);

            // 🚨 TAKILMAYI ÖNLEYEN YER:
            // setDefaults() metodunu kaldırdık çünkü IMPORTANCE_HIGH zaten ses çıkartıyor.
            // Üst üste binmeyi engellemek için sadece 1 kez ses çıkmasını garanti ediyoruz.

            if (manager != null) {
                manager.notify(id != 0 ? id : 555, builder.build());
            }

        } else {
            // 🎵 DURUM 2: Ezan Açık! (Müzik servisini çalıştır)
            Intent serviceIntent = new Intent(context, PrayerAudioService.class);
            serviceIntent.putExtra("prayerName", title);
            serviceIntent.putExtra("soundName", sound);
            serviceIntent.putExtra("body", body);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
        }
    }
}
