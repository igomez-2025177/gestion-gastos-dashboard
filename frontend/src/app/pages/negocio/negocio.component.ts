import { Component, OnInit, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NegocioFormComponent } from "./negocio-form.component";
import { NegocioHistorialComponent } from "./negocio-historial.component";
import { InvitarMiembroComponent } from "./invitar-miembro.component";
import { BusinessService } from "../../services/business.service";

type NegocioSubTab = "registro" | "historial" | "equipo";

@Component({
  selector: "app-negocio",
  standalone: true,
  imports: [CommonModule, NegocioFormComponent, NegocioHistorialComponent, InvitarMiembroComponent],
  template: `
    <div class="negocio-container">
      <nav class="negocio-subtabs">
        <button [class.active]="activeSubTab() === 'registro'" (click)="setTab('registro')">Registrar</button>
        <button [class.active]="activeSubTab() === 'historial'" (click)="setTab('historial')">Historial</button>
        @if (isOwner()) {
          <button [class.active]="activeSubTab() === 'equipo'" (click)="setTab('equipo')">Equipo</button>
        }
      </nav>

      @if (activeSubTab() === 'registro') {
        <app-negocio-form (saved)="onMovementSaved()" />
      }
      @if (activeSubTab() === 'historial') {
        <app-negocio-historial />
      }
      @if (activeSubTab() === 'equipo' && isOwner()) {
        <app-invitar-miembro />
      }
    </div>
  `,
})
export class NegocioComponent implements OnInit {
  private businessService = inject(BusinessService);

  activeSubTab = signal<NegocioSubTab>("registro");
  isOwner = signal(false);

  async ngOnInit() {
    if (!this.businessService.business()) {
      await this.businessService.checkMyBusiness();
    }
    this.isOwner.set(this.businessService.role() === "OWNER");
  }

  setTab(tab: NegocioSubTab) {
    this.activeSubTab.set(tab);
  }

  onMovementSaved() {
    this.activeSubTab.set("historial");
  }
}