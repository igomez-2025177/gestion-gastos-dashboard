import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SessionExpiredService {
  show = signal(false);

  trigger(): void {
    this.show.set(true);
  }

  hide(): void {
    this.show.set(false);
  }
}