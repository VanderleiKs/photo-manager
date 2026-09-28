import { Component, OnInit, signal, computed } from '@angular/core';
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
  file_extension: string;
  camera_model: string | null;
}

@Component({
  selector: 'pm-library',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="library-container">
      <header class="page-header">
        <h1 class="text-2xl font-semibold">Todas as fotos</h1>
        <p class="text-muted">{{ filteredPhotos().length }} itens</p>
      </header>

      <!-- Filtros -->
      <div class="filters-bar">
        <div class="filter-group">
          <label class="filter-label">Ano</label>
          <select [(ngModel)]="selectedYear" (change)="applyFilters()" class="filter-select">
            <option [ngValue]="null">Todos</option>
            @for (year of availableYears(); track year) {
              <option [ngValue]="year">{{ year }}</option>
            }
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Tipo</label>
          <select [(ngModel)]="selectedType" (change)="applyFilters()" class="filter-select">
            <option [ngValue]="'all'">Todos</option>
            <option [ngValue]="'photos'">Fotos</option>
            <option [ngValue]="'videos'">Vídeos</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Favoritos</label>
          <select [(ngModel)]="selectedFavorite" (change)="applyFilters()" class="filter-select">
            <option [ngValue]="'all'">Todos</option>
            <option [ngValue]="'favorites'">Apenas favoritos</option>
          </select>
        </div>

        <div class="filter-group flex-1">
          <label class="filter-label">Buscar</label>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (input)="applyFilters()"
            placeholder="Buscar por nome..."
            class="filter-input"
          />
        </div>

        <button class="btn-secondary" (click)="clearFilters()">
          <i class="pi pi-filter-slash"></i>
          Limpar
        </button>
      </div>

      @if (loading()) {
        <div class="loading">
          <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
        </div>
      } @else {
        <div class="photos-grid">
          @for (photo of filteredPhotos(); track photo.id) {
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
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .library-container {
      padding: 24px;
    }

    .page-header {
      margin-bottom: 24px;
    }

    .filters-bar {
      display: flex;
      align-items: flex-end;
      gap: 16px;
      margin-bottom: 24px;
      padding: 16px;
      background: var(--surface-card);
      border-radius: var(--border-radius-lg);
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .filter-group.flex-1 {
      flex: 1;
    }

    .filter-label {
      font-size: 12px;
      font-weight: 500;
      color: var(--text-color-secondary);
    }

    .filter-select,
    .filter-input {
      padding: 8px 12px;
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      font-size: 14px;
      background: var(--surface-card);
      color: var(--text-color);
    }

    .filter-select:focus,
    .filter-input:focus {
      outline: none;
      border-color: var(--primary-color);
    }

    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 400px;
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

    .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: var(--surface-hover);
      color: var(--text-color);
      border: none;
      border-radius: var(--border-radius);
      font-weight: 500;
      cursor: pointer;
    }
  `]
})
export class LibraryComponent implements OnInit {
  photos = signal<Photo[]>([]);
  loading = signal(true);
  selectedYear = signal<number | null>(null);
  selectedType = signal<'all' | 'photos' | 'videos'>('all');
  selectedFavorite = signal<'all' | 'favorites'>('all');
  searchQuery = signal('');

  availableYears = computed(() => {
    const years = new Set<number>();
    for (const photo of this.photos()) {
      if (photo.taken_at) {
        years.add(new Date(photo.taken_at).getFullYear());
      }
    }
    return Array.from(years).sort((a, b) => b - a);
  });

  filteredPhotos = computed(() => {
    return this.photos().filter(photo => {
      if (this.selectedYear() && photo.taken_at) {
        if (new Date(photo.taken_at).getFullYear() !== this.selectedYear()) return false;
      }

      if (this.selectedType() === 'photos' && photo.is_video) return false;
      if (this.selectedType() === 'videos' && !photo.is_video) return false;

      if (this.selectedFavorite() === 'favorites' && !photo.is_favorite) return false;

      if (this.searchQuery()) {
        const search = this.searchQuery().toLowerCase();
        if (!photo.filename.toLowerCase().includes(search)) return false;
      }

      return true;
    });
  });

  constructor(private electron: ElectronService) {}

  async ngOnInit(): Promise<void> {
    try {
      const photos = await this.electron.getPhotos({ limit: 500 });
      this.photos.set(photos);
    } catch (error) {
      console.error('Erro ao carregar fotos:', error);
    } finally {
      this.loading.set(false);
    }
  }

  applyFilters(): void {
    // Os filtros são reativos via computed
  }

  clearFilters(): void {
    this.selectedYear.set(null);
    this.selectedType.set('all');
    this.selectedFavorite.set('all');
    this.searchQuery.set('');
  }

  openPhoto(photo: Photo): void {
    console.log('Abrir foto:', photo);
  }
}
