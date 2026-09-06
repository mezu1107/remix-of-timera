/**
 * upload.ts — Supabase Storage upload helpers
 *
 * Uploads any file (image OR video) directly to Supabase Storage and returns
 * the public URL. The admin can then drag-and-drop from their phone or PC.
 *
 * Storage buckets used:
 *   media   — images, videos, hero backgrounds, product gallery
 *
 * The bucket must exist in Supabase Storage with public read access.
 * Create it once in Dashboard → Storage → New bucket → name: "media" → Public.
 */
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "media";

/**
 * Uploads a File to Supabase Storage and returns the public URL.
 * @param file   The File object from an <input type="file"> or drop event
 * @param folder Optional sub-folder, e.g. "hero", "products", "videos"
 */
export async function uploadToStorage(file: File, folder = "uploads"): Promise<string> {
  // Build a unique path: folder/timestamp-randomhex-originalname
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const random = Math.random().toString(36).slice(2, 8);
  const path = `${folder}/${Date.now()}-${random}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "31536000", // 1 year cache
      upsert: false,
      contentType: file.type || undefined,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error("Could not get public URL after upload");

  return data.publicUrl;
}

/** Returns true if a string looks like a video file URL */
export function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov|m4v|ogv)(\?|$)/i.test(url);
}

/** Returns true if a string looks like an image file URL or data URL */
export function isImageUrl(url: string): boolean {
  return /^data:image\//.test(url) || /\.(jpe?g|png|gif|webp|avif|svg)(\?|$)/i.test(url);
}
