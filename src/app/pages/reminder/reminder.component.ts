import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from 'src/app/services/settings';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
// Ionic Standalone Bileşenlerini İçe Aktar
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonIcon,
  IonInput,
  IonButton,
  IonDatetime,
  IonDatetimeButton,
  IonModal,
  IonToggle
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  notificationsOutline,
  timeOutline,
  addCircle,
  trashOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-reminder',
  templateUrl: './reminder.component.html',
  styleUrls: ['./reminder.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    // Modülleri Buraya Ekledik Aga
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonIcon,
    IonInput,
    IonButton,
    IonDatetime,
    IonDatetimeButton,
    IonModal,
    IonToggle,
    TranslateModule
  ]
})
export class ReminderComponent implements OnInit {
  public settings = inject(SettingsService);

  newReminderTitle: string = '';
  newReminderTime: string = new Date().toISOString();

  constructor() {
    // İkonları Kaydediyoruz
    addIcons({
      notificationsOutline,
      timeOutline,
      addCircle,
      trashOutline
    });
  }

  ngOnInit() {
    this.settings.requestNotificationPermission();
  }

  async addReminder() {
    if (this.newReminderTitle.trim()) {
      const time = new Date(this.newReminderTime);
      const formattedTime = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;

      await this.settings.addCustomReminder(this.newReminderTitle, formattedTime);
      this.newReminderTitle = '';
    }
  }

  async toggleReminder(reminder: any) {
    await this.settings.toggleCustomReminder(reminder);
  }

  async deleteReminder(id: number) {
    await this.settings.deleteCustomReminder(id);
  }
}
