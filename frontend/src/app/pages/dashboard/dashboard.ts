import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MovementService } from '../../services/movement.service';
import { Personal } from '../personal/personal';

interface AccountTab {
  id: string;
  label: string;
  disabled: boolean;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, Personal],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  public authService = inject(AuthService);
  public movementService = inject(MovementService);
  private router = inject(Router);

  accountTabs: AccountTab[] = [
    { id: 'menu', label: 'Menú', disabled: false },
    { id: 'personal', label: 'Personal', disabled: false },
    { id: 'negocio', label: 'Negocio', disabled: true },
    { id: 'fondo', label: 'Fondo de inversión', disabled: true },
  ];

  activeTab = 'menu';

  balance: number | null = null;
  ingresosMes: number | null = null;
  gastosMes: number | null = null;
  impuestos: number | null = null;

  fondoInversion: number | null = null;
  negocio: number | null = null;

  ngOnInit(): void {
    this.authService.getMe().subscribe();

    this.movementService.getAll().subscribe(() => {
      this.calcularTotales();
    });
  }

  private calcularTotales(): void {
    const movements = this.movementService.movements();

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let balanceTotal = 0;
    let ingresosDelMes = 0;
    let gastosDelMes = 0;
    let ivaDelMes = 0;

    for (const mov of movements) {
      const monto = mov.amount;
      const fecha = new Date(mov.date);
      const esDelMesActual = fecha.getMonth() === currentMonth && fecha.getFullYear() === currentYear;

      if (mov.type === 'INGRESO') {
        balanceTotal += monto;
        if (esDelMesActual) ingresosDelMes += monto;
      } else {
        balanceTotal -= monto;
        if (esDelMesActual) gastosDelMes += monto;
        if (esDelMesActual) ivaDelMes += this.movementService.ivaIncluido(mov);
      }
    }

    this.balance = balanceTotal;
    this.ingresosMes = ingresosDelMes;
    this.gastosMes = gastosDelMes;
    this.impuestos = ivaDelMes;
  }

  setActiveTab(tab: AccountTab): void {
    if (tab.disabled) return;
    this.activeTab = tab.id;
  }

  formatMoney(value: number | null): string {
    if (value === null) return 'No disponible';
    return 'Q ' + value.toLocaleString('es-GT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}