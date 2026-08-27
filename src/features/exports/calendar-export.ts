import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type CalendarExportItem = Readonly<{
  title: string;
  type: "Lavoro programmato" | "Promemoria";
  date: string;
  groupName: string | null;
}>;

type CalendarExportData = Readonly<{
  sectorName: string;
  monthLabel: string;
  items: readonly CalendarExportItem[];
}>;

function getRows(items: readonly CalendarExportItem[]): string[][] {
  return items.map((item) => [item.date, item.type, item.title, item.groupName ?? "Generale"]);
}

export async function createCalendarExcel(data: CalendarExportData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Calendario");
  worksheet.addRow(["PSTS Planner", data.sectorName, data.monthLabel]);
  worksheet.mergeCells("A1:D1");
  worksheet.getCell("A1").font = { bold: true, size: 14 };
  worksheet.addRow(["Data", "Tipo", "Titolo", "Gruppo"]);
  worksheet.getRow(2).font = { bold: true };
  worksheet.addRows(getRows(data.items));
  worksheet.columns = [{ width: 20 }, { width: 22 }, { width: 44 }, { width: 28 }];

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export function createCalendarPdf(data: CalendarExportData): Buffer {
  const document = new jsPDF({ orientation: "landscape" });
  document.setFontSize(16);
  document.text("PSTS Planner - Calendario", 14, 16);
  document.setFontSize(10);
  document.text(`${data.sectorName} | ${data.monthLabel}`, 14, 23);
  autoTable(document, {
    startY: 30,
    head: [["Data", "Tipo", "Titolo", "Gruppo"]],
    body: getRows(data.items),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [26, 99, 166] },
  });

  return Buffer.from(document.output("arraybuffer"));
}
