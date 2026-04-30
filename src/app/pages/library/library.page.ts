import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-library',
  templateUrl: './library.page.html',
  styleUrls: ['./library.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule,TranslateModule]
})
export class LibraryPage implements OnInit {

  libraryCategories = [
    {
      id: 'kuran',
      title: "Kur'an-ı Kerim",
      subtitle: 'Sureler ve Mealler',
      icon: 'book',
      color: 'success'
    },
    {
      id: 'hadis',
      title: 'Hadis-i Şerifler',
      subtitle: 'Seçme Hadisler',
      icon: 'library',
      color: 'tertiary'
    },
    {
      id: 'cevşen',
      title: 'Cevşen-ül Kebir',
      subtitle: 'Münacat ve Dualar',
      icon: 'shield-checkmark',
      color: 'warning'
    },
    {
      id: 'tabirler',
      title: 'Rüya Tabirleri',
      subtitle: 'İslami Kaynaklı',
      icon: 'moon',
      color: 'secondary'
    },
    {
      id: 'ilmihal',
      title: 'Temel İlmihal',
      subtitle: 'Dini Bilgiler Rehberi',
      icon: 'school',
      color: 'medium'
    }
  ];

  constructor(private router: Router) {}

  ngOnInit() {}

  goToDetail(categoryId: string) {
    this.router.navigate(['/library-detail', categoryId]);
  }
}
