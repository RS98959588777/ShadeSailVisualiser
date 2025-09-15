import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Plus,
  Trash2,
  Ruler,
  Move,
  Palette
} from 'lucide-react';
import { PostManager, PostSettings } from './ShadeSailPost';

interface PostControlsProps {
  postManager: PostManager | null;
  selectedPostId: string | null;
  onPostSelect: (id: string | null) => void;
}

const POST_COLORS = [
  { name: 'Brown Wood', value: '#8B4513', description: 'Natural wood brown' },
  { name: 'Dark Steel', value: '#2F4F4F', description: 'Industrial steel gray' },
  { name: 'White PVC', value: '#F5F5F5', description: 'Clean white finish' },
  { name: 'Black Metal', value: '#1C1C1C', description: 'Modern black metal' },
  { name: 'Bronze', value: '#CD7F32', description: 'Elegant bronze finish' }
];

export default function PostControls({
  postManager,
  selectedPostId,
  onPostSelect
}: PostControlsProps) {
  const [posts, setPosts] = useState<PostSettings[]>([]);
  const [selectedHeight, setSelectedHeight] = useState(200);
  const [selectedThickness, setSelectedThickness] = useState(20);
  const [selectedColor, setSelectedColor] = useState('#8B4513');

  const refreshPosts = () => {
    if (postManager) {
      setPosts(postManager.getAllPosts());
    }
  };

  const handleAddPost = () => {
    if (postManager) {
      // Add post at canvas center (PostManager will calculate dynamically)
      const newPostId = postManager.addPost(
        undefined, // Let PostManager calculate center
        undefined,
        selectedHeight,
        selectedThickness,
        selectedColor
      );
      onPostSelect(newPostId);
      refreshPosts();
    }
  };

  const handleRemovePost = (postId: string) => {
    if (postManager) {
      postManager.removePost(postId);
      if (selectedPostId === postId) {
        onPostSelect(null);
      }
      refreshPosts();
    }
  };

  const handleUpdateSelectedPost = (updates: Partial<PostSettings>) => {
    if (postManager && selectedPostId) {
      postManager.updatePost(selectedPostId, updates);
      refreshPosts();
    }
  };

  const selectedPost = posts.find(p => p.id === selectedPostId);

  return (
    <div className="space-y-6">
      {/* Post Creation */}
      <div className="space-y-4">
        <h5 className="text-sm font-medium text-foreground">Add New Post</h5>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-foreground flex items-center gap-1">
              <Ruler className="w-3 h-3" />
              Height
            </span>
            <span className="text-xs text-muted-foreground">{selectedHeight}px</span>
          </div>
          <Slider
            value={[selectedHeight]}
            onValueChange={(value) => setSelectedHeight(value[0])}
            min={100}
            max={400}
            step={10}
            className="w-full"
            data-testid="slider-new-post-height"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-foreground flex items-center gap-1">
              <Move className="w-3 h-3" />
              Thickness
            </span>
            <span className="text-xs text-muted-foreground">{selectedThickness}px</span>
          </div>
          <Slider
            value={[selectedThickness]}
            onValueChange={(value) => setSelectedThickness(value[0])}
            min={10}
            max={50}
            step={2}
            className="w-full"
            data-testid="slider-new-post-thickness"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-foreground flex items-center gap-1">
              <Palette className="w-3 h-3" />
              Color
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {POST_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => setSelectedColor(color.value)}
                className={`h-8 rounded border-2 transition-all hover-elevate ${
                  selectedColor === color.value 
                    ? 'border-primary ring-2 ring-primary/20' 
                    : 'border-border'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.description}
                data-testid={`color-${color.name.toLowerCase().replace(/\s+/g, '-')}`}
              />
            ))}
          </div>
        </div>

        <Button
          onClick={handleAddPost}
          className="w-full"
          data-testid="button-add-post"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Post
        </Button>
      </div>

      <Separator />

      {/* Existing Posts */}
      <div className="space-y-4">
        <h5 className="text-sm font-medium text-foreground">Existing Posts ({posts.length})</h5>
        
        {posts.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">No posts added yet</p>
            <p className="text-xs">Add your first post above</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {posts.map((post) => (
              <Card 
                key={post.id}
                className={`cursor-pointer transition-all hover-elevate ${
                  selectedPostId === post.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => onPostSelect(post.id)}
                data-testid={`post-card-${post.id}`}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: post.color }}
                      />
                      <div>
                        <div className="text-xs font-medium">Post {post.id.split('-')[1]}</div>
                        <div className="text-xs text-muted-foreground">
                          H: {post.height}px, T: {post.thickness}px
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePost(post.id);
                      }}
                      data-testid={`button-remove-${post.id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selectedPost && (
        <>
          <Separator />

          {/* Selected Post Controls */}
          <div className="space-y-4">
            <h5 className="text-sm font-medium text-foreground">
              Edit Post {selectedPost.id.split('-')[1]}
            </h5>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground">Height</span>
                <span className="text-xs text-muted-foreground">{selectedPost.height}px</span>
              </div>
              <Slider
                value={[selectedPost.height]}
                onValueChange={(value) => handleUpdateSelectedPost({ height: value[0] })}
                min={100}
                max={400}
                step={10}
                className="w-full"
                data-testid="slider-edit-post-height"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground">Thickness</span>
                <span className="text-xs text-muted-foreground">{selectedPost.thickness}px</span>
              </div>
              <Slider
                value={[selectedPost.thickness]}
                onValueChange={(value) => handleUpdateSelectedPost({ thickness: value[0] })}
                min={10}
                max={50}
                step={2}
                className="w-full"
                data-testid="slider-edit-post-thickness"
              />
            </div>

            <div>
              <span className="text-sm text-foreground mb-2 block">Color</span>
              <div className="grid grid-cols-5 gap-2">
                {POST_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleUpdateSelectedPost({ color: color.value })}
                    className={`h-8 rounded border-2 transition-all hover-elevate ${
                      selectedPost.color === color.value 
                        ? 'border-primary ring-2 ring-primary/20' 
                        : 'border-border'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.description}
                    data-testid={`edit-color-${color.name.toLowerCase().replace(/\s+/g, '-')}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <Separator />

      {/* Tips */}
      <div className="p-3 bg-muted/50 rounded-md">
        <h6 className="font-medium text-sm text-foreground mb-2">Post Tips</h6>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Click on a post in the canvas to select it</li>
          <li>• Drag posts to reposition them</li>
          <li>• Adjust height for different mounting points</li>
          <li>• Use thickness to match your actual posts</li>
          <li>• Choose colors to match your outdoor space</li>
        </ul>
      </div>
    </div>
  );
}