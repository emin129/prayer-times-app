package io.ionic.ezancepte;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Typeface;
import android.icu.text.DateFormat;
import android.icu.util.ULocale;
import android.location.Address;
import android.location.Geocoder;
import android.location.Location;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.text.SpannableStringBuilder;
import android.text.style.ForegroundColorSpan;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.drawable.IconCompat;

import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.Priority;

import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.TimeUnit;

public class PrayerService extends Service {
    private static final String CHANNEL_ID = "ezan_vakti_v_final";
    private static final int NOTIFICATION_ID = 1;
    private static final String PREFS_NAME = "EzanVaktiPrefs";
    private static final String KEY_LAT = "last_lat";
    private static final String KEY_LON = "last_lon";

    private final Handler handler = new Handler(Looper.getMainLooper());
    private Runnable countdownRunnable;

    private Map<String, String> prayerTimes = new HashMap<>();
    private final String[] keys = {"Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"};
    private final String[] namesTr = {"İmsak", "Güneş", "Öğle", "İkindi", "Akşam", "Yatsı"};

    private double lat = 36.8841;
    private double lon = 30.7056;
    private String currentCity = "Konum Alınıyor..";
    private String currentHicriDate = "Yükleniyor..";

    private MediaPlayer mediaPlayer;
    private FusedLocationProviderClient fusedLocationClient;
    private LocationCallback locationCallback;

    private final BroadcastReceiver radioReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if ("ACTION_PLAY_RADIO".equals(intent.getAction())) {
                String url = intent.getStringExtra("radio_url");
                if (url != null) playRadio(url);
            } else if ("ACTION_STOP_RADIO".equals(intent.getAction())) {
                stopRadio();
            }
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        loadSavedLocation();
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this);
        startLocationTracking();

        IntentFilter filter = new IntentFilter();
        filter.addAction("ACTION_PLAY_RADIO");
        filter.addAction("ACTION_STOP_RADIO");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(radioReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(radioReceiver, filter);
        }
    }

    private void startLocationTracking() {
        if (ContextCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            return;
        }

        LocationRequest locationRequest = new LocationRequest.Builder(Priority.PRIORITY_BALANCED_POWER_ACCURACY, 1000 * 60 * 30)
                .setMinUpdateIntervalMillis(1000 * 60 * 10)
                .build();

        locationCallback = new LocationCallback() {
            @Override
            public void onLocationResult(LocationResult locationResult) {
                if (locationResult == null) return;
                for (Location location : locationResult.getLocations()) {
                    float[] results = new float[1];
                    Location.distanceBetween(lat, lon, location.getLatitude(), location.getLongitude(), results);
                    if (results[0] > 1000 || prayerTimes.isEmpty()) {
                        lat = location.getLatitude();
                        lon = location.getLongitude();
                        saveLocation(lat, lon);
                        refreshTimesFromApi();
                    }
                }
            }
        };

        try {
            fusedLocationClient.requestLocationUpdates(locationRequest, locationCallback, Looper.getMainLooper());
        } catch (SecurityException e) { Log.e("PrayerService", "Konum izni yok"); }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String action = intent.getAction();
            if ("STOP".equals(action) || "STOP".equals(intent.getStringExtra("action"))) {
                stopRadio();
                stopForeground(true);
                stopSelf();
                return START_NOT_STICKY;
            }
        }

        try {
            if (ContextCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                fusedLocationClient.getLastLocation().addOnSuccessListener(location -> {
                    if (location != null) {
                        lat = location.getLatitude();
                        lon = location.getLongitude();
                        saveLocation(lat, lon);
                    }
                    refreshTimesFromApi();
                }).addOnFailureListener(e -> refreshTimesFromApi());
            } else {
                refreshTimesFromApi();
            }
        } catch (SecurityException e) { refreshTimesFromApi(); }

        return START_STICKY;
    }

    private void playRadio(String url) {
        try {
            stopRadio();
            mediaPlayer = new MediaPlayer();
            mediaPlayer.setAudioAttributes(new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .setUsage(AudioAttributes.USAGE_MEDIA).build());
            mediaPlayer.setDataSource(url);
            mediaPlayer.prepareAsync();
            mediaPlayer.setOnPreparedListener(mp -> {
                mp.setVolume(1.0f, 1.0f);
                mp.start();
            });
        } catch (Exception e) { Log.e("PrayerService", "Radyo hatası"); }
    }

    private void stopRadio() {
        if (mediaPlayer != null) {
            try { if (mediaPlayer.isPlaying()) mediaPlayer.stop(); } catch (Exception e) {}
            mediaPlayer.release();
            mediaPlayer = null;
        }
    }

    private void refreshTimesFromApi() {
        new Thread(() -> {
            try {
                try {
                    Geocoder geocoder = new Geocoder(this, Locale.getDefault());
                    List<Address> addresses = geocoder.getFromLocation(lat, lon, 1);
                    if (addresses != null && !addresses.isEmpty()) {
                        String city = addresses.get(0).getAdminArea();
                        if (city != null) this.currentCity = city;
                    } else {
                        this.currentCity = "Konum Güncel";
                    }
                } catch (Exception e) { this.currentCity = "Konum Güncel"; }

                SimpleDateFormat sdf = new SimpleDateFormat("dd-MM-yyyy", Locale.getDefault());
                String urlString = "https://api.aladhan.com/v1/timings/" + sdf.format(new Date()) +
                        "?latitude=" + lat + "&longitude=" + lon + "&method=13&t=" + System.currentTimeMillis();

                URL url = new URL(urlString);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(15000);
                BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) response.append(line);
                reader.close();

                JSONObject data = new JSONObject(response.toString()).getJSONObject("data");
                JSONObject timings = data.getJSONObject("timings");

                for (String key : keys) {
                    String timeValue = timings.getString(key);
                    if (key.equals("Asr")) {
                        prayerTimes.put(key, adjustTimeJava(timeValue, 1));
                    } else if (key.equals("Maghrib")) {
                        prayerTimes.put(key, adjustTimeJava(timeValue, -1));
                    } else {
                        prayerTimes.put(key, timeValue);
                    }
                }

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    currentHicriDate = DateFormat.getDateInstance(DateFormat.LONG, new ULocale("tr@calendar=islamic-umalqura")).format(new Date());
                } else { currentHicriDate = "Bugün"; }

                handler.post(this::startCountdown);
            } catch (Exception e) {
                handler.postDelayed(this::refreshTimesFromApi, 30000);
            }
        }).start();
    }

    private String adjustTimeJava(String timeStr, int minutesToAdd) {
        try {
            String[] parts = timeStr.split(":");
            int hour = Integer.parseInt(parts[0]);
            int minute = Integer.parseInt(parts[1]);

            Calendar cal = Calendar.getInstance();
            cal.set(Calendar.HOUR_OF_DAY, hour);
            cal.set(Calendar.MINUTE, minute);
            cal.add(Calendar.MINUTE, minutesToAdd);

            return String.format(Locale.getDefault(), "%02d:%02d",
                   cal.get(Calendar.HOUR_OF_DAY), cal.get(Calendar.MINUTE));
        } catch (Exception e) {
            return timeStr;
        }
    }

    private void startCountdown() {
        if (countdownRunnable != null) handler.removeCallbacks(countdownRunnable);
        countdownRunnable = new Runnable() {
            @Override
            public void run() {
                updateUI();
                // ✅ Bir sonraki tam dakikaya senkronize et
                long now = System.currentTimeMillis();
                long nextMinute = ((now / 60000) + 1) * 60000;
                long delay = nextMinute - now + 500; // +500ms güvenlik payı
                handler.postDelayed(this, delay);
            }
        };
        handler.post(countdownRunnable);
    }

    private void updateUI() {
        if (prayerTimes.isEmpty()) return;
        Calendar now = Calendar.getInstance();
        String nextName = "";
        long diff = -1;
        int nextVakitIndex = -1;

        for (int i = 0; i < keys.length; i++) {
            long tDiff = calculateDiff(prayerTimes.get(keys[i]), now, false);
            if (tDiff > 0) { diff = tDiff; nextName = namesTr[i]; nextVakitIndex = i; break; }
        }

        if (nextName.isEmpty()) {
            diff = calculateDiff(prayerTimes.get("Fajr"), now, true);
            nextName = "İmsak"; nextVakitIndex = 0;
            if (now.get(Calendar.HOUR_OF_DAY) == 0 && now.get(Calendar.MINUTE) == 0) refreshTimesFromApi();
        }

        String titleMain = currentCity + "  |  " + currentHicriDate;
        // ✅ Collapsed bildirimde gösterilecek kısa metin (her zaman güncellenir)
        String collapsedText = nextName + getEki(nextName) + " kalan: " + formatTime(diff);

        SpannableStringBuilder ssbV = new SpannableStringBuilder();
        SpannableStringBuilder ssbS = new SpannableStringBuilder();

        for (int i = 0; i < keys.length; i++) {
            int startV = ssbV.length(); ssbV.append(namesTr[i]);
            int startS = ssbS.length(); ssbS.append(prayerTimes.get(keys[i]));
            if (i == nextVakitIndex) {
                ssbV.setSpan(new ForegroundColorSpan(Color.RED), startV, ssbV.length(), 0);
                ssbS.setSpan(new ForegroundColorSpan(Color.RED), startS, ssbS.length(), 0);
            }
            if (i < keys.length - 1) { ssbV.append("\t\t"); ssbS.append("\t\t"); }
        }

        CharSequence bigText = new SpannableStringBuilder().append(ssbV).append("\n").append(ssbS);
        showNotification(titleMain, collapsedText, bigText, diff);
    }

    private String getEki(String name) {
        if (name.equals("Yatsı")) return "ya";
        if (name.equals("Öğle") || name.equals("İkindi")) return "ye";
        if (name.equals("Güneş")) return "e";
        return "a";
    }

    private void showNotification(String titleMain, String collapsedText, CharSequence bigText, long diff) {
        int pFlags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        PendingIntent contentPI = PendingIntent.getActivity(this, 0, new Intent(this, MainActivity.class), pFlags);
        PendingIntent stopPI = PendingIntent.getService(this, 0, new Intent(this, PrayerService.class).setAction("STOP"), pFlags);

        // ✅ Dakikayı yukarı yuvarla (collapsed ikon ile senkron)
        long minutes = Math.max(0, (diff + 59999) / 60000);

        // Expanded (açık) hali için custom view
        android.widget.RemoteViews rv = new android.widget.RemoteViews(getPackageName(), R.layout.custom_notification);
        rv.setInt(R.id.notif_layout_root, "setBackgroundColor", Color.parseColor("#E8F5E9"));
        rv.setTextColor(R.id.notif_title, Color.parseColor("#1B5E20"));
        rv.setTextColor(R.id.notif_sub, Color.BLACK);
        rv.setTextColor(R.id.notif_big, Color.BLACK);
        rv.setTextViewText(R.id.notif_title, titleMain);
        rv.setTextViewText(R.id.notif_sub, collapsedText);
        rv.setTextViewText(R.id.notif_big, bigText);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                // ✅ Collapsed halde setContentTitle + setContentText kullan
                // Bunlar her notify() çağrısında güncellenir, custom view'a bağımlı değil
                .setContentTitle(titleMain)
                .setContentText(collapsedText)
                // Expanded halde custom view göster
                .setCustomBigContentView(rv)
                .setStyle(new NotificationCompat.DecoratedCustomViewStyle())
                .setOngoing(true)
                .setSilent(true)
                .setOnlyAlertOnce(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setContentIntent(contentPI)
                .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Kapat", stopPI);

        if (minutes > 90) {
            builder.setSmallIcon(R.mipmap.ic_launcher);
        } else {
            builder.setSmallIcon(IconCompat.createWithBitmap(createCountIcon(minutes)));
        }

        Notification n = builder.build();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            boolean hasLoc = ContextCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
            int serviceType = ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE;
            if (hasLoc) {
                serviceType |= ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION;
            }
            startForeground(NOTIFICATION_ID, n, serviceType);
        } else {
            startForeground(NOTIFICATION_ID, n);
        }

        // ✅ Zorla güncelle — startForeground tek başına collapsed'ı yenilemez
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (nm != null) nm.notify(NOTIFICATION_ID, n);
    }

    private Bitmap createCountIcon(long minutes) {
        Bitmap b = Bitmap.createBitmap(128, 128, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(b);
        Paint p = new Paint();
        p.setAntiAlias(true); p.setColor(Color.WHITE); p.setTypeface(Typeface.DEFAULT_BOLD); p.setTextAlign(Paint.Align.CENTER);
        p.setTextSize(minutes > 99 ? 75f : 95f);
        c.drawText(String.valueOf(minutes), 64, 64 - ((p.descent() + p.ascent()) / 2f), p);
        return b;
    }

    private long calculateDiff(String timeStr, Calendar now, boolean tomorrow) {
        try {
            String[] p = timeStr.split(":");
            Calendar t = Calendar.getInstance();
            t.set(Calendar.HOUR_OF_DAY, Integer.parseInt(p[0]));
            t.set(Calendar.MINUTE, Integer.parseInt(p[1]));
            t.set(Calendar.SECOND, 0); t.set(Calendar.MILLISECOND, 0);
            if (tomorrow) t.add(Calendar.DATE, 1);
            return t.getTimeInMillis() - now.getTimeInMillis();
        } catch (Exception e) { return -1; }
    }

    private String formatTime(long ms) {
        return String.format(Locale.getDefault(), "%02d:%02d", TimeUnit.MILLISECONDS.toHours(ms), TimeUnit.MILLISECONDS.toMinutes(ms) % 60);
    }

    private void saveLocation(double lat, double lon) {
        getSharedPreferences(PREFS_NAME, MODE_PRIVATE).edit().putFloat(KEY_LAT, (float) lat).putFloat(KEY_LON, (float) lon).apply();
    }

    private void loadSavedLocation() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        this.lat = prefs.getFloat(KEY_LAT, 36.8841f);
        this.lon = prefs.getFloat(KEY_LON, 30.7056f);
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel c = new NotificationChannel(CHANNEL_ID, "Vakit Takibi", NotificationManager.IMPORTANCE_HIGH);
            NotificationManager m = getSystemService(NotificationManager.class);
            if (m != null) m.createNotificationChannel(c);
        }
    }

    @Override
    public void onDestroy() {
        if (handler != null) handler.removeCallbacks(countdownRunnable);
        if (fusedLocationClient != null) fusedLocationClient.removeLocationUpdates(locationCallback);
        try { unregisterReceiver(radioReceiver); } catch (Exception e) {}
        stopRadio();
        super.onDestroy();
    }

    @Override public IBinder onBind(Intent i) { return null; }
}
