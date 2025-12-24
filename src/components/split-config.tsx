import { useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SplitConfigProps {
  duration: string;
  onDurationChange: (duration: string) => void;
  videoDuration: number;
  disabled?: boolean;
}

export function SplitConfig({
  duration,
  onDurationChange,
  videoDuration,
  disabled,
}: SplitConfigProps) {
  // Parse duration string (HH:MM:SS) into parts
  const { hours, minutes, seconds } = useMemo(() => {
    const parts = duration.split(":");
    if (parts.length === 3) {
      return {
        hours: parts[0] || "00",
        minutes: parts[1] || "00",
        seconds: parts[2] || "00",
      };
    }
    return { hours: "00", minutes: "00", seconds: "00" };
  }, [duration]);

  // Parse duration to seconds for clip count calculation
  const durationSeconds = useMemo(() => {
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const s = parseInt(seconds) || 0;
    return h * 3600 + m * 60 + s;
  }, [hours, minutes, seconds]);

  const clipCount =
    durationSeconds > 0 && videoDuration > 0
      ? Math.ceil(videoDuration / durationSeconds)
      : 0;

  // Handle individual field changes (allow empty while typing)
  const handleFieldChange = useCallback(
    (field: "hours" | "minutes" | "seconds", value: string) => {
      // Allow only digits
      const digits = value.replace(/\D/g, "").slice(0, 2);

      const newDuration =
        field === "hours"
          ? `${digits}:${minutes}:${seconds}`
          : field === "minutes"
          ? `${hours}:${digits}:${seconds}`
          : `${hours}:${minutes}:${digits}`;

      onDurationChange(newDuration);
    },
    [hours, minutes, seconds, onDurationChange]
  );

  // Format on blur (pad with zeros, clamp values)
  const handleFieldBlur = useCallback(
    (field: "hours" | "minutes" | "seconds", value: string) => {
      const digits = value.replace(/\D/g, "");
      let numValue = parseInt(digits) || 0;

      // Clamp minutes and seconds to 59
      if (field !== "hours") {
        numValue = Math.min(numValue, 59);
      }

      const formatted = String(numValue).padStart(2, "0");

      const newDuration =
        field === "hours"
          ? `${formatted}:${minutes}:${seconds}`
          : field === "minutes"
          ? `${hours}:${formatted}:${seconds}`
          : `${hours}:${minutes}:${formatted}`;

      onDurationChange(newDuration);
    },
    [hours, minutes, seconds, onDurationChange]
  );

  // Auto-select all text on focus
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Split Duration</Label>
        <div className="flex items-center gap-1">
          <div className="flex flex-col items-center">
            <Input
              type="text"
              inputMode="numeric"
              value={hours}
              onChange={(e) => handleFieldChange("hours", e.target.value)}
              onFocus={handleFocus}
              onBlur={(e) => handleFieldBlur("hours", e.target.value)}
              disabled={disabled}
              className="w-14 text-center font-mono"
              maxLength={2}
            />
            <span className="text-xs text-muted-foreground mt-1">HH</span>
          </div>
          <span className="text-xl font-bold text-muted-foreground pb-5">:</span>
          <div className="flex flex-col items-center">
            <Input
              type="text"
              inputMode="numeric"
              value={minutes}
              onChange={(e) => handleFieldChange("minutes", e.target.value)}
              onFocus={handleFocus}
              onBlur={(e) => handleFieldBlur("minutes", e.target.value)}
              disabled={disabled}
              className="w-14 text-center font-mono"
              maxLength={2}
            />
            <span className="text-xs text-muted-foreground mt-1">MM</span>
          </div>
          <span className="text-xl font-bold text-muted-foreground pb-5">:</span>
          <div className="flex flex-col items-center">
            <Input
              type="text"
              inputMode="numeric"
              value={seconds}
              onChange={(e) => handleFieldChange("seconds", e.target.value)}
              onFocus={handleFocus}
              onBlur={(e) => handleFieldBlur("seconds", e.target.value)}
              disabled={disabled}
              className="w-14 text-center font-mono"
              maxLength={2}
            />
            <span className="text-xs text-muted-foreground mt-1">SS</span>
          </div>
        </div>
      </div>

      {clipCount > 0 && (
        <div className="rounded-md bg-muted/50 p-3">
          <p className="text-sm">
            This will create <strong>{clipCount}</strong> clip
            {clipCount !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
