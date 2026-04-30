package io.ionic.ezancepte;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

public class PrayerAlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String prayerName = intent.getStringExtra("prayerName");
        String soundName = intent.getStringExtra("soundName");
        String body = intent.getStringExtra("body"); // 👈 Burayı ekledik.

        Intent serviceIntent = new Intent(context, PrayerAudioService.class);
        serviceIntent.putExtra("prayerName", prayerName);
        serviceIntent.putExtra("soundName", soundName);
        serviceIntent.putExtra("body", body); // 👈 Burayı ekledik.

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }
    }
}
