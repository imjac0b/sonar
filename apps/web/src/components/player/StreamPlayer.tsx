import { isTauri } from "@tauri-apps/api/core";
import { Loader2, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import ReactPlayer from "react-player";
import { TauriHlsLoader } from "@/lib/tauri-hls-loader";
import { cn } from "@/lib/utils";
import { type Stream, useStore } from "@/store/useStore";

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
  const focusMode = useStore((state) => state.settings.focusMode);

  // In focus mode, mute all streams except selected
  // Otherwise use manual mute state
  const isMuted = focusMode ? !isSelected : manualMute;

  console.log("isTauri", isTauri());

  return (
    <div className="relative h-full w-full">
      <button
        className={cn(
          "relative block h-full w-full overflow-hidden border-4 bg-black p-0 outline-none transition-colors duration-200",
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

        <ReactPlayer
          config={{
            hls: {
              loader: TauriHlsLoader,
            },
          }}
          controls={false}
          height="100%"
          muted={isMuted}
          onError={(e) => {
            setIsLoading(false);
            setError("Failed to load stream");
            console.error("Stream Error:", e);
          }}
          onReady={() => setIsLoading(false)}
          onStart={() => setIsLoading(false)}
          playing
          src={stream.url}
          width="100%"
        />

        {/* Title Overlay */}
        <div
          className={cn(
            "absolute top-0 left-0 flex items-center gap-2 bg-black/60 p-2 font-medium text-white text-xs transition-opacity duration-200",
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
