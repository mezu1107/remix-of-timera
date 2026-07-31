import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { siteSettingsQuery } from "@/lib/site-settings";
import { initMetaPixel, metaTrack } from "@/lib/pixels/meta-pixel";
import { initGooglePixel } from "@/lib/pixels/google-pixel";
import { trackEvent } from "@/lib/tracking";

export function TrackingPixels() {
  const { data: settings } = useQuery(siteSettingsQuery);
  const location = useRouterState({ select: (s) => s.location });

  // Meta Pixel always boots (falls back to the built-in pixel id).
  useEffect(() => {
    initMetaPixel(settings?.metaPixelId);
  }, [settings?.metaPixelId]);

  useEffect(() => {
    if (!settings?.googleTagId) return;
    initGooglePixel(settings.googleTagId, settings.googleAdsPurchaseLabel);
  }, [settings?.googleTagId, settings?.googleAdsPurchaseLabel]);

  // Route changes → Meta PageView + internal analytics.
  useEffect(() => {
    const pagePath = `${location.pathname}${location.searchStr}`;
    metaTrack("PageView", {});
    if (settings?.trackingEnabled) void trackEvent("page_view", { pagePath });
  }, [settings?.trackingEnabled, location.pathname, location.searchStr]);

  return null;
}
