import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ElectronService } from '../../core/services/electron.service';

interface YearCount {
  year: number;
  count: number;
}

interface Stats {
  totalPhotos: number;
  totalVideos: number;
  totalFavorites: number;
  totalLibraries: number;
  years: YearCount[];
}

@Component({
  selector: 'pm-home',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <div class="home-container">
      <!-- Header -->
      <header class="header">
        <div class="header-left">
          <i class="pi pi-images text-2xl text-primary"></i>
          <h1 class="text-2xl font-semibold">PhotoManager</h1>
        </div>
        <div class="header-right">
          <button class="btn-primary" (click)="selectFolder()">
            <i class="pi pi-folder-open"></i>
            Selecionar Pasta
          </button>
        </div>
      </header>

      <!-- Main Content -->
      <main class="main-content">
        @if (loading()) {
          <div class="loading-container">
            <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
            <p class="mt-4 text-muted">Carregando biblioteca...</p>
          </div>
        } @else if (hasLibrary()) {
          <div class="content-grid">
            <!-- Sidebar -->
            <aside class="sidebar">
              <nav class="nav-menu">
                <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
                  <i class="pi pi-home"></i>
                  <span>Início</span>
                </a>
                <a routerLink="/library" routerLinkActive="active" class="nav-item">
                  <i class="pi pi-images"></i>
                  <span>Todas as fotos</span>
                </a>
                <a routerLink="/timeline" routerLinkActive="active" class="nav-item">
                  <i class="pi pi-calendar"></i>
                  <span>Timeline</span>
                </a>
                <a routerLink="/albums" routerLinkActive="active" class="nav-item">
                  <i class="pi pi-book"></i>
                  <span>Álbuns</span>
                </a>
                <a routerLink="/events" routerLinkActive="active" class="nav-item">
                  <i class="pi pi-map"></i>
                  <span>Viagens</span>
                </a>
                <a routerLink="/people" routerLinkActive="active" class="nav-item">
                  <i class="pi pi-users"></i>
                  <span>Pessoas</span>
                </a>
                <a routerLink="/favorites" routerLinkActive="active" class="nav-item">
                  <i class="pi pi-heart-fill"></i>
                  <span>Favoritos</span>
                </a>
              </nav>

              <div class="nav-section">
                <h3 class="nav-section-title">Organizar</h3>
                <a routerLink="/organize" routerLinkActive="active" class="nav-item">
                  <i class="pi pi-copy"></i>
                  <span>Possíveis duplicatas</span>
                  <span class="badge">1.248</span>
                </a>
                <a routerLink="/organize" routerLinkActive="active" class="nav-item">
                  <i class="pi pi-clone"></i>
                  <span>Fotos semelhantes</span>
                  <span class="badge">2.391</span>
                </a>
                <a routerLink="/organize" routerLinkActive="active" class="nav-item">
                  <i class="pi pi-exclamation-triangle"></i>
                  <span>Baixa qualidade</span>
                  <span class="badge">382</span>
                </a>
                <a routerLink="/organize" routerLinkActive="active" class="nav-item">
                  <i class="pi pi-camera"></i>
                  <span>Fotos momentâneas</span>
                  <span class="badge">927</span>
                </a>
                <a routerLink="/organize" routerLinkActive="active" class="nav-item">
                  <i class="pi pi-desktop"></i>
                  <span>Screenshots</span>
                  <span class="badge">641</span>
                </a>
                <a routerLink="/review" routerLinkActive="active" class="nav-item">
                  <i class="pi pi-check-square"></i>
                  <span>Revisão</span>
                  <span class="badge">4.823</span>
                </a>
              </div>

              <div class="nav-section">
                <h3 class="nav-section-title">Biblioteca</h3>
                <a routerLink="/library" routerLinkActive="active" class="nav-item">
                  <i class="pi pi-database"></i>
                  <span>Bibliotecas</span>
                </a>
                <a routerLink="/settings" routerLinkActive="active" class="nav-item">
                  <i class="pi pi-cog"></i>
                  <span>Configurações</span>
                </a>
              </div>
            </aside>

            <!-- Content Area -->
            <div class="content-area">
              <!-- Welcome Banner -->
              <div class="welcome-banner">
                <div class="welcome-content">
                  <h2 class="text-2xl font-semibold">Bem-vindo ao PhotoManager</h2>
                  <p class="text-muted">Sua biblioteca inteligente de fotos e vídeos</p>
                </div>
                <div class="welcome-stats">
                  <div class="stat-card">
                    <i class="pi pi-image text-2xl text-primary"></i>
                    <div class="stat-info">
                      <span class="stat-value">{{ stats()?.totalPhotos | number }}</span>
                      <span class="stat-label">Fotos</span>
                    </div>
                  </div>
                  <div class="stat-card">
                    <i class="pi pi-video text-2xl text-primary"></i>
                    <div class="stat-info">
                      <span class="stat-value">{{ stats()?.totalVideos | number }}</span>
                      <span class="stat-label">Vídeos</span>
                    </div>
                  </div>
                  <div class="stat-card">
                    <i class="pi pi-map text-2xl text-primary"></i>
                    <div class="stat-info">
                      <span class="stat-value">17</span>
                      <span class="stat-label">Viagens</span>
                    </div>
                  </div>
                  <div class="stat-card">
                    <i class="pi pi-heart-fill text-2xl text-primary"></i>
                    <div class="stat-info">
                      <span class="stat-value">{{ stats()?.totalFavorites | number }}</span>
                      <span class="stat-label">Favoritos</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Years Section -->
              <section class="years-section">
                <h3 class="section-title">Anos</h3>
                <div class="years-grid">
                  @for (year of stats()?.years; track year.year) {
                    <a [routerLink]="['/timeline']" [queryParams]="{year: year.year}" class="year-card">
                      <div class="year-overlay">
                        <span class="year-value">{{ year.year }}</span>
                        <span class="year-count">{{ year.count | number }} fotos</span>
                      </div>
                    </a>
                  }
                </div>
              </section>

              <!-- Recent Photos -->
              <section class="recent-section">
                <div class="section-header">
                  <h3 class="section-title">Fotos recentes</h3>
                  <a routerLink="/library" class="see-all">Ver todas</a>
                </div>
                <div class="photos-grid">
                  @for (photo of recentPhotos(); track photo.id) {
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
              </section>
            </div>
          </div>
        } @else {
          <div class="empty-state">
            <i class="pi pi-images text-6xl text-muted"></i>
            <h2 class="text-2xl font-semibold mt-4">Nenhuma biblioteca configurada</h2>
            <p class="text-muted mt-2">Selecione uma pasta com suas fotos para começar</p>
            <button class="btn-primary mt-4" (click)="selectFolder()">
              <i class="pi pi-folder-open"></i>
              Selecionar Pasta
            </button>
          </div>
        }
      </main>
    </div>
  `,
  styles: [`
    .home-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      height: 60px;
      background: var(--surface-card);
      border-bottom: 1px solid var(--surface-border);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .main-content {
      flex: 1;
      overflow: auto;
      padding: 24px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 260px 1fr;
      gap: 24px;
      height: 100%;
    }

    .sidebar {
      background: var(--surface-card);
      border-radius: var(--border-radius-lg);
      padding: 16px;
      overflow-y: auto;
    }

    .nav-menu {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: var(--border-radius);
      color: var(--text-color);
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .nav-item:hover {
      background: var(--surface-hover);
    }

    .nav-item.active {
      background: var(--primary-color);
      color: var(--primary-color-text);
    }

    .nav-item i {
      font-size: 1.2rem;
    }

    .badge {
      margin-left: auto;
      background: var(--surface-border);
      color: var(--text-color);
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
    }

    .nav-section {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid var(--surface-border);
    }

    .nav-section-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-color-muted);
      margin-bottom: 8px;
      padding: 0 12px;
    }

    .content-area {
      overflow-y: auto;
    }

    .welcome-banner {
      background: linear-gradient(135deg, var(--primary-color), #1d4ed8);
      border-radius: var(--border-radius-lg);
      padding: 32px;
      color: white;
      margin-bottom: 24px;
    }

    .welcome-content h2 {
      color: white;
    }

    .welcome-content p {
      color: rgba(255, 255, 255, 0.8);
    }

    .welcome-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-top: 24px;
    }

    .stat-card {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: var(--border-radius);
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 20px;
      font-weight: 700;
    }

    .stat-label {
      font-size: 12px;
      opacity: 0.8;
    }

    .years-section {
      margin-bottom: 24px;
    }

    .section-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
    }

    .years-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 12px;
    }

    .year-card {
      aspect-ratio: 1;
      border-radius: var(--border-radius);
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.2s ease;
    }

    .year-card:hover {
      transform: scale(1.05);
    }

    .year-overlay {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .year-value {
      font-size: 24px;
      font-weight: 700;
    }

    .year-count {
      font-size: 12px;
      opacity: 0.8;
    }

    .recent-section {
      margin-bottom: 24px;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .see-all {
      color: var(--primary-color);
      text-decoration: none;
      font-weight: 500;
    }

    .see-all:hover {
      text-decoration: underline;
    }

    .photos-grid {
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
      padding: 8px 12px;
    }

    .photo-name {
      display: block;
      font-weight: 500;
      font-size: 13px;
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
      transition: background 0.2s ease;
    }

    .btn-primary:hover {
      background: #2563eb;
    }
  `]
})
export class HomeComponent implements OnInit {
  loading = signal(true);
  hasLibrary = signal(false);
  stats = signal<Stats | null>(null);
  recentPhotos = signal<any[]>([]);

  constructor(private electron: ElectronService) {}

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  async loadData(): Promise<void> {
    try {
      const library = await this.electron.getCurrentLibrary();
      if (library) {
        this.hasLibrary.set(true);
        const [stats, photos] = await Promise.all([
          this.electron.getStats(),
          this.electron.getRecentPhotos(20)
        ]);
        this.stats.set(stats);
        this.recentPhotos.set(photos);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async selectFolder(): Promise<void> {
    try {
      const folder = await this.electron.selectFolder();
      if (folder) {
        const name = folder.split(/[\\/]/).pop() || 'Biblioteca';
        await this.electron.createLibrary(name, folder);
        await this.loadData();
      }
    } catch (error) {
      console.error('Erro ao selecionar pasta:', error);
    }
  }

  openPhoto(photo: any): void {
    console.log('Abrir foto:', photo);
  }
}
