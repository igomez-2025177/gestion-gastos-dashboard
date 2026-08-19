import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
interface AccountTab {
  id: string;
  label: string;
  active: boolean;
  comingSoon?: boolean;
}
interface CategoryExpense {
  name: string;
  amount: number;
  percent: number;
}
interface Budget {
  name: string;
  spent: number;
  limit: number;
}
interface MonthPoint {
  label: string;
  value: number;
}
@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  accountTabs: AccountTab[] = [
    { id: 'personal', label: 'Personal', active: true, comingSoon: true },
    { id: 'negocio', label: 'Negocio', active: false, comingSoon: true },
    { id: 'fondo', label: 'Fondo de inversión', active: false, comingSoon: true },
  ];
  balance = 3050;
  ingresos = 6800;
  gastos = 3750;
  categories: CategoryExpense[] = [
    { name: 'Alimentación', amount: 1200, percent: 32 },
    { name: 'Servicios', amount: 650, percent: 17 },
    { name: 'Otros', amount: 800, percent: 21 },
    { name: 'Transporte', amount: 480, percent: 13 },
    { name: 'Ocio', amount: 320, percent: 9 },
    { name: 'Salud', amount: 300, percent: 8 },
  ];
  budgets: Budget[] = [
    { name: 'Alimentación', spent: 1200, limit: 1500 },
    { name: 'Transporte', spent: 480, limit: 600 },
    { name: 'Ocio', spent: 320, limit: 250 },
  ];
  trend: MonthPoint[] = [
    { label: 'Mar', value: 2400 },
    { label: 'Abr', value: 3100 },
    { label: 'May', value: 2800 },
    { label: 'Jun', value: 3600 },
    { label: 'Jul', value: 3200 },
    { label: 'Ago', value: 3750 },
  ];
  maxTrend = Math.max(...this.trend.map((m) => m.value));
  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.getMe().subscribe();
  }

  budgetPercent(budget: Budget): number {
    return Math.min(Math.round((budget.spent / budget.limit) * 100), 999);
  }
  isOverBudget(budget: Budget): boolean {
    return budget.spent > budget.limit;
  }
  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}