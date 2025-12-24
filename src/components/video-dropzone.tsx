import { useCallback } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { Upload, File, X } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface VideoFile {
  path: string;
  name: string;
  size: number;
  duration: number;
}

interface VideoDropzoneProps {
  video: VideoFile | null;
  onVideoSelect: (video: VideoFile | null) => void;
  isLoading?: boolean;
}

export function VideoDropzone({
  video,
  onVideoSelect,
  isLoading,
}: VideoDropzoneProps) {
  const handleSelectFile = useCallback(async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "Video",
            extensions: ["mp4", "mkv", "avi", "mov", "webm", "m4v", "flv"],
          },
        ],
      });

      if (selected && typeof selected === "string") {
        // Extract filename from path
        const name = selected.split("/").pop() || selected.split("\\").pop() || "video";

        // We'll get actual size and duration from backend
        onVideoSelect({
          path: selected,
          name,
          size: 0, // Will be updated by backend
          duration: 0, // Will be updated by backend
        });
      }
    } catch (error) {
      console.error("Error selecting file:", error);
    }
  }, [onVideoSelect]);

  const handleClear = useCallback(() => {
    onVideoSelect(null);
  }, [onVideoSelect]);

  if (video) {
    return (
      <div className="relative rounded-lg border-2 border-dashed border-border p-6 transition-colors">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <File className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{video.name}</p>
            <p className="text-sm text-muted-foreground">
              {video.size > 0 ? formatBytes(video.size) : "Loading info..."}
              {video.duration > 0 && (
                <span className="ml-2">
                  {Math.floor(video.duration / 60)}:{String(Math.floor(video.duration % 60)).padStart(2, "0")}
                </span>
              )}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleSelectFile}
      disabled={isLoading}
      className={cn(
        "w-full rounded-lg border-2 border-dashed border-border p-12 transition-colors",
        "hover:border-primary/50 hover:bg-accent/50",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50"
      )}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Upload className="h-7 w-7 text-primary" />
        </div>
        <div>
          <p className="font-medium">Click to select video</p>
          <p className="text-sm text-muted-foreground">
            MP4, MKV, AVI, MOV, WebM supported
          </p>
        </div>
      </div>
    </button>
  );
}
