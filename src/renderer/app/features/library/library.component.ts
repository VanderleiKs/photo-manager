import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ElectronService } from '../../core/services/electron.service';

@Component({
  selector: 'pm-library',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="library-container">
      <header class="page-header">
        <h1 class="text-2xl font-semibold">Todas as fotos</h1>
        <p class="text-muted">{{ photos().length }} itens</p>
      </header>

      @if (loading()) {
        <div class="loading">
          <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
        </div>
      } @else {
        <div class="photos-grid">
          @for (photo of photos(); track photo.id) {
            <div class="photo-card">
              <div class="photo-thumbnail">
                <img [src]="photo.thumbnail || 'assets/placeholder.png'" [alt]="photo.filename" loading="lazy">
                @if (photo.is_video) {
                  <div class="video-badge">
                    <i class="pi pi-play"></i>
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
export class LibraryComponent implements OnInit {
  photos = signal<any[]>([]);
  loading = signal(true);

  constructor(private electron: ElectronService) {}

  async ngOnInit(): Promise<void> {
    try {
      const photos = await this.electron.getPhotos({ limit: 100 });
      this.photos.set(photos);
    } catch (error) {
      console.error('Erro ao carregar fotos:', error);
    } finally {
      this.loading.set(false);
    }
  }
}
