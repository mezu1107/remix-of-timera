import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { siteSettingsQuery } from "@/lib/site-settings";
import { initGoogleTag, initMetaPixel, trackEvent } from "@/lib/tracking";

export function TrackingPixels() {
  const { data: settings } = useQuery(siteSettingsQuery);
  const location = useRouterState({ select: (s) => s.location });

  useEffect(() => {
    if (!settings?.trackingEnabled) return;
    initMetaPixel(settings.metaPixelId);
    initGoogleTag(settings.googleTagId, settings.googleAdsPurchaseLabel);
  }, [settings?.trackingEnabled, settings?.metaPixelId, settings?.googleTagId, settings?.googleAdsPurchaseLabel]);

  useEffect(() => {
    if (!settings?.trackingEnabled) return;
    void trackEvent("page_view", { pagePath: `${location.pathname}${location.searchStr}` });
  }, [settings?.trackingEnabled, location.pathname, location.searchStr]);

  return null;
}