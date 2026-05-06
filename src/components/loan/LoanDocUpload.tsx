import { useRef, useState } from "react";
import { Loader2, Upload, FileCheck2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type LoanDocKey =
  | "doc_marriage_cert"
  | "doc_fayda_kebele"
  | "doc_member_booklet"
  | "doc_vehicle_house_title"
  | "doc_insurance"
  | "doc_restraint_letter"
  | "doc_cheque";

export const LOAN_DOC_LIST: { key: LoanDocKey; label: string }[] = [
  { key: "doc_marriage_cert", label: "የጋብቻ ሰርተፍኬት" },
  { key: "doc_fayda_kebele", label: "የፋይዳ / የቀበሌ መታወቂያ" },
  { key: "doc_member_booklet", label: "የአባል ደብተር" },
  { key: "doc_vehicle_house_title", label: "የመኪና ሊብሬ / የቤት ካርታ" },
  { key: "doc_insurance", label: "ኢንሹራንስ" },
  { key: "doc_restraint_letter", label: "የእግድ ደብዳቤ" },
  { key: "doc_cheque", label: "ቼክ" },
];

type Props = {
  checked: Record<string, boolean>;
  urls: Record<string, string>;
  onCheckedChange: (key: LoanDocKey, value: boolean) => void;
  onUrlChange: (key: LoanDocKey, url: string | null) => void;
  memberRef?: string;
};

export const LoanDocUpload = ({ checked, urls, onCheckedChange, onUrlChange, memberRef }: Props) => {
  return (
    <div className="grid sm:grid-cols-2 gap-2 text-sm">
      {LOAN_DOC_LIST.map(({ key, label }) => (
        <DocRow
          key={key}
          docKey={key}
          label={label}
          checked={!!checked[key]}
          url={urls[key] ?? null}
          memberRef={memberRef}
          onChecked={v => onCheckedChange(key, v)}
          onUrl={u => onUrlChange(key, u)}
        />
      ))}
    </div>
  );
};

const DocRow = ({
  docKey,
  label,
  checked,
  url,
  memberRef,
  onChecked,
  onUrl,
}: {
  docKey: LoanDocKey;
  label: string;
  checked: boolean;
  url: string | null;
  memberRef?: string;
  onChecked: (v: boolean) => void;
  onUrl: (u: string | null) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const upload = async (file: File) => {
    setBusy(true);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const folder = memberRef || "anon";
      const path = `${folder}/${docKey}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("loan-documents").upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("loan-documents").getPublicUrl(path);
      onUrl(data.publicUrl);
      onChecked(true);
      toast({ title: "ሰነድ ተጭኗል", description: label });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message ?? String(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-md border bg-muted/20 p-2 space-y-2">
      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox checked={checked} onCheckedChange={v => onChecked(!!v)} />
        <span className="flex-1">{label}</span>
        {url && <FileCheck2 className="size-4 text-emerald-600" />}
      </label>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? <Loader2 className="size-3 animate-spin" /> : <Upload className="size-3" />}
          {url ? "Replace" : "Upload"}
        </Button>
        {url && (
          <>
            <a href={url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
              View
            </a>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-destructive"
              onClick={() => onUrl(null)}
            >
              <X className="size-3" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};