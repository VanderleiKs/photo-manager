import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'pm-review',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="review-container">
      <header class="page-header">
        <h1 class="text-2xl font-semibold">Revisão</h1>
        <p class="text-muted">Revise sugestões do PhotoManager</p>
      </header>

      <div class="empty-state">
        <i class="pi pi-check-square text-6xl text-muted"></i>
        <h2 class="text-xl font-semibold mt-4">Nenhuma sugestão pendente</h2>
        <p class="text-muted mt-2">As sugestões aparecerão aqui após a análise</p>
      </div>
    </div>
  `,
  styles: [`
    .review-container {
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
export class ReviewComponent {}
