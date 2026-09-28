import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ElectronService } from '../../core/services/electron.service';

interface Photo {
  id: string;
  filename: string;
  taken_at: string | null;
  thumbnail?: string;
  is_video: boolean;
  is_favorite: boolean;
  camera_model: string | null;
}

@Component({
  selector: 'pm-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="search-container">
      <header class="page-header">
        <h1 class="text-2xl font-semibold">Buscar</h1>
        <p class="text-muted">Encontre fotos por nome, data, local...</p>
      </header>

      <div class="search-box">
        <i class="pi pi-search"></i>
        <input
          type="text"
          [(ngModel)]="query"
          (input)="onSearch()"
          placeholder="Buscar fotos, pessoas, locais, álbuns..."
          class="search-input"
        />
        @if (query()) {
          <button class="clear-btn" (click)="clearSearch()">
            <i class="pi pi-times"></i>
          </button>
        }
      </div>

      @if (loading()) {
        <div class="loading">
          <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
        </div>
      } @else if (query() && results().length === 0) {
        <div class="no-results">
          <i class="pi pi-search text-6xl text-muted"></i>
          <h2 class="text-xl font-semibold mt-4">Nenhum resultado</h2>
          <p class="text-muted mt-2">Tente buscar por outro termo</p>
        </div>
      } @else if (results().length > 0) {
        <div class="results-count text-muted mt-4 mb-4">
          {{ results().length }} resultados encontrados
        </div>
        <div class="photos-grid">
          @for (photo of results(); track photo.id) {
            <div class="photo-card" (click)="openPhoto(photo)">
              <div class="photo-thumbnail">
                <img [src]="photo.thumbnail || 'assets/placeholder.png'" [alt]="photo.filename" loading="lazy">
                @if (photo.is_video) {
                  <div class="video-badge">
                    <i class="pi pi-play"></i>
                  </div>
                }
                @if (photo.is_favorite) {
                  <div class="favorite-badge">
                    <i class="pi pi-heart-fill"></i>
                  </div>
                }
              </div>
              <div class="photo-info">
                <span class="photo-name truncate">{{ photo.filename }}</span>
                <span class="photo-date text-xs text-muted">{{ photo.taken_at | date:'dd/MM/yyyy' }}</span>
                @if (photo.camera_model) {
                  <span class="photo-camera text-xs text-muted">{{ photo.camera_model }}</span>
                }
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="search-suggestions">
          <h3 class="text-lg font-semibold mb-4">Sugestões de busca</h3>
          <div class="suggestions-grid">
            <div class="suggestion-card" (click)="quickSearch('2024')">
              <i class="pi pi-calendar"></i>
              <span>Fotos de 2024</span>
            </div>
            <div class="suggestion-card" (click)="quickSearch('favoritos')">
              <i class="pi pi-heart"></i>
              <span>Favoritos</span>
            </div>
            <div class="suggestion-card" (click)="quickSearch('vídeos')">
              <i class="pi pi-video"></i>
              <span>Vídeos</span>
            </div>
            <div class="suggestion-card" (click)="quickSearch('Gramado')">
              <i class="pi pi-map-marker"></i>
              <span>Gramado</span>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .search-container {
      padding: 24px;
    }

    .page-header {
      margin-bottom: 24px;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius-lg);
      padding: 12px 16px;
      margin-bottom: 24px;
    }

    .search-box i {
      color: var(--text-color-muted);
      font-size: 1.2rem;
    }

    .search-input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 16px;
      background: transparent;
      color: var(--text-color);
    }

    .search-input::placeholder {
      color: var(--text-color-muted);
    }

    .clear-btn {
      background: none;
      border: none;
      color: var(--text-color-muted);
      cursor: pointer;
      padding: 4px;
    }

    .clear-btn:hover {
      color: var(--text-color);
    }

    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 300px;
    }

    .no-results {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 300px;
      text-align: center;
    }

    .results-count {
      font-size: 14px;
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

    .video-badge {
      position: absolute;
      bottom: 8px;
      left: 8px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
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

    .photo-camera {
      display: block;
      margin-top: 2px;
    }

    .search-suggestions {
      padding: 24px;
    }

    .suggestions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 12px;
    }

    .suggestion-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 20px;
      background: var(--surface-card);
      border-radius: var(--border-radius-lg);
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .suggestion-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .suggestion-card i {
      font-size: 24px;
      color: var(--primary-color);
    }

    .suggestion-card span {
      font-size: 14px;
      font-weight: 500;
    }
  `]
})
export class SearchComponent {
  query = signal('');
  results = signal<Photo[]>([]);
  loading = signal(false);

  constructor(private electron: ElectronService) {}

  async onSearch(): Promise<void> {
    const q = this.query().trim();
    if (!q) {
      this.results.set([]);
      return;
    }

    this.loading.set(true);
    try {
      const photos = await this.electron.getPhotos({ search: q, limit: 100 });
      this.results.set(photos);
    } catch (error) {
      console.error('Erro na busca:', error);
    } finally {
      this.loading.set(false);
    }
  }

  quickSearch(term: string): void {
    this.query.set(term);
    this.onSearch();
  }

  clearSearch(): void {
    this.query.set('');
    this.results.set([]);
  }

  openPhoto(photo: Photo): void {
    console.log('Abrir foto:', photo);
  }
}
