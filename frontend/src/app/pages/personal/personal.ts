import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MovementService, MovementType, MovementCategory } from '../../services/movement.service';

interface CategoryOption {
  value: MovementCategory;
  label: string;
}

interface TaxResult {
  salarioMensual: number;
  igssMensual: number;
  isrMensual: number;
  totalDescuentos: number;
  salarioNeto: number;
  rentaImponibleAnual: number;
}

// constantes de ley, Decreto 10-2012 (ISR) y Acuerdo 1124 (IGSS)
const IGSS_RATE = 0.0483; // cuota laboral, se la descuenta el patrono al trabajador
const DEDUCCION_UNICA_ANUAL = 51024; // Q48,000 fijos + Q3,024 deduccion extraordinaria 2026
const LIMITE_TRAMO_BAJO = 300000; // hasta aqui se paga 5% anual
const TASA_BAJA = 0.05;
const TASA_ALTA = 0.07; // sobre el excedente de Q300,000

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

  allCategories: CategoryOption[] = [...this.incomeCategories, ...this.expenseCategories];

  isSubmitting = false;
  errorMessage = '';

  form = this.fb.group({
    type: this.fb.control<MovementType>('INGRESO', Validators.required),
    category: this.fb.control<MovementCategory>('SUELDO', Validators.required),
    amount: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
    description: this.fb.control(''),
  });

  // form aparte para la calculadora de impuestos, no tiene nada que ver
  // con el form de arriba de registrar movimientos
  taxForm = this.fb.group({
    salarioMensual: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
  });

  taxResult: TaxResult | null = null;

  ngOnInit(): void {
    this.movementService.getAll().subscribe();

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

  calcularImpuestos(): void {
    if (this.taxForm.invalid) {
      this.taxForm.markAllAsTouched();
      return;
    }

    const salarioMensual = this.taxForm.value.salarioMensual!;
    const salarioAnual = salarioMensual * 12;

    // IGSS: se calcula sobre el salario ordinario, y es deducible del ISR
    const igssMensual = salarioMensual * IGSS_RATE;
    const igssAnual = igssMensual * 12;

    // renta imponible = lo que sobra despues de restar IGSS y la deduccion unica de ley
    const rentaImponibleAnual = Math.max(0, salarioAnual - igssAnual - DEDUCCION_UNICA_ANUAL);

    // tarifa escalonada: 5% hasta el primer tramo, 7% sobre lo que exceda
    let isrAnual: number;
    if (rentaImponibleAnual <= LIMITE_TRAMO_BAJO) {
      isrAnual = rentaImponibleAnual * TASA_BAJA;
    } else {
      const excedente = rentaImponibleAnual - LIMITE_TRAMO_BAJO;
      isrAnual = LIMITE_TRAMO_BAJO * TASA_BAJA + excedente * TASA_ALTA;
    }

    const isrMensual = isrAnual / 12;
    const totalDescuentos = igssMensual + isrMensual;

    this.taxResult = {
      salarioMensual,
      igssMensual,
      isrMensual,
      totalDescuentos,
      salarioNeto: salarioMensual - totalDescuentos,
      rentaImponibleAnual,
    };
  }

  formatQ(value: number): string {
    return 'Q ' + value.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}