import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NegocioForm } from './negocio-form';
import { NegocioHistorial } from './negocio-historial';
import { InvitarMiembro } from './invitar-miembro';
import { BusinessService } from '../../services/business.service';

type NegocioSubTab = 'registro' | 'historial' | 'equipo';

@Component({
  selector: 'app-negocio',
  imports: [CommonModule, NegocioForm, NegocioHistorial, InvitarMiembro],
  templateUrl: './negocio.html',
  styleUrl: './negocio.css',
})
export class Negocio implements OnInit {
  private businessService = inject(BusinessService);

  activeSubTab = signal<NegocioSubTab>('registro');
  isOwner = signal(false);

  ngOnInit(): void {
    if (!this.businessService.business()) {
      this.businessService.checkMyBusiness().subscribe(() => {
        this.isOwner.set(this.businessService.role() === 'OWNER');
      });
    } else {
      this.isOwner.set(this.businessService.role() === 'OWNER');
    }
  }

  setTab(tab: NegocioSubTab): void {
    this.activeSubTab.set(tab);
  }

  onMovementSaved(): void {
    this.activeSubTab.set('historial');
  }
}