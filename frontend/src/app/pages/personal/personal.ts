import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { MovementService, MovementType, MovementCategory, Movement } from '../../services/movement.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CategoryOption {
  value: MovementCategory;
  label: string;
}

interface MonthOption {
  value: string;
  label: string;
}

type HistoryFilter = 'TODOS' | MovementType;

@Component({
  selector: 'app-personal',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './personal.html',
  styleUrl: './personal.css',
})
export class Personal implements OnInit {
  private fb = inject(FormBuilder);
  public movementService = inject(MovementService);

  incomeCategories: CategoryOption[] = [
    { value: 'SUELDO', label: 'Sueldo' },
    { value: 'BONO', label: 'Bono' },
    { value: 'BONO14', label: 'Bono 14' },
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

  editingId: string | null = null;

  filterType: HistoryFilter = 'TODOS';
  filterCategory: MovementCategory | 'TODAS' = 'TODAS';
  filterMonth: string = 'TODOS';

  form = this.fb.group({
    type: this.fb.control<MovementType>('INGRESO', Validators.required),
    category: this.fb.control<MovementCategory>('SUELDO', Validators.required),
    amount: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
    description: this.fb.control(''),
  });

  ngOnInit(): void {
    this.movementService.getAll().subscribe();

    this.form.get('type')!.valueChanges.subscribe((newType) => {
      if (this.editingId) return;
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

  totalIngresos(): number {
    return this.filteredMovements()
      .filter((m) => m.type === 'INGRESO')
      .reduce((sum, m) => sum + m.amount, 0);
  }

  totalGastos(): number {
    return this.filteredMovements()
      .filter((m) => m.type === 'GASTO')
      .reduce((sum, m) => sum + m.amount, 0);
  }

  balancePersonal(): number {
    return this.totalIngresos() - this.totalGastos();
  }

  filteredMovements(): Movement[] {
    return this.movementService.movements().filter((mov) => {
      const matchesType = this.filterType === 'TODOS' || mov.type === this.filterType;
      const matchesCategory = this.filterCategory === 'TODAS' || mov.category === this.filterCategory;
      const matchesMonth = this.matchesMonth(mov);
      return matchesType && matchesCategory && matchesMonth;
    });
  }

  onFilterTypeChange(value: string): void {
    this.filterType = value as HistoryFilter;
    this.filterCategory = 'TODAS';
  }

  categoriesForFilter(): CategoryOption[] {
    if (this.filterType === 'INGRESO') return this.incomeCategories;
    if (this.filterType === 'GASTO') return this.expenseCategories;
    return this.allCategories;
  }

  availableMonths(): MonthOption[] {
    const monthsSet = new Set<string>();

    for (const mov of this.movementService.movements()) {
      const fecha = new Date(mov.date);
      const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      monthsSet.add(key);
    }

    const nombresMes = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];

    return Array.from(monthsSet)
      .sort((a, b) => b.localeCompare(a))
      .map((key) => {
        const [year, month] = key.split('-');
        const label = `${nombresMes[Number(month) - 1]} ${year}`;
        return { value: key, label };
      });
  }

  private matchesMonth(mov: Movement): boolean {
    if (this.filterMonth === 'TODOS') return true;
    const fecha = new Date(mov.date);
    const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    return key === this.filterMonth;
  }

  exportarPDF(): void {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Historial de movimientos - Gestión', 14, 18);

    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Generado el ${new Date().toLocaleDateString('es-GT')}`, 14, 24);
    doc.setTextColor(0);

    const filas = this.filteredMovements().map((mov) => [
      this.formatDate(mov.date),
      mov.type === 'INGRESO' ? 'Ingreso' : 'Gasto',
      this.categoryLabel(mov.category),
      mov.description ?? '-',
      (mov.type === 'INGRESO' ? '+' : '-') + this.formatQ(mov.amount),
    ]);

    autoTable(doc, {
      startY: 30,
      head: [['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Monto']],
      body: filas,
      headStyles: { fillColor: [242, 130, 61] },
      styles: { fontSize: 9 },
    });

    const finalY = (doc as any).lastAutoTable?.finalY ?? 30;

    doc.setFontSize(11);
    doc.text(`Total ingresos: ${this.formatQ(this.totalIngresos())}`, 14, finalY + 12);
    doc.text(`Total gastos: ${this.formatQ(this.totalGastos())}`, 14, finalY + 19);
    doc.setFont('helvetica', 'bold');
    doc.text(`Balance: ${this.formatQ(this.balancePersonal())}`, 14, finalY + 26);
    doc.setFont('helvetica', 'normal');

    doc.save('historial-gestion.pdf');
  }
}