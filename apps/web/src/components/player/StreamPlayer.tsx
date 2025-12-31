import { isTauri } from "@tauri-apps/api/core";
import { isHLSProvider, MediaPlayer, MediaProvider } from "@vidstack/react";
import { Loader2, Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { TauriHlsLoader } from "@/lib/tauri-hls-loader";
import { cn } from "@/lib/utils";
import { type Stream, useStore } from "@/store/useStore";
import "@vidstack/react/player/styles/base.css";

interface StreamPlayerProps {
  stream: Stream;
  isSelected: boolean;
  onSelect: () => void;
}

export function StreamPlayer({
  stream,
  isSelected,
  onSelect,
}: StreamPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manualMute, setManualMute] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const focusMode = useStore((state) => state.settings.focusMode);
  const isAudioEnabled = useStore((state) => state.isAudioEnabled);

  // Effect to resolve URL if needed (e.g. Kick streams)
  useEffect(() => {
    let mounted = true;

    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: we need to resolve the URL if it's a Kick stream
    const resolveUrl = async () => {
      // If the URL is already a resolved Kick URL, we might need to refresh it if it fails.
      // But for now, let's assume if it starts with "kick:", we need to resolve it.
      // Also check for legacy persisted URLs that might be stale but don't start with "kick:".
      // Since we can't easily distinguish a stale URL from a valid one without trying it,
      // we rely on the store update to ensure new streams use "kick:" prefix.

      if (stream.url.startsWith("kick:")) {
        const channelName = stream.url.replace("kick:", "");
        try {
          setIsLoading(true);

          const res = await fetch(
            `https://kick.com/api/v2/channels/${channelName}/playback-url`
          );
          if (!res.ok) {
            throw new Error("Failed to fetch playback URL");
          }
          const data = await res.json();
          if (!data.data) {
            throw new Error("No playback URL found");
          }

          const originalUrl = data.data;
          const urlObj = new URL(originalUrl);
          urlObj.hostname = "d2xr8tsefxgeo0.cloudfront.net";

          if (mounted) {
            setResolvedUrl(urlObj.toString());
            setIsLoading(false);
            setError(null);
          }
        } catch (err) {
          console.error("Failed to resolve Kick URL:", err);
          if (mounted) {
            setError("Failed to load Kick stream");
            setIsLoading(false);
          }
        }
      } else {
        setResolvedUrl(stream.url);
        setIsLoading(false);
      }
    };

    resolveUrl();

    return () => {
      mounted = false;
    };
  }, [stream.url]);

  // In focus mode, mute all streams except selected
  // Otherwise use manual mute state
  const isMuted = !isAudioEnabled || (focusMode ? !isSelected : manualMute);

  return (
    <div className="relative h-full w-full">
      <button
        className={cn(
          "relative block h-full w-full overflow-hidden rounded-lg border-2 bg-black p-0 outline-none transition-colors duration-200",
          isSelected ? "border-primary" : "border-transparent"
        )}
        onClick={onSelect}
        type="button"
      >
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black">
            <div className="text-center text-red-500">
              <p className="font-bold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        <MediaPlayer
          autoplay
          className="h-full w-full"
          controls={false}
          muted={isMuted}
          onCanPlay={() => setIsLoading(false)}
          onError={(e) => {
            setIsLoading(false);
            setError("Failed to load stream");
            console.error("Stream Error:", e);
          }}
          onPlay={() => setIsLoading(false)}
          onProviderChange={(provider) => {
            if (isTauri() && isHLSProvider(provider)) {
              provider.config = {
                loader: TauriHlsLoader,
              };
            }
          }}
          src={resolvedUrl ?? ""}
        >
          <MediaProvider className="h-full w-full object-cover" />
        </MediaPlayer>

        {/* Title Overlay */}
        <div
          className={cn(
            "absolute top-0 left-0 z-20 flex items-center gap-2 bg-black/60 p-2 font-medium text-white text-xs transition-opacity duration-200",
            isSelected ? "opacity-100" : "opacity-0 hover:opacity-100"
          )}
        >
          {stream.logo && (
            <img
              alt={stream.title}
              className="h-4 w-4 object-contain"
              height={16}
              src={stream.logo}
              width={16}
            />
          )}
          {stream.title}
        </div>
      </button>

      {/* Mute Button - only show when not in focus mode */}
      {!focusMode && (
        <button
          className="absolute right-4 bottom-4 z-30 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
          onClick={(e) => {
            e.stopPropagation();
            setManualMute(!manualMute);
          }}
          type="button"
        >
          {manualMute ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  );
}
