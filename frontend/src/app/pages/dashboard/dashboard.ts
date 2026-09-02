import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MovementService } from '../../services/movement.service';
import { BusinessService } from '../../services/business.service';
import { Personal } from '../personal/personal';
import { ConfirmNegocioModal } from '../negocio/confirm-negocio-modal';
import { Negocio } from '../negocio/negocio';

interface AccountTab {
  id: string;
  label: string;
  disabled: boolean;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, Personal, ConfirmNegocioModal, Negocio],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  public authService = inject(AuthService);
  public movementService = inject(MovementService);
  public businessService = inject(BusinessService);
  private router = inject(Router);

  accountTabs: AccountTab[] = [
    { id: 'menu', label: 'Menú', disabled: false },
    { id: 'personal', label: 'Personal', disabled: false },
    { id: 'negocio', label: 'Negocio', disabled: false },
    { id: 'fondo', label: 'Fondo de inversión', disabled: true },
  ];

  activeTab = 'menu';
  showConfirmModal = signal(false);

  balance = computed(() => {
    let total = 0;
    for (const mov of this.movementService.movements()) {
      total += mov.type === 'INGRESO' ? mov.amount : -mov.amount;
    }
    return total;
  });

  ingresosMes = computed(() => this.sumarDelMes('INGRESO'));
  gastosMes = computed(() => this.sumarDelMes('GASTO'));

  impuestos = computed(() => {
    const now = new Date();
    let iva = 0;
    for (const mov of this.movementService.movements()) {
      const fecha = new Date(mov.date);
      const esDelMesActual = fecha.getMonth() === now.getMonth() && fecha.getFullYear() === now.getFullYear();
      if (mov.type === 'GASTO' && esDelMesActual) {
        iva += this.movementService.ivaIncluido(mov);
      }
    }
    return iva;
  });

  fondoInversion: number | null = null;

  // "Negocio" ya no es una propiedad fija en null — se calcula según si hay negocio activo
  negocio = computed(() => {
    if (!this.businessService.business()) return null;
    let total = 0;
    for (const mov of this.movementService.negocioMovements()) {
      total += mov.type === 'INGRESO' ? mov.amount : -mov.amount;
    }
    return total;
  });

  ngOnInit(): void {
    this.authService.getMe().subscribe();
    this.movementService.getAll().subscribe();

    this.businessService.checkMyBusiness().subscribe(() => {
      const business = this.businessService.business();
      if (business) {
        this.movementService.getAllNegocio(business.id).subscribe();
      }
    });
  }

  private sumarDelMes(type: 'INGRESO' | 'GASTO'): number {
    const now = new Date();
    let total = 0;
    for (const mov of this.movementService.movements()) {
      const fecha = new Date(mov.date);
      const esDelMesActual = fecha.getMonth() === now.getMonth() && fecha.getFullYear() === now.getFullYear();
      if (mov.type === type && esDelMesActual) {
        total += mov.amount;
      }
    }
    return total;
  }

  setActiveTab(tab: AccountTab): void {
    if (tab.disabled) return;

    if (tab.id === 'negocio' && !this.businessService.business()) {
      this.showConfirmModal.set(true);
      return;
    }

    this.activeTab = tab.id;
  }

  onNegocioConfirmed(): void {
    this.showConfirmModal.set(false);
    this.activeTab = 'negocio';
    const business = this.businessService.business();
    if (business) {
      this.movementService.getAllNegocio(business.id).subscribe();
    }
  }

  onNegocioCancelled(): void {
    this.showConfirmModal.set(false);
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