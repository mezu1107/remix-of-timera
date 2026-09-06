import { createFileRoute } from "@tanstack/react-router";
import { CrudModule } from "@/components/admin/CrudModule";

export const Route = createFileRoute("/admin/hero")({ component: HeroAdmin });

function HeroAdmin() {
  return (
    <CrudModule
      table="hero_slides"
      title="Hero Slides"
      description="Homepage full-screen slider. Upload a background image or video directly from your phone or PC — no URL needed."
      orderBy={{ column: "sort_order" }}
      invalidate={["hero_slides"]}
      columns={[
        {
          key: "image_url",
          label: "Media",
          render: (r) =>
            r.image_url ? (
              <img src={r.image_url} alt="" className="h-12 w-20 rounded object-cover" />
            ) : (
              <span className="text-xs text-muted-foreground">No image</span>
            ),
        },
        { key: "title", label: "Title" },
        { key: "eyebrow", label: "Eyebrow" },
        { key: "sort_order", label: "Order" },
        { key: "active", label: "Active", render: (r) => (r.active ? "✓" : "—") },
      ]}
      fields={[
        {
          section: "Media",
          key: "image_url",
          label: "Background image",
          type: "image",
          help: "Drag & drop or tap to upload from your phone or PC. Recommended: 1920×1080 JPG.",
        },
        {
          section: "Media",
          key: "video_url",
          label: "Background video (optional)",
          type: "video" as any,
          help: "Upload an MP4 video. Will autoplay muted on loop. If set, video plays instead of the image.",
        },
        { section: "Copy", key: "eyebrow", label: "Eyebrow (small text above title)", type: "text" },
        { section: "Copy", key: "title", label: "Heading", type: "text", required: true },
        { section: "Copy", key: "title_accent", label: "Accent words (shown italic in gold)", type: "text" },
        { section: "Copy", key: "description", label: "Subheading", type: "textarea" },
        { section: "Copy", key: "cta_label", label: "Button label", type: "text", default: "Shop Now" },
        { section: "Copy", key: "cta_href", label: "Button link", type: "text", default: "/shop" },
        { section: "Settings", key: "sort_order", label: "Sort order (lower = first)", type: "number" },
        { section: "Settings", key: "active", label: "Show this slide", type: "switch", default: true },
      ]}
    />
  );
}
