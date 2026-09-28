import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ElectronService } from '../../core/services/electron.service';

interface Photo {
  id: string;
  filename: string;
  taken_at: string | null;
  thumbnail?: string;
  is_video: boolean;
  is_favorite: boolean;
}

interface YearGroup {
  year: number;
  months: MonthGroup[];
  count: number;
}

interface MonthGroup {
  month: number;
  monthName: string;
  days: DayGroup[];
  count: number;
}

interface DayGroup {
  day: number;
  date: Date;
  photos: Photo[];
}

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
              <div class="year-count text-muted">{{ year.count }} fotos</div>

              <div class="months-grid">
                @for (month of year.months; track month.month) {
                  <div class="month-section">
                    <h3 class="month-title">{{ month.monthName }}</h3>
                    <div class="month-count text-muted">{{ month.count }} fotos</div>

                    <div class="days-list">
                      @for (day of month.days; track day.day) {
                        <div class="day-section">
                          <div class="day-header">
                            <span class="day-number">{{ day.day }}</span>
                            <span class="day-count text-muted">{{ day.photos.length }} fotos</span>
                          </div>
                          <div class="day-photos">
                            @for (photo of day.photos; track photo.id) {
                              <div class="photo-card" (click)="openPhoto(photo)">
                                <div class="photo-thumbnail">
                                  <img [src]="photo.thumbnail || 'assets/placeholder.png'" [alt]="photo.filename" loading="lazy">
                                  @if (photo.is_video) {
                                    <div class="video-badge">
                                      <i class="pi pi-play"></i>
                                    </div>
                                  }
                                </div>
                              </div>
                            }
                          </div>
                        </div>
                      }
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
      margin-bottom: 40px;
    }

    .year-title {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .year-count {
      font-size: 14px;
      margin-bottom: 20px;
    }

    .months-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    .month-section {
      background: var(--surface-card);
      border-radius: var(--border-radius-lg);
      padding: 16px;
    }

    .month-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .month-count {
      font-size: 13px;
      margin-bottom: 16px;
    }

    .days-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .day-section {
      border-left: 3px solid var(--surface-border);
      padding-left: 12px;
    }

    .day-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .day-number {
      font-size: 16px;
      font-weight: 600;
    }

    .day-count {
      font-size: 12px;
    }

    .day-photos {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 8px;
    }

    .photo-card {
      cursor: pointer;
      border-radius: var(--border-radius);
      overflow: hidden;
      transition: transform 0.2s ease;
    }

    .photo-card:hover {
      transform: scale(1.05);
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
      bottom: 4px;
      left: 4px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
    }
  `]
})
export class TimelineComponent implements OnInit {
  photos = signal<Photo[]>([]);
  loading = signal(true);

  years = computed<YearGroup[]>(() => {
    const grouped = new Map<number, YearGroup>();

    for (const photo of this.photos()) {
      if (!photo.taken_at) continue;

      const date = new Date(photo.taken_at);
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();

      if (!grouped.has(year)) {
        grouped.set(year, { year, months: [], count: 0 });
      }
      const yearGroup = grouped.get(year)!;
      yearGroup.count++;

      let monthGroup = yearGroup.months.find(m => m.month === month);
      if (!monthGroup) {
        monthGroup = {
          month,
          monthName: this.getMonthName(month),
          days: [],
          count: 0
        };
        yearGroup.months.push(monthGroup);
      }
      monthGroup.count++;

      let dayGroup = monthGroup.days.find(d => d.day === day);
      if (!dayGroup) {
        dayGroup = { day, date: new Date(year, month, day), photos: [] };
        monthGroup.days.push(dayGroup);
      }
      dayGroup.photos.push(photo);
    }

    // Ordenar
    const result = Array.from(grouped.values());
    result.sort((a, b) => b.year - a.year);
    for (const y of result) {
      y.months.sort((a, b) => b.month - a.month);
      for (const m of y.months) {
        m.days.sort((a, b) => b.day - a.day);
      }
    }

    return result;
  });

  constructor(
    private electron: ElectronService,
    private route: ActivatedRoute
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      const photos = await this.electron.getPhotos({ limit: 1000 });
      this.photos.set(photos);
    } catch (error) {
      console.error('Erro ao carregar timeline:', error);
    } finally {
      this.loading.set(false);
    }
  }

  getMonthName(month: number): string {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month];
  }

  openPhoto(photo: Photo): void {
    console.log('Abrir foto:', photo);
  }
}
