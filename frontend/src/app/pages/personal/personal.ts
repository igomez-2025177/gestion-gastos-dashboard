import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MovementService, MovementType, MovementCategory, Movement } from '../../services/movement.service';

interface CategoryOption {
  value: MovementCategory;
  label: string;
}

const IGSS_RATE = 0.0483;
const DEDUCCION_UNICA_ANUAL = 51024;
const LIMITE_TRAMO_BAJO = 300000;
const TASA_BAJA = 0.05;
const TASA_ALTA = 0.07;

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
    { value: 'SALUD', label: 'Salud' },
    { value: 'OTROS', label: 'Otros' },
  ];

  allCategories: CategoryOption[] = [...this.incomeCategories, ...this.expenseCategories];

  isSubmitting = false;
  errorMessage = '';

  // si tiene valor, significa que estamos editando ese movimiento en vez de crear uno nuevo
  editingId: string | null = null;

  form = this.fb.group({
    type: this.fb.control<MovementType>('INGRESO', Validators.required),
    category: this.fb.control<MovementCategory>('SUELDO', Validators.required),
    amount: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
    description: this.fb.control(''),
  });

  ngOnInit(): void {
    this.movementService.getAll().subscribe();

    this.form.get('type')!.valueChanges.subscribe((newType) => {
      // si estamos editando, no queremos que se resetee la categoria de golpe
      // cuando el form recien se llena con setValue, asi que solo aplica
      // este auto-reset cuando el usuario cambia el tipo a mano
      if (this.editingId) return;
      const firstValid = this.categoriesForType(newType!)[0]?.value;
      this.form.get('category')!.setValue(firstValid);
    });
  }

  categoriesForType(type: MovementType | null): CategoryOption[] {
    return type === 'INGRESO' ? this.incomeCategories : this.expenseCategories;
  }

  isSalaryCategorySelected(): boolean {
    const category = this.form.value.category;
    return !!category && SALARY_CATEGORIES.includes(category);
  }

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
    const payload = {
      type: type!,
      category: category!,
      amount: amount!,
      description: description || undefined,
    };

    const request$ = this.editingId
      ? this.movementService.update(this.editingId, payload)
      : this.movementService.create(payload);

    request$.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.cancelEdit();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.error || 'Error al guardar el movimiento';
      },
    });
  }

  startEdit(mov: Movement): void {
    this.editingId = mov.id;
    this.form.setValue({
      type: mov.type,
      category: mov.category,
      amount: mov.amount,
      description: mov.description ?? '',
    });
    // llevamos la vista hacia el formulario, por si el historial esta largo
    document.querySelector('.form-panel')?.scrollIntoView({ behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.editingId = null;
    this.form.reset({ type: 'INGRESO', category: 'SUELDO', amount: null, description: '' });
  }

  confirmDelete(mov: Movement): void {
    const confirmado = confirm(
      `¿Seguro que quieres eliminar este movimiento de ${this.categoryLabel(mov.category)} por ${this.formatQ(mov.amount)}?`
    );
    if (!confirmado) return;

    this.movementService.delete(mov.id).subscribe({
      error: () => {
        this.errorMessage = 'No se pudo eliminar el movimiento';
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

  netAmount(mov: Movement): number {
    return mov.amount - (mov.igssAmount ?? 0) - (mov.isrAmount ?? 0);
  }

  hasDeductions(mov: Movement): boolean {
    return mov.igssAmount !== null || mov.isrAmount !== null;
  }
}