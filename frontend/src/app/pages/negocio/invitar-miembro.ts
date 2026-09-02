import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BusinessService, BusinessMember } from '../../services/business.service';

@Component({
  selector: 'app-invitar-miembro',
  imports: [CommonModule, FormsModule],
  templateUrl: './invitar-miembro.html',
  styleUrl: './invitar-miembro.css',
})
export class InvitarMiembro implements OnInit {
  private businessService = inject(BusinessService);

  members = this.businessService.members;

  email = signal('');
  role = signal<'GERENTE' | 'CONFIANZA'>('CONFIANZA');
  sending = signal(false);
  errorMsg = signal<string | null>(null);
  successMsg = signal<string | null>(null);

  ngOnInit(): void {
    this.businessService.loadMembers().subscribe();
  }

  invitar(): void {
    const emailValue = this.email().trim();
    if (!emailValue) return;

    this.sending.set(true);
    this.errorMsg.set(null);
    this.successMsg.set(null);

    this.businessService.inviteMember(emailValue, this.role()).subscribe({
      next: () => {
        this.sending.set(false);
        this.successMsg.set(`Invitación enviada a ${emailValue}`);
        this.email.set('');
      },
      error: (err) => {
        this.sending.set(false);
        this.errorMsg.set(err?.error?.message || 'No se pudo enviar la invitación');
      },
    });
  }

  quitar(member: BusinessMember): void {
    if (!confirm(`¿Quitar a ${member.email} del negocio?`)) return;
    this.businessService.removeMember(member.id).subscribe();
  }

  roleLabel(role: string): string {
    return role === 'GERENTE' ? 'Gerente' : role === 'OWNER' ? 'Dueño' : 'Persona de confianza';
  }

  statusLabel(status: string): string {
    if (status === 'ACEPTADA') return 'Activo';
    if (status === 'PENDIENTE') return 'Pendiente (aún no tiene cuenta)';
    return 'Rechazada';
  }
}