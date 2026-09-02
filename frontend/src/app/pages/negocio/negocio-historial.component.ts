import { Component, OnInit, computed, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Movement, MovementService } from "../../services/movement.service";
import { BusinessService } from "../../services/business.service";
import { exportNegocioPdf } from "./negocio-pdf";

const CATEGORY_LABELS: Record<string, string> = {
  VENTA: "Venta",
  SERVICIO_PRESTADO: "Servicio prestado",
  INVERSION: "Inversión",
  OTROS: "Otros",
  PROVEEDORES: "Proveedores",
  NOMINA: "Nómina",
  ALQUILER: "Alquiler",
  MARKETING: "Marketing",
  IMPUESTOS: "Impuestos",
  MANTENIMIENTO: "Mantenimiento",
};

@Component({
  selector: "app-negocio-historial",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="historial-filters">
      <label>
        Mes
        <input type="month" [ngModel]="filterMonth()" (ngModelChange)="filterMonth.set($event)" />
      </label>

      <label>
        Tipo
        <select [ngModel]="filterType()" (ngModelChange)="filterType.set($event)">
          <option value="">Todos</option>
          <option value="INGRESO">Ingreso</option>
          <option value="GASTO">Gasto</option>
        </select>
      </label>

      <label>
        Categoría
        <select [ngModel]="filterCategory()" (ngModelChange)="filterCategory.set($event)">
          <option value="">Todas</option>
          @for (cat of categoryLabels | keyvalue; track cat.key) {
            <option [value]="cat.key">{{ cat.value }}</option>
          }
        </select>
      </label>

      <button type="button" class="btn-secondary" (click)="exportPdf()">Exportar PDF</button>
    </div>

    <div class="historial-summary">
      <div>Ingresos: Q{{ totalIngresos().toFixed(2) }}</div>
      <div>Gastos: Q{{ totalGastos().toFixed(2) }}</div>
      <div>Balance: Q{{ balance().toFixed(2) }}</div>
    </div>

    <table class="historial-table">
      <thead>
        <tr>
          <th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Monto</th><th>Descripción</th><th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        @for (mov of filtered(); track mov.id) {
          <tr>
            <td>{{ mov.date | date: "dd/MM/yyyy" }}</td>
            <td>{{ mov.type === "INGRESO" ? "Ingreso" : "Gasto" }}</td>
            <td>{{ categoryLabels[mov.category] ?? mov.category }}</td>

            @if (editingId() === mov.id) {
              <td><input type="number" [ngModel]="editAmount()" (ngModelChange)="editAmount.set($event)" /></td>
              <td><input type="text" [ngModel]="editDescription()" (ngModelChange)="editDescription.set($event)" /></td>
              <td>
                <button type="button" (click)="saveEdit(mov)">Guardar</button>
                <button type="button" (click)="cancelEdit()">Cancelar</button>
              </td>
            } @else {
              <td>Q{{ mov.amount.toFixed(2) }}</td>
              <td>{{ mov.description || "—" }}</td>
              <td>
                <button type="button" (click)="startEdit(mov)">Editar</button>
                <button type="button" (click)="remove(mov)">Eliminar</button>
              </td>
            }
          </tr>
        } @empty {
          <tr><td colspan="6">Todavía no hay movimientos registrados.</td></tr>
        }
      </tbody>
    </table>
  `,
})
export class NegocioHistorialComponent implements OnInit {
  private movementService = inject(MovementService);
  private businessService = inject(BusinessService);

  movements = this.movementService.negocioMovements;

  filterMonth = signal<string>("");
  filterType = signal<"" | "INGRESO" | "GASTO">("");
  filterCategory = signal<string>("");

  editingId = signal<string | null>(null);
  editAmount = signal<number>(0);
  editDescription = signal<string>("");

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
    this.filtered().filter((m) => m.type === "INGRESO").reduce((sum, m) => sum + m.amount, 0)
  );

  totalGastos = computed(() =>
    this.filtered().filter((m) => m.type === "GASTO").reduce((sum, m) => sum + m.amount, 0)
  );

  balance = computed(() => this.totalIngresos() - this.totalGastos());

  async ngOnInit() {
    const business = this.businessService.business();
    if (business) {
      await this.movementService.getAll(business.id);
    }
  }

  startEdit(mov: Movement) {
    this.editingId.set(mov.id);
    this.editAmount.set(mov.amount);
    this.editDescription.set(mov.description ?? "");
  }

  cancelEdit() {
    this.editingId.set(null);
  }

  async saveEdit(mov: Movement) {
    await this.movementService.update(mov.id, {
      amount: this.editAmount(),
      description: this.editDescription(),
    });
    this.editingId.set(null);
  }

  async remove(mov: Movement) {
    if (!confirm("¿Seguro que querés eliminar este movimiento?")) return;
    await this.movementService.delete(mov.id, mov.businessId ?? undefined);
  }

  exportPdf() {
    const business = this.businessService.business();
    exportNegocioPdf(this.filtered(), business?.name ?? "Mi Negocio", this.categoryLabels);
  }
}