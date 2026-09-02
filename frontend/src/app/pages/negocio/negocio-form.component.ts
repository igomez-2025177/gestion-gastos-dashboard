import { Component, EventEmitter, Output, computed, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MovementService } from "../../services/movement.service";
import { BusinessService } from "../../services/business.service";

const INGRESO_CATEGORIES = [
  { value: "VENTA", label: "Venta" },
  { value: "SERVICIO_PRESTADO", label: "Servicio prestado" },
  { value: "INVERSION", label: "Inversión" },
  { value: "OTROS", label: "Otros" },
];

const GASTO_CATEGORIES = [
  { value: "PROVEEDORES", label: "Proveedores" },
  { value: "NOMINA", label: "Nómina" },
  { value: "ALQUILER", label: "Alquiler" },
  { value: "MARKETING", label: "Marketing" },
  { value: "IMPUESTOS", label: "Impuestos" },
  { value: "MANTENIMIENTO", label: "Mantenimiento" },
  { value: "OTROS", label: "Otros" },
];

@Component({
  selector: "app-negocio-form",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="negocio-form">
      <div class="type-toggle">
        <button type="button"
                [class.active]="form.controls.type.value === 'INGRESO'"
                (click)="onTypeChange('INGRESO')">
          Ingreso
        </button>
        <button type="button"
                [class.active]="form.controls.type.value === 'GASTO'"
                (click)="onTypeChange('GASTO')">
          Gasto
        </button>
      </div>

      <label>
        Categoría
        <select formControlName="category">
          <option value="" disabled>Seleccioná una categoría</option>
          @for (cat of categories(); track cat.value) {
            <option [value]="cat.value">{{ cat.label }}</option>
          }
        </select>
      </label>

      <label>
        Monto (Q)
        <input type="number" formControlName="amount" step="0.01" min="0" placeholder="0.00" />
      </label>

      <label>
        Descripción (opcional)
        <input type="text" formControlName="description" placeholder="Ej. Pago proveedor de insumos" />
      </label>

      @if (errorMsg()) {
        <p class="error-text">{{ errorMsg() }}</p>
      }

      <button type="submit" class="btn-primary" [disabled]="saving()">
        {{ saving() ? "Guardando..." : "Registrar movimiento" }}
      </button>
    </form>
  `,
})
export class NegocioFormComponent {
  private fb = inject(FormBuilder);
  private movementService = inject(MovementService);
  private businessService = inject(BusinessService);

  @Output() saved = new EventEmitter<void>();

  saving = signal(false);
  errorMsg = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    type: this.fb.nonNullable.control<"INGRESO" | "GASTO">("INGRESO"),
    category: this.fb.nonNullable.control("", Validators.required),
    amount: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    description: this.fb.nonNullable.control(""),
  });

  categories = computed(() =>
    this.form.controls.type.value === "INGRESO" ? INGRESO_CATEGORIES : GASTO_CATEGORIES
  );

  onTypeChange(type: "INGRESO" | "GASTO") {
    this.form.controls.type.setValue(type);
    this.form.controls.category.setValue("");
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const business = this.businessService.business();
    if (!business) {
      this.errorMsg.set("No hay un negocio activo");
      return;
    }

    this.saving.set(true);
    this.errorMsg.set(null);

    try {
      const { type, category, amount, description } = this.form.getRawValue();
      await this.movementService.create({
        type,
        category,
        amount: amount!,
        description: description || undefined,
        businessId: business.id,
      });
      this.form.reset({ type: "INGRESO", category: "", amount: null, description: "" });
      this.saved.emit();
    } catch {
      this.errorMsg.set("No se pudo guardar el movimiento");
    } finally {
      this.saving.set(false);
    }
  }
}