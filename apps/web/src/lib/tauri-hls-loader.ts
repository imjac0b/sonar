import { fetch } from "@tauri-apps/plugin-http";
import type {
  HlsConfig,
  Loader,
  LoaderCallbacks,
  LoaderConfiguration,
  LoaderContext,
  LoaderStats,
} from "hls.js";

export class TauriHlsLoader implements Loader<LoaderContext> {
  context!: LoaderContext;
  config!: LoaderConfiguration;
  stats: LoaderStats;
  callbacks!: LoaderCallbacks<LoaderContext>;
  abortController: AbortController | null = null;

  constructor(config: HlsConfig) {
    this.config = config as unknown as LoaderConfiguration;
    this.stats = {
      aborted: false,
      loaded: 0,
      retry: 0,
      total: 0,
      chunkCount: 0,
      bwEstimate: 0,
      loading: { start: 0, first: 0, end: 0 },
      parsing: { start: 0, end: 0 },
      buffering: { start: 0, first: 0, end: 0 },
    };
  }

  destroy(): void {
    this.abort();
    // @ts-expect-error
    this.callbacks = null;
    // @ts-expect-error
    this.config = null;
    // @ts-expect-error
    this.context = null;
    // @ts-expect-error
    this.stats = null;
  }

  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.stats.aborted = true;
  }

  load(
    context: LoaderContext,
    config: LoaderConfiguration,
    callbacks: LoaderCallbacks<LoaderContext>
  ): void {
    this.context = context;
    this.config = config;
    this.callbacks = callbacks;
    this.stats.loading.start = performance.now();
    this.stats.retry = 0;

    this.abortController = new AbortController();

    this.loadInternal();
  }

  async loadInternal(): Promise<void> {
    try {
      const response = await fetch(this.context.url, {
        method: "GET",
        signal: this.abortController?.signal,
        headers:
          this.context.responseType === "arraybuffer" ? {} : { Accept: "*/*" },
      });

      if (!response.ok) {
        this.callbacks.onError(
          {
            code: response.status,
            text: response.statusText,
          },
          this.context,
          response,
          this.stats
        );
        return;
      }

      this.stats.loading.first = performance.now();

      let data: ArrayBuffer | string;
      if (this.context.responseType === "arraybuffer") {
        data = await response.arrayBuffer();
        this.stats.loaded = data.byteLength;
        this.stats.total = data.byteLength;
      } else {
        data = await response.text();
        this.stats.loaded = data.length;
        this.stats.total = data.length;
      }

      this.stats.loading.end = performance.now();

      // Calculate bandwidth estimate (bits per second)
      const duration = this.stats.loading.end - this.stats.loading.first;
      if (duration > 0) {
        this.stats.bwEstimate = (this.stats.loaded * 8) / (duration / 1000);
      }

      this.callbacks.onSuccess(
        {
          url: response.url,
          data,
        },
        this.stats,
        this.context,
        response
      );
      // biome-ignore lint/suspicious/noExplicitAny: needed for tauri check
    } catch (error: any) {
      if (this.stats.aborted) {
        return;
      }
      this.callbacks.onError(
        { code: 0, text: error.message },
        this.context,
        error,
        this.stats
      );
    }
  }
}
