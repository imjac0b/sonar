import { isTauri } from "@tauri-apps/api/core";
import { LazyStore } from "@tauri-apps/plugin-store";
import { create } from "zustand";
import {
  createJSONStorage,
  type PersistStorage,
  persist,
  type StorageValue,
} from "zustand/middleware";

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
  type: "m3u" | "xtream" | "kick";
  channels: Channel[];
}

export interface Stream {
  id: string;
  channelId: string;
  url: string;
  title: string;
  logo?: string;
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
    | "add-kick"
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
  addChannelToPlaylist: (playlistId: string, channel: Channel) => void;
  removeChannelFromPlaylist: (playlistId: string, channelId: string) => void;
  renamePlaylist: (id: string, name: string) => void;
  removePlaylist: (id: string) => void;
  addStream: (channel: Channel) => Promise<void>;
  removeStream: (id: string) => void;
  selectStream: (id: string | null) => void;
  setModalOpen: (isOpen: boolean) => void;
  setModalView: (view: UIState["modalView"]) => void;
  toggleSetting: (key: keyof Settings) => void;
}

type PersistedState = Pick<
  AppState,
  "playlists" | "streams" | "selectedStreamId" | "settings"
>;

const getTauriStore = () => new LazyStore("store.json");

const tauriStorage: PersistStorage<PersistedState> = {
  getItem: async (name) => {
    const store = getTauriStore();
    return (await store.get<StorageValue<PersistedState>>(name)) || null;
  },
  setItem: async (name, value) => {
    const store = getTauriStore();
    await store.set(name, value);
    await store.save();
  },
  removeItem: async (name) => {
    const store = getTauriStore();
    await store.delete(name);
    await store.save();
  },
};

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

      addChannelToPlaylist: (playlistId, channel) =>
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === playlistId
              ? { ...p, channels: [...p.channels, channel] }
              : p
          ),
        })),

      removeChannelFromPlaylist: (playlistId, channelId) =>
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === playlistId
              ? {
                  ...p,
                  channels: p.channels.filter((c) => c.id !== channelId),
                }
              : p
          ),
        })),

      renamePlaylist: (id, name) =>
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === id ? { ...p, name } : p
          ),
        })),

      removePlaylist: (id) =>
        set((state) => ({
          playlists: state.playlists.filter((p) => p.id !== id),
        })),

      addStream: async (channel) => {
        let streamUrl = channel.url;
        let isKick = channel.url.startsWith("kick:");
        let kickChannelName = "";

        if (isKick) {
          kickChannelName = channel.url.replace("kick:", "");
        } else if (channel.group === "Kick") {
          // Legacy support
          isKick = true;
          kickChannelName = channel.name;
        }

        // Handle Kick streams
        if (isKick) {
          try {
            const res = await fetch(
              `https://kick.com/api/v2/channels/${kickChannelName}/playback-url`
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
            streamUrl = urlObj.toString();
          } catch (error) {
            console.error("Failed to resolve Kick URL:", error);
            // If we fail here, the stream won't be added properly or will rely on old logic if not returned
            // But we should probably return here to avoid adding a broken stream
            return;
          }
        }

        set((state) => {
          const newStream: Stream = {
            id: crypto.randomUUID(),
            channelId: channel.id,
            url: streamUrl,
            title: channel.name,
            logo: channel.logo,
            status: "playing",
          };
          return {
            streams: [...state.streams, newStream],
            selectedStreamId: newStream.id,
            ui: { ...state.ui, isModalOpen: false },
          };
        });
      },

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
      storage: isTauri()
        ? tauriStorage
        : createJSONStorage<PersistedState>(() => localStorage),
      partialize: (state) => ({
        playlists: state.playlists,
        streams: state.streams,
        selectedStreamId: state.selectedStreamId,
        settings: state.settings,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && (state.streams.length > 0 || state.playlists.length > 0)) {
          state.setModalOpen(false);
        }
      },
    }
  )
);
