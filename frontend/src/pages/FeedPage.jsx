// src/pages/FeedPage.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import PostCard from "@/components/PostCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL; // e.g. http://localhost:8000/api

export default function FeedPage({ currentUser }) {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [postType, setPostType] = useState("text");
  const [loading, setLoading] = useState(true);

  const fetchFeed = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/posts/feed`, { params: { limit: 30 } });
      setPosts(res.data.posts || []);
    } catch (err) {
      console.error("Error fetching feed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const handleFileChange = (e) => {
    setMediaFile(e.target.files?.[0] || null);
    // optionally set postType to video if file type includes 'video'
    const f = e.target.files?.[0];
    if (f && f.type.startsWith("video/")) setPostType("video");
  };

  const handleCreatePost = async () => {
    if (!content.trim() && !mediaFile) return;

    try {
      const form = new FormData();
      form.append("author_id", currentUser.id);
      form.append("author_name", currentUser.name);
      form.append("content", content);
      form.append("post_type", postType);
      if (mediaFile) form.append("media", mediaFile);

      await axios.post(`${BACKEND_URL}/posts/create`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Clear form and refresh feed
      setContent("");
      setMediaFile(null);
      setPostType("text");
      fetchFeed();
    } catch (err) {
      console.error("Error creating post:", err);
      alert("Failed to create post");
    }
  };

  if (loading) {
    return <div className="text-center mt-10 text-gray-500">Loading feed...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <Card className="p-4 mb-6">
          <h2 className="text-lg font-semibold mb-2">Share something</h2>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share an update, article or short video..."
            rows={4}
          />
          <div className="flex items-center gap-2 mt-3">
            <Input type="file" onChange={handleFileChange} />
            <select
              className="border rounded px-2 py-1"
              value={postType}
              onChange={(e) => setPostType(e.target.value)}
            >
              <option value="text">Text</option>
              <option value="article">Article</option>
              <option value="video">Video</option>
            </select>
            <Button onClick={handleCreatePost} className="ml-auto bg-blue-600 text-white">
              Post
            </Button>
          </div>
        </Card>

        <div className="space-y-4">
          {posts.length === 0 && (
            <div className="text-center text-gray-400">No posts yet — be the first to share!</div>
          )}
          {posts.map((p) => (
            <PostCard key={p._id} post={p} currentUser={currentUser} refreshFeed={fetchFeed} />
          ))}
        </div>
      </div>
    </div>
  );
}
