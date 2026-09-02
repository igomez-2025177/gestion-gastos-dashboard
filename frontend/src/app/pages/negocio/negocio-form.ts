import { Component, EventEmitter, Output, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MovementService } from '../../services/movement.service';
import { BusinessService } from '../../services/business.service';

const INGRESO_CATEGORIES = [
  { value: 'VENTA', label: 'Venta' },
  { value: 'SERVICIO_PRESTADO', label: 'Servicio prestado' },
  { value: 'INVERSION', label: 'Inversión' },
  { value: 'OTROS', label: 'Otros' },
];

const GASTO_CATEGORIES = [
  { value: 'PROVEEDORES', label: 'Proveedores' },
  { value: 'NOMINA', label: 'Nómina' },
  { value: 'ALQUILER', label: 'Alquiler' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'IMPUESTOS', label: 'Impuestos' },
  { value: 'MANTENIMIENTO', label: 'Mantenimiento' },
  { value: 'OTROS', label: 'Otros' },
];

@Component({
  selector: 'app-negocio-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './negocio-form.html',
  styleUrl: './negocio-form.css',
})
export class NegocioForm {
  private fb = inject(FormBuilder);
  private movementService = inject(MovementService);
  private businessService = inject(BusinessService);

  @Output() saved = new EventEmitter<void>();

  saving = signal(false);
  errorMsg = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    type: this.fb.nonNullable.control<'INGRESO' | 'GASTO'>('INGRESO'),
    category: this.fb.nonNullable.control('', Validators.required),
    amount: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    description: this.fb.nonNullable.control(''),
  });

  categories = computed(() =>
    this.form.controls.type.value === 'INGRESO' ? INGRESO_CATEGORIES : GASTO_CATEGORIES
  );

  onTypeChange(type: 'INGRESO' | 'GASTO'): void {
    this.form.controls.type.setValue(type);
    this.form.controls.category.setValue('');
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const business = this.businessService.business();
    if (!business) {
      this.errorMsg.set('No hay un negocio activo');
      return;
    }

    this.saving.set(true);
    this.errorMsg.set(null);

    const { type, category, amount, description } = this.form.getRawValue();

    this.movementService
      .create({
        type,
        category,
        amount: amount!,
        description: description || undefined,
        businessId: business.id,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.form.reset({ type: 'INGRESO', category: '', amount: null, description: '' });
          this.saved.emit();
        },
        error: () => {
          this.saving.set(false);
          this.errorMsg.set('No se pudo guardar el movimiento');
        },
      });
  }
}