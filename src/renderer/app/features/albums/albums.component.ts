import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'pm-albums',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="albums-container">
      <header class="page-header">
        <h1 class="text-2xl font-semibold">Álbuns</h1>
        <p class="text-muted">Organize suas fotos em coleções</p>
      </header>

      <div class="empty-state">
        <i class="pi pi-book text-6xl text-muted"></i>
        <h2 class="text-xl font-semibold mt-4">Nenhum álbum criado</h2>
        <p class="text-muted mt-2">Crie álbuns para organizar suas fotos</p>
        <button class="btn-primary mt-4">
          <i class="pi pi-plus"></i>
          Criar Álbum
        </button>
      </div>
    </div>
  `,
  styles: [`
    .albums-container {
      padding: 24px;
    }

    .page-header {
      margin-bottom: 24px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 400px;
      text-align: center;
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: var(--primary-color);
      color: white;
      border: none;
      border-radius: var(--border-radius);
      font-weight: 500;
      cursor: pointer;
    }
  `]
})
export class AlbumsComponent {}
