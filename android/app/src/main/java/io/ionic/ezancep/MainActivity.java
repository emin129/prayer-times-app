package io.ionic.ezancepte;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import io.ionic.ezancepte.PrayerService;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // 🔥 EN GARANTİ YÖNTEM: super'den önce kaydet
        registerPlugin(PrayerPlugin.class);

        super.onCreate(savedInstanceState);

        startInitialPrayerService();
    }

    @Override
    public void onResume() {
        super.onResume();
        startInitialPrayerService();
    }

    private void startInitialPrayerService() {
        try {
            Intent serviceIntent = new Intent(this, PrayerService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent);
            } else {
                startService(serviceIntent);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
