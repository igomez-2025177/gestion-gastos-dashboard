// calculos de descuentos de ley, Decreto 10-2012 (ISR) y Acuerdo 1124 (IGSS)
export const IGSS_RATE = 0.0483; // cuota laboral, se la descuenta el patrono al trabajador
const DEDUCCION_UNICA_ANUAL = 51024; // Q48,000 fijos + Q3,024 deduccion extraordinaria 2026
const LIMITE_TRAMO_BAJO = 300000; // hasta aqui se paga 5% anual
const TASA_BAJA = 0.05;
const TASA_ALTA = 0.07; // sobre el excedente de Q300,000

export interface SalaryDeductions {
  igssAmount: number;
  isrAmount: number;
}

// recibe el monto mensual (sueldo o bono) y proyecta el ISR anual
// para sacar cuanto corresponde retener ese mes en particular
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