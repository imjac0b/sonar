import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Plus,
  Settings,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/useStore";

const HIDE_DELAY = 3000;

export function MobileControls() {
  const {
    streams,
    selectedStreamId,
    selectStream,
    removeStream,
    setModalOpen,
    setModalView,
    playlists,
    ui,
  } = useStore();

  const [visible, setVisible] = useState(true);
  const isPortrait = ui.isPortrait;
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentIndex = streams.findIndex((s) => s.id === selectedStreamId);
  const hasStreams = streams.length > 0;

  const resetHideTimer = useCallback(() => {
    setVisible(true);
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    hideTimeoutRef.current = setTimeout(() => {
      setVisible(false);
    }, HIDE_DELAY);
  }, []);

  // Show controls on any touch/interaction
  useEffect(() => {
    const handleInteraction = () => resetHideTimer();

    window.addEventListener("touchstart", handleInteraction);
    window.addEventListener("click", handleInteraction);

    // Initial timer
    resetHideTimer();

    return () => {
      window.removeEventListener("touchstart", handleInteraction);
      window.removeEventListener("click", handleInteraction);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [resetHideTimer]);

  // Keep visible when modal is open
  useEffect(() => {
    if (ui.isModalOpen) {
      setVisible(true);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    } else {
      resetHideTimer();
    }
  }, [ui.isModalOpen, resetHideTimer]);

  const navigateStream = (direction: "left" | "right") => {
    if (streams.length === 0) {
      return;
    }

    if (currentIndex === -1) {
      selectStream(streams[0].id);
      return;
    }

    let newIndex = currentIndex;
    switch (direction) {
      case "left":
        newIndex = currentIndex - 1;
        break;
      case "right":
        newIndex = currentIndex + 1;
        break;
      default:
        break;
    }

    if (newIndex >= 0 && newIndex < streams.length) {
      selectStream(streams[newIndex].id);
    }
  };

  const handleAddStream = () => {
    if (playlists.length === 0) {
      setModalView("welcome");
    } else {
      setModalView("channel-selector");
    }
    setModalOpen(true);
  };

  const handleRemoveStream = () => {
    if (selectedStreamId) {
      removeStream(selectedStreamId);
    }
  };

  const handleSettings = () => {
    setModalView("settings");
    setModalOpen(true);
  };

  return (
    <div
      className={cn(
        "fixed right-0 bottom-0 left-0 z-50 flex items-center justify-center gap-2 px-4 pt-12 pb-8 transition-opacity duration-300",
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      <div className="flex items-center gap-1.5 rounded-full border border-white/5 bg-black/30 p-1.5 backdrop-blur-md">
        {/* Settings */}
        <button
          aria-label="Settings"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors active:bg-white/20"
          onClick={handleSettings}
          type="button"
        >
          <Settings className="h-5 w-5" />
        </button>

        {/* Navigate Previous */}
        <button
          aria-label="Previous stream"
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full text-white transition-colors",
            hasStreams && currentIndex > 0
              ? "bg-white/10 active:bg-white/20"
              : "bg-white/5 text-white/30"
          )}
          disabled={!hasStreams || currentIndex <= 0}
          onClick={() => navigateStream("left")}
          type="button"
        >
          {isPortrait ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>

        {/* Add Stream (Primary) */}
        <button
          aria-label="Add stream"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
          onClick={handleAddStream}
          type="button"
        >
          <Plus className="h-5 w-5" />
        </button>

        {/* Navigate Next */}
        <button
          aria-label="Next stream"
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full text-white transition-colors",
            hasStreams && currentIndex < streams.length - 1
              ? "bg-white/10 active:bg-white/20"
              : "bg-white/5 text-white/30"
          )}
          disabled={!hasStreams || currentIndex >= streams.length - 1}
          onClick={() => navigateStream("right")}
          type="button"
        >
          {isPortrait ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </button>

        {/* Remove Stream */}
        <button
          aria-label="Remove stream"
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full text-white transition-colors",
            selectedStreamId
              ? "bg-white/10 active:bg-destructive"
              : "bg-white/5 text-white/30"
          )}
          disabled={!selectedStreamId}
          onClick={handleRemoveStream}
          type="button"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
