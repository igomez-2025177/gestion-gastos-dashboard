import { Injectable, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { environment } from "../../environments/environment";

export type BusinessRole = "OWNER" | "GERENTE" | "CONFIANZA";

export interface Business {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
}

export interface BusinessMember {
  id: string;
  businessId: string;
  email: string;
  role: BusinessRole;
  status: "PENDIENTE" | "ACEPTADA" | "RECHAZADA";
  invitedAt: string;
}

@Injectable({ providedIn: "root" })
export class BusinessService {
  private readonly baseUrl = `${environment.apiUrl}/business`;

  business = signal<Business | null>(null);
  role = signal<BusinessRole | null>(null);
  members = signal<BusinessMember[]>([]);

  constructor(private http: HttpClient) {}

  async checkMyBusiness() {
    const res = await firstValueFrom(
      this.http.get<{ business: Business | null; role: BusinessRole | null }>(`${this.baseUrl}/me`)
    );
    this.business.set(res.business);
    this.role.set(res.role);
    return res;
  }

  async activate(name?: string) {
    const business = await firstValueFrom(
      this.http.post<Business>(`${this.baseUrl}/activate`, { name })
    );
    this.business.set(business);
    this.role.set("OWNER");
    return business;
  }

  async inviteMember(email: string, role: "GERENTE" | "CONFIANZA") {
    const member = await firstValueFrom(
      this.http.post<BusinessMember>(`${this.baseUrl}/invite`, { email, role })
    );
    this.members.update((list) => [member, ...list]);
    return member;
  }

  async loadMembers() {
    const members = await firstValueFrom(
      this.http.get<BusinessMember[]>(`${this.baseUrl}/members`)
    );
    this.members.set(members);
    return members;
  }

  async removeMember(id: string) {
    await firstValueFrom(this.http.delete(`${this.baseUrl}/members/${id}`));
    this.members.update((list) => list.filter((m) => m.id !== id));
  }
}