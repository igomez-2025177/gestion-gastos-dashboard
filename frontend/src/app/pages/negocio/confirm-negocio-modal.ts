import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BusinessService } from '../../services/business.service';

@Component({
  selector: 'app-confirm-negocio-modal',
  imports: [CommonModule],
  templateUrl: './confirm-negocio-modal.html',
  styleUrl: './confirm-negocio-modal.css',
})
export class ConfirmNegocioModal {
  private businessService = inject(BusinessService);

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  loading = signal(false);

  confirmar(): void {
    this.loading.set(true);
    this.businessService.activate().subscribe({
      next: () => {
        this.loading.set(false);
        this.confirmed.emit();
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}