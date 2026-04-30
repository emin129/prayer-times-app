import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.ezancepte',
  appName: 'ezan-vakti-app',
  webDir: 'www',
  plugins: {
    LocalNotifications: {
      // Küçük ikon isminin res/drawable klasöründe olduğundan emin ol
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      // Sabit sound satırını sildik; böylece SettingsService içindeki
      // 'ezan', 'medine_ezan' ve 'ayasofya_ezan' sesleri özgürce çalabilir.
    }
  }
};

export default config;
