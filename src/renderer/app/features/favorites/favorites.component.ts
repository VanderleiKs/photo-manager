import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ElectronService } from '../../core/services/electron.service';

@Component({
  selector: 'pm-favorites',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="favorites-container">
      <header class="page-header">
        <h1 class="text-2xl font-semibold">Favoritos</h1>
        <p class="text-muted">{{ photos().length }} fotos favoritas</p>
      </header>

      @if (loading()) {
        <div class="loading">
          <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
        </div>
      } @else if (photos().length === 0) {
        <div class="empty-state">
          <i class="pi pi-heart text-6xl text-muted"></i>
          <h2 class="text-xl font-semibold mt-4">Nenhum favorito</h2>
          <p class="text-muted mt-2">Marque fotos como favoritas para vê-las aqui</p>
        </div>
      } @else {
        <div class="photos-grid">
          @for (photo of photos(); track photo.id) {
            <div class="photo-card">
              <div class="photo-thumbnail">
                <img [src]="photo.thumbnail || 'assets/placeholder.png'" [alt]="photo.filename" loading="lazy">
                <div class="favorite-badge">
                  <i class="pi pi-heart-fill"></i>
                </div>
              </div>
              <div class="photo-info">
                <span class="photo-name truncate">{{ photo.filename }}</span>
                <span class="photo-date text-xs text-muted">{{ photo.taken_at | date:'dd/MM/yyyy' }}</span>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .favorites-container {
      padding: 24px;
    }

    .page-header {
      margin-bottom: 24px;
    }

    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 400px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 400px;
      text-align: center;
    }

    .photos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }

    .photo-card {
      background: var(--surface-card);
      border-radius: var(--border-radius);
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .photo-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .photo-thumbnail {
      aspect-ratio: 1;
      background: var(--surface-hover);
      position: relative;
    }

    .photo-thumbnail img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .favorite-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      color: #ef4444;
      font-size: 16px;
    }

    .photo-info {
      padding: 12px;
    }

    .photo-name {
      display: block;
      font-weight: 500;
      font-size: 13px;
    }
  `]
})
export class FavoritesComponent implements OnInit {
  photos = signal<any[]>([]);
  loading = signal(true);

  constructor(private electron: ElectronService) {}

  async ngOnInit(): Promise<void> {
    try {
      const photos = await this.electron.getPhotos({ isFavorite: true, limit: 100 });
      this.photos.set(photos);
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
    } finally {
      this.loading.set(false);
    }
  }
}
