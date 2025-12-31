export interface M3UChannel {
  id: string;
  name: string;
  url: string;
  group?: string;
  logo?: string;
  tvgId?: string;
}

function parseAttributes(info: string) {
  const getAttribute = (attr: string) => {
    const match = info.match(new RegExp(`${attr}="([^"]*)"`));
    return match ? match[1] : undefined;
  };
  return {
    group: getAttribute("group-title"),
    logo: getAttribute("tvg-logo"),
    tvgId: getAttribute("tvg-id"),
  };
}

function processMetadataLine(
  line: string,
  currentChannel: Partial<M3UChannel>
): Partial<M3UChannel> {
  const info = line.substring(8);
  const commaIndex = info.lastIndexOf(",");

  const displayName =
    commaIndex !== -1 ? info.substring(commaIndex + 1).trim() : "";
  const metadata = commaIndex !== -1 ? info.substring(0, commaIndex) : info;

  const attrs = parseAttributes(metadata);

  return {
    ...currentChannel,
    name: displayName,
    ...attrs,
  };
}

export function parseM3U(content: string): M3UChannel[] {
  const lines = content.split("\n");
  const channels: M3UChannel[] = [];
  let currentChannel: Partial<M3UChannel> = {};

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      continue;
    }

    if (trimmedLine.startsWith("#EXTINF:")) {
      currentChannel = processMetadataLine(trimmedLine, currentChannel);
    } else if (
      !trimmedLine.startsWith("#") &&
      (currentChannel.name || currentChannel.group)
    ) {
      channels.push({
        id: crypto.randomUUID(),
        name: currentChannel.name || "Unknown Channel",
        url: trimmedLine,
        group: currentChannel.group,
        logo: currentChannel.logo,
        tvgId: currentChannel.tvgId,
      });
      currentChannel = {};
    }
  }

  return channels;
}
