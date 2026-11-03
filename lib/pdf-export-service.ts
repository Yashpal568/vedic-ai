/**
 * Vedic AI — Client-Side Binary PDF Export Service
 * Converts structured A4 / US Letter HTML documents into genuine multi-page binary PDF files (application/pdf).
 */

export interface ExportPdfOptions {
  format?: "A4" | "US_Letter";
  orientation?: "portrait" | "landscape";
}

export interface ExportPdfResult {
  blob: Blob;
  url: string;
  pageCount: number;
}

/**
 * Rasterizes an HTML document into a real binary PDF Blob with exact A4 proportions.
 */
export async function exportHtmlToPdfBlob(
  html: string,
  options: ExportPdfOptions = {}
): Promise<ExportPdfResult> {
  if (typeof window === "undefined") {
    throw new Error("PDF export is only available in browser environments");
  }

  const isLetter = options.format === "US_Letter";
  const pdfFormat = isLetter ? "letter" : "a4";
  const pageWidthMm = isLetter ? 215.9 : 210;
  const pageHeightMm = isLetter ? 279.4 : 297;
  const viewportWidthPx = isLetter ? 816 : 794; // Exact standard A4 / US Letter width at 96 DPI

  const { jsPDF } = await import("jspdf");
  const html2canvas = (await import("html2canvas")).default;

  // Create an invisible sandbox iframe so styles don't conflict with main page
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-9999px";
  iframe.style.top = "0";
  iframe.style.width = `${viewportWidthPx}px`;
  iframe.style.height = "1200px";
  iframe.style.border = "none";
  iframe.style.zIndex = "-99999";
  iframe.setAttribute("aria-hidden", "true");
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentWindow?.document;
    if (!doc) {
      throw new Error("Unable to access iframe document for PDF rasterization");
    }

    doc.open();
    doc.write(html);
    doc.close();

    // Give web fonts, styles, and SVG graphics time to render
    await new Promise((resolve) => setTimeout(resolve, 400));

    const pageElements = doc.querySelectorAll<HTMLElement>(".pdf-page");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: pdfFormat,
      compress: true,
    });

    let renderedPages = 0;

    if (pageElements.length > 0) {
      for (let i = 0; i < pageElements.length; i++) {
        const pageEl = pageElements[i];
        const origWidth = pageEl.style.width;
        pageEl.style.width = `${viewportWidthPx}px`;
        pageEl.style.boxSizing = "border-box";

        const canvas = await html2canvas(pageEl, {
          scale: 2, // 2x high-DPI clarity for razor-sharp typography and diagrams
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: null,
          windowWidth: viewportWidthPx,
        });

        pageEl.style.width = origWidth;

        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        if (i > 0) {
          pdf.addPage(pdfFormat, "portrait");
        }
        pdf.addImage(imgData, "JPEG", 0, 0, pageWidthMm, pageHeightMm, undefined, "FAST");
        renderedPages++;
      }
    } else {
      const canvas = await html2canvas(doc.body, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        windowWidth: viewportWidthPx,
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      pdf.addImage(imgData, "JPEG", 0, 0, pageWidthMm, pageHeightMm, undefined, "FAST");
      renderedPages = 1;
    }

    const blob = pdf.output("blob");
    const url = URL.createObjectURL(blob);
    return { blob, url, pageCount: renderedPages };
  } finally {
    try {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    } catch {}
  }
}

/**
 * Generates and downloads a real binary PDF file directly in the user's browser.
 */
export async function downloadRealPdfFile(
  html: string,
  filename: string,
  options: ExportPdfOptions = {}
): Promise<void> {
  if (typeof window === "undefined") return;

  const cleanFilename = filename.toLowerCase().endsWith(".pdf")
    ? filename
    : `${filename}.pdf`;

  const { url } = await exportHtmlToPdfBlob(html, options);

  const a = document.createElement("a");
  a.href = url;
  a.download = cleanFilename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
