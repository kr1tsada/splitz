import { useCallback } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { Folder } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface OutputConfigProps {
  prefix: string;
  suffix: string;
  outputDir: string;
  onPrefixChange: (prefix: string) => void;
  onSuffixChange: (suffix: string) => void;
  onOutputDirChange: (dir: string) => void;
  disabled?: boolean;
}

export function OutputConfig({
  prefix,
  suffix,
  outputDir,
  onPrefixChange,
  onSuffixChange,
  onOutputDirChange,
  disabled,
}: OutputConfigProps) {
  const handleSelectFolder = useCallback(async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });

      if (selected && typeof selected === "string") {
        onOutputDirChange(selected);
      }
    } catch (error) {
      console.error("Error selecting folder:", error);
    }
  }, [onOutputDirChange]);

  // Generate preview filenames
  const generatePreview = () => {
    const examples = [1, 2, 3];
    return examples
      .map((i) => `${prefix}${String(i).padStart(3, "0")}${suffix}.mp4`)
      .join(", ");
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="prefix">Prefix</Label>
          <Input
            id="prefix"
            type="text"
            placeholder="video_"
            value={prefix}
            onChange={(e) => onPrefixChange(e.target.value)}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="suffix">Suffix</Label>
          <Input
            id="suffix"
            type="text"
            placeholder=""
            value={suffix}
            onChange={(e) => onSuffixChange(e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="outputDir">Output Folder</Label>
        <div className="flex gap-2">
          <Input
            id="outputDir"
            type="text"
            value={outputDir}
            onChange={(e) => onOutputDirChange(e.target.value)}
            disabled={disabled}
            className="flex-1"
            placeholder="Select output folder..."
            readOnly
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleSelectFolder}
            disabled={disabled}
          >
            <Folder className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {prefix && (
        <div className="rounded-md bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground mb-1">Preview:</p>
          <p className="text-sm font-mono truncate">{generatePreview()}</p>
        </div>
      )}
    </div>
  );
}
