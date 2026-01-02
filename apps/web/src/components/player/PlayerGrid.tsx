import { Plus, Settings } from "lucide-react";
import { MadeBy } from "@/components/made-by";
import { Kbd } from "@/components/shadcn/kbd";
import { useStore } from "@/store/useStore";
import { StreamPlayer } from "./StreamPlayer";

function EmptyStateDesktop() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-8">
        <span className="text-muted-foreground">Add stream</span>
        <Kbd>+</Kbd>
      </div>
      <div className="flex items-center justify-between gap-8">
        <span className="text-muted-foreground">Settings</span>
        <Kbd>,</Kbd>
      </div>
      <div className="flex items-center justify-between gap-8">
        <span className="text-muted-foreground">Remove stream</span>
        <Kbd>Del</Kbd>
      </div>
    </div>
  );
}

function EmptyStateMobile() {
  const { setModalOpen, setModalView, playlists } = useStore();

  const handleAddStream = () => {
    if (playlists.length === 0) {
      setModalView("welcome");
    } else {
      setModalView("channel-selector");
    }
    setModalOpen(true);
  };

  const handleSettings = () => {
    setModalView("settings");
    setModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <button
        className="flex items-center justify-center gap-3 rounded-xl border border-border bg-card px-6 py-4 text-card-foreground transition-colors active:bg-accent"
        onClick={handleAddStream}
        type="button"
      >
        <Plus className="h-5 w-5" />
        <span>Add stream</span>
      </button>
      <button
        className="flex items-center justify-center gap-3 rounded-xl border border-border bg-card px-6 py-4 text-card-foreground transition-colors active:bg-accent"
        onClick={handleSettings}
        type="button"
      >
        <Settings className="h-5 w-5" />
        <span>Settings</span>
      </button>
    </div>
  );
}

export function PlayerGrid() {
  const { streams, selectedStreamId, selectStream, ui } = useStore();
  const isPortrait = ui.isPortrait;
  const count = streams.length;

  if (count === 0) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-6 px-4">
        <h1 className="font-bold text-5xl text-primary md:text-6xl">Sonar</h1>
        {isPortrait ? <EmptyStateMobile /> : <EmptyStateDesktop />}
        <MadeBy />
      </div>
    );
  }

  // Calculate grid dimensions - single column in portrait mode
  const cols = isPortrait ? 1 : Math.ceil(Math.sqrt(count));
  const rows = isPortrait ? count : Math.ceil(count / cols);
  const totalCells = cols * rows;
  const emptySpaces = totalCells - count;

  return (
    <div
      className="grid h-dvh w-full gap-1 bg-background"
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
      }}
    >
      {streams.map((stream) => (
        <StreamPlayer
          isSelected={stream.id === selectedStreamId}
          key={stream.id}
          onSelect={() => selectStream(stream.id)}
          stream={stream}
        />
      ))}
      {Array.from({ length: emptySpaces }, (_, i) => `empty-${count}-${i}`).map(
        (key) => (
          <div
            className="flex items-center justify-center font-bold text-2xl text-muted"
            key={key}
          >
            Sonar
          </div>
        )
      )}
    </div>
  );
}
