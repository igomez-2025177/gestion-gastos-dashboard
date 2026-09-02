import { Component, OnInit, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { BusinessService, BusinessMember } from "../../services/business.service";

@Component({
  selector: "app-invitar-miembro",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="invitar-miembro">
      <h3>Personas con acceso a este negocio</h3>
      <p class="hint-text">
        Agregá el correo de un gerente o alguien de confianza para que también pueda
        registrar y ver los movimientos de tu negocio.
      </p>

      <div class="invitar-form">
        <input type="email" placeholder="correo@ejemplo.com"
               [ngModel]="email()" (ngModelChange)="email.set($event)" />
        <select [ngModel]="role()" (ngModelChange)="role.set($event)">
          <option value="CONFIANZA">Persona de confianza</option>
          <option value="GERENTE">Gerente</option>
        </select>
        <button type="button" class="btn-primary" [disabled]="sending()" (click)="invitar()">
          {{ sending() ? "Enviando..." : "Invitar" }}
        </button>
      </div>

      @if (errorMsg()) { <p class="error-text">{{ errorMsg() }}</p> }
      @if (successMsg()) { <p class="success-text">{{ successMsg() }}</p> }

      <table class="miembros-table">
        <thead>
          <tr><th>Correo</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          @for (m of members(); track m.id) {
            <tr>
              <td>{{ m.email }}</td>
              <td>{{ roleLabel(m.role) }}</td>
              <td>{{ statusLabel(m.status) }}</td>
              <td><button type="button" (click)="quitar(m)">Quitar</button></td>
            </tr>
          } @empty {
            <tr><td colspan="4">Todavía no invitaste a nadie.</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class InvitarMiembroComponent implements OnInit {
  private businessService = inject(BusinessService);

  members = this.businessService.members;

  email = signal("");
  role = signal<"GERENTE" | "CONFIANZA">("CONFIANZA");
  sending = signal(false);
  errorMsg = signal<string | null>(null);
  successMsg = signal<string | null>(null);

  async ngOnInit() {
    await this.businessService.loadMembers();
  }

  async invitar() {
    const emailValue = this.email().trim();
    if (!emailValue) return;

    this.sending.set(true);
    this.errorMsg.set(null);
    this.successMsg.set(null);

    try {
      await this.businessService.inviteMember(emailValue, this.role());
      this.successMsg.set(`Invitación enviada a ${emailValue}`);
      this.email.set("");
    } catch (err: any) {
      this.errorMsg.set(err?.error?.message || "No se pudo enviar la invitación");
    } finally {
      this.sending.set(false);
    }
  }

  async quitar(member: BusinessMember) {
    if (!confirm(`¿Quitar a ${member.email} del negocio?`)) return;
    await this.businessService.removeMember(member.id);
  }

  roleLabel(role: string): string {
    return role === "GERENTE" ? "Gerente" : role === "OWNER" ? "Dueño" : "Persona de confianza";
  }

  statusLabel(status: string): string {
    if (status === "ACEPTADA") return "Activo";
    if (status === "PENDIENTE") return "Pendiente (aún no tiene cuenta)";
    return "Rechazada";
  }
}