import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ElectronService } from '../../core/services/electron.service';

@Component({
  selector: 'pm-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="timeline-container">
      <header class="page-header">
        <h1 class="text-2xl font-semibold">Timeline</h1>
        <p class="text-muted">Navegue por data</p>
      </header>

      @if (loading()) {
        <div class="loading">
          <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
        </div>
      } @else {
        <div class="timeline-content">
          @for (year of years(); track year.year) {
            <div class="year-section">
              <h2 class="year-title">{{ year.year }}</h2>
              <div class="year-photos">
                @for (photo of getPhotosByYear(year.year); track photo.id) {
                  <div class="photo-card">
                    <div class="photo-thumbnail">
                      <img [src]="photo.thumbnail || 'assets/placeholder.png'" [alt]="photo.filename" loading="lazy">
                    </div>
                    <div class="photo-info">
                      <span class="photo-name truncate">{{ photo.filename }}</span>
                      <span class="photo-date text-xs text-muted">{{ photo.taken_at | date:'dd/MM/yyyy' }}</span>
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .timeline-container {
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

    .year-section {
      margin-bottom: 32px;
    }

    .year-title {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 16px;
      color: var(--text-color);
    }

    .year-photos {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 12px;
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
    }

    .photo-thumbnail img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .photo-info {
      padding: 8px 12px;
    }

    .photo-name {
      display: block;
      font-weight: 500;
      font-size: 13px;
    }
  `]
})
export class TimelineComponent implements OnInit {
  years = signal<any[]>([]);
  photos = signal<any[]>([]);
  loading = signal(true);

  constructor(
    private electron: ElectronService,
    private route: ActivatedRoute
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      const [years, photos] = await Promise.all([
        this.electron.getYears(),
        this.electron.getPhotos({ limit: 500 })
      ]);
      this.years.set(years);
      this.photos.set(photos);
    } catch (error) {
      console.error('Erro ao carregar timeline:', error);
    } finally {
      this.loading.set(false);
    }
  }

  getPhotosByYear(year: number): any[] {
    return this.photos().filter(p => {
      if (!p.taken_at) return false;
      return new Date(p.taken_at).getFullYear() === year;
    });
  }
}
