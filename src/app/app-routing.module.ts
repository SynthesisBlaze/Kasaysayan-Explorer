import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./splashscreen/splashscreen.module').then(m => m.SplashscreenPageModule)
  },
  {
    path: '',
    redirectTo: '/tabs',
    pathMatch: 'full'
  },
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
  },
  {
    path: 'figures/:id',
    loadChildren: () => import('./figures/figures.module').then(m => m.FiguresPageModule)
  },
  {
    path: 'places/:id',
    loadChildren: () => import('./places/places.module').then(m => m.PlacesPageModule)
  },
  {
    path: 'events/:id',
    loadChildren: () => import('./events/events.module').then(m => m.EventsPageModule)
  },
  {
    path: 'periods/:id',
    loadChildren: () => import('./periods/periods.module').then(m => m.PeriodsPageModule)
  },
  {
    path: 'settings',
    loadChildren: () => import('./settings/settings.page').then( m => m.SettingsPage)
  },
  {
    path: 'quiz',
    loadComponent: () => import('./quiz/quiz.page').then( m => m.QuizPage)
  },
  {
    path: 'quiz-menu',
    loadComponent: () => import('./quizMenu/quizMenu.page').then((m) => m.QuizMenuPage),
  },
  {
    path: 'quiz2',
    loadComponent: () => import('./quiz2/quiz2.page').then( m => m.Quiz2Page)
  },
  {
    path: 'historical-events',
    loadComponent: () => import('./seeMore/historical-events/historical-events.page').then( m => m.HistoricalEventsPage)
  },
  {
    path: 'historical-places',
    loadComponent: () => import('./seeMore/historical-places/historical-places.page').then( m => m.HistoricalPlacesPage)
  },
  {
    path: 'historical-figures',
    loadComponent: () => import('./seeMore/historical-figures/historical-figures.page').then( m => m.HistoricalFiguresPage)
  },
  {
    path: 'historical-periods',
    loadComponent: () => import('./seeMore/historical-periods/historical-periods.page').then( m => m.HistoricalPeriodsPage)
  },
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
