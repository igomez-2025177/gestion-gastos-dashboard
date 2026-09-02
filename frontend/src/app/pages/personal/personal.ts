import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MovementService, MovementType, MovementCategory } from '../../services/movement.service';

interface CategoryOption {
  value: MovementCategory;
  label: string;
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
    { value: 'BONO', label: 'Bono' },
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
}