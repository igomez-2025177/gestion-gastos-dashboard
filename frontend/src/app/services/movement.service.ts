import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export type MovementType = 'INGRESO' | 'GASTO';

export interface Movement {
  id: string;
  type: MovementType;
  category: string;
  amount: number;
  description?: string | null;
  date: string;
  businessId?: string | null;
}

export interface CreateMovementPayload {
  type: MovementType;
  category: string;
  amount: number;
  description?: string;
  date?: string;
  businessId?: string;
}

@Injectable({ providedIn: 'root' })
export class MovementService {
  private readonly baseUrl = `${environment.apiUrl}/movements`;

  movements = signal<Movement[]>([]);
  negocioMovements = signal<Movement[]>([]);

  constructor(private http: HttpClient) {}

  getAll(): Observable<Movement[]> {
    return this.http.get<Movement[]>(this.baseUrl).pipe(
      tap((data) => this.movements.set(data))
    );
  }

  getAllNegocio(businessId: string): Observable<Movement[]> {
    return this.http.get<Movement[]>(`${this.baseUrl}?businessId=${businessId}`).pipe(
      tap((data) => this.negocioMovements.set(data))
    );
  }

  create(payload: CreateMovementPayload): Observable<Movement> {
    return this.http.post<Movement>(this.baseUrl, payload).pipe(
      tap((created) => {
        if (payload.businessId) {
          this.negocioMovements.update((list) => [created, ...list]);
        } else {
          this.movements.update((list) => [created, ...list]);
        }
      })
    );
  }

  update(id: string, payload: Partial<CreateMovementPayload>): Observable<Movement> {
    return this.http.put<Movement>(`${this.baseUrl}/${id}`, payload).pipe(
      tap((updated) => {
        if (updated.businessId) {
          this.negocioMovements.update((list) => list.map((m) => (m.id === id ? updated : m)));
        } else {
          this.movements.update((list) => list.map((m) => (m.id === id ? updated : m)));
        }
      })
    );
  }

  delete(id: string, businessId?: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        if (businessId) {
          this.negocioMovements.update((list) => list.filter((m) => m.id !== id));
        } else {
          this.movements.update((list) => list.filter((m) => m.id !== id));
        }
      })
    );
  }

  ivaIncluido(mov: Movement): number {
    return mov.amount * (0.12 / 1.12);
  }
}