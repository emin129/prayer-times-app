package io.ionic.ezancepte;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.database.ContentObserver;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import androidx.core.app.NotificationCompat;

public class PrayerAudioService extends Service {
    private MediaPlayer mediaPlayer;
    private AudioManager audioManager;
    private SettingsContentObserver mSettingsContentObserver;
    private static final String CHANNEL_ID = "EzanVaktiKanalı";

    @Override
    public void onCreate() {
        super.onCreate();

        audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);

        mSettingsContentObserver = new SettingsContentObserver(new Handler(Looper.getMainLooper()));
        getApplicationContext().getContentResolver().registerContentObserver(
                android.provider.Settings.System.CONTENT_URI, true, mSettingsContentObserver);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
            stopSelf();
            return START_NOT_STICKY;
        }

        String action = intent.getStringExtra("action");
        if ("STOP_AUDIO".equals(action)) {
            susturVeKapat();
            return START_NOT_STICKY;
        }

        String prayerName = intent.getStringExtra("prayerName");
        String soundName = intent.getStringExtra("soundName");
        String body = intent.getStringExtra("body"); // 👈 Metni okuyoruz

        createNotificationChannel();

        // 🎯 DİNAMİK İÇERİK: Body varsa onu yaz, yoksa klasik ezan yazısını bas.
        String notificationContent = (body != null && !body.isEmpty()) ? body : "Aziz Allah... Ezan okunuyor.";

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle(prayerName != null ? prayerName : "Ezan Vakti")
                .setContentText(notificationContent) // 👈 Buraya bağladık
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setAutoCancel(true)
                .build();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(1923, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(1923, notification);
        }

        if (soundName != null && !soundName.equals("silent") && !soundName.equalsIgnoreCase("off")) {
            int resId = getResources().getIdentifier(soundName, "raw", getPackageName());
            if (resId != 0) {
                if (mediaPlayer != null) { mediaPlayer.stop(); mediaPlayer.release(); }
                mediaPlayer = MediaPlayer.create(this, resId);
                mediaPlayer.setOnCompletionListener(mp -> susturVeKapat());
                mediaPlayer.start();
            }
        }

        return START_NOT_STICKY;
    }

    public class SettingsContentObserver extends ContentObserver {
        public SettingsContentObserver(Handler handler) {
            super(handler);
        }

        @Override
        public void onChange(boolean selfChange) {
            super.onChange(selfChange);

            if (audioManager != null && mediaPlayer != null && mediaPlayer.isPlaying()) {
                susturVeKapat();
            }
        }
    }

    private void susturVeKapat() {
        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                }
            } catch (Exception e) {
                // Ignore
            }
            mediaPlayer.release();
            mediaPlayer = null;
        }

        if (mSettingsContentObserver != null) {
            getApplicationContext().getContentResolver().unregisterContentObserver(mSettingsContentObserver);
        }

        stopForeground(true);
        stopSelf();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID, "Ezan Sesli Bildirimler", NotificationManager.IMPORTANCE_HIGH);
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    @Override
    public void onDestroy() {
        susturVeKapat();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }
}
