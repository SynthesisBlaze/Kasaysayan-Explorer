import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'discover',
        loadComponent: () => import('../discover/discover.page').then(m => m.DiscoverPage)
      },
      {
        path: 'search',
        loadComponent: () => import('../search/search.page').then(m => m.SearchPage)
      },
      {
        path: 'quizMenu',
        loadComponent: () => import('../quizMenu/quizMenu.page').then(m => m.QuizMenuPage)
      },
      {
        path: 'favorites',
        loadComponent: () => import('../favorites/favorites.page').then(m => m.FavoritesPage)
      },
      {
        path: 'settings',
        loadComponent: () => import('../settings/settings.page').then(m => m.SettingsPage)
      },
      {
        path: '',
        redirectTo: 'discover',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class TabsPageRoutingModule {}