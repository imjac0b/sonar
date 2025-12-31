import { useStore } from "@/store/useStore";
import { StreamPlayer } from "./StreamPlayer";

export function PlayerGrid() {
  const { streams, selectedStreamId, selectStream } = useStore();
  const count = streams.length;

  if (count === 0) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-muted-foreground">
        <p>Press '+' to add a stream</p>
      </div>
    );
  }

  // Calculate grid dimensions
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);

  return (
    <div
      className="grid h-screen w-full gap-1 bg-black p-1"
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
