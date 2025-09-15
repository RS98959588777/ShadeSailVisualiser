import { Canvas, FabricObject, Point, Circle, Shadow } from 'fabric';

export interface PerspectivePoint {
  x: number;
  y: number;
}

export interface PerspectiveSettings {
  topLeft: PerspectivePoint;
  topRight: PerspectivePoint;
  bottomLeft: PerspectivePoint;
  bottomRight: PerspectivePoint;
  tilt: number;
  perspective: number;
}

export class PerspectiveTransform {
  private canvas: Canvas;
  private object: FabricObject;
  private originalPoints: PerspectivePoint[];
  private anchorControls: FabricObject[] = [];

  constructor(canvas: Canvas, object: FabricObject) {
    this.canvas = canvas;
    this.object = object;
    this.originalPoints = this.getObjectCorners();
  }

  private getObjectCorners(): PerspectivePoint[] {
    const bounds = this.object.getBoundingRect();
    return [
      { x: bounds.left, y: bounds.top }, // top-left
      { x: bounds.left + bounds.width, y: bounds.top }, // top-right
      { x: bounds.left, y: bounds.top + bounds.height }, // bottom-left
      { x: bounds.left + bounds.width, y: bounds.top + bounds.height } // bottom-right
    ];
  }

  public createAnchorControls(): void {
    this.removeAnchorControls();
    
    const corners = this.getObjectCorners();
    const anchorSize = 12;
    
    corners.forEach((corner, index) => {
      const anchor = new Circle({
        left: corner.x - anchorSize / 2,
        top: corner.y - anchorSize / 2,
        radius: anchorSize / 2,
        fill: '#ffffff',
        stroke: '#007bff',
        strokeWidth: 2,
        selectable: true,
        evented: true,
        hasControls: false,
        hasBorders: false,
        originX: 'center',
        originY: 'center',
        opacity: 0.9
      });

      // Add custom data to identify the anchor
      (anchor as any).anchorIndex = index;
      (anchor as any).isAnchor = true;

      // Add event handlers
      anchor.on('moving', () => this.onAnchorMove(anchor, index));
      anchor.on('mousedown', () => this.onAnchorSelect(anchor));

      this.canvas.add(anchor);
      this.anchorControls.push(anchor);
    });

    this.canvas.renderAll();
  }

  private onAnchorMove(anchor: FabricObject, index: number): void {
    const newPosition = { x: anchor.left!, y: anchor.top! };
    this.updatePerspective(index, newPosition);
  }

  private onAnchorSelect(anchor: FabricObject): void {
    // Highlight selected anchor
    anchor.set('stroke', '#ff4444');
    this.canvas.renderAll();
    
    // Reset other anchors
    this.anchorControls.forEach(a => {
      if (a !== anchor) {
        a.set('stroke', '#007bff');
      }
    });
  }

  private updatePerspective(anchorIndex: number, newPosition: PerspectivePoint): void {
    // Get current anchor positions
    const anchors = this.anchorControls.map(anchor => ({
      x: anchor.left!,
      y: anchor.top!
    }));

    // Update the moved anchor
    anchors[anchorIndex] = newPosition;

    // Apply perspective transformation
    this.applyPerspectiveTransform(anchors);
  }

