import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export type MovementType = 'INGRESO' | 'GASTO';

export type MovementCategory =
  | 'ALIMENTACION'
  | 'TRANSPORTE'
  | 'SERVICIOS'
  | 'SALUD'
  | 'SUELDO'
  | 'BONO'
  | 'BONO14'
  | 'VENTA'
  | 'INVERSION'
  | 'OTROS';

export interface Movement {
  id: string;
  type: MovementType;
  category: MovementCategory;
  amount: number;
  igssAmount: number | null;
  isrAmount: number | null;
  description: string | null;
  date: string;
  createdAt: string;
  userId: string;
}

export interface CreateMovementPayload {
  type: MovementType;
  category: MovementCategory;
  amount: number;
  description?: string;
}

@Injectable({
  providedIn: 'root',
})
export class MovementService {
  private readonly API_URL = 'http://localhost:3000/api/movements';

  movements = signal<Movement[]>([]);

  constructor(private http: HttpClient) {}

  create(payload: CreateMovementPayload): Observable<{ message: string; movement: Movement }> {
    return this.http
      .post<{ message: string; movement: Movement }>(this.API_URL, payload)
      .pipe(
        tap((response) => {
          this.movements.update((current) => [response.movement, ...current]);
        })
      );
  }

  getAll(): Observable<{ movements: Movement[] }> {
    return this.http.get<{ movements: Movement[] }>(this.API_URL).pipe(
      tap((response) => this.movements.set(response.movements))
    );
  }

  update(id: string, payload: CreateMovementPayload): Observable<{ message: string; movement: Movement }> {
    return this.http
      .put<{ message: string; movement: Movement }>(`${this.API_URL}/${id}`, payload)
      .pipe(
        tap((response) => {
          this.movements.update((current) =>
            current.map((mov) => (mov.id === id ? response.movement : mov))
          );
        })
      );
  }

  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/${id}`).pipe(
      tap(() => {
        this.movements.update((current) => current.filter((mov) => mov.id !== id));
      })
    );
  }

  // el monto real que cuenta para tus totales: si el movimiento tiene
  // descuentos de ley (sueldo/bono), se usa el neto, si no, el monto tal cual
  effectiveAmount(mov: Movement): number {
    if (mov.igssAmount || mov.isrAmount) {
      return mov.amount - (mov.igssAmount ?? 0) - (mov.isrAmount ?? 0);
    }
    return mov.amount;
  }
}