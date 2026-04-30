package io.ionic.ezancepte;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "PrayerPlugin")
public class PrayerPlugin extends Plugin {

    @PluginMethod
    public void setAlarm(PluginCall call) {
        Long triggerTime = call.getLong("time");
        String title = call.getString("title");
        String body = call.getString("body");
        String sound = call.getString("sound");
        String channelId = call.getString("channelId");
        Integer id = call.getInt("id");

        if (triggerTime == null || id == null) {
            call.reject("Eksik veri!");
            return;
        }

        Context context = getContext();
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);

        Intent intent = new Intent(context, NotificationReceiver.class);
        intent.putExtra("title", title);
        intent.putExtra("body", body);
        intent.putExtra("sound", sound);
        intent.putExtra("channelId", channelId);
        intent.putExtra("id", id);

        PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context, id, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        // 🔍 KONTROL: Ezan sesi kapalı mı?
        boolean isEzanKapali = (sound == null || sound.isEmpty() || sound.equalsIgnoreCase("off") || sound.equalsIgnoreCase("null") || sound.equalsIgnoreCase("silent"));

        if (isEzanKapali) {
            // 🔔 DURUM 1: Ezan kapalı! (Uykuyu bölmeyen, Android'i kızdırmayan hafif alarm kuruyoruz)
            // Bu sayede "Sadece bildirim" dediğinde arka planda engellenmeyecek.
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent);
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent);
            }
        } else {
            // 🎵 DURUM 2: Ezan Açık! (Telefon derin uykuda olsa bile uyandırıp bağıracak sert alarm)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent);
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent);
            }
        }

        call.resolve();
    }


    @PluginMethod
    public void cancelAlarm(PluginCall call) {
        Integer id = call.getInt("id");
        if (id == null) {
            call.reject("ID eksik!");
            return;
        }

        Context context = getContext();
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);

        Intent intent = new Intent(context, NotificationReceiver.class);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context, id, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        if (alarmManager != null) {
            alarmManager.cancel(pendingIntent);
        }

        call.resolve();
    }


    @PluginMethod
    public void stopService(PluginCall call) {
        call.resolve();
    }
}
