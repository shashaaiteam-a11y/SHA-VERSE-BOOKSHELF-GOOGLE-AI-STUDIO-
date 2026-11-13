import { useState } from "react";
import { Share2, Copy, Check, Facebook, Twitter, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  url?: string;
}

export function ShareDialog({ open, onOpenChange, title, url }: ShareDialogProps) {
  const shareUrl = url || window.location.href;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWebAPI = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Share Book
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm font-medium text-foreground truncate">{title}</p>

          <div className="flex items-center gap-2">
            <Input value={shareUrl} readOnly className="text-xs" />
            <Button size="icon" variant="outline" onClick={handleCopy}>
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          <div className="pt-2">
            <Button onClick={shareWebAPI} className="w-full gap-2">
              <Share2 className="w-4 h-4" /> Share via Apps
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ShareDialog;
