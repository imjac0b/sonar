import { MadeBy } from "@/components/made-by";
import { Kbd } from "@/components/shadcn/kbd";
import { useStore } from "@/store/useStore";
import { StreamPlayer } from "./StreamPlayer";

export function PlayerGrid() {
  const { streams, selectedStreamId, selectStream } = useStore();
  const count = streams.length;

  if (count === 0) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-background">
        <h1 className="font-bold text-6xl">Sonar</h1>
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
        <MadeBy />
      </div>
    );
  }

  // Calculate grid dimensions
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);

  return (
    <div
      className="grid h-screen w-full gap-1 bg-background"
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
    </div>
  );
}
