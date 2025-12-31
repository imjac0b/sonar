import {
  ChevronDown,
  ChevronRight,
  Folder,
  Play,
  Plus,
  Search,
  Settings,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import { parseM3U } from "@/lib/m3u-parser";
import { cn } from "@/lib/utils";
import { type XtreamAccount, XtreamClient } from "@/lib/xtream-client";
import { type Channel, useStore } from "@/store/useStore";

// Minimal UI Components
function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm";
}) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
  const variants = {
    default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
    outline:
      "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
  };
  const sizes = {
    default: "h-9 px-4 py-2",
    sm: "h-8 rounded-md px-3 text-xs",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      type="button"
      {...props}
    />
  );
}

function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

function Label({
  className,
  htmlFor,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      htmlFor={htmlFor}
      {...props}
    >
      {children}
    </label>
  );
}

// --- Sub-Components ---

function WelcomeView({
  onSelect,
}: {
  onSelect: (view: "add-m3u" | "add-xtream") => void;
}) {
  return (
    <div className="grid gap-4 py-4">
      <Button className="h-16 text-lg" onClick={() => onSelect("add-xtream")}>
        Add Xtream Account
      </Button>
      <Button
        className="h-16 text-lg"
        onClick={() => onSelect("add-m3u")}
        variant="outline"
      >
        Upload M3U Playlist
      </Button>
    </div>
  );
}

function AddM3UView({
  onBack,
  onComplete,
}: {
  onBack: () => void;
  onComplete: () => void;
}) {
  const addPlaylist = useStore((state) => state.addPlaylist);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setLoading(true);
    try {
      const text = await file.text();
      const channels = parseM3U(text);
      addPlaylist({
        id: crypto.randomUUID(),
        name: file.name.replace(".m3u", "").replace(".m3u8", ""),
        type: "m3u",
        channels,
      });
      onComplete();
    } catch {
      setError("Failed to parse file");
    } finally {
      setLoading(false);
    }
  };

  const handleUrlSubmit = async () => {
    if (!url) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(url);
      const text = await res.text();
      const channels = parseM3U(text);
      addPlaylist({
        id: crypto.randomUUID(),
        name: url.split("/").pop() || "Remote Playlist",
        type: "m3u",
        channels,
      });
      onComplete();
    } catch {
      setError("Failed to fetch or parse URL");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="m3u-url">Playlist URL</Label>
        <div className="flex gap-2">
          <Input
            id="m3u-url"
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/playlist.m3u"
            value={url}
          />
          <Button disabled={loading} onClick={handleUrlSubmit}>
            Add
          </Button>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or upload file
          </span>
        </div>
      </div>

      <Input
        accept=".m3u,.m3u8"
        aria-label="Upload M3U file"
        disabled={loading}
        onChange={handleFileUpload}
        type="file"
      />

      {error && <p className="text-red-500 text-sm">{error}</p>}
      <Button onClick={onBack} variant="ghost">
        Back
      </Button>
    </div>
  );
}

