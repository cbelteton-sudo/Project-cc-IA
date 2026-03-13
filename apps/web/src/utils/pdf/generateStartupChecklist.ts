import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

export interface StartupChecklistPDFData {
  projectName: string;
  date: string;
  overallProgress: number;
  totalItems: number;
  completeItems: number;
  pmName?: string;
  items: {
    materialName: string;
    plannedQty: number;
    stockAvailable: number;
    unit: string;
    isComplete: boolean;
    progressPercentage: number;
  }[];
}

export const generateStartupChecklistPDF = (data: StartupChecklistPDFData) => {
  try {
    const doc = new jsPDF();
    const lineHeight = 7;
    let y = 20;

    // --- Header ---
    doc.setFontSize(18);
    doc.setTextColor(37, 99, 235); // Blue-600
    doc.setFont('helvetica', 'bold');
    
    // Centrar Título Principal
    const title = 'CONSTANCIA DE MATERIALES DE ARRANQUE';
    const pageWidth = doc.internal.pageSize.getWidth();
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, (pageWidth - titleWidth) / 2, y);

    y += 14;

    // Project Info
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text('Proyecto:', 20, y);

    doc.setFontSize(11);
    doc.setTextColor(80);
    doc.setFont('helvetica', 'normal');
    doc.text(data.projectName, 42, y);
    
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Fecha: ${data.date}`, 190, y, { align: 'right' });

    y += 12;

    // --- Meta Info ---
    doc.setDrawColor(220);
    doc.line(20, y, 190, y);
    y += 10;

    const leftColX = 20;
    const rightColX = 120;

    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text('PROGRESO DE ABASTECIMIENTO', leftColX, y);
    doc.text('ESTADO DE LA PLANEACIÓN', rightColX, y);

    y += 5;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(data.overallProgress === 100 ? 0 : 255);
    if (data.overallProgress === 100) doc.setTextColor(16, 185, 129); // Emerald-500
    else doc.setTextColor(245, 158, 11); // Amber-500
    doc.text(`${data.overallProgress}% COMPLETADO`, leftColX, y);
    doc.setTextColor(0); // Reset

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${data.completeItems} de ${data.totalItems} materiales completos`, rightColX, y);

    y += 15;

    // --- Table Header ---
    doc.setFillColor(243, 244, 246); // Gray-100
    doc.rect(20, y, 170, 8, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100);

    const colDesc = 25;
    const colReq = 110;
    const colStock = 140;
    const colStatus = 170;

    doc.text('MATERIAL', colDesc, y + 5);
    doc.text('QTY REQUERIDO', colReq, y + 5, { align: 'center' });
    doc.text('QTY ASIGNADO', colStock, y + 5, { align: 'center' });
    doc.text('ESTADO', colStatus, y + 5, { align: 'center' });

    y += 13; // Increased to avoid overlapping with first row

    // --- Table Rows ---
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    doc.setFontSize(9);

    data.items.forEach((item) => {
      // Check page break
      if (y > 240) { // Leave room for signatures if needed, so break earlier
        doc.addPage();
        y = 20;
      }

      // Material Name (truncate if too long)
      const maxNameLength = 40;
      let displayName = item.materialName;
      if (displayName.length > maxNameLength) {
        displayName = displayName.substring(0, maxNameLength - 3) + '...';
      }
      doc.text(displayName, colDesc, y);
      
      // Quantities
      doc.text(`${item.plannedQty} ${item.unit}`, colReq, y, { align: 'center' });
      doc.text(`${item.stockAvailable} ${item.unit}`, colStock, y, { align: 'center' });

      // Status
      if (item.isComplete) {
        doc.setTextColor(16, 185, 129); // Emerald
        doc.setFont('helvetica', 'bold');
        doc.text(`${item.progressPercentage}%`, colStatus - 2, y, { align: 'right' });
        doc.setFont('zapfdingbats', 'normal');
        doc.text('4', colStatus + 2, y, { align: 'left' }); // '4' is heavy checkmark in ZapfDingbats
        doc.setFont('helvetica', 'normal');
      } else {
        doc.setTextColor(245, 158, 11); // Amber
        doc.setFont('helvetica', 'bold');
        doc.text(`${item.progressPercentage}%`, colStatus - 2, y, { align: 'right' });
        doc.setFont('zapfdingbats', 'normal');
        doc.text('8', colStatus + 2, y, { align: 'left' }); // '8' is heavy cross in ZapfDingbats
        doc.setFont('helvetica', 'normal');
      }
      doc.setTextColor(0); // Reset

      doc.setDrawColor(240);
      doc.line(20, y + 2, 190, y + 2);
      y += lineHeight;
    });

    y += 20;

    // --- Signatures ---
    // If not enough space for signatures, add a new page
    if (y > 250) {
      doc.addPage();
      y = 30;
    }

    doc.setDrawColor(0);
    doc.line(30, y, 80, y);
    doc.line(130, y, 180, y);

    y += 5;
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text('Firma de Project Manager', 55, y, { align: 'center' });
    
    // Add PM Name under the text if it exists
    if (data.pmName) {
      doc.setFontSize(8);
      doc.setTextColor(80);
      doc.text(data.pmName, 55, y + 4, { align: 'center' });
    }

    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text('Firma Residente / Supervisor', 155, y, { align: 'center' });

    // --- Footer ---
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.setFont('helvetica', 'italic');
    doc.text('Generado por FieldClose Management', 105, pageHeight - 10, { align: 'center' });

    // --- Save / Download ---
    const dateStr = data.date.replace(/\//g, '-');
    const fileName = `Checklist-Arranque-${data.projectName.substring(0, 10).replace(/\s/g, '_')}-${dateStr}.pdf`;
    
    // Explicit Blob generation for cross-browser compatibility
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();

    requestAnimationFrame(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    });

    toast.success('Constancia PDF descargada con éxito');
    return true;

  } catch (error: unknown) {
    console.error('PDF Gen Error:', error);
    toast.error('Ocurrió un error al generar el PDF');
    return false;
  }
};
