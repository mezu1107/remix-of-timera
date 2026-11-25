import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImagePlus, Loader2, X, Upload } from "lucide-react";
import { toast } from "sonner";
import { uploadToStorage } from "@/lib/upload";

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

/**
 * Compress an image in-browser before uploading.
 * Falls back gracefully if canvas is unavailable.
 */
export async function compressImage(file: File, maxEdge = 1400, quality = 0.85): Promise<File> {
  if (!file.type.startsWith("image/")) throw new Error("Not an image file");
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(file); // can't decode → send original
      img.onload = () => {
        const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(file);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
          },
          "image/jpeg",
          quality,
        );
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

/* ------------------------------------------------------------------ */
/* Single image field with drag-and-drop + Storage upload              */
/* ------------------------------------------------------------------ */
export function ImageField({
  value,
  onChange,
  folder = "images",
}: {
  value: string;
  onChange: (v: string) => void;
  folder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handle = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      let toUpload = file;
      if (file.type.startsWith("image/")) toUpload = await compressImage(file);
      const url = await uploadToStorage(toUpload, folder);
      onChange(url);
      toast.success("Image uploaded ✓");
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="mt-1.5 space-y-2">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handle(e.dataTransfer.files);
        }}
        onClick={() => !busy && inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition
          ${dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"}`}
      >
        {busy ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Uploading…</p>
          </>
        ) : (
          <>
            <Upload className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-medium">Drop image here or tap to browse</p>
            <p className="text-xs text-muted-foreground">JPG, PNG, WebP — from your phone or PC</p>
          </>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => handle(e.target.files)} />

      {/* URL fallback */}
      <div className="flex gap-2">
        <Input
          value={value ?? ""}
          placeholder="Or paste an image URL"
          onChange={(e) => onChange(e.target.value)}
          className="h-9 flex-1 text-sm"
        />
        {value && (
          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => onChange("")} aria-label="Remove">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Preview */}
      {value && !value.startsWith("PASTE") && (
        <div className="relative inline-block">
          <img src={value} alt="Preview" className="h-28 w-auto max-w-full rounded-lg border border-border object-cover" />
          <button type="button" onClick={() => onChange("")} aria-label="Remove image"
            className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full border border-border bg-card shadow-sm">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Multi-image field                                                    */
/* ------------------------------------------------------------------ */
export function ImagesField({
  value,
  onChange,
  folder = "images",
}: {
  value: string[];
  onChange: (v: string[]) => void;
  folder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const handle = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) {
        const compressed = f.type.startsWith("image/") ? await compressImage(f) : f;
        urls.push(await uploadToStorage(compressed, folder));
      }
      onChange([...value, ...urls]);
      toast.success(`${urls.length} image${urls.length > 1 ? "s" : ""} uploaded ✓`);
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="mt-1.5 space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handle(e.dataTransfer.files);
        }}
        onClick={() => !busy && inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 text-center transition
          ${dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"}`}
      >
        {busy ? (
          <><Loader2 className="h-5 w-5 animate-spin text-primary" /><p className="text-sm text-muted-foreground">Uploading…</p></>
        ) : (
          <><Upload className="h-5 w-5 text-muted-foreground" /><p className="text-sm font-medium">Drop images or tap to browse</p><p className="text-xs text-muted-foreground">Select multiple — works from phone camera too</p></>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple capture="environment" hidden onChange={(e) => handle(e.target.files)} />

      {/* URL add */}
      <div className="flex gap-2">
        <Input value={urlInput} placeholder="Or paste image URL" onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (urlInput.trim()) { onChange([...value, urlInput.trim()]); setUrlInput(""); } } }}
          className="h-9 flex-1 text-sm" />
        <Button type="button" variant="outline" className="h-9 shrink-0 text-xs" onClick={() => { if (urlInput.trim()) { onChange([...value, urlInput.trim()]); setUrlInput(""); } }}>Add</Button>
      </div>

      {/* Thumbnails */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((src, i) => (
            <div key={`${src.slice(-20)}-${i}`} className="relative">
              <img src={src} alt="" className="h-20 w-20 rounded-lg border border-border object-cover" />
              <button type="button" aria-label="Remove" onClick={() => onChange(value.filter((_, j) => j !== i))}
                className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full border border-border bg-card shadow-sm">
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
