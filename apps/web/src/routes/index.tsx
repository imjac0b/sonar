import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { MobileControls } from "@/components/MobileControls";
import { BrowserSupportModal } from "@/components/modals/BrowserSupportModal";
import { ControlModal } from "@/components/modals/ControlModal";
import { PlayerGrid } from "@/components/player/PlayerGrid";
import { useStore } from "@/store/useStore";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function calculateNewIndex(
  currentIndex: number,
  count: number,
  key: string
): number {
  // Use portrait mode from store (kept in sync via resize listener)
  const { isPortrait } = useStore.getState().ui;
  const cols = isPortrait ? 1 : Math.ceil(Math.sqrt(count));

  switch (key) {
    case "ArrowRight":
      return currentIndex + 1;
    case "ArrowLeft":
      return currentIndex - 1;
    case "ArrowDown":
      return currentIndex + cols;
    case "ArrowUp":
      return currentIndex - cols;
    default:
      return currentIndex;
  }
}

function handleNavigation(e: KeyboardEvent) {
  const state = useStore.getState();
  const { streams, selectedStreamId, selectStream, ui } = state;

  if (ui.isModalOpen || streams.length === 0) {
    return;
  }

  const currentIndex = streams.findIndex((s) => s.id === selectedStreamId);

  // Select first if nothing selected
  if (currentIndex === -1) {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      selectStream(streams[0].id);
    }
    return;
  }

  const newIndex = calculateNewIndex(currentIndex, streams.length, e.key);

  if (newIndex >= 0 && newIndex < streams.length && newIndex !== currentIndex) {
    selectStream(streams[newIndex].id);
  }
}

function handleGlobalKeys(e: KeyboardEvent) {
  const activeTag = document.activeElement?.tagName;
  if (activeTag === "INPUT" || activeTag === "TEXTAREA") {
    return;
  }

  const state = useStore.getState();
  const {
    selectedStreamId,
    removeStream,
    setModalOpen,
    setModalView,
    playlists,
  } = state;

  if (e.key === "+" || e.key === "=") {
    e.preventDefault();
    if (playlists.length === 0) {
      setModalView("welcome");
    } else {
      setModalView("channel-selector");
    }
    setModalOpen(true);
    return;
  }

  if (e.key === ",") {
    e.preventDefault();
    setModalView("settings");
    setModalOpen(true);
    return;
  }

  if (
    e.key === "-" ||
    e.key === "_" ||
    e.key === "Delete" ||
    e.key === "Backspace"
  ) {
    if (selectedStreamId) {
      removeStream(selectedStreamId);
    }
    return;
  }

  handleNavigation(e);
}

function HomeComponent() {
  const setPortrait = useStore((state) => state.setPortrait);

  // Keep portrait state in sync with window size
  useEffect(() => {
    const updatePortrait = () => {
      setPortrait(window.innerHeight > window.innerWidth);
    };

    updatePortrait();
    window.addEventListener("resize", updatePortrait);
    window.addEventListener("orientationchange", updatePortrait);

    return () => {
      window.removeEventListener("resize", updatePortrait);
      window.removeEventListener("orientationchange", updatePortrait);
    };
  }, [setPortrait]);

  useEffect(() => {
    window.addEventListener("keydown", handleGlobalKeys);
    return () => window.removeEventListener("keydown", handleGlobalKeys);
  }, []);

  return (
    <>
      <PlayerGrid />
      <MobileControls />
      <ControlModal />
      <BrowserSupportModal />
    </>
  );
}
