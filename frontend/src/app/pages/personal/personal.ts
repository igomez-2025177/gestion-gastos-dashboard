import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MovementService, MovementType, MovementCategory, Movement } from '../../services/movement.service';

interface CategoryOption {
  value: MovementCategory;
  label: string;
}

// mismas constantes de ley que usa el backend, aqui solo sirven para
// mostrar una vista previa mientras escribes el monto. El calculo que
// de verdad se guarda siempre lo hace el backend, esto es solo visual
const IGSS_RATE = 0.0483;
const DEDUCCION_UNICA_ANUAL = 51024;
const LIMITE_TRAMO_BAJO = 300000;
const TASA_BAJA = 0.05;
const TASA_ALTA = 0.07;

// solo Sueldo y Bono (productividad) llevan descuento automatico de ley.
// Bono14 esta exento por ley, igual que el Aguinaldo
const SALARY_CATEGORIES: MovementCategory[] = ['SUELDO', 'BONO'];

interface DeductionPreview {
  igss: number;
  isr: number;
  neto: number;
}

@Component({
  selector: 'app-personal',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './personal.html',
  styleUrl: './personal.css',
})
export class Personal implements OnInit {
  private fb = inject(FormBuilder);
  public movementService = inject(MovementService);

  incomeCategories: CategoryOption[] = [
    { value: 'SUELDO', label: 'Sueldo' },
    { value: 'BONO', label: 'Bono (productividad)' },
    { value: 'BONO14', label: 'Bono 14 (exento)' },
    { value: 'VENTA', label: 'Venta' },
    { value: 'INVERSION', label: 'Inversión' },
    { value: 'OTROS', label: 'Otros' },
  ];

  expenseCategories: CategoryOption[] = [
    { value: 'ALIMENTACION', label: 'Alimentación' },
    { value: 'TRANSPORTE', label: 'Transporte' },
    { value: 'SERVICIOS', label: 'Servicios' },
    { value: 'OCIO', label: 'Ocio' },
    { value: 'SALUD', label: 'Salud' },
    { value: 'COMPRA_GRANDE', label: 'Compra grande (vehículo/vivienda)' },
    { value: 'OTROS', label: 'Otros' },
  ];

  // lista combinada, solo se usa para mostrar el label en el historial
  allCategories: CategoryOption[] = [...this.incomeCategories, ...this.expenseCategories];

  isSubmitting = false;
  errorMessage = '';

  form = this.fb.group({
    type: this.fb.control<MovementType>('INGRESO', Validators.required),
    category: this.fb.control<MovementCategory>('SUELDO', Validators.required),
    amount: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
    description: this.fb.control(''),
  });

  ngOnInit(): void {
    this.movementService.getAll().subscribe();

    // cuando cambia el tipo, la categoría seleccionada puede quedar inválida
    // (ej. tenías "Sueldo" y cambiaste a Gasto), así que reseteamos a la primera opción válida
    this.form.get('type')!.valueChanges.subscribe((newType) => {
      const firstValid = this.categoriesForType(newType!)[0]?.value;
      this.form.get('category')!.setValue(firstValid);
    });
  }

  categoriesForType(type: MovementType | null): CategoryOption[] {
    return type === 'INGRESO' ? this.incomeCategories : this.expenseCategories;
  }

  // le dice al template si la categoria elegida ahorita es de las que
  // llevan descuento automatico de ley (sueldo o bono de productividad)
  isSalaryCategorySelected(): boolean {
    const category = this.form.value.category;
    return !!category && SALARY_CATEGORIES.includes(category);
  }

  isBigPurchaseCategorySelected(): boolean {
    return this.form.value.category === 'COMPRA_GRANDE';
  }

  // vista previa en vivo mientras escribes el monto, no es lo que se guarda,
  // solo para que veas cuanto te van a descontar antes de darle a Registrar
  previewDeduction(): DeductionPreview | null {
    const amount = this.form.value.amount;
    if (!this.isSalaryCategorySelected() || !amount || amount <= 0) return null;

    const igss = amount * IGSS_RATE;

    const salarioAnual = amount * 12;
    const igssAnual = igss * 12;
    const rentaImponibleAnual = Math.max(0, salarioAnual - igssAnual - DEDUCCION_UNICA_ANUAL);

    let isrAnual: number;
    if (rentaImponibleAnual <= LIMITE_TRAMO_BAJO) {
      isrAnual = rentaImponibleAnual * TASA_BAJA;
    } else {
      const excedente = rentaImponibleAnual - LIMITE_TRAMO_BAJO;
      isrAnual = LIMITE_TRAMO_BAJO * TASA_BAJA + excedente * TASA_ALTA;
    }
    const isr = isrAnual / 12;

    return { igss, isr, neto: amount - igss - isr };
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const { type, category, amount, description } = this.form.getRawValue();

    this.movementService
      .create({
        type: type!,
        category: category!,
        amount: amount!,
        description: description || undefined,
      })
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.form.reset({ type: 'INGRESO', category: 'SUELDO', amount: null, description: '' });
        },
        error: (err) => {
          this.isSubmitting = false;
          this.errorMessage = err.error?.error || 'Error al registrar el movimiento';
        },
      });
  }

  categoryLabel(value: MovementCategory): string {
    return this.allCategories.find((c) => c.value === value)?.label ?? value;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-GT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  formatQ(value: number): string {
    return 'Q ' + value.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // el monto neto real que quedo despues de descuentos de ley,
  // para un ingreso que ya esta guardado en el historial
  netAmount(mov: Movement): number {
    return mov.amount - (mov.igssAmount ?? 0) - (mov.isrAmount ?? 0);
  }

  hasDeductions(mov: Movement): boolean {
    return mov.igssAmount !== null || mov.isrAmount !== null;
  }
}