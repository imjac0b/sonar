import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Channel {
  id: string;
  name: string;
  url: string;
  group?: string;
  logo?: string;
}

export interface Playlist {
  id: string;
  name: string;
  type: "m3u" | "xtream";
  channels: Channel[];
}

export interface Stream {
  id: string;
  channelId: string;
  url: string;
  title: string;
  status: "playing" | "error" | "buffering";
}

interface UIState {
  isModalOpen: boolean;
  modalView: "welcome" | "add-m3u" | "add-xtream" | "channel-selector";
}

interface AppState {
  playlists: Playlist[];
  streams: Stream[];
  selectedStreamId: string | null;
  ui: UIState;

  // Actions
  addPlaylist: (playlist: Playlist) => void;
  removePlaylist: (id: string) => void;
  addStream: (channel: Channel) => void;
  removeStream: (id: string) => void;
  selectStream: (id: string | null) => void;
  setModalOpen: (isOpen: boolean) => void;
  setModalView: (view: UIState["modalView"]) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      playlists: [],
      streams: [],
      selectedStreamId: null,
      ui: {
        isModalOpen: true, // Initially true, but updated on hydration
        modalView: "welcome",
      },

      addPlaylist: (playlist) =>
        set((state) => ({ playlists: [...state.playlists, playlist] })),

      removePlaylist: (id) =>
        set((state) => ({
          playlists: state.playlists.filter((p) => p.id !== id),
        })),

      addStream: (channel) =>
        set((state) => {
          const newStream: Stream = {
            id: crypto.randomUUID(),
            channelId: channel.id,
            url: channel.url,
            title: channel.name,
            status: "playing",
          };
          return {
            streams: [...state.streams, newStream],
            selectedStreamId: newStream.id, // Auto-select new stream
            ui: { ...state.ui, isModalOpen: false }, // Close modal on selection
          };
        }),

      removeStream: (id) =>
        set((state) => {
          const newStreams = state.streams.filter((s) => s.id !== id);
          // Select adjacent stream if removed one was selected
          let newSelectedId = state.selectedStreamId;
          if (state.selectedStreamId === id) {
            newSelectedId =
              newStreams.length > 0 ? (newStreams.at(-1)?.id ?? null) : null;
          }
          return {
            streams: newStreams,
            selectedStreamId: newSelectedId,
          };
        }),

      selectStream: (id) => set({ selectedStreamId: id }),

      setModalOpen: (isOpen) =>
        set((state) => ({ ui: { ...state.ui, isModalOpen: isOpen } })),

      setModalView: (view) =>
        set((state) => ({ ui: { ...state.ui, modalView: view } })),
    }),
    {
      name: "sonar-storage",
      partialize: (state) => ({
        playlists: state.playlists,
        streams: state.streams,
        selectedStreamId: state.selectedStreamId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.streams.length > 0) {
          state.setModalOpen(false);
        }
      },
    }
  )
);
