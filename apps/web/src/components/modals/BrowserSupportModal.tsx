import { isTauri } from "@tauri-apps/api/core";
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
import { useStore } from "@/store/useStore";

export function BrowserSupportModal() {
  const isAudioEnabled = useStore((state) => state.isAudioEnabled);
  const setAudioEnabled = useStore((state) => state.setAudioEnabled);

  // If on Tauri or audio is already enabled, don't show
  if (isTauri() || isAudioEnabled) {
    return null;
  }

  return (
    <Credenza
      onOpenChange={(open) => {
        if (!open) {
          setAudioEnabled(true);
        }
      }}
      open={true}
    >
      <CredenzaContent className="sm:max-w-[425px]">
        <CredenzaHeader>
          <CredenzaTitle>Welcome to Sonar</CredenzaTitle>
          <CredenzaDescription>
            For the best experience, please enable audio or download the desktop
            app.
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody className="flex flex-col gap-4 py-4">
          <p className="text-muted-foreground text-sm">
            Browsers autoplay policies require user interaction to play audio.
          </p>
        </CredenzaBody>
        <CredenzaFooter className="flex flex-col gap-2 sm:flex-col sm:space-x-0">
          <Button className="w-full" onClick={() => setAudioEnabled(true)}>
            Enable Audio
          </Button>
          <Button asChild className="w-full" variant="outline">
            <a
              href="https://github.com/imjac0b/sonar/releases/latest"
              rel="noreferrer"
              target="_blank"
            >
              Download Desktop App
            </a>
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