function AddXtreamView({
  onBack,
  onComplete,
}: {
  onBack: () => void;
  onComplete: () => void;
}) {
  const addPlaylist = useStore((state) => state.addPlaylist);
  const [config, setConfig] = useState<XtreamAccount>({
    url: "",
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const client = new XtreamClient(config);
      await client.authenticate();
      const streams = await client.getStreams();
      const channels: Channel[] = streams.map((s) => ({
        id: s.stream_id.toString(),
        name: s.name,
        url: client.getStreamUrl(
          s.stream_id,
          s.stream_type === "live" ? "ts" : s.container_extension || "ts"
        ),
        group: s.category_id,
        logo: s.stream_icon,
      }));

      addPlaylist({
        id: crypto.randomUUID(),
        name: new URL(config.url).hostname,
        type: "xtream",
        channels,
      });
      onComplete();
    } catch (err) {
      console.error(err);
      setError("Failed to connect or fetch streams");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="xtream-url">Server URL</Label>
        <Input
          id="xtream-url"
          onChange={(e) => setConfig({ ...config, url: e.target.value })}
          placeholder="http://server:port"
          value={config.url}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="xtream-username">Username</Label>
        <Input
          id="xtream-username"
          onChange={(e) => setConfig({ ...config, username: e.target.value })}
          value={config.username}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="xtream-password">Password</Label>
        <Input
          id="xtream-password"
          onChange={(e) => setConfig({ ...config, password: e.target.value })}
          type="password"
          value={config.password}
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex justify-between">
        <Button onClick={onBack} variant="ghost">
          Back
        </Button>
        <Button disabled={loading} onClick={handleSubmit}>
          {loading ? "Connecting..." : "Connect"}
        </Button>
      </div>
    </div>
  );
}

function SettingsView({ onBack }: { onBack: () => void }) {
  const { settings, toggleSetting } = useStore();

  return (
    <div className="grid gap-4 py-4">
      <label className="flex cursor-pointer items-center justify-between space-x-2">
        <span className="flex flex-col space-y-1">
          <span className="font-medium text-sm leading-none">Focus Mode</span>
          <span className="font-normal text-muted-foreground text-xs">
            Only play audio from the selected stream
          </span>
        </span>
        <input
          checked={settings.focusMode}
          className="h-4 w-4"
          onChange={() => toggleSetting("focusMode")}
          type="checkbox"
        />
      </label>

      <div className="flex justify-between border-t pt-4">
        <Button onClick={onBack} variant="ghost">
          Back
        </Button>
      </div>
    </div>
  );
}

function ChannelSelectorView() {
  const { playlists, addStream } = useStore();
  const setModalView = useStore((state) => state.setModalView);
  const [expandedPlaylists, setExpandedPlaylists] = useState<
    Record<string, boolean>
  >({});
  const [search, setSearch] = useState("");

  const toggleExpand = (id: string) => {
    setExpandedPlaylists((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredPlaylists = useMemo(() => {
    if (!search) {
      return playlists;
    }
    const lowerSearch = search.toLowerCase();

    return playlists
      .map((p) => ({
        ...p,
        channels: p.channels.filter((c) =>
          c.name.toLowerCase().includes(lowerSearch)
        ),
      }))
      .filter((p) => p.channels.length > 0);
  }, [playlists, search]);

  if (playlists.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="mb-4 text-muted-foreground">No playlists added</p>
        <Button onClick={() => setModalView("welcome")}>Add Playlist</Button>
      </div>
    );
  }

  return (
    <div className="flex h-[60vh] flex-col gap-4">
      <div className="relative">
        <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
        <Input
          aria-label="Search channels"
          autoFocus
          className="pl-8"
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
          }}
          placeholder="Search channels..."
          value={search}
        />
      </div>
      <div className="flex-1 overflow-auto rounded-md border p-2">
        {filteredPlaylists.map((playlist) => (
          <div className="mb-2" key={playlist.id}>
            <button
              className="flex w-full items-center gap-2 rounded-md p-2 text-left font-semibold hover:bg-accent"
              onClick={() => toggleExpand(playlist.id)}
              type="button"
            >
              {expandedPlaylists[playlist.id] || search ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <Folder className="mr-2 h-4 w-4" />
              {playlist.name}
              <span className="ml-auto text-muted-foreground text-xs">
                {playlist.channels.length} channels
              </span>
            </button>

            {(expandedPlaylists[playlist.id] || search) && (
              <div className="mt-1 ml-6 space-y-1">
                {playlist.channels.map((channel) => (
                  <button
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                    key={channel.id}
                    onClick={() => addStream(channel)}
                    type="button"
                  >
                    <Play className="h-3 w-3" />
                    <span className="truncate">{channel.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between border-t pt-2">
        <Button
          onClick={() => setModalView("welcome")}
          size="sm"
          variant="ghost"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Another Playlist
        </Button>
        <Button
          onClick={() => setModalView("settings")}
          size="sm"
          variant="ghost"
        >
          <Settings className="mr-2 h-4 w-4" /> Settings
        </Button>
      </div>
    </div>
  );
}

// --- Main Modal Component ---

export function ControlModal() {
  const { isModalOpen, modalView } = useStore((state) => state.ui);
  const setModalOpen = useStore((state) => state.setModalOpen);
  const setModalView = useStore((state) => state.setModalView);

  const handleOpenChange = (open: boolean) => {
    setModalOpen(open);
  };

  const getTitle = () => {
    switch (modalView) {
      case "welcome":
        return "Welcome to Sonar";
      case "add-m3u":
        return "Add M3U Playlist";
      case "add-xtream":
        return "Add Xtream Account";
      case "channel-selector":
        return "Select Channel";
      case "settings":
        return "Settings";
      default:
        return "Sonar";
    }
  };

  return (
    <Credenza onOpenChange={handleOpenChange} open={isModalOpen}>
      <CredenzaContent className="sm:max-w-[500px]">
        <CredenzaHeader>
          <CredenzaTitle>{getTitle()}</CredenzaTitle>
          {modalView === "welcome" && (
            <CredenzaDescription>
              Get started by adding a stream source.
            </CredenzaDescription>
          )}
        </CredenzaHeader>

        <CredenzaBody>
          {modalView === "welcome" && <WelcomeView onSelect={setModalView} />}
          {modalView === "add-m3u" && (
            <AddM3UView
              onBack={() => setModalView("welcome")}
              onComplete={() => setModalView("channel-selector")}
            />
          )}
          {modalView === "add-xtream" && (
            <AddXtreamView
              onBack={() => setModalView("welcome")}
              onComplete={() => setModalView("channel-selector")}
            />
          )}
          {modalView === "settings" && (
            <SettingsView onBack={() => setModalView("channel-selector")} />
          )}
          {modalView === "channel-selector" && <ChannelSelectorView />}
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
}
