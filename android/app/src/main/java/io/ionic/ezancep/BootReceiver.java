package io.ionic.ezancepte;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import androidx.core.content.ContextCompat;

public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();

        // Hem telefonun tamamen açılmasını hem de kullanıcının kilidi açmasını dinliyoruz
        if (Intent.ACTION_BOOT_COMPLETED.equals(action) ||
            Intent.ACTION_USER_PRESENT.equals(action)) {

            Intent i = new Intent(context, PrayerService.class);

            try {
                ContextCompat.startForegroundService(context, i);
            } catch (Exception e) {
                e.printStackTrace();
                // Olası kısıtlama hatalarında uygulamanın tamamen çökmesini engeller.
            }
        }
    }
}
