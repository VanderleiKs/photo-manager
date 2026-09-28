import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'library',
    loadComponent: () => import('./features/library/library.component').then(m => m.LibraryComponent)
  },
  {
    path: 'timeline',
    loadComponent: () => import('./features/timeline/timeline.component').then(m => m.TimelineComponent)
  },
  {
    path: 'albums',
    loadComponent: () => import('./features/albums/albums.component').then(m => m.AlbumsComponent)
  },
  {
    path: 'events',
    loadComponent: () => import('./features/events/events.component').then(m => m.EventsComponent)
  },
  {
    path: 'people',
    loadComponent: () => import('./features/people/people.component').then(m => m.PeopleComponent)
  },
  {
    path: 'favorites',
    loadComponent: () => import('./features/favorites/favorites.component').then(m => m.FavoritesComponent)
  },
  {
    path: 'organize',
    loadComponent: () => import('./features/organize/organize.component').then(m => m.OrganizeComponent)
  },
  {
    path: 'review',
    loadComponent: () => import('./features/review/review.component').then(m => m.ReviewComponent)
  },
  {
    path: 'search',
    loadComponent: () => import('./features/search/search.component').then(m => m.SearchComponent)
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
