import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export type BusinessRole = 'OWNER' | 'GERENTE' | 'CONFIANZA';

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
  status: 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';
  invitedAt: string;
}

interface MyBusinessResponse {
  business: Business | null;
  role: BusinessRole | null;
}

@Injectable({ providedIn: 'root' })
export class BusinessService {
  private readonly baseUrl = `${environment.apiUrl}/business`;

  business = signal<Business | null>(null);
  role = signal<BusinessRole | null>(null);
  members = signal<BusinessMember[]>([]);

  constructor(private http: HttpClient) {}

  checkMyBusiness(): Observable<MyBusinessResponse> {
    return this.http.get<MyBusinessResponse>(`${this.baseUrl}/me`).pipe(
      tap((res) => {
        this.business.set(res.business);
        this.role.set(res.role);
      })
    );
  }

  activate(name?: string): Observable<Business> {
    return this.http.post<Business>(`${this.baseUrl}/activate`, { name }).pipe(
      tap((business) => {
        this.business.set(business);
        this.role.set('OWNER');
      })
    );
  }

  inviteMember(email: string, role: 'GERENTE' | 'CONFIANZA'): Observable<BusinessMember> {
    return this.http.post<BusinessMember>(`${this.baseUrl}/invite`, { email, role }).pipe(
      tap((member) => this.members.update((list) => [member, ...list]))
    );
  }

  loadMembers(): Observable<BusinessMember[]> {
    return this.http.get<BusinessMember[]>(`${this.baseUrl}/members`).pipe(
      tap((members) => this.members.set(members))
    );
  }

  removeMember(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/members/${id}`).pipe(
      tap(() => this.members.update((list) => list.filter((m) => m.id !== id)))
    );
  }
}