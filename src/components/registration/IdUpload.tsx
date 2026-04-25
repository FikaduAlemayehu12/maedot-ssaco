import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileImage, X } from "lucide-react";

interface Props {
  label: string;
  file: File | null;
  previewUrl: string | null;
  onChange: (file: File | null) => void;
}

export const IdUpload = ({ label, file, previewUrl, onChange }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handle = (f: File | null) => {
    if (f && f.size > 5 * 1024 * 1024) {
      alert("File must be smaller than 5MB");
      return;
    }
    onChange(f);
  };

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{label}</div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0] ?? null)}
      />
      {previewUrl ? (
        <div className="relative rounded-xl overflow-hidden border bg-muted aspect-[16/10]">
          <img src={previewUrl} alt={label} className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 size-8 rounded-full bg-secondary/90 text-secondary-foreground grid place-items-center hover:bg-destructive hover:text-destructive-foreground"
            aria-label="Remove"
          >
            <X className="size-4" />
          </button>
          <div className="absolute bottom-2 left-2 text-xs font-semibold px-2 py-1 rounded bg-secondary/90 text-secondary-foreground truncate max-w-[80%]">
            {file?.name}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors p-6 flex flex-col items-center gap-2 text-muted-foreground hover:text-primary"
        >
          <Upload className="size-7" />
          <span className="text-sm font-medium">Click to upload or take a photo</span>
          <span className="text-xs">JPG, PNG, WEBP · max 5MB</span>
        </button>
      )}
      {previewUrl && (
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          <FileImage className="size-4" /> Replace
        </Button>
      )}
    </div>
  );
};
