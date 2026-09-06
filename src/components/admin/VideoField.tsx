import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Upload, Loader2, Video } from "lucide-react";
import { toast } from "sonner";
import { uploadToStorage } from "@/lib/upload";

/* ------------------------------------------------------------------ */
/* Single video field — drag-and-drop or file-picker upload             */
/* ------------------------------------------------------------------ */
export function VideoField({
  value,
  onChange,
  label = "Video",
  help,
  folder = "videos",
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  help?: string;
  folder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const hasVideo = !!value?.trim();

  const handle = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) { toast.error("Please select a video file (MP4, MOV, WebM)"); return; }
    setBusy(true);
    try {
      const url = await uploadToStorage(file, folder);
      onChange(url);
      toast.success("Video uploaded ✓ — save to publish");
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="mt-1.5 space-y-2.5">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files); }}
        onClick={() => !busy && inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition
          ${dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"}`}
      >
        {busy ? (
          <><Loader2 className="h-6 w-6 animate-spin text-primary" /><p className="text-sm text-muted-foreground">Uploading video… please wait</p></>
        ) : (
          <><Video className="h-6 w-6 text-muted-foreground" /><p className="text-sm font-medium">Drop video here or tap to browse</p><p className="text-xs text-muted-foreground">MP4, MOV, WebM — from your phone or PC</p></>
        )}
      </div>
      <input ref={inputRef} type="file" accept="video/mp4,video/webm,video/quicktime,video/*" capture="environment" hidden onChange={(e) => handle(e.target.files)} />

      {/* URL fallback */}
      <div className="flex gap-2">
        <Input value={value ?? ""} placeholder="Or paste a video URL (MP4/WebM)"
          onChange={(e) => onChange(e.target.value)} className="h-9 flex-1 text-sm" />
        {value && <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => onChange("")} aria-label="Remove"><X className="h-4 w-4" /></Button>}
      </div>

      {help && <p className="text-xs text-muted-foreground">{help}</p>}

      {/* Preview */}
      {hasVideo && (
        <div className="relative inline-block w-full max-w-xs overflow-hidden rounded-xl border border-border bg-card">
          <video src={value} controls muted playsInline preload="metadata" className="w-full max-h-48 object-contain" />
          <button type="button" onClick={() => onChange("")} aria-label="Remove video"
            className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full border border-border bg-card/90 shadow-sm hover:text-destructive transition">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Multi-video field — ordered list, drag-and-drop upload               */
/* ------------------------------------------------------------------ */
export function VideosField({
  value,
  onChange,
  folder = "videos",
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
    const videoFiles = Array.from(files).filter((f) => f.type.startsWith("video/") || /\.(mp4|webm|mov|m4v)$/i.test(f.name));
    if (!videoFiles.length) { toast.error("Please select video files (MP4, MOV, WebM)"); return; }
    setBusy(true);
    try {
      const urls: string[] = [];
      for (const f of videoFiles) urls.push(await uploadToStorage(f, folder));
      onChange([...value, ...urls]);
      toast.success(`${urls.length} video${urls.length > 1 ? "s" : ""} uploaded ✓`);
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  function remove(idx: number) { onChange(value.filter((_, i) => i !== idx)); }
  function moveUp(idx: number) { if (idx === 0) return; const a = [...value]; [a[idx - 1], a[idx]] = [a[idx], a[idx - 1]]; onChange(a); }
  function moveDown(idx: number) { if (idx === value.length - 1) return; const a = [...value]; [a[idx], a[idx + 1]] = [a[idx + 1], a[idx]]; onChange(a); }

  return (
    <div className="mt-1.5 space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files); }}
        onClick={() => !busy && inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition
          ${dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"}`}
      >
        {busy ? (
          <><Loader2 className="h-6 w-6 animate-spin text-primary" /><p className="text-sm text-muted-foreground">Uploading… please wait</p></>
        ) : (
          <><Upload className="h-6 w-6 text-muted-foreground" /><p className="text-sm font-medium">Drop videos here or tap to browse</p><p className="text-xs text-muted-foreground">MP4, MOV, WebM · phone or PC · multiple at once</p></>
        )}
      </div>
      <input ref={inputRef} type="file" accept="video/mp4,video/webm,video/quicktime,video/*" multiple capture="environment" hidden onChange={(e) => handle(e.target.files)} />

      {/* URL add */}
      <div className="flex gap-2">
        <Input value={urlInput} placeholder="Or paste video URL (MP4)" onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (urlInput.trim()) { onChange([...value, urlInput.trim()]); setUrlInput(""); } } }}
          className="h-9 flex-1 text-sm" />
        <Button type="button" variant="outline" className="h-9 shrink-0 text-xs" onClick={() => { if (urlInput.trim()) { onChange([...value, urlInput.trim()]); setUrlInput(""); } }}>Add URL</Button>
      </div>

      {/* Empty state */}
      {value.length === 0 && (
        <p className="text-xs text-muted-foreground">No videos yet — upload from your phone or PC above.</p>
      )}

      {/* Video list */}
      <div className="space-y-3">
        {value.map((url, idx) => (
          <div key={url + idx} className="flex gap-3 rounded-xl border border-border bg-card p-3">
            {/* Order buttons */}
            <div className="flex flex-col justify-center gap-1 shrink-0">
              <button type="button" onClick={() => moveUp(idx)} disabled={idx === 0}
                className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-25 transition text-xs" aria-label="Move up">▲</button>
              <button type="button" onClick={() => moveDown(idx)} disabled={idx === value.length - 1}
                className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-25 transition text-xs" aria-label="Move down">▼</button>
            </div>

            {/* Preview */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Video {idx + 1}</p>
              <video src={url} controls muted playsInline preload="metadata"
                className="w-full max-h-36 rounded-lg object-contain bg-black/5" />
              <p className="mt-1 text-[10px] text-muted-foreground truncate" title={url}>{url}</p>
            </div>

            {/* Remove */}
            <button type="button" onClick={() => remove(idx)} aria-label="Remove video"
              className="shrink-0 self-start text-muted-foreground hover:text-destructive transition mt-1">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
