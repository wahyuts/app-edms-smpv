import { useEffect, useState } from "react";

const previewErrorMessage =
  "Spreadsheet preview tidak dapat ditampilkan.\n\nSilakan gunakan tombol Download untuk membuka file menggunakan Microsoft Excel atau aplikasi Spreadsheet lainnya.";

const emptySheetMessage = "Worksheet tidak memiliki data untuk ditampilkan.";

const columnWidthToPixels = (column) => {
  if (!column) return 96;
  if (Number.isFinite(column.wpx)) return Math.max(48, column.wpx);
  if (Number.isFinite(column.width)) return Math.max(48, Math.round(column.width * 8));
  if (Number.isFinite(column.wch)) return Math.max(48, Math.round(column.wch * 8));
  return 96;
};

const rowHeightToPixels = (row) => {
  if (!row) return undefined;
  if (Number.isFinite(row.hpx)) return Math.max(24, row.hpx);
  if (Number.isFinite(row.hpt)) return Math.max(24, Math.round(row.hpt * 1.33));
  return undefined;
};

const getCellText = (cell) => {
  if (!cell) return "";
  if (cell.w != null) return String(cell.w);
  if (cell.v == null) return "";
  if (cell.v instanceof Date) return cell.v.toLocaleDateString("en-GB");
  return String(cell.v);
};

const getMergeMap = (merges = []) => {
  const anchors = new Map();
  const covered = new Set();

  merges.forEach((merge) => {
    const rowSpan = merge.e.r - merge.s.r + 1;
    const colSpan = merge.e.c - merge.s.c + 1;
    const anchorKey = `${merge.s.r}:${merge.s.c}`;

    anchors.set(anchorKey, { colSpan, rowSpan });

    for (let rowIndex = merge.s.r; rowIndex <= merge.e.r; rowIndex += 1) {
      for (let columnIndex = merge.s.c; columnIndex <= merge.e.c; columnIndex += 1) {
        const key = `${rowIndex}:${columnIndex}`;
        if (key !== anchorKey) covered.add(key);
      }
    }
  });

  return { anchors, covered };
};

const normalizeColor = (color) => {
  const rgb = color?.rgb ?? color?.fgColor?.rgb;
  if (!rgb || rgb.length < 6) return undefined;
  return `#${rgb.slice(-6)}`;
};

const getCellStyle = (cell, row) => {
  const style = cell?.s ?? {};
  const alignment = style.alignment ?? {};
  const font = style.font ?? {};
  const fill = style.fill ?? {};
  const border = style.border ?? {};
  const borderColor = "#CBD5E1";
  const nextStyle = {
    height: rowHeightToPixels(row),
    textAlign: alignment.horizontal,
    verticalAlign: alignment.vertical,
    whiteSpace: alignment.wrapText ? "normal" : "pre",
  };

  const backgroundColor = normalizeColor(fill.fgColor ?? fill);
  const color = normalizeColor(font.color);

  if (backgroundColor) nextStyle.backgroundColor = backgroundColor;
  if (color) nextStyle.color = color;
  if (font.bold) nextStyle.fontWeight = 700;
  if (font.italic) nextStyle.fontStyle = "italic";
  if (font.sz) nextStyle.fontSize = `${font.sz}px`;
  if (border.top) nextStyle.borderTopColor = borderColor;
  if (border.right) nextStyle.borderRightColor = borderColor;
  if (border.bottom) nextStyle.borderBottomColor = borderColor;
  if (border.left) nextStyle.borderLeftColor = borderColor;

  return nextStyle;
};

const buildSheetPreview = (sheetName, worksheet, XLSX) => {
  const range = worksheet["!ref"] ? XLSX.utils.decode_range(worksheet["!ref"]) : null;

  if (!range) {
    return { columns: [], isEmpty: true, name: sheetName, rows: [] };
  }

  const columns = [];
  const rows = [];
  const merges = getMergeMap(worksheet["!merges"]);

  for (let columnIndex = range.s.c; columnIndex <= range.e.c; columnIndex += 1) {
    columns.push({
      key: columnIndex,
      width: columnWidthToPixels(worksheet["!cols"]?.[columnIndex]),
    });
  }

  for (let rowIndex = range.s.r; rowIndex <= range.e.r; rowIndex += 1) {
    const cells = [];

    for (let columnIndex = range.s.c; columnIndex <= range.e.c; columnIndex += 1) {
      const cellKey = `${rowIndex}:${columnIndex}`;

      if (merges.covered.has(cellKey)) {
        continue;
      }

      const address = XLSX.utils.encode_cell({ c: columnIndex, r: rowIndex });
      const merge = merges.anchors.get(cellKey);
      const cell = worksheet[address];

      cells.push({
        address,
        colSpan: merge?.colSpan,
        key: address,
        rowSpan: merge?.rowSpan,
        style: getCellStyle(cell, worksheet["!rows"]?.[rowIndex]),
        text: getCellText(cell),
      });
    }

    rows.push({
      cells,
      key: rowIndex,
      number: rowIndex + 1,
    });
  }

  return {
    columns,
    isEmpty: rows.every((row) => row.cells.every((cell) => !cell.text)),
    name: sheetName,
    rows,
  };
};

export const SpreadsheetPreview = ({ file }) => {
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState(file ? "" : previewErrorMessage);
  const [isLoading, setIsLoading] = useState(Boolean(file));
  const [sheets, setSheets] = useState([]);

  useEffect(() => {
    let isActive = true;

    const loadWorkbook = async () => {
      setIsLoading(true);
      setErrorMessage("");
      setSheets([]);
      setActiveSheetIndex(0);

      try {
        const XLSX = await import("xlsx");
        const workbook = XLSX.read(await file.arrayBuffer(), {
          cellDates: true,
          cellFormula: false,
          cellStyles: true,
          dense: false,
          type: "array",
        });
        const nextSheets = workbook.SheetNames.map((sheetName) =>
          buildSheetPreview(sheetName, workbook.Sheets[sheetName], XLSX),
        );

        if (!isActive) return;

        if (nextSheets.length === 0) {
          throw new Error("Workbook does not contain worksheets.");
        }

        setSheets(nextSheets);
      } catch {
        if (isActive) setErrorMessage(previewErrorMessage);
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    if (file) {
      loadWorkbook();
    }

    return () => {
      isActive = false;
    };
  }, [file]);

  if (isLoading) {
    return (
      <div className="flex min-h-64 w-[min(82vw,640px)] items-center justify-center bg-white p-6 text-sm text-[#0F172A]">
        <div className="flex items-center gap-3 font-semibold">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#CBD5E1] border-t-[#0F7BFF]" />
          Memproses spreadsheet...
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex min-h-64 w-[min(82vw,640px)] flex-col items-center justify-center bg-white p-6 text-center text-sm text-[#475569]">
        {errorMessage.split("\n\n").map((line) => (
          <p className="mt-2 max-w-md first:mt-0" key={line}>
            {line}
          </p>
        ))}
      </div>
    );
  }

  const activeSheet = sheets[activeSheetIndex] ?? sheets[0];

  return (
    <div className="inline-flex min-w-max flex-col bg-white text-[#0F172A]">
      <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2">
        {sheets.map((sheet, index) => (
          <button
            className={[
              "h-8 max-w-48 shrink-0 rounded-md border px-3 text-sm font-semibold",
              index === activeSheetIndex
                ? "border-[#0F7BFF] bg-[#DBEAFE] text-[#0B3A75]"
                : "border-[#CBD5E1] bg-white text-[#475569] hover:border-[#0F7BFF]",
            ].join(" ")}
            key={sheet.name}
            onClick={() => setActiveSheetIndex(index)}
            title={sheet.name}
            type="button"
          >
            <span className="block truncate">{sheet.name}</span>
          </button>
        ))}
      </div>
      <div>
        {activeSheet?.isEmpty ? (
          <div className="flex min-h-64 w-[min(82vw,640px)] items-center justify-center p-6 text-sm text-[#64748B]">
            {emptySheetMessage}
          </div>
        ) : (
          <table className="border-separate border-spacing-0 text-sm">
            <colgroup>
              <col className="w-12" />
              {activeSheet.columns.map((column) => (
                <col key={column.key} style={{ width: column.width }} />
              ))}
            </colgroup>
            <tbody>
              {activeSheet.rows.map((row) => (
                <tr key={row.key}>
                  <th className="sticky left-0 z-10 border-b border-r border-[#CBD5E1] bg-[#F1F5F9] px-2 py-1 text-right text-xs font-semibold text-[#64748B]">
                    {row.number}
                  </th>
                  {row.cells.map((cell) => (
                    <td
                      className="min-w-12 border-b border-r border-[#CBD5E1] px-2 py-1 align-top"
                      colSpan={cell.colSpan}
                      key={cell.key}
                      rowSpan={cell.rowSpan}
                      style={cell.style}
                      title={cell.text}
                    >
                      {cell.text}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SpreadsheetPreview;
