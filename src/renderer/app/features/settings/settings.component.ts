import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ElectronService } from '../../core/services/electron.service';

@Component({
  selector: 'pm-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="settings-container">
      <header class="page-header">
        <h1 class="text-2xl font-semibold">Configurações</h1>
        <p class="text-muted">Gerencie suas preferências</p>
      </header>

      <div class="settings-grid">
        <div class="settings-card">
          <h3 class="settings-title">Biblioteca</h3>
          <div class="settings-item">
            <div class="settings-info">
              <span class="settings-label">Pasta da biblioteca</span>
              <span class="settings-value">{{ libraryPath() || 'Não configurada' }}</span>
            </div>
            <button class="btn-secondary" (click)="selectFolder()">
              <i class="pi pi-folder-open"></i>
              Selecionar
            </button>
          </div>
          @if (libraryPath()) {
            <div class="settings-item">
              <div class="settings-info">
                <span class="settings-label">Último scan</span>
                <span class="settings-value">{{ lastScan() || 'Nunca' }}</span>
              </div>
              <button class="btn-primary" (click)="scanLibrary()">
                <i class="pi pi-refresh"></i>
                Escanear
              </button>
            </div>
          }
        </div>

        <div class="settings-card">
          <h3 class="settings-title">Estatísticas</h3>
          <div class="stats-list">
            <div class="stat-item">
              <span class="stat-label">Total de fotos</span>
              <span class="stat-value">{{ stats()?.totalPhotos | number }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Total de vídeos</span>
              <span class="stat-value">{{ stats()?.totalVideos | number }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Favoritos</span>
              <span class="stat-value">{{ stats()?.totalFavorites | number }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Bibliotecas</span>
              <span class="stat-value">{{ stats()?.totalLibraries | number }}</span>
            </div>
          </div>
        </div>

        <div class="settings-card">
          <h3 class="settings-title">Sobre</h3>
          <div class="about-info">
            <p><strong>PhotoManager</strong></p>
            <p class="text-muted">Versão 1.0.0</p>
            <p class="text-muted">Aplicativo desktop para organização inteligente de fotos</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-container {
      padding: 24px;
    }

    .page-header {
      margin-bottom: 24px;
    }

    .settings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 16px;
    }

    .settings-card {
      background: var(--surface-card);
      border-radius: var(--border-radius-lg);
      padding: 20px;
    }

    .settings-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--surface-border);
    }

    .settings-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid var(--surface-border);
    }

    .settings-item:last-child {
      border-bottom: none;
    }

    .settings-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .settings-label {
      font-size: 13px;
      color: var(--text-color-secondary);
    }

    .settings-value {
      font-size: 14px;
      font-weight: 500;
      word-break: break-all;
    }

    .stats-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .stat-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;
    }

    .stat-label {
      color: var(--text-color-secondary);
    }

    .stat-value {
      font-weight: 600;
    }

    .about-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: var(--primary-color);
      color: white;
      border: none;
      border-radius: var(--border-radius);
      font-weight: 500;
      cursor: pointer;
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
export class SettingsComponent implements OnInit {
  libraryPath = signal<string>('');
  lastScan = signal<string>('');
  stats = signal<any>(null);

  constructor(private electron: ElectronService) {}

  async ngOnInit(): Promise<void> {
    try {
      const library = await this.electron.getCurrentLibrary();
      if (library) {
        this.libraryPath.set(library.root_path);
        this.lastScan.set(library.last_scan_at || '');
      }
      const stats = await this.electron.getStats();
      this.stats.set(stats);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  }

  async selectFolder(): Promise<void> {
    try {
      const folder = await this.electron.selectFolder();
      if (folder) {
        const name = folder.split(/[\\/]/).pop() || 'Biblioteca';
        await this.electron.createLibrary(name, folder);
        this.libraryPath.set(folder);
      }
    } catch (error) {
      console.error('Erro ao selecionar pasta:', error);
    }
  }

  async scanLibrary(): Promise<void> {
    try {
      const library = await this.electron.getCurrentLibrary();
      if (library) {
        await this.electron.scanLibrary(library.id);
        this.lastScan.set(new Date().toISOString());
      }
    } catch (error) {
      console.error('Erro ao escanear biblioteca:', error);
    }
  }
}
