import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Movement, MovementService } from '../../services/movement.service';
import { BusinessService } from '../../services/business.service';
import { exportNegocioPdf } from './negocio-pdf';

const CATEGORY_LABELS: Record<string, string> = {
  VENTA: 'Venta',
  SERVICIO_PRESTADO: 'Servicio prestado',
  INVERSION: 'Inversión',
  OTROS: 'Otros',
  PROVEEDORES: 'Proveedores',
  NOMINA: 'Nómina',
  ALQUILER: 'Alquiler',
  MARKETING: 'Marketing',
  IMPUESTOS: 'Impuestos',
  MANTENIMIENTO: 'Mantenimiento',
};

@Component({
  selector: 'app-negocio-historial',
  imports: [CommonModule, FormsModule],
  templateUrl: './negocio-historial.html',
  styleUrl: './negocio-historial.css',
})
export class NegocioHistorial implements OnInit {
  private movementService = inject(MovementService);
  private businessService = inject(BusinessService);

  movements = this.movementService.negocioMovements;

  filterMonth = signal<string>('');
  filterType = signal<'' | 'INGRESO' | 'GASTO'>('');
  filterCategory = signal<string>('');

  editingId = signal<string | null>(null);
  editAmount = signal<number>(0);
  editDescription = signal<string>('');

  categoryLabels = CATEGORY_LABELS;

  filtered = computed(() => {
    return this.movements().filter((m) => {
      if (this.filterMonth() && !m.date.startsWith(this.filterMonth())) return false;
      if (this.filterType() && m.type !== this.filterType()) return false;
      if (this.filterCategory() && m.category !== this.filterCategory()) return false;
      return true;
    });
  });

  totalIngresos = computed(() =>
    this.filtered().filter((m) => m.type === 'INGRESO').reduce((sum, m) => sum + m.amount, 0)
  );

  totalGastos = computed(() =>
    this.filtered().filter((m) => m.type === 'GASTO').reduce((sum, m) => sum + m.amount, 0)
  );

  balance = computed(() => this.totalIngresos() - this.totalGastos());

  ngOnInit(): void {
    const business = this.businessService.business();
    if (business) {
      this.movementService.getAllNegocio(business.id).subscribe();
    }
  }

  startEdit(mov: Movement): void {
    this.editingId.set(mov.id);
    this.editAmount.set(mov.amount);
    this.editDescription.set(mov.description ?? '');
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  saveEdit(mov: Movement): void {
    this.movementService
      .update(mov.id, {
        amount: this.editAmount(),
        description: this.editDescription(),
      })
      .subscribe(() => this.editingId.set(null));
  }

  remove(mov: Movement): void {
    if (!confirm('¿Seguro que querés eliminar este movimiento?')) return;
    this.movementService.delete(mov.id, mov.businessId ?? undefined).subscribe();
  }

  exportPdf(): void {
    const business = this.businessService.business();
    exportNegocioPdf(this.filtered(), business?.name ?? 'Mi Negocio', this.categoryLabels);
  }
}