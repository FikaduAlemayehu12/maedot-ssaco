import { jsPDF } from "jspdf";
import { supabase } from "@/integrations/supabase/client";
import logoUrl from "@/assets/logo.png";

export type FullRegistration = Record<string, any> & {
  id: string;
  customer_number: string;
  account_number: string;
  full_name: string;
  email: string;
  phone: string;
  region: string;
  account_type: string;
  status: string;
  created_at: string;
  live_photo_url?: string | null;
  optional_photo_url?: string | null;
  id_front_url?: string | null;
  id_back_url?: string | null;
  signature_data_url?: string | null;
};

export type SiteBrand = {
  org_name_en: string;
  org_name_am: string;
  motto_en: string;
  motto_am: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  logo_url?: string | null;
};

const fileToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });

const urlToDataUrl = async (url: string): Promise<string | null> => {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await fileToDataUrl(blob);
  } catch {
    return null;
  }
};

const signedImage = async (bucket: string, path?: string | null): Promise<string | null> => {
  if (!path) return null;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 10);
  if (error || !data?.signedUrl) return null;
  return await urlToDataUrl(data.signedUrl);
};

const fmt = (v: any) => (v === null || v === undefined || v === "" ? "—" : String(v));
const fmtMoney = (v: any) => (v === null || v === undefined || v === "" ? "—" : `ETB ${Number(v).toLocaleString()}`);

/**
 * Render any string (with Amharic glyphs) into a transparent PNG using
 * the loaded "Noto Sans Ethiopic" web font. Returns { dataUrl, w, h } in px.
 */
