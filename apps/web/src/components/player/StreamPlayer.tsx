import { Loader2 } from "lucide-react";
import { useState } from "react";
import ReactPlayer from "react-player";
import { cn } from "@/lib/utils";
import type { Stream } from "@/store/useStore";

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

  console.log(stream);

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden border-4 bg-black outline-none transition-colors duration-200",
        isSelected ? "border-primary" : "border-transparent"
      )}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onSelect();
        }
      }}
      role="button"
      tabIndex={0}
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
          file: {
            forceHLS: true,
          } as any,
        }}
        controls={false}
        height="100%"
        onBuffer={() => setIsLoading(true)}
        onBufferEnd={() => setIsLoading(false)}
        onError={(e) => {
          setIsLoading(false);
          setError("Failed to load stream");
          console.error("Stream Error:", e);
        }}
        onReady={() => setIsLoading(false)}
        playing
        src={stream.url}
        width="100%"
      />

      {/* Title Overlay */}
      <div
        className={cn(
          "absolute top-0 left-0 bg-black/60 p-2 font-medium text-white text-xs transition-opacity duration-200",
          isSelected ? "opacity-100" : "opacity-0 hover:opacity-100"
        )}
      >
        {stream.title}
      </div>
    </div>
  );
}
