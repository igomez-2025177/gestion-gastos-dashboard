import { Injectable, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { environment } from "../../environments/environment";

export type MovementType = "INGRESO" | "GASTO";

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

@Injectable({ providedIn: "root" })
export class MovementService {
  private readonly baseUrl = `${environment.apiUrl}/movements`;

  movements = signal<Movement[]>([]);
  negocioMovements = signal<Movement[]>([]);

  constructor(private http: HttpClient) {}

  async getAll(businessId?: string) {
    const url = businessId ? `${this.baseUrl}?businessId=${businessId}` : this.baseUrl;
    const data = await firstValueFrom(this.http.get<Movement[]>(url));
    if (businessId) {
      this.negocioMovements.set(data);
    } else {
      this.movements.set(data);
    }
    return data;
  }

  async create(payload: CreateMovementPayload) {
    const created = await firstValueFrom(this.http.post<Movement>(this.baseUrl, payload));
    if (payload.businessId) {
      this.negocioMovements.update((list) => [created, ...list]);
    } else {
      this.movements.update((list) => [created, ...list]);
    }
    return created;
  }

  async update(id: string, payload: Partial<CreateMovementPayload>) {
    const updated = await firstValueFrom(
      this.http.put<Movement>(`${this.baseUrl}/${id}`, payload)
    );
    if (updated.businessId) {
      this.negocioMovements.update((list) => list.map((m) => (m.id === id ? updated : m)));
    } else {
      this.movements.update((list) => list.map((m) => (m.id === id ? updated : m)));
    }
    return updated;
  }

  async delete(id: string, businessId?: string) {
    await firstValueFrom(this.http.delete(`${this.baseUrl}/${id}`));
    if (businessId) {
      this.negocioMovements.update((list) => list.filter((m) => m.id !== id));
    } else {
      this.movements.update((list) => list.filter((m) => m.id !== id));
    }
  }

  ivaIncluido(mov: Movement): number {
    return mov.amount * (0.12 / 1.12);
  }
}