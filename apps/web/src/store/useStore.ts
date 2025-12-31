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

interface Settings {
  focusMode: boolean; // Mute others when selected
}

interface UIState {
  isModalOpen: boolean;
  modalView:
    | "welcome"
    | "add-m3u"
    | "add-xtream"
    | "channel-selector"
    | "settings";
}

interface AppState {
  playlists: Playlist[];
  streams: Stream[];
  selectedStreamId: string | null;
  ui: UIState;
  settings: Settings;

  // Actions
  addPlaylist: (playlist: Playlist) => void;
  removePlaylist: (id: string) => void;
  addStream: (channel: Channel) => void;
  removeStream: (id: string) => void;
  selectStream: (id: string | null) => void;
  setModalOpen: (isOpen: boolean) => void;
  setModalView: (view: UIState["modalView"]) => void;
  toggleSetting: (key: keyof Settings) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      playlists: [],
      streams: [],
      selectedStreamId: null,
      settings: {
        focusMode: false,
      },
      ui: {
        isModalOpen: true,
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
            selectedStreamId: newStream.id,
            ui: { ...state.ui, isModalOpen: false },
          };
        }),

      removeStream: (id) =>
        set((state) => {
          const newStreams = state.streams.filter((s) => s.id !== id);
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

      toggleSetting: (key) =>
        set((state) => ({
          settings: { ...state.settings, [key]: !state.settings[key] },
        })),
    }),
    {
      name: "sonar-storage",
      partialize: (state) => ({
        playlists: state.playlists,
        streams: state.streams,
        selectedStreamId: state.selectedStreamId,
        settings: state.settings,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.streams.length > 0) {
          state.setModalOpen(false);
        }
      },
    }
  )
);