const renderTextPng = async (
  text: string,
  opts: { fontSize?: number; weight?: number | string; color?: string; maxWidth?: number; align?: "left" | "center" | "right" } = {},
): Promise<{ dataUrl: string; w: number; h: number }> => {
  const { fontSize = 14, weight = 400, color = "#141E3C", maxWidth, align = "left" } = opts;
  // Ensure web fonts are ready before measuring
  try { await (document as any).fonts?.ready; } catch { /* ignore */ }

  const dpr = 2; // crisp on PDF
  const measureCanvas = document.createElement("canvas");
  const mctx = measureCanvas.getContext("2d")!;
  const fontStr = `${weight} ${fontSize}px "Noto Sans Ethiopic","Plus Jakarta Sans",system-ui,sans-serif`;
  mctx.font = fontStr;

  // Word-wrap if maxWidth provided
  const lines: string[] = [];
  if (maxWidth) {
    const words = text.split(/\s+/);
    let line = "";
    for (const w of words) {
      const test = line ? line + " " + w : w;
      if (mctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
  } else {
    lines.push(text);
  }

  const widths = lines.map((l) => mctx.measureText(l).width);
  const w = Math.ceil((maxWidth ?? Math.max(...widths)) + 4);
  const lineH = Math.ceil(fontSize * 1.35);
  const h = lineH * lines.length + 4;

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(2, w * dpr);
  canvas.height = Math.max(2, h * dpr);
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);
  ctx.font = fontStr;
  ctx.fillStyle = color;
  ctx.textBaseline = "top";

  lines.forEach((ln, i) => {
    let x = 2;
    const lw = ctx.measureText(ln).width;
    if (align === "center") x = (w - lw) / 2;
    else if (align === "right") x = w - lw - 2;
    ctx.fillText(ln, x, 2 + i * lineH);
  });

  return { dataUrl: canvas.toDataURL("image/png"), w, h };
};

export async function generateRegistrationPdf(reg: FullRegistration, brand: SiteBrand) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 36;
  let y = M;

  const primary: [number, number, number] = [217, 119, 6]; // gold
  const dark: [number, number, number] = [20, 30, 60];
  const muted: [number, number, number] = [115, 120, 135];
  const lightBg: [number, number, number] = [251, 247, 235];

  const logoData = brand.logo_url
    ? (await urlToDataUrl(brand.logo_url)) ?? (await urlToDataUrl(logoUrl))
    : await urlToDataUrl(logoUrl);

  // Helper to place an Amharic-capable text image
  const putAmText = async (
    text: string,
    x: number,
    yy: number,
    opts: { fontSize?: number; weight?: number | string; color?: string; maxWidth?: number; align?: "left" | "center" | "right" } = {},
  ) => {
    if (!text) return 0;
    const png = await renderTextPng(text, opts);
    let drawX = x;
    if (opts.align === "center") drawX = x - png.w / 2;
    else if (opts.align === "right") drawX = x - png.w;
    try { doc.addImage(png.dataUrl, "PNG", drawX, yy, png.w, png.h); } catch {}
    return png.h;
  };

  // ====== HEADER ======
  if (logoData) {
    try { doc.addImage(logoData, "PNG", pageW / 2 - 26, y, 52, 52); } catch {}
  }
  y += 56;
  // Org name (English)
  doc.setTextColor(...dark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(brand.org_name_en, pageW / 2, y, { align: "center" });
  y += 14;
  // Org name (Amharic via canvas)
  await putAmText(brand.org_name_am, pageW / 2, y, { fontSize: 10, weight: 600, color: "#141E3C", align: "center" });
  y += 14;
  // Motto bilingual
  doc.setTextColor(...primary);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.text(`"${brand.motto_en}"`, pageW / 2 - 4, y, { align: "right" });
  await putAmText(`  •  "${brand.motto_am}"`, pageW / 2 - 4, y - 2, { fontSize: 10, weight: 500, color: "#D97706", align: "left" });
  y += 12;
  doc.setTextColor(...muted);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  const contactLine = [brand.phone, brand.email, brand.address].filter(Boolean).join("  |  ");
  doc.text(contactLine, pageW / 2, y, { align: "center" });
  y += 10;
  doc.setDrawColor(...primary);
  doc.setLineWidth(1);
  doc.line(M, y, pageW - M, y);
  y += 14;

  // ====== TITLE BANNER ======
  doc.setFillColor(...dark);
  doc.rect(M, y, pageW - 2 * M, 24, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("MEMBERSHIP APPLICATION & ACCOUNT CREATION", pageW / 2, y + 16, { align: "center" });
  y += 32;

  // ====== Submitted Documents header strip (member id, name) — placed directly below header ======
  doc.setFillColor(...lightBg);
  doc.rect(M, y, pageW - 2 * M, 50, "F");
  doc.setTextColor(...muted);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("CUSTOMER NUMBER", M + 10, y + 12);
  doc.text("ACCOUNT NUMBER", M + 175, y + 12);
  doc.text("STATUS", M + 340, y + 12);
  doc.text("SUBMITTED", M + 430, y + 12);
  doc.setFontSize(11);
  doc.setTextColor(...primary);
  doc.text(reg.customer_number, M + 10, y + 26);
  doc.setTextColor(...dark);
  doc.text(reg.account_number, M + 175, y + 26);
  const statusColor: [number, number, number] = reg.status === "approved" ? [22, 130, 80] : reg.status === "rejected" ? [180, 50, 50] : [200, 130, 0];
  doc.setTextColor(...statusColor);
  doc.text(reg.status.toUpperCase(), M + 340, y + 26);
  doc.setTextColor(...dark);
  doc.setFontSize(9);
  doc.text(new Date(reg.created_at).toLocaleDateString(), M + 430, y + 26);

  // Member name line at bottom of strip
  doc.setTextColor(...muted);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("MEMBER", M + 10, y + 38);
  // Render member name (potentially Amharic)
  await putAmText(`${reg.full_name} • ${reg.customer_number}`, M + 50, y + 31, { fontSize: 10, weight: 700, color: "#141E3C" });

  y += 60;

  // ====== Section helper ======
  const sectionTitle = (label: string) => {
    doc.setFillColor(...primary);
    doc.rect(M, y, 3, 12, "F");
    doc.setTextColor(...dark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(label.toUpperCase(), M + 8, y + 9);
    y += 16;
  };

  // Compact two-col rows (label + value)
  const colW = (pageW - 2 * M) / 2;
  const ROW_H = 24;
  const drawRow = async (pairs: Array<[string, string, boolean?]>) => {
    // pairs: [label, value, valueIsAmharic?]
    for (let i = 0; i < pairs.length; i += 2) {
      const left = pairs[i];
      const right = pairs[i + 1];
      const cells = [left, right].filter(Boolean) as Array<[string, string, boolean?]>;
      for (let c = 0; c < cells.length; c++) {
        const x = M + c * colW;
        const [lab, val, amh] = cells[c];
        doc.setTextColor(...muted);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.text(lab.toUpperCase(), x, y + 2);
        if (amh) {
          await putAmText(val, x, y + 7, { fontSize: 9, weight: 600, color: "#141E3C", maxWidth: colW - 12 });
        } else {
          doc.setTextColor(...dark);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          const text = doc.splitTextToSize(val, colW - 12);
          doc.text(text, x, y + 14);
        }
      }
      y += ROW_H;
    }
  };

  // ====== Sections (PAGE 1) ======
  sectionTitle("Personal Information");
  await drawRow([
    ["Full Name", fmt(reg.full_name), true],
    ["Mother's Name", fmt(reg.mothers_name), true],
    ["Gender", fmt(reg.gender)],
    ["Date of Birth", fmt(reg.date_of_birth)],
    ["Nationality", fmt(reg.nationality), true],
    ["Region / City", fmt(reg.region), true],
    ["Marital Status", fmt(reg.marital_status)],
    ["Education", fmt(reg.education)],
  ]);

  sectionTitle("Contact");
  await drawRow([
    ["Phone", fmt(reg.phone)],
    ["Email", fmt(reg.email)],
  ]);

  sectionTitle("Identification & Account");
  await drawRow([
    ["ID Type", fmt(reg.id_type)],
    ["ID Number", fmt(reg.id_number)],
    ["TIN Number", fmt(reg.tin_number)],
    ["Referral Code", fmt(reg.referral_code)],
    ["Account Type", fmt(reg.account_type).replace(/_/g, " ")],
    ["Branch", fmt(reg.branch), true],
    ["Occupation", fmt(reg.occupation), true],
    ["Monthly Income", fmtMoney(reg.monthly_income)],
    ["Annual Income", fmtMoney(reg.annual_income)],
    ["Submitted", new Date(reg.created_at).toLocaleString()],
  ]);

  sectionTitle("Heirs & Witnesses");
  await drawRow([
    ["Heir 1 — Name", fmt(reg.heir_full_name), true],
    ["Heir 1 — Phone", fmt(reg.heir_phone)],
    ["Heir 1 — Relationship", fmt(reg.heir_relationship), true],
    ["Heir 2 — Name", fmt(reg.heir2_full_name), true],
    ["Heir 2 — Phone", fmt(reg.heir2_phone)],
    ["Heir 2 — Relationship", fmt(reg.heir2_relationship), true],
    ["Witness 1", fmt(reg.witness_1), true],
    ["Witness 2", fmt(reg.witness_2), true],
    ["Witness 3", fmt(reg.witness_3), true],
    ["", ""],
  ]);

  // Footer note for page 1
  doc.setTextColor(...muted);
  doc.setFontSize(8);
  doc.text(`${brand.org_name_en} • ${brand.motto_en}`, pageW / 2, pageH - 18, { align: "center" });

  // ====== PAGE 2 — Documents & Photos ======
  doc.addPage();
  y = M;

  // Compact header
  if (logoData) { try { doc.addImage(logoData, "PNG", M, y, 32, 32); } catch {} }
  doc.setTextColor(...dark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Submitted Documents & Photos", M + 42, y + 14);
  doc.setTextColor(...muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  await putAmText(`${reg.full_name} • ${reg.customer_number}`, M + 42, y + 20, { fontSize: 9, weight: 500, color: "#73788C" });
  y += 40;
  doc.setDrawColor(...primary);
  doc.line(M, y, pageW - M, y);
  y += 12;

  const [livePhoto, optPhoto, idFront, idBack] = await Promise.all([
    signedImage("member-photos", reg.live_photo_url),
    signedImage("member-photos", reg.optional_photo_url),
    signedImage("member-ids", reg.id_front_url),
    signedImage("member-ids", reg.id_back_url),
  ]);

  const placePhoto = (label: string, dataUrl: string | null, x: number, yy: number, w: number, h: number) => {
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(248, 248, 250);
    doc.rect(x, yy, w, h, "FD");
    if (dataUrl) {
      try {
        const imgFmt = dataUrl.includes("image/png") ? "PNG" : "JPEG";
        // Inset to leave room for label
        doc.addImage(dataUrl, imgFmt, x + 4, yy + 4, w - 8, h - 22);
      } catch {}
    } else {
      doc.setTextColor(...muted);
      doc.setFontSize(9);
      doc.text("Not provided", x + w / 2, yy + h / 2, { align: "center" });
    }
    doc.setFillColor(255, 255, 255);
    doc.rect(x + 1, yy + h - 18, w - 2, 16, "F");
    doc.setTextColor(...dark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(label, x + 6, yy + h - 6);
  };

  // 2x2 grid of photos (live + optional, then id front + id back)
  const halfW = (pageW - 2 * M - 14) / 2;
  const photoH = 175;
  placePhoto("LIVE PHOTO", livePhoto, M, y, halfW, photoH);
  placePhoto("ADDITIONAL PHOTO", optPhoto, M + halfW + 14, y, halfW, photoH);
  y += photoH + 12;
  placePhoto("ID — FRONT", idFront, M, y, halfW, photoH);
  placePhoto("ID — BACK", idBack, M + halfW + 14, y, halfW, photoH);
  y += photoH + 18;

  // Signature block
  const sigBoxW = (pageW - 2 * M - 20) / 2;
  const sigBoxH = 80;
  const drawSigBox = (label: string, dataUrl: string | null, x: number) => {
    doc.setDrawColor(...muted);
    doc.setLineWidth(0.5);
    doc.rect(x, y, sigBoxW, sigBoxH, "S");
    if (dataUrl) {
      try {
        const imgFmt = dataUrl.includes("image/png") ? "PNG" : "JPEG";
        doc.addImage(dataUrl, imgFmt, x + 6, y + 6, sigBoxW - 12, sigBoxH - 24);
      } catch {}
    }
    doc.setTextColor(...muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(label.toUpperCase(), x + 6, y + sigBoxH - 6);
  };
  drawSigBox("Applicant Signature", reg.signature_data_url ?? null, M);
  drawSigBox("Authorized Officer", null, M + sigBoxW + 20);
  y += sigBoxH + 8;

  // Footer
  doc.setTextColor(...muted);
  doc.setFontSize(8);
  doc.text(`${brand.org_name_en} • ${brand.motto_en}`, pageW / 2, pageH - 18, { align: "center" });

  // Page numbers
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setTextColor(...muted);
    doc.setFontSize(8);
    doc.text(`Page ${i} of ${totalPages}`, pageW - M, pageH - 18, { align: "right" });
  }

  return doc;
}

export async function downloadRegistrationPdf(reg: FullRegistration, brand: SiteBrand) {
  const doc = await generateRegistrationPdf(reg, brand);
  const safe = reg.full_name.replace(/[^A-Za-z0-9]+/g, "_");
  doc.save(`Maedot_${reg.customer_number}_${safe}.pdf`);
}

export async function openRegistrationPdf(reg: FullRegistration, brand: SiteBrand) {
  const doc = await generateRegistrationPdf(reg, brand);
  const url = doc.output("bloburl");
  window.open(url, "_blank");
}
