import { useState, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Scissors, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { VideoDropzone } from "@/components/video-dropzone";
import { SplitConfig } from "@/components/split-config";
import { OutputConfig } from "@/components/output-config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { parseTimeToSeconds } from "@/lib/utils";

interface VideoFile {
  path: string;
  name: string;
  size: number;
  duration: number;
}

interface SplitProgress {
  currentFile: number;
  totalFiles: number;
  totalClipsCreated: number;
  percentage: number;
}

type Status = "idle" | "loading" | "splitting" | "success" | "error";

export function VideoSplitter() {
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [duration, setDuration] = useState("00:05:00");
  const [outputDir, setOutputDir] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState<SplitProgress>({
    currentFile: 0,
    totalFiles: 0,
    totalClipsCreated: 0,
    percentage: 0,
  });
  const [error, setError] = useState<string | null>(null);

  // Get video info when files are selected
  useEffect(() => {
    const videosNeedingInfo = videos.filter((v) => v.duration === 0);
    if (videosNeedingInfo.length === 0) return;

    setStatus("loading");

    const fetchVideoInfo = async () => {
      try {
        for (const video of videosNeedingInfo) {
          const info = await invoke<{ duration: number; size: number }>("get_video_info", {
            path: video.path,
          });
          setVideos((prev) =>
            prev.map((v) =>
              v.path === video.path
                ? { ...v, duration: info.duration, size: info.size }
                : v
            )
          );
        }
        // Set default output dir from first video if not set
        if (!outputDir && videos.length > 0) {
          const firstVideo = videos[0];
          const dir = firstVideo.path.substring(0, firstVideo.path.lastIndexOf("/"));
          setOutputDir(dir || firstVideo.path.substring(0, firstVideo.path.lastIndexOf("\\")));
        }
        setStatus("idle");
      } catch (err) {
        console.error("Failed to get video info:", err);
        setError("Failed to get video information. Is FFmpeg installed?");
        setStatus("error");
      }
    };

    fetchVideoInfo();
  }, [videos, outputDir]);

  const handleVideoSelect = useCallback((selectedVideos: VideoFile[]) => {
    setVideos(selectedVideos);
    setError(null);
    setStatus("idle");
    setProgress({ currentFile: 0, totalFiles: 0, totalClipsCreated: 0, percentage: 0 });
  }, []);

  const handleRemoveVideo = useCallback((index: number) => {
    setVideos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSplit = useCallback(async () => {
    if (videos.length === 0 || !outputDir) return;

    const durationSeconds = parseTimeToSeconds(duration);
    if (durationSeconds <= 0) {
      setError("Please enter a valid duration");
      return;
    }

    setStatus("splitting");
    setError(null);
    setProgress({ currentFile: 0, totalFiles: videos.length, totalClipsCreated: 0, percentage: 0 });

    let totalClipsCreated = 0;

    try {
      for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        // Use filename (without extension) as prefix
        const prefix = video.name.replace(/\.[^/.]+$/, "") + "_";

        setProgress((prev) => ({
          ...prev,
          currentFile: i + 1,
          percentage: Math.round((i / videos.length) * 100),
        }));

        const clipsCreated = await invoke<number>("split_video", {
          inputPath: video.path,
          outputDir,
          prefix,
          suffix: "",
          durationSeconds,
        });

        totalClipsCreated += clipsCreated;
        setProgress((prev) => ({
          ...prev,
          totalClipsCreated,
        }));
      }

      setStatus("success");
      setProgress((prev) => ({ ...prev, percentage: 100, totalClipsCreated }));
    } catch (err) {
      console.error("Split failed:", err);
      setError(String(err));
      setStatus("error");
    }
  }, [videos, duration, outputDir]);

  const handleReset = useCallback(() => {
    setVideos([]);
    setDuration("00:05:00");
    setOutputDir("");
    setStatus("idle");
    setProgress({ currentFile: 0, totalFiles: 0, totalClipsCreated: 0, percentage: 0 });
    setError(null);
  }, []);

  const allVideosHaveInfo = videos.length > 0 && videos.every((v) => v.duration > 0);
  const isReady =
    allVideosHaveInfo &&
    outputDir &&
    parseTimeToSeconds(duration) > 0;
  const isProcessing = status === "loading" || status === "splitting";

  return (
    <div className="space-y-6">
      {/* Video Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Select Videos {videos.length > 0 && `(${videos.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <VideoDropzone
            videos={videos}
            onVideoSelect={handleVideoSelect}
            onRemoveVideo={handleRemoveVideo}
            isLoading={isProcessing}
          />
        </CardContent>
      </Card>

      {/* Configuration */}
      {allVideosHaveInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Split Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <SplitConfig
              duration={duration}
              onDurationChange={setDuration}
              videoDuration={Math.max(...videos.map((v) => v.duration))}
              disabled={isProcessing}
            />
            <div className="border-t pt-6">
              <OutputConfig
                outputDir={outputDir}
                onOutputDirChange={setOutputDir}
                disabled={isProcessing}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress */}
      {status === "splitting" && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>
                  Splitting video {progress.currentFile} of {progress.totalFiles}...
                </span>
              </div>
              <Progress value={progress.percentage} />
              {progress.totalClipsCreated > 0 && (
                <p className="text-sm text-muted-foreground">
                  {progress.totalClipsCreated} clips created so far
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success */}
      {status === "success" && (
        <Card className="border-green-500/50 bg-green-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              <span>
                Split complete! {progress.totalClipsCreated} clips created from {progress.totalFiles} videos
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {status === "success" ? (
          <Button onClick={handleReset} className="flex-1">
            Split Another Video
          </Button>
        ) : (
          <Button
            onClick={handleSplit}
            disabled={!isReady || isProcessing}
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Scissors className="h-4 w-4" />
                Start Split
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
