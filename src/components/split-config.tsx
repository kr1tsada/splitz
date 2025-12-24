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
  // Parse duration string (HH:MM:SS) to seconds
  const parseDuration = (time: string): number => {
    const parts = time.split(":").map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return parts[0] || 0;
  };

  const durationSeconds = parseDuration(duration);
  const clipCount =
    durationSeconds > 0 && videoDuration > 0
      ? Math.ceil(videoDuration / durationSeconds)
      : 0;

  // Validate and format input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Allow only numbers and colons
    value = value.replace(/[^\d:]/g, "");

    // Auto-format as user types
    const digits = value.replace(/:/g, "");
    if (digits.length <= 2) {
      value = digits;
    } else if (digits.length <= 4) {
      value = `${digits.slice(0, -2)}:${digits.slice(-2)}`;
    } else {
      value = `${digits.slice(0, -4)}:${digits.slice(-4, -2)}:${digits.slice(-2)}`;
    }

    onDurationChange(value);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="duration">Split Duration (HH:MM:SS)</Label>
        <Input
          id="duration"
          type="text"
          placeholder="00:05:00"
          value={duration}
          onChange={handleChange}
          disabled={disabled}
          className="font-mono"
        />
        <p className="text-xs text-muted-foreground">
          Enter the duration for each clip (e.g., 00:05:00 for 5 minutes)
        </p>
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
