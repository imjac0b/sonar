import { useQuery } from "@tanstack/react-query";
import { isTauri } from "@tauri-apps/api/core";
import {
  isHLSProvider,
  MediaPlayer,
  MediaProvider,
  type MediaProviderAdapter,
} from "@vidstack/react";
import { Loader2, Tv, Volume2, VolumeX } from "lucide-react";
import { type SyntheticEvent, useState } from "react";
import { fetch } from "@/lib/fetch";
import { TauriHlsLoader } from "@/lib/tauri-hls-loader";
import { cn, proxyImageUrl } from "@/lib/utils";
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

function LoadingOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
      <Loader2 className="h-8 w-8 animate-spin text-white" />
    </div>
  );
}

function ErrorOverlay({ error }: { error: string }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black">
      <div className="text-center text-red-500">
        <p className="font-bold">Error</p>
        <p className="text-sm">{error}</p>
      </div>
    </div>
  );
}

function ChannelIcon({
  logo,
  title,
  proxyImages,
}: {
  logo: string | undefined;
  title: string;
  proxyImages: boolean;
}) {
  const [hasError, setHasError] = useState(false);
  let logoSrc: string | undefined;
  if (logo) {
    logoSrc = proxyImages ? proxyImageUrl(logo) : logo;
  }

  const handleError = (e: SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.display = "none";
    setHasError(true);
  };

  if (!logoSrc || hasError) {
    return <Tv className="h-4 w-4 shrink-0 text-muted-foreground" />;
  }

  return (
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: onError is for image loading failures
    <img
      alt={title}
      className="h-4 w-4 object-contain"
      height={16}
      onError={handleError}
      src={logoSrc}
      width={16}
    />
  );
}

function TitleOverlay({
  stream,
  isVisible,
  proxyImages,
}: {
  stream: Stream;
  isVisible: boolean;
  proxyImages: boolean;
}) {
  return (
    <div
      className={cn(
        "absolute top-0 left-0 z-20 flex items-center gap-2 rounded-br-lg bg-black/60 p-2 font-medium text-white text-xs transition-opacity duration-200",
        isVisible ? "opacity-100" : "opacity-0 hover:opacity-100"
      )}
    >
      <ChannelIcon
        logo={stream.logo}
        proxyImages={proxyImages}
        title={stream.title}
      />
      {stream.title}
    </div>
  );
}

function MuteButton({
  isMuted,
  onToggle,
}: {
  isMuted: boolean;
  onToggle: () => void;
}) {
  const Icon = isMuted ? VolumeX : Volume2;

  return (
    <button
      className="absolute right-4 bottom-4 z-30 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      type="button"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function handleProviderChange(provider: MediaProviderAdapter | null) {
  if (isHLSProvider(provider)) {
    provider.library = () => import("hls.js");
    if (isTauri()) {
      provider.config = { loader: TauriHlsLoader };
    }
  }
}

function extractErrorMessage(e: unknown): string {
  if (e instanceof Error) {
    return e.message;
  }
  if (typeof e === "string") {
    return e;
  }
  if (e && typeof e === "object") {
    const obj = e as Record<string, unknown>;
    // Handle vidstack MediaErrorEvent which has detail.message
    if (obj.detail && typeof obj.detail === "object") {
      const detail = obj.detail as Record<string, unknown>;
      if (typeof detail.message === "string") {
        return detail.message;
      }
    }
    if (typeof obj.message === "string") {
      return obj.message;
    }
  }
  return "Failed to load stream";
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
  const proxyImages = useStore((state) => state.settings.proxyImages);
  const alwaysShowTitle = useStore((state) => state.settings.alwaysShowTitle);
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
    staleTime: 1000 * 60 * 30,
    retry: 2,
  });

  const streamUrl = isKickStream ? resolvedUrl : stream.url;
  const isLoading = isKickStream
    ? isUrlLoading || playerLoading
    : playerLoading;
  const error = urlError
    ? (urlError as Error).message || "Failed to load Kick stream"
    : playerError;
  const isMuted = !isAudioEnabled || (focusMode ? !isSelected : manualMute);
  const isTitleVisible = isSelected || alwaysShowTitle;

  const handleError = (e: unknown) => {
    setPlayerLoading(false);
    setPlayerError(extractErrorMessage(e));
    console.error("Stream Error:", e);
  };

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
        {isLoading && <LoadingOverlay />}
        {error && <ErrorOverlay error={error} />}

        <MediaPlayer
          autoPlay
          className="h-full w-full"
          controls={false}
          muted={isMuted}
          onCanPlay={() => setPlayerLoading(false)}
          onError={handleError}
          onPlay={() => setPlayerLoading(false)}
          onProviderChange={handleProviderChange}
          playsInline
          src={streamUrl ?? ""}
        >
          <MediaProvider className="h-full w-full object-cover" />
        </MediaPlayer>

        <TitleOverlay
          isVisible={isTitleVisible}
          proxyImages={proxyImages}
          stream={stream}
        />
      </button>

      {!focusMode && (
        <MuteButton
          isMuted={manualMute}
          onToggle={() => setManualMute(!manualMute)}
        />
      )}
    </div>
  );
}
