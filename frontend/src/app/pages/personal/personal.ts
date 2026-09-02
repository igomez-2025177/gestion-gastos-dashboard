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

  categories: CategoryOption[] = [
    { value: 'ALIMENTACION', label: 'Alimentación' },
    { value: 'TRANSPORTE', label: 'Transporte' },
    { value: 'SERVICIOS', label: 'Servicios' },
    { value: 'OCIO', label: 'Ocio' },
    { value: 'SALUD', label: 'Salud' },
    { value: 'OTROS', label: 'Otros' },
  ];

  isSubmitting = false;
  errorMessage = '';

  form = this.fb.group({
    type: this.fb.control<MovementType>('INGRESO', Validators.required),
    category: this.fb.control<MovementCategory>('OTROS', Validators.required),
    amount: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
    description: this.fb.control(''),
  });

  ngOnInit(): void {
    this.movementService.getAll().subscribe();
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
          this.form.reset({ type: 'INGRESO', category: 'OTROS', amount: null, description: '' });
        },
        error: (err) => {
          this.isSubmitting = false;
          this.errorMessage = err.error?.error || 'Error al registrar el movimiento';
        },
      });
  }

  categoryLabel(value: MovementCategory): string {
    return this.categories.find((c) => c.value === value)?.label ?? value;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-GT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}