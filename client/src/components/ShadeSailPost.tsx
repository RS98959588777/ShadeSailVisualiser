import { Canvas, FabricObject, Rect, Ellipse, Group, Gradient } from 'fabric';

export interface PostSettings {
  id: string;
  x: number;
  y: number;
  height: number;
  thickness: number;
  color: string;
}

export class ShadeSailPost {
  private canvas: Canvas;
  private postGroup: Group | null = null;
  private settings: PostSettings;

  constructor(canvas: Canvas, settings: PostSettings) {
    this.canvas = canvas;
    this.settings = settings;
    this.createPost();
  }

  private createPost(): void {
    const { x, y, height, thickness, color } = this.settings;
    
    // Create the main post cylinder with gradient for 3D effect
    const postBody = new Rect({
      left: 0,
      top: 0,
      width: thickness,
      height: height,
      fill: this.create3DGradient(color),
      stroke: this.getDarkerShade(color, 0.3),
      strokeWidth: 1,
      rx: thickness * 0.1, // Slight rounding for realism
      ry: thickness * 0.1
    });

    // Create the top cap for 3D appearance
    const topCap = new Ellipse({
      left: thickness / 2,
      top: -thickness / 4,
      rx: thickness / 2,
      ry: thickness / 4,
      fill: this.getLighterShade(color, 0.2),
      stroke: this.getDarkerShade(color, 0.2),
      strokeWidth: 1,
      originX: 'center',
      originY: 'center'
    });

    // Create shadow for depth
    const shadow = new Rect({
      left: thickness * 0.3,
      top: height * 0.1,
      width: thickness * 0.8,
      height: height * 0.9,
      fill: 'rgba(0, 0, 0, 0.2)',
      rx: thickness * 0.08,
      ry: thickness * 0.08,
      selectable: false,
      evented: false
    });

    // Group all post elements
    this.postGroup = new Group([shadow, postBody, topCap], {
      left: x,
      top: y,
      selectable: true,
      hasControls: true,
      hasBorders: true,
      lockRotation: false
    });
    
    // Store the id as a custom property
    (this.postGroup as any).postId = this.settings.id;

    this.canvas.add(this.postGroup);
    
    // Add event listener for position updates when dragged
    this.postGroup.on('modified', () => {
      if (this.postGroup) {
        this.settings.x = this.postGroup.left || 0;
        this.settings.y = this.postGroup.top || 0;
      }
    });
  }

  private create3DGradient(baseColor: string): any {
    const lightShade = this.getLighterShade(baseColor, 0.3);
    const darkShade = this.getDarkerShade(baseColor, 0.3);

    return new Gradient({
      type: 'linear',
      coords: { x1: 0, y1: 0, x2: this.settings.thickness, y2: 0 },
      colorStops: [
        { offset: 0, color: lightShade },
        { offset: 0.3, color: baseColor },
        { offset: 0.7, color: baseColor },
        { offset: 1, color: darkShade }
      ]
    });
  }

  private getLighterShade(color: string, factor: number): string {
    // Convert hex to RGB, lighten, and convert back
    const hex = color.replace('#', '');
    const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + Math.round(255 * factor));
    const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + Math.round(255 * factor));
    const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + Math.round(255 * factor));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  private getDarkerShade(color: string, factor: number): string {
    // Convert hex to RGB, darken, and convert back
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - Math.round(255 * factor));
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - Math.round(255 * factor));
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - Math.round(255 * factor));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  public updatePost(newSettings: Partial<PostSettings>): void {
    // Preserve current position if post is on canvas
    let currentLeft = this.settings.x;
    let currentTop = this.settings.y;
    let wasSelected = false;
    
    if (this.postGroup) {
      currentLeft = this.postGroup.left || this.settings.x;
      currentTop = this.postGroup.top || this.settings.y;
      wasSelected = this.canvas.getActiveObject() === this.postGroup;
    }
    
    this.settings = { 
      ...this.settings, 
      ...newSettings,
      x: currentLeft,
      y: currentTop
    };
    
    this.removePost();
    this.createPost();
    
    // Restore selection if the post was previously selected
    if (wasSelected && this.postGroup) {
      this.canvas.setActiveObject(this.postGroup);
      this.canvas.requestRenderAll();
    }
  }

  public removePost(): void {
    if (this.postGroup) {
      this.canvas.remove(this.postGroup);
      this.postGroup = null;
    }
  }

  public getPost(): Group | null {
    return this.postGroup;
  }

  public getSettings(): PostSettings {
    return { ...this.settings };
  }

  public setPosition(x: number, y: number): void {
    if (this.postGroup) {
      this.postGroup.set({ left: x, top: y });
      this.settings.x = x;
      this.settings.y = y;
      this.canvas.renderAll();
    }
  }

  public setHeight(height: number): void {
    this.updatePost({ height });
  }

  public setThickness(thickness: number): void {
    this.updatePost({ thickness });
  }

  public setColor(color: string): void {
    this.updatePost({ color });
  }
}

export class PostManager {
  private canvas: Canvas;
  private posts: Map<string, ShadeSailPost> = new Map();
  private nextId: number = 1;

  constructor(canvas: Canvas) {
    this.canvas = canvas;
  }

  public addPost(x?: number, y?: number, height: number = 200, thickness: number = 20, color: string = '#8B4513'): string {
    const id = `post-${this.nextId++}`;
    // Use canvas center if no position specified (using nullish coalescing to handle 0)
    const finalX = x ?? this.canvas.getWidth() / 2;
    const finalY = y ?? this.canvas.getHeight() / 2;
    const settings: PostSettings = { id, x: finalX, y: finalY, height, thickness, color };
    const post = new ShadeSailPost(this.canvas, settings);
    this.posts.set(id, post);
    return id;
  }

  public removePost(id: string): void {
    const post = this.posts.get(id);
    if (post) {
      post.removePost();
      this.posts.delete(id);
    }
  }

  public updatePost(id: string, settings: Partial<PostSettings>): void {
    const post = this.posts.get(id);
    if (post) {
      post.updatePost(settings);
    }
  }

  public getAllPosts(): PostSettings[] {
    return Array.from(this.posts.values()).map(post => post.getSettings());
  }

  public getPost(id: string): ShadeSailPost | undefined {
    return this.posts.get(id);
  }

  public clearAllPosts(): void {
    this.posts.forEach(post => post.removePost());
    this.posts.clear();
  }

  public getSelectedPost(): string | null {
    const activeObject = this.canvas.getActiveObject();
    if (activeObject && (activeObject as any).postId) {
      return (activeObject as any).postId;
    }
    return null;
  }

  public selectPost(id: string): void {
    const post = this.posts.get(id);
    if (post) {
      const postGroup = post.getPost();
      if (postGroup) {
        // Bring to front for better visibility if overlapping
        this.canvas.bringObjectToFront(postGroup);
        this.canvas.setActiveObject(postGroup);
        this.canvas.requestRenderAll();
      }
    }
  }
}