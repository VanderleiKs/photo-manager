import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'pm-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="app-container">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .app-container {
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background-color: var(--surface-ground);
    }
  `]
})
export class AppComponent {
  title = 'PhotoManager';
}
