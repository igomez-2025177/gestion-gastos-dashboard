import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
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

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.getMe().subscribe();
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