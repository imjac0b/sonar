import { useQuery } from "@tanstack/react-query";
import { isTauri } from "@tauri-apps/api/core";
import { isHLSProvider, MediaPlayer, MediaProvider } from "@vidstack/react";
import { Loader2, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import { fetch } from "@/lib/fetch";
import { TauriHlsLoader } from "@/lib/tauri-hls-loader";
import { cn } from "@/lib/utils";
import { type Stream, useStore } from "@/store/useStore";
import "@vidstack/react/player/styles/base.css";

async function resolveKickUrl(channelName: string): Promise<string> {
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
  return urlObj.toString();
}

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
  const [manualMute, setManualMute] = useState(false);
  const [playerLoading, setPlayerLoading] = useState(true);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const focusMode = useStore((state) => state.settings.focusMode);
  const isAudioEnabled = useStore((state) => state.isAudioEnabled);

  const isKickStream = stream.url.startsWith("kick:");
  const channelName = isKickStream ? stream.url.replace("kick:", "") : "";

  const {
    data: resolvedUrl,
    isLoading: isUrlLoading,
    error: urlError,
  } = useQuery({
    queryKey: ["kick-stream-url", channelName],
    queryFn: () => resolveKickUrl(channelName),
    enabled: isKickStream,
    staleTime: 1000 * 60 * 30, // 30 minutes - Kick URLs are valid for a while
    retry: 2,
  });

  // For non-Kick streams, use the URL directly
  const streamUrl = isKickStream ? resolvedUrl : stream.url;
  const isLoading = isKickStream
    ? isUrlLoading || playerLoading
    : playerLoading;
  const error = urlError ? "Failed to load Kick stream" : playerError;

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
          onCanPlay={() => setPlayerLoading(false)}
          onError={(e) => {
            setPlayerLoading(false);
            setPlayerError("Failed to load stream");
            console.error("Stream Error:", e);
          }}
          onPlay={() => setPlayerLoading(false)}
          onProviderChange={(provider) => {
            if (isHLSProvider(provider)) {
              provider.library = () => import("hls.js");

              if (isTauri()) {
                provider.config = {
                  loader: TauriHlsLoader,
                };
              }
            }
          }}
          src={streamUrl ?? ""}
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
