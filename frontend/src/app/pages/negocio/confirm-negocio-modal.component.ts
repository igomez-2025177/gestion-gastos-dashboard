import { Component, EventEmitter, Output, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { BusinessService } from "../../services/business.service";

@Component({
  selector: "app-confirm-negocio-modal",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay">
      <div class="modal-card">
        <h2>¿Vas a llevar las finanzas de tu negocio aquí?</h2>
        <p>
          Esto va a habilitar un espacio separado de tus movimientos personales,
          donde vas a poder registrar ingresos y gastos de tu negocio, y opcionalmente
          invitar a un gerente o persona de confianza para que tenga acceso.
        </p>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" (click)="cancel.emit()">Todavía no</button>
          <button type="button" class="btn-primary" [disabled]="loading()" (click)="confirmar()">
            {{ loading() ? "Activando..." : "Sí, activar negocio" }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.6);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .modal-card {
      background: #1a1a1a; border-radius: 12px; padding: 28px; max-width: 420px;
      border: 1px solid transparent;
      border-image: linear-gradient(135deg, #ffd600, #ff6d00, #e53935) 1;
      color: #f2f2f2;
    }
    .modal-card h2 { margin-top: 0; font-size: 1.25rem; }
    .modal-card p { color: #c7c7c7; line-height: 1.5; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
    .btn-primary {
      background: linear-gradient(135deg, #ffd600, #ff6d00);
      color: #1a1a1a; border: none; padding: 10px 18px; border-radius: 8px;
      font-weight: 600; cursor: pointer;
    }
    .btn-secondary {
      background: transparent; color: #c7c7c7; border: 1px solid #444;
      padding: 10px 18px; border-radius: 8px; cursor: pointer;
    }
  `],
})
export class ConfirmNegocioModalComponent {
  private businessService = inject(BusinessService);

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  loading = signal(false);

  async confirmar() {
    this.loading.set(true);
    try {
      await this.businessService.activate();
      this.confirmed.emit();
    } finally {
      this.loading.set(false);
    }
  }
}