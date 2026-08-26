import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface AccountTab {
  id: string;
  label: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  accountTabs: AccountTab[] = [
    { id: 'menu', label: 'Menú' },
    { id: 'personal', label: 'Personal' },
    { id: 'negocio', label: 'Negocio' },
    { id: 'fondo', label: 'Fondo de inversión' },
  ];

  activeTab = 'menu';

  balance = 54289.75;
  ingresosMes = 12450.0;
  gastosMes = 7689.3;
  impuestos = 2350.0;
  impuestosEstado: 'Pendiente' | 'Al día' = 'Pendiente';
  fondoInversion = 8120.0;
  negocio = 6540.0;

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.getMe().subscribe();
  }

  setActiveTab(id: string): void {
    this.activeTab = id;
  }

  formatMoney(value: number): string {
    return value.toLocaleString('es-GT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}