import { Component } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { SessionExpiredService } from './services/session-expired.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  constructor(
    public sessionExpiredService: SessionExpiredService,
    private router: Router
  ) {}

  onSessionExpiredOk(): void {
    this.sessionExpiredService.hide();
    this.router.navigate(['/login'], { queryParams: { expired: true } });
  }
}