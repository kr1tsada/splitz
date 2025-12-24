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
  currentClip: number;
  totalClips: number;
  percentage: number;
}

type Status = "idle" | "loading" | "splitting" | "success" | "error";

export function VideoSplitter() {
  const [video, setVideo] = useState<VideoFile | null>(null);
  const [duration, setDuration] = useState("00:05:00");
  const [prefix, setPrefix] = useState("");
  const [suffix, setSuffix] = useState("");
  const [outputDir, setOutputDir] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState<SplitProgress>({
    currentClip: 0,
    totalClips: 0,
    percentage: 0,
  });
  const [error, setError] = useState<string | null>(null);

  // Get video info when file is selected
  useEffect(() => {
    if (video && video.duration === 0) {
      setStatus("loading");
      invoke<{ duration: number; size: number }>("get_video_info", {
        path: video.path,
      })
        .then((info) => {
          setVideo((prev) =>
            prev ? { ...prev, duration: info.duration, size: info.size } : null
          );
          // Set default prefix from filename (without extension)
          const nameWithoutExt = video.name.replace(/\.[^/.]+$/, "");
          setPrefix(nameWithoutExt + "_");
          // Set default output dir to same folder as video
          const dir = video.path.substring(0, video.path.lastIndexOf("/"));
          setOutputDir(dir || video.path.substring(0, video.path.lastIndexOf("\\")));
          setStatus("idle");
        })
        .catch((err) => {
          console.error("Failed to get video info:", err);
          setError("Failed to get video information. Is FFmpeg installed?");
          setStatus("error");
        });
    }
  }, [video]);

  const handleVideoSelect = useCallback((selectedVideo: VideoFile | null) => {
    setVideo(selectedVideo);
    setError(null);
    setStatus("idle");
    setProgress({ currentClip: 0, totalClips: 0, percentage: 0 });
  }, []);

  const handleSplit = useCallback(async () => {
    if (!video || !outputDir) return;

    const durationSeconds = parseTimeToSeconds(duration);
    if (durationSeconds <= 0) {
      setError("Please enter a valid duration");
      return;
    }

    setStatus("splitting");
    setError(null);

    const totalClips = Math.ceil(video.duration / durationSeconds);
    setProgress({ currentClip: 0, totalClips, percentage: 0 });

    try {
      await invoke("split_video", {
        inputPath: video.path,
        outputDir,
        prefix,
        suffix,
        durationSeconds,
      });

      setStatus("success");
      setProgress((prev) => ({ ...prev, percentage: 100 }));
    } catch (err) {
      console.error("Split failed:", err);
      setError(String(err));
      setStatus("error");
    }
  }, [video, duration, prefix, suffix, outputDir]);

  const handleReset = useCallback(() => {
    setVideo(null);
    setDuration("00:05:00");
    setPrefix("");
    setSuffix("");
    setOutputDir("");
    setStatus("idle");
    setProgress({ currentClip: 0, totalClips: 0, percentage: 0 });
    setError(null);
  }, []);

  const isReady =
    video &&
    video.duration > 0 &&
    outputDir &&
    parseTimeToSeconds(duration) > 0;
  const isProcessing = status === "loading" || status === "splitting";

  return (
    <div className="space-y-6">
      {/* Video Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Video</CardTitle>
        </CardHeader>
        <CardContent>
          <VideoDropzone
            video={video}
            onVideoSelect={handleVideoSelect}
            isLoading={isProcessing}
          />
        </CardContent>
      </Card>

      {/* Configuration */}
      {video && video.duration > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Split Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <SplitConfig
              duration={duration}
              onDurationChange={setDuration}
              videoDuration={video.duration}
              disabled={isProcessing}
            />
            <div className="border-t pt-6">
              <OutputConfig
                prefix={prefix}
                suffix={suffix}
                outputDir={outputDir}
                onPrefixChange={setPrefix}
                onSuffixChange={setSuffix}
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
                  Splitting... Clip {progress.currentClip} of{" "}
                  {progress.totalClips}
                </span>
              </div>
              <Progress value={progress.percentage} />
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
                Split complete! {progress.totalClips} clips created in {outputDir}
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
