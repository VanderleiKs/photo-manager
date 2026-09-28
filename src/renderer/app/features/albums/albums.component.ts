import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ElectronService } from '../../core/services/electron.service';

interface Album {
  id: string;
  name: string;
  description?: string;
  is_smart: boolean;
  smart_criteria?: string;
  cover_photo_id?: string;
  cover?: string;
  photo_count: number;
  created_at: string;
}

interface Photo {
  id: string;
  filename: string;
  taken_at: string | null;
  thumbnail?: string;
  is_video: boolean;
  is_favorite: boolean;
}

@Component({
  selector: 'pm-albums',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="albums-container">
      <header class="page-header">
        <div>
          <h1 class="text-2xl font-semibold">Álbuns</h1>
          <p class="text-muted">Organize suas fotos em coleções</p>
        </div>
        <button class="btn-primary" (click)="showCreateModal.set(true)">
          <i class="pi pi-plus"></i>
          Criar Álbum
        </button>
      </header>

      <!-- Álbuns Inteligentes -->
      <section class="section">
        <h2 class="section-title">Álbuns Inteligentes</h2>
        <div class="albums-grid">
          @for (album of smartAlbums(); track album.id) {
            <div class="album-card" (click)="openAlbum(album)">
              <div class="album-cover">
                <img [src]="album.cover || 'assets/placeholder.png'" [alt]="album.name">
                <div class="smart-badge">
                  <i class="pi pi-bolt"></i>
                </div>
              </div>
              <div class="album-info">
                <h3 class="album-name">{{ album.name }}</h3>
                <p class="album-count text-muted">{{ album.photo_count }} fotos</p>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- Álbuns Manuais -->
      <section class="section">
        <h2 class="section-title">Meus Álbuns</h2>
        @if (manualAlbums().length === 0) {
          <div class="empty-state">
            <i class="pi pi-book text-6xl text-muted"></i>
            <h3 class="text-xl font-semibold mt-4">Nenhum álbum criado</h3>
            <p class="text-muted mt-2">Crie álbuns para organizar suas fotos</p>
          </div>
        } @else {
          <div class="albums-grid">
            @for (album of manualAlbums(); track album.id) {
              <div class="album-card" (click)="openAlbum(album)">
                <div class="album-cover">
                  <img [src]="album.cover || 'assets/placeholder.png'" [alt]="album.name">
                </div>
                <div class="album-info">
                  <h3 class="album-name">{{ album.name }}</h3>
                  <p class="album-count text-muted">{{ album.photo_count }} fotos</p>
                </div>
              </div>
            }
          </div>
        }
      </section>

      <!-- Modal de Criação -->
      @if (showCreateModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="text-xl font-semibold">Criar Álbum</h3>
              <button class="close-btn" (click)="closeModal()">
                <i class="pi pi-times"></i>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Nome do álbum</label>
                <input
                  type="text"
                  [(ngModel)]="newAlbumName"
                  placeholder="Ex: Gramado 2024"
                  class="form-input"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Descrição (opcional)</label>
                <textarea
                  [(ngModel)]="newAlbumDescription"
                  placeholder="Descreva o álbum..."
                  class="form-textarea"
                  rows="3"
                ></textarea>
              </div>
              <div class="form-group">
                <label class="form-label">Tipo</label>
                <div class="radio-group">
                  <label class="radio-label">
                    <input type="radio" [(ngModel)]="newAlbumType" value="manual" />
                    <span>Manual - Seleciono as fotos</span>
                  </label>
                  <label class="radio-label">
                    <input type="radio" [(ngModel)]="newAlbumType" value="smart" />
                    <span>Inteligente - Baseado em critérios</span>
                  </label>
                </div>
              </div>
              @if (newAlbumType() === 'smart') {
                <div class="form-group">
                  <label class="form-label">Critérios</label>
                  <select [(ngModel)]="newAlbumCriteria" class="form-select">
                    <option value="year:2024">Fotos de 2024</option>
                    <option value="favorite">Favoritos</option>
                    <option value="video">Vídeos</option>
                    <option value="quality:high">Alta qualidade</option>
                  </select>
                </div>
              }
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" (click)="closeModal()">
                Cancelar
              </button>
              <button class="btn-primary" (click)="createAlbum()">
                Criar
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .albums-container {
      padding: 24px;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    .section {
      margin-bottom: 32px;
    }

    .section-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
    }

    .albums-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }

    .album-card {
      background: var(--surface-card);
      border-radius: var(--border-radius-lg);
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .album-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
    }

    .album-cover {
      aspect-ratio: 16/10;
      background: var(--surface-hover);
      position: relative;
    }

    .album-cover img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .smart-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      background: var(--primary-color);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
    }

    .album-info {
      padding: 12px;
    }

    .album-name {
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 4px;
    }

    .album-count {
      font-size: 12px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      text-align: center;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal {
      background: var(--surface-card);
      border-radius: var(--border-radius-lg);
      width: 90%;
      max-width: 500px;
      max-height: 90vh;
      overflow: auto;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px;
      border-bottom: 1px solid var(--surface-border);
    }

    .close-btn {
      background: none;
      border: none;
      color: var(--text-color-muted);
      cursor: pointer;
      font-size: 18px;
    }

    .modal-body {
      padding: 20px;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 6px;
      color: var(--text-color-secondary);
    }

    .form-input,
    .form-textarea,
    .form-select {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      font-size: 14px;
      background: var(--surface-card);
      color: var(--text-color);
    }

    .form-input:focus,
    .form-textarea:focus,
    .form-select:focus {
      outline: none;
      border-color: var(--primary-color);
    }

    .radio-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .radio-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 20px;
      border-top: 1px solid var(--surface-border);
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

    .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: var(--surface-hover);
      color: var(--text-color);
      border: none;
      border-radius: var(--border-radius);
      font-weight: 500;
      cursor: pointer;
    }
  `]
})
export class AlbumsComponent implements OnInit {
  albums = signal<Album[]>([]);
  showCreateModal = signal(false);
  newAlbumName = signal('');
  newAlbumDescription = signal('');
  newAlbumType = signal<'manual' | 'smart'>('manual');
  newAlbumCriteria = signal('');

  smartAlbums = computed(() => this.albums().filter(a => a.is_smart));
  manualAlbums = computed(() => this.albums().filter(a => !a.is_smart));

  constructor(private electron: ElectronService) {}

  async ngOnInit(): Promise<void> {
    // Carregar álbuns do banco de dados
    // Por enquanto, usar dados de exemplo
    this.albums.set([
      {
        id: 'smart-1',
        name: 'Fotos de 2024',
        is_smart: true,
        smart_criteria: 'year:2024',
        photo_count: 1250,
        created_at: new Date().toISOString()
      },
      {
        id: 'smart-2',
        name: 'Favoritos',
        is_smart: true,
        smart_criteria: 'favorite',
        photo_count: 1203,
        created_at: new Date().toISOString()
      },
      {
        id: 'smart-3',
        name: 'Vídeos',
        is_smart: true,
        smart_criteria: 'video',
        photo_count: 3821,
        created_at: new Date().toISOString()
      }
    ]);
  }

  closeModal(): void {
    this.showCreateModal.set(false);
    this.newAlbumName.set('');
    this.newAlbumDescription.set('');
  }

  async createAlbum(): Promise<void> {
    const name = this.newAlbumName().trim();
    if (!name) return;

    const album: Album = {
      id: `album-${Date.now()}`,
      name,
      description: this.newAlbumDescription(),
      is_smart: this.newAlbumType() === 'smart',
      smart_criteria: this.newAlbumType() === 'smart' ? this.newAlbumCriteria() : undefined,
      photo_count: 0,
      created_at: new Date().toISOString()
    };

    this.albums.update(albums => [...albums, album]);
    this.closeModal();
  }

  openAlbum(album: Album): void {
    console.log('Abrir álbum:', album);
  }
}
