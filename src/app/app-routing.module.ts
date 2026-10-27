import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { nonAdminOnlyGuard } from './admin/non-admin-only.guard';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadChildren: () => import('./splashscreen/splashscreen.module').then(m => m.SplashscreenPageModule)
  },
  {
    path: '',
    redirectTo: '/tabs',
    pathMatch: 'full'
  },
  {
    path: 'tabs',
    canMatch: [nonAdminOnlyGuard],
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
  },
  {
    path: 'figures/:id',
    canMatch: [nonAdminOnlyGuard],
    loadChildren: () => import('./figures/figures.module').then(m => m.FiguresPageModule)
  },
  {
    path: 'places/:id',
    canMatch: [nonAdminOnlyGuard],
    loadChildren: () => import('./places/places.module').then(m => m.PlacesPageModule)
  },
  {
    path: 'events/:id',
    canMatch: [nonAdminOnlyGuard],
    loadChildren: () => import('./events/events.module').then(m => m.EventsPageModule)
  },
  {
    path: 'periods/:id',
    canMatch: [nonAdminOnlyGuard],
    loadChildren: () => import('./periods/periods.module').then(m => m.PeriodsPageModule)
  },
  {
    path: 'assistant',
    canMatch: [nonAdminOnlyGuard],
    loadComponent: () => import('./assistant/assistant.page').then(m => m.AssistantPage)
  },
  { path: 'settings', redirectTo: '/tabs/account', pathMatch: 'full' },
  { path: 'account', redirectTo: '/tabs/account', pathMatch: 'full' },
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin.page').then(m => m.AdminPage)
  },
  {
    path: 'quiz',
    canMatch: [nonAdminOnlyGuard],
    loadComponent: () => import('./quiz/quiz.page').then( m => m.QuizPage)
  },
  {
    path: 'quiz-menu',
    canMatch: [nonAdminOnlyGuard],
    loadComponent: () => import('./quizMenu/quizMenu.page').then((m) => m.QuizMenuPage),
  },
  {
    path: 'quiz2',
    canMatch: [nonAdminOnlyGuard],
    loadComponent: () => import('./quiz2/quiz2.page').then( m => m.Quiz2Page)
  },
  {
    path: 'historical-events',
    canMatch: [nonAdminOnlyGuard],
    loadComponent: () => import('./seeMore/historical-events/historical-events.page').then( m => m.HistoricalEventsPage)
  },
  {
    path: 'historical-places',
    canMatch: [nonAdminOnlyGuard],
    loadComponent: () => import('./seeMore/historical-places/historical-places.page').then( m => m.HistoricalPlacesPage)
  },
  {
    path: 'historical-figures',
    canMatch: [nonAdminOnlyGuard],
    loadComponent: () => import('./seeMore/historical-figures/historical-figures.page').then( m => m.HistoricalFiguresPage)
  },
  {
    path: 'historical-periods',
    canMatch: [nonAdminOnlyGuard],
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