  private applyPerspectiveTransform(corners: PerspectivePoint[]): void {
    const [topLeft, topRight, bottomLeft, bottomRight] = corners;
    
    // Calculate skew and perspective values based on corner positions
    const originalBounds = this.object.getBoundingRect();
    const originalWidth = originalBounds.width;
    const originalHeight = originalBounds.height;

    // Calculate perspective distortion
    const topWidth = Math.abs(topRight.x - topLeft.x);
    const bottomWidth = Math.abs(bottomRight.x - bottomLeft.x);
    const leftHeight = Math.abs(bottomLeft.y - topLeft.y);
    const rightHeight = Math.abs(bottomRight.y - topRight.y);

    // Calculate skew values
    const skewX = ((topRight.x - topLeft.x) - (bottomRight.x - bottomLeft.x)) / originalHeight;
    const skewY = ((bottomLeft.x - topLeft.x) - (bottomRight.x - topRight.x)) / originalWidth;

    // Calculate scale values for perspective effect
    const scaleX = (topWidth + bottomWidth) / (2 * originalWidth);
    const scaleY = (leftHeight + rightHeight) / (2 * originalHeight);

    // Apply transformation to the object
    const centerX = (topLeft.x + topRight.x + bottomLeft.x + bottomRight.x) / 4;
    const centerY = (topLeft.y + topRight.y + bottomLeft.y + bottomRight.y) / 4;

    this.object.set({
      left: centerX,
      top: centerY,
      scaleX: Math.max(0.1, scaleX),
      scaleY: Math.max(0.1, scaleY),
      skewX: skewX * 45, // Convert to degrees
      skewY: skewY * 45,
      originX: 'center',
      originY: 'center'
    });

    this.canvas.renderAll();
  }

  public applyPresetPerspective(preset: 'normal' | 'tiltLeft' | 'tiltRight' | 'stretch' | 'perspective'): void {
    const bounds = this.object.getBoundingRect();
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const width = bounds.width;
    const height = bounds.height;

    let corners: PerspectivePoint[];

    switch (preset) {
      case 'normal':
        corners = [
          { x: centerX - width/2, y: centerY - height/2 },
          { x: centerX + width/2, y: centerY - height/2 },
          { x: centerX - width/2, y: centerY + height/2 },
          { x: centerX + width/2, y: centerY + height/2 }
        ];
        break;
      case 'tiltLeft':
        corners = [
          { x: centerX - width/2 + 20, y: centerY - height/2 },
          { x: centerX + width/2, y: centerY - height/2 - 10 },
          { x: centerX - width/2 - 20, y: centerY + height/2 },
          { x: centerX + width/2, y: centerY + height/2 + 10 }
        ];
        break;
      case 'tiltRight':
        corners = [
          { x: centerX - width/2, y: centerY - height/2 - 10 },
          { x: centerX + width/2 - 20, y: centerY - height/2 },
          { x: centerX - width/2, y: centerY + height/2 + 10 },
          { x: centerX + width/2 + 20, y: centerY + height/2 }
        ];
        break;
      case 'stretch':
        corners = [
          { x: centerX - width/2 - 30, y: centerY - height/2 },
          { x: centerX + width/2 + 30, y: centerY - height/2 },
          { x: centerX - width/2 + 10, y: centerY + height/2 },
          { x: centerX + width/2 - 10, y: centerY + height/2 }
        ];
        break;
      case 'perspective':
        corners = [
          { x: centerX - width/2 + 15, y: centerY - height/2 - 5 },
          { x: centerX + width/2 - 15, y: centerY - height/2 - 5 },
          { x: centerX - width/2 - 15, y: centerY + height/2 + 15 },
          { x: centerX + width/2 + 15, y: centerY + height/2 + 15 }
        ];
        break;
    }

    // Update anchor positions
    this.anchorControls.forEach((anchor, index) => {
      anchor.set({
        left: corners[index].x,
        top: corners[index].y
      });
    });

    // Apply the transformation
    this.applyPerspectiveTransform(corners);
  }

  public removeAnchorControls(): void {
    this.anchorControls.forEach(anchor => {
      this.canvas.remove(anchor);
    });
    this.anchorControls = [];
    this.canvas.renderAll();
  }

  public toggleAnchorMode(enabled: boolean): void {
    if (enabled) {
      this.createAnchorControls();
    } else {
      this.removeAnchorControls();
    }
  }

  public getCurrentSettings(): PerspectiveSettings {
    const corners = this.anchorControls.map(anchor => ({
      x: anchor.left!,
      y: anchor.top!
    }));

    return {
      topLeft: corners[0] || { x: 0, y: 0 },
      topRight: corners[1] || { x: 0, y: 0 },
      bottomLeft: corners[2] || { x: 0, y: 0 },
      bottomRight: corners[3] || { x: 0, y: 0 },
      tilt: this.object.skewX || 0,
      perspective: this.object.skewY || 0
    };
  }
}