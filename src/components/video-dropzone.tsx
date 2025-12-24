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
  videos: VideoFile[];
  onVideoSelect: (videos: VideoFile[]) => void;
  onRemoveVideo: (index: number) => void;
  isLoading?: boolean;
}

export function VideoDropzone({
  videos,
  onVideoSelect,
  onRemoveVideo,
  isLoading,
}: VideoDropzoneProps) {
  const handleSelectFiles = useCallback(async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [
          {
            name: "Video",
            extensions: ["mp4", "mkv", "avi", "mov", "webm", "m4v", "flv"],
          },
        ],
      });

      if (selected && Array.isArray(selected) && selected.length > 0) {
        const newVideos: VideoFile[] = selected.map((path) => {
          const name = (path.split("/").pop() || path.split("\\").pop() || "video").replace(/:/g, "/");
          return {
            path,
            name,
            size: 0,
            duration: 0,
          };
        });
        onVideoSelect([...videos, ...newVideos]);
      }
    } catch (error) {
      console.error("Error selecting files:", error);
    }
  }, [onVideoSelect, videos]);

  if (videos.length > 0) {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          {videos.map((video, index) => (
            <div
              key={video.path}
              className="relative rounded-lg border border-border p-4 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <File className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-sm">{video.name}</p>
                  <p className="text-xs text-muted-foreground">
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
                  onClick={() => onRemoveVideo(index)}
                  disabled={isLoading}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          onClick={handleSelectFiles}
          disabled={isLoading}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          Add more videos
        </Button>
      </div>
    );
  }

  return (
    <button
      onClick={handleSelectFiles}
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
          <p className="font-medium">Click to select videos</p>
          <p className="text-sm text-muted-foreground">
            MP4, MKV, AVI, MOV, WebM supported
          </p>
        </div>
      </div>
    </button>
  );
}
