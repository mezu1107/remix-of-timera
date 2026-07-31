/**
 * PIXELS — single entry point for every marketing pixel on the site.
 * Each pixel lives in its own module; nothing else belongs in this folder.
 */
export {
  DEFAULT_META_PIXEL_ID,
  initMetaPixel,
  isMetaPixelReady,
  metaPixelIds,
  metaTrack,
  metaTrackCustom,
  type MetaStandardEvent,
} from "./meta-pixel";

export { initGooglePixel, isGooglePixelReady, googleTrack, googleAdsConversion } from "./google-pixel";
