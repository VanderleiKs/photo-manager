import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'pm-people',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="people-container">
      <header class="page-header">
        <h1 class="text-2xl font-semibold">Pessoas</h1>
        <p class="text-muted">Reconhecimento de pessoas</p>
      </header>

      <div class="empty-state">
        <i class="pi pi-users text-6xl text-muted"></i>
        <h2 class="text-xl font-semibold mt-4">Nenhuma pessoa identificada</h2>
        <p class="text-muted mt-2">O reconhecimento de pessoas será implementado em breve</p>
      </div>
    </div>
  `,
  styles: [`
    .people-container {
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
export class PeopleComponent {}
