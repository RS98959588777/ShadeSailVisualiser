import { Button } from "@/components/ui/button";
import { Download, Upload, RotateCcw } from "lucide-react";

interface HeaderProps {
  onDownload?: () => void;
  onReset?: () => void;
  hasImage?: boolean;
}

export default function Header({ onDownload, onReset, hasImage = false }: HeaderProps) {
  return (
    <header className="flex items-center justify-between p-4 border-b bg-background">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
          <div className="w-4 h-4 bg-primary-foreground rounded-sm transform rotate-45"></div>
        </div>
        <h1 className="text-xl font-semibold text-foreground">Shade Sail Visualizer</h1>
      </div>
      
      <div className="flex items-center gap-2">
        {hasImage && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              data-testid="button-reset"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={onDownload}
              size="sm"
              data-testid="button-download"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </>
        )}
      </div>
    </header>
  );
}