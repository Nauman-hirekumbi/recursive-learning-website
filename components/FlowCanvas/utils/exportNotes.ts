import jsPDF from "jspdf";
import { ChatPage } from "../hooks/useChatPages";
import { NoteItem } from "../types";

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// jsPDF's built-in fonts only support the WinAnsi (Latin-1-ish) character
// set. AI-generated text sometimes contains smart quotes / dashes / bullets
// that fall outside that range and would otherwise render as garbled boxes
// or blank glyphs — which is exactly the "invalid data" symptom. Normalize
// the common offenders to safe ASCII equivalents before writing any text.
function sanitizeForPdf(text: string): string {
  return (text ?? "")
    .replace(/\*\*(.*?)\*\*/g, "$1") // strip markdown bold markers
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[\u2022\u25CF]/g, "-")
    .replace(/[^\x00-\xFF]/g, ""); // drop anything still outside Latin-1
}

const MARGIN = 48;

class NotesPdf {
  doc: jsPDF;
  pageWidth: number;
  pageHeight: number;
  cursorY: number;

  constructor() {
    this.doc = new jsPDF({ unit: "pt", format: "a4" });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.cursorY = MARGIN;
  }

  private ensureSpace(lineHeight: number) {
    if (this.cursorY + lineHeight > this.pageHeight - MARGIN) {
      this.doc.addPage();
      this.cursorY = MARGIN;
    }
  }

  divider() {
    this.ensureSpace(20);
    this.doc.setDrawColor(220, 220, 226);
    this.doc.line(MARGIN, this.cursorY, this.pageWidth - MARGIN, this.cursorY);
    this.cursorY += 18;
  }

  space(amount: number) {
    this.cursorY += amount;
  }

  text(
    raw: string,
    opts: {
      size?: number;
      style?: "normal" | "bold" | "italic";
      color?: [number, number, number];
      lineHeight?: number;
      indent?: number;
    } = {}
  ) {
    const {
      size = 10,
      style = "normal",
      color = [30, 30, 36],
      lineHeight = 14,
      indent = 0,
    } = opts;

    const clean = sanitizeForPdf(raw);
    if (!clean) return;

    this.doc.setFont("helvetica", style);
    this.doc.setFontSize(size);
    this.doc.setTextColor(color[0], color[1], color[2]);

    const maxWidth = this.pageWidth - MARGIN * 2 - indent;
    const lines: string[] = this.doc.splitTextToSize(clean, maxWidth);

    lines.forEach((line) => {
      this.ensureSpace(lineHeight);
      this.doc.text(line, MARGIN + indent, this.cursorY);
      this.cursorY += lineHeight;
    });
  }

  save(filename: string) {
    this.doc.save(filename);
  }
}

// ── Build a single, professionally formatted, correctly paginated PDF
// containing every research page's full conversation, plus any quick
// notes captured in the Notes panel — everything the user has discussed
// with the AI, across every page, in one downloadable file. ──
export function buildNotesPdf(pages: ChatPage[], quickNotes: NoteItem[] = []): NotesPdf {
  const pdf = new NotesPdf();

  pdf.text("Research Notes", { size: 22, style: "bold", lineHeight: 28 });
  pdf.text(`Exported ${new Date().toLocaleString()}`, {
    size: 9,
    color: [110, 110, 120],
    lineHeight: 14,
  });
  const totalMessages = pages.reduce((sum, p) => sum + p.messages.length, 0);
  pdf.text(
    `${pages.length} page${pages.length !== 1 ? "s" : ""} - ${totalMessages} message${totalMessages !== 1 ? "s" : ""}`,
    { size: 9, color: [110, 110, 120], lineHeight: 14 }
  );
  pdf.space(6);
  pdf.divider();

  pages.forEach((page, idx) => {
    pdf.text(`${idx + 1}. ${page.title}`, {
      size: 14,
      style: "bold",
      color: [76, 29, 149],
      lineHeight: 20,
    });
    pdf.text(`Created: ${formatDate(page.createdAt)}`, {
      size: 8,
      color: [120, 120, 130],
      lineHeight: 13,
    });
    pdf.space(6);

    const realMessages = page.messages.filter((m) => m.role !== "loading");

    if (realMessages.length === 0) {
      pdf.text("No conversation on this page yet.", {
        size: 9,
        style: "italic",
        color: [140, 140, 150],
        lineHeight: 14,
      });
    } else {
      realMessages.forEach((m) => {
        const isUser = m.role === "user";
        pdf.text(isUser ? "You" : "Rue AI", {
          size: 9,
          style: "bold",
          color: isUser ? [124, 58, 237] : [8, 120, 150],
          lineHeight: 13,
        });
        pdf.text(m.text ?? "", { size: 10, lineHeight: 14, indent: 10 });
        if (m.keywords && m.keywords.length > 0) {
          pdf.text(`Keywords: ${m.keywords.join(", ")}`, {
            size: 8,
            style: "italic",
            color: [120, 120, 130],
            lineHeight: 12,
            indent: 10,
          });
        }
        pdf.space(6);
      });
    }

    pdf.space(6);
    pdf.divider();
  });

  if (quickNotes.length > 0) {
    pdf.text("Quick Notes", { size: 14, style: "bold", color: [76, 29, 149], lineHeight: 20 });
    pdf.space(4);
    quickNotes.forEach((n) => {
      pdf.text(`-  ${n.text}`, { size: 10, lineHeight: 14, indent: 4 });
    });
  }

  return pdf;
}

// ── Trigger a browser download of the notes PDF. Runs entirely
// client-side via jsPDF's own save(), no server round-trip required. ──
export function downloadNotesAsPdf(pages: ChatPage[], quickNotes: NoteItem[] = []): void {
  if (typeof window === "undefined") return;

  const pdf = buildNotesPdf(pages, quickNotes);
  const stamp = new Date().toISOString().slice(0, 10);
  pdf.save(`research-notes-${stamp}.pdf`);
}
