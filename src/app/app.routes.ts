import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', loadComponent: () => import('./home/home.page').then((m) => m.HomePage) },
  { path: 'applications', loadComponent: () => import('./pages/applications/applications.component').then(m => m.ApplicationsComponent) },
  { path: 'zikirmatik', loadComponent: () => import('./pages/zikirmatik/zikirmatik.page').then(m => m.ZikirmatikPage) },
  { path: 'library', loadComponent: () => import('./pages/library/library.page').then(m => m.LibraryPage) },
  { path: 'library-detail/:id', loadComponent: () => import('./pages/library-detail/library-detail.component').then(m => m.LibraryDetailComponent) },
  { path: 'settings', loadComponent: () => import('./pages/settings/settings.page').then(m => m.SettingsPage) },
  {
    path: 'dream-interpretation',
    loadComponent: () => import('./pages/dream-interpretation/dream-interpretation.page').then(m => m.DreamInterpretationPage)
  },
  { path: 'qibla', loadComponent: () => import('./pages/qibla/qibla.component').then(m => m.QiblaComponent) },
  { path: 'tefeul', loadComponent: () => import('./pages/tefeul/tefeul.page').then(m => m.TefeulPage) },
  {
    path: 'ebced',
    loadComponent: () => import('./pages/ebced/ebced.component').then(m => m.Ebced)
  },
  { path: 'reminder', loadComponent: () => import('./pages/reminder/reminder.component').then(m => m.ReminderComponent) },
  { path: 'converter', loadComponent: () => import('./pages/converter/converter.component').then(m => m.ConverterComponent) },
  { path: 'religious-detail/:id', loadComponent: () => import('./pages/religious-content/religious-content.page').then( m => m.ReligiousContentPage) },
  { path: 'radio', loadComponent: () => import('./pages/radio/radio.component').then(m => m.RadioComponent) },
  { path: 'tracing', loadComponent: () => import('./pages/tracing/tracing.component').then(m => m.TracingComponent) },
  { path: 'mosque', loadComponent: () => import('./pages/mosque/mosque.component').then(m => m.MosquesComponent) },
  { path: 'premium', loadComponent: () => import('./pages/premium/premium.component').then(m => m.PremiumPage) },
];
