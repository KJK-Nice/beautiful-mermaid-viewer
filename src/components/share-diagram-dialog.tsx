import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { encodeShareLink, copyTextToClipboard } from "@/lib/share-link";

export interface ShareDiagramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  mermaid_code: string;
}

export function ShareDiagramDialog({
  open,
  onOpenChange,
  name,
  mermaid_code,
}: ShareDiagramDialogProps) {
  const [consent, setConsent] = React.useState(false);
  const [encodeError, setEncodeError] = React.useState<string | null>(null);
  const [copyHint, setCopyHint] = React.useState<string | null>(null);
  const [manualUrl, setManualUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setConsent(false);
      setEncodeError(null);
      setCopyHint(null);
      setManualUrl(null);
    }
  }, [open]);

  const handleCopy = async () => {
    setEncodeError(null);
    setCopyHint(null);
    setManualUrl(null);
    const result = encodeShareLink(name, mermaid_code);
    if (!result.ok) {
      setEncodeError(result.error);
      return;
    }
    const copied = await copyTextToClipboard(result.fullUrl);
    if (copied) {
      setCopyHint("Link copied to clipboard.");
    } else {
      setManualUrl(result.fullUrl);
      setEncodeError(
        "Could not copy automatically. Copy the link below manually."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share diagram</DialogTitle>
          <DialogDescription className="text-left">
            Create a link that embeds this diagram&apos;s title and full Mermaid source in the URL.
            Anyone with the link can read that content. Nothing is uploaded to a server—everything
            stays in the link. Very large diagrams may exceed browser URL limits.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex items-start gap-2">
            <input
              id="share-consent"
              type="checkbox"
              checked={consent}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setConsent(e.target.checked)
              }
              className="mt-1 h-4 w-4 rounded border border-input accent-primary"
            />
            <Label htmlFor="share-consent" className="cursor-pointer font-normal leading-snug">
              I understand the diagram title and source will be embedded in the link, and anyone with
              the link can see them.
            </Label>
          </div>
          {encodeError ? (
            <p className="text-sm text-destructive">{encodeError}</p>
          ) : null}
          {copyHint ? <p className="text-sm text-muted-foreground">{copyHint}</p> : null}
          {manualUrl ? (
            <p className="max-h-32 overflow-auto break-all text-xs text-muted-foreground">{manualUrl}</p>
          ) : null}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button type="button" disabled={!consent} onClick={handleCopy}>
            Create and copy link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
