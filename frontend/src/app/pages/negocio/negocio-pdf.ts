import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Movement } from "../../services/movement.service";
import { VOLTUM_LOGO_BASE64 } from "../personal/voltum-logo";

export function exportNegocioPdf(
  movements: Movement[],
  businessName: string,
  categoryLabels: Record<string, string>
) {
  const doc = new jsPDF();

  doc.setFillColor(255, 214, 0);
  doc.rect(0, 0, 210, 8, "F");
  doc.setFillColor(229, 57, 53);
  doc.rect(0, 8, 210, 2, "F");

  doc.addImage(VOLTUM_LOGO_BASE64, "PNG", 14, 16, 30, 30);

  doc.setFontSize(16);
  doc.setTextColor(30, 30, 30);
  doc.text("Reporte de movimientos de negocio", 50, 28);

  doc.setFontSize(11);
  doc.setTextColor(90, 90, 90);
  doc.text(`Negocio: ${businessName}`, 50, 36);
  doc.text(`Generado: ${new Date().toLocaleDateString("es-GT")}`, 50, 42);

  const rows = movements.map((m) => [
    new Date(m.date).toLocaleDateString("es-GT"),
    m.type === "INGRESO" ? "Ingreso" : "Gasto",
    categoryLabels[m.category] ?? m.category,
    `Q${m.amount.toFixed(2)}`,
    m.description || "—",
  ]);

  autoTable(doc, {
    startY: 52,
    head: [["Fecha", "Tipo", "Categoría", "Monto", "Descripción"]],
    body: rows,
    headStyles: { fillColor: [229, 57, 53] },
    styles: { fontSize: 9 },
  });

  const totalIngresos = movements.filter((m) => m.type === "INGRESO").reduce((s, m) => s + m.amount, 0);
  const totalGastos = movements.filter((m) => m.type === "GASTO").reduce((s, m) => s + m.amount, 0);
  const balance = totalIngresos - totalGastos;

  const finalY = (doc as any).lastAutoTable.finalY || 60;

  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text(`Ingresos totales: Q${totalIngresos.toFixed(2)}`, 14, finalY + 10);
  doc.text(`Gastos totales: Q${totalGastos.toFixed(2)}`, 14, finalY + 17);
  doc.text(`Balance: Q${balance.toFixed(2)}`, 14, finalY + 24);

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`Página ${i} de ${pageCount}`, 190, 290, { align: "right" });
    doc.text("VOLTUM — Tecnología Financiera", 14, 290);
  }

  doc.save(`reporte-negocio-${businessName.replace(/\s+/g, "_").toLowerCase()}.pdf`);
}