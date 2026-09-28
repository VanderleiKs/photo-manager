import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'pm-organize',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="organize-container">
      <header class="page-header">
        <h1 class="text-2xl font-semibold">Organizar</h1>
        <p class="text-muted">Encontre e organize fotos duplicadas ou semelhantes</p>
      </header>

      <div class="organize-grid">
        <div class="organize-card">
          <div class="organize-icon">
            <i class="pi pi-copy text-3xl text-primary"></i>
          </div>
          <div class="organize-info">
            <h3 class="font-semibold">Possíveis duplicatas</h3>
            <p class="text-muted text-sm">1.248 fotos</p>
          </div>
          <button class="btn-secondary">Revisar</button>
        </div>

        <div class="organize-card">
          <div class="organize-icon">
            <i class="pi pi-clone text-3xl text-primary"></i>
          </div>
          <div class="organize-info">
            <h3 class="font-semibold">Fotos semelhantes</h3>
            <p class="text-muted text-sm">2.391 fotos</p>
          </div>
          <button class="btn-secondary">Revisar</button>
        </div>

        <div class="organize-card">
          <div class="organize-icon">
            <i class="pi pi-exclamation-triangle text-3xl text-orange-500"></i>
          </div>
          <div class="organize-info">
            <h3 class="font-semibold">Baixa qualidade</h3>
            <p class="text-muted text-sm">382 fotos</p>
          </div>
          <button class="btn-secondary">Revisar</button>
        </div>

        <div class="organize-card">
          <div class="organize-icon">
            <i class="pi pi-camera text-3xl text-orange-500"></i>
          </div>
          <div class="organize-info">
            <h3 class="font-semibold">Fotos momentâneas</h3>
            <p class="text-muted text-sm">927 fotos</p>
          </div>
          <button class="btn-secondary">Revisar</button>
        </div>

        <div class="organize-card">
          <div class="organize-icon">
            <i class="pi pi-desktop text-3xl text-orange-500"></i>
          </div>
          <div class="organize-info">
            <h3 class="font-semibold">Screenshots</h3>
            <p class="text-muted text-sm">641 fotos</p>
          </div>
          <button class="btn-secondary">Revisar</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .organize-container {
      padding: 24px;
    }

    .page-header {
      margin-bottom: 24px;
    }

    .organize-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }

    .organize-card {
      background: var(--surface-card);
      border-radius: var(--border-radius-lg);
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .organize-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .organize-icon {
      width: 56px;
      height: 56px;
      border-radius: var(--border-radius);
      background: var(--surface-hover);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .organize-info {
      flex: 1;
    }

    .btn-secondary {
      padding: 8px 16px;
      background: var(--surface-hover);
      color: var(--text-color);
      border: none;
      border-radius: var(--border-radius);
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .btn-secondary:hover {
      background: var(--surface-active);
    }
  `]
})
export class OrganizeComponent {}
