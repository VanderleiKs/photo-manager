import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'pm-events',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="events-container">
      <header class="page-header">
        <h1 class="text-2xl font-semibold">Viagens</h1>
        <p class="text-muted">Eventos e viagens detectados</p>
      </header>

      <div class="empty-state">
        <i class="pi pi-map text-6xl text-muted"></i>
        <h2 class="text-xl font-semibold mt-4">Nenhuma viagem detectada</h2>
        <p class="text-muted mt-2">As viagens serão detectadas automaticamente após a análise</p>
      </div>
    </div>
  `,
  styles: [`
    .events-container {
      padding: 24px;
    }

    .page-header {
      margin-bottom: 24px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 400px;
      text-align: center;
    }
  `]
})
export class EventsComponent {}
