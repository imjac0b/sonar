import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isTauri } from "@tauri-apps/api/core";
import { relaunch } from "@tauri-apps/plugin-process";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { useState } from "react";
import { Button } from "@/components/shadcn/button";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";

interface UpdateContentProps {
  update: Update;
  downloadProgress: number;
  isDownloading: boolean;
  isReady: boolean;
  hasError: boolean;
  errorMessage: string;
  onDownload: () => void;
  onDismiss: () => void;
}

function UpdateContent({
  update,
  downloadProgress,
  isDownloading,
  isReady,
  hasError,
  errorMessage,
  onDownload,
  onDismiss,
}: UpdateContentProps) {
  const handleRelaunch = async () => {
    await relaunch();
  };

  return (
    <CredenzaContent className="sm:max-w-[425px]">
      <CredenzaHeader>
        <CredenzaTitle>
          {isReady ? "Update Ready" : "Update Available"}
        </CredenzaTitle>
        <CredenzaDescription>
          {!(isDownloading || isReady || hasError) && (
            <>
              A new version of Sonar is available:{" "}
              <span className="font-semibold text-foreground">
                v{update.version}
              </span>
            </>
          )}
          {isDownloading && "Downloading update..."}
          {isReady &&
            "The update has been installed. Restart to apply changes."}
          {hasError && `Error: ${errorMessage}`}
        </CredenzaDescription>
      </CredenzaHeader>

      <CredenzaBody className="flex flex-col gap-4 py-4">
        {isDownloading && (
          <div className="space-y-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
            <p className="text-center text-muted-foreground text-sm">
              {downloadProgress}% complete
            </p>
          </div>
        )}

        {!(isDownloading || isReady || hasError) && (
          <p className="text-muted-foreground text-sm">
            Would you like to download and install this update now?
          </p>
        )}

        {isReady && (
          <p className="text-muted-foreground text-sm">
            Click the button below to restart Sonar and enjoy the latest
            features.
          </p>
        )}
      </CredenzaBody>

      <CredenzaFooter className="flex flex-col gap-2 sm:flex-col sm:space-x-0">
        {!(isDownloading || isReady || hasError) && (
          <>
            <Button className="w-full" onClick={onDownload}>
              Download & Install
            </Button>
            <Button className="w-full" onClick={onDismiss} variant="outline">
              Later
            </Button>
          </>
        )}

        {isDownloading && (
          <Button className="w-full" disabled>
            Downloading...
          </Button>
        )}

        {isReady && (
          <Button className="w-full" onClick={handleRelaunch}>
            Restart Now
          </Button>
        )}

        {hasError && (
          <Button className="w-full" onClick={onDismiss} variant="outline">
            Close
          </Button>
        )}
      </CredenzaFooter>
    </CredenzaContent>
  );
}

export function UpdateModal() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const updateQuery = useQuery({
    queryKey: ["app-update"],
    queryFn: () => check(),
    enabled: isTauri(),
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  });

  const installMutation = useMutation({
    mutationFn: async (update: Update) => {
      let downloaded = 0;
      let contentLength = 0;

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            contentLength = event.data.contentLength ?? 0;
            break;
          case "Progress":
            downloaded += event.data.chunkLength;
            if (contentLength > 0) {
              setDownloadProgress(
                Math.round((downloaded / contentLength) * 100)
              );
            }
            break;
          case "Finished":
            setDownloadProgress(100);
            break;
          default:
            break;
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-update"] });
    },
  });

  const update = updateQuery.data;
  const hasUpdate = update !== null && update !== undefined;
  const showModal = isOpen || (hasUpdate && !installMutation.isSuccess);

  if (hasUpdate && !isOpen && !installMutation.isSuccess) {
    setIsOpen(true);
  }

  const handleDownload = () => {
    if (!update) {
      return;
    }
    setDownloadProgress(0);
    installMutation.mutate(update);
  };

  if (!(isTauri() && showModal && update)) {
    return null;
  }

  const errorMessage =
    installMutation.error instanceof Error
      ? installMutation.error.message
      : "Unknown error";

  return (
    <Credenza onOpenChange={setIsOpen} open={isOpen}>
      <UpdateContent
        downloadProgress={downloadProgress}
        errorMessage={errorMessage}
        hasError={installMutation.isError}
        isDownloading={installMutation.isPending}
        isReady={installMutation.isSuccess}
        onDismiss={() => setIsOpen(false)}
        onDownload={handleDownload}
        update={update}
      />
    </Credenza>
  );
}
