export const IGSS_RATE = 0.0483;
const DEDUCCION_UNICA_ANUAL = 51024;
const LIMITE_TRAMO_BAJO = 300000; 
const TASA_BAJA = 0.05;
const TASA_ALTA = 0.07;

export interface SalaryDeductions {
  igssAmount: number;
  isrAmount: number;
}

export function calculateSalaryDeductions(monthlyAmount: number): SalaryDeductions {
  const igssAmount = monthlyAmount * IGSS_RATE;

  const salarioAnual = monthlyAmount * 12;
  const igssAnual = igssAmount * 12;
  const rentaImponibleAnual = Math.max(0, salarioAnual - igssAnual - DEDUCCION_UNICA_ANUAL);

  let isrAnual: number;
  if (rentaImponibleAnual <= LIMITE_TRAMO_BAJO) {
    isrAnual = rentaImponibleAnual * TASA_BAJA;
  } else {
    const excedente = rentaImponibleAnual - LIMITE_TRAMO_BAJO;
    isrAnual = LIMITE_TRAMO_BAJO * TASA_BAJA + excedente * TASA_ALTA;
  }

  const isrAmount = isrAnual / 12;

  return { igssAmount, isrAmount };
}