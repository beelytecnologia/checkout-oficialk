import { Routes } from '@angular/router';
import { CatalogComponent } from './catalogo/catalog.component';

export const routes: Routes = [
  /* rota principal do catálogo */
  { path: 'catalog', component: CatalogComponent },

  /* raiz do site → redireciona para /catalog */
  { path: '', redirectTo: 'catalog', pathMatch: 'full' },

  /* qualquer outra URL cai no catálogo */
  { path: '**', redirectTo: 'catalog' }
];
