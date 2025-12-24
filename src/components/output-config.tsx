import { useCallback } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { Folder } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface OutputConfigProps {
  outputDir: string;
  onOutputDirChange: (dir: string) => void;
  disabled?: boolean;
}

export function OutputConfig({
  outputDir,
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

  return (
    <div className="space-y-4">
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
    </div>
  );
}
