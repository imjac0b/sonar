import { fetch } from "@/lib/fetch";

export interface XtreamAccount {
  url: string;
  username: string;
  password: string;
}

export interface XtreamStream {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  epg_channel_id: string;
  added: string;
  category_id: string;
  custom_sid: string;
  tv_archive: number;
  direct_source: string;
  tv_archive_duration: number;
  container_extension?: string;
}

export interface XtreamCategory {
  category_id: string;
  category_name: string;
  parent_id: number;
}

const TRAILING_SLASH_REGEX = /\/$/;

export class XtreamClient {
  private readonly baseUrl: string;
  private readonly params: URLSearchParams;

  constructor(account: XtreamAccount) {
    this.baseUrl = account.url.replace(TRAILING_SLASH_REGEX, "");
    this.params = new URLSearchParams({
      username: account.username,
      password: account.password,
    });
  }

  private async fetch<T>(
    action: string,
    extraParams: Record<string, string> = {}
  ): Promise<T> {
    const params = new URLSearchParams(this.params);
    params.append("action", action);
    for (const [key, value] of Object.entries(extraParams)) {
      params.append(key, value);
    }

    const response = await fetch(
      `${this.baseUrl}/player_api.php?${params.toString()}`
    );
    if (!response.ok) {
      throw new Error(`Xtream API Error: ${response.statusText}`);
    }
    return response.json() as Promise<T>;
  }

  async authenticate() {
    return await this.fetch<unknown>("get_live_categories"); // Simple check
  }

  async getCategories(): Promise<XtreamCategory[]> {
    return await this.fetch<XtreamCategory[]>("get_live_categories");
  }

  async getStreams(categoryId?: string): Promise<XtreamStream[]> {
    const params: Record<string, string> = {};
    if (categoryId) {
      params.category_id = categoryId;
    }
    return await this.fetch<XtreamStream[]>("get_live_streams", params);
  }

  getStreamUrl(streamId: number, extension = "ts"): string {
    const username = this.params.get("username");
    const password = this.params.get("password");
    return `${this.baseUrl}/live/${username}/${password}/${streamId}.${extension}`;
  }
}
