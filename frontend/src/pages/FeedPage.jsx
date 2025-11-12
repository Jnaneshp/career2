// src/pages/FeedPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import PostCard from "@/components/PostCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, FileText } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function FeedPage({ currentUser }) {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [postType, setPostType] = useState("text");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ✅ Fetch feed with personalization
  const fetchFeed = async () => {
    if (!currentUser?.id) return;

    try {
      const res = await axios.get(`${BACKEND_URL}/posts/feed`, {
        params: { user_id: currentUser.id, limit: 30 },
      });
      setPosts(res.data.posts || []);
    } catch (err) {
      console.error("⚠️ Error fetching feed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setMediaFile(file || null);
    if (file && file.type.startsWith("video/")) setPostType("video");
    else if (file && file.type.startsWith("image/")) setPostType("article");
  };

  const handleCreatePost = async () => {
    if (!content.trim() && !mediaFile) return alert("Please add content or media");

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

      setContent("");
      setMediaFile(null);
      setPostType("text");
      fetchFeed();
    } catch (err) {
      console.error("⚠️ Error creating post:", err);
      alert("Failed to create post");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
        Loading your personalized feed...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100">
      {/* 🔹 Sticky Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-xl font-bold text-gray-900">
              Your Personalized Feed
            </h1>
          </div>
          <FileText className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* 🔹 Feed Body */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Create Post Section */}
        <Card className="p-4 shadow-md border border-gray-200 bg-white/95 hover:shadow-lg transition">
          <h2 className="text-lg font-semibold mb-2 text-gray-800">
            Share something with your network
          </h2>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share an update, article, or video..."
            rows={3}
            className="focus:ring-2 focus:ring-blue-500 bg-white border-gray-300"
          />

          <div className="flex items-center gap-3 mt-3">
            {/* File Upload */}
            <label className="flex items-center gap-2 cursor-pointer text-gray-600 hover:text-blue-600 transition">
              <Upload className="w-4 h-4" />
              <span>Upload Media</span>
              <Input type="file" onChange={handleFileChange} className="hidden" />
            </label>

            {/* Type Selector */}
            <select
              className="border rounded px-2 py-1 text-sm text-gray-700 bg-white focus:ring-blue-500"
              value={postType}
              onChange={(e) => setPostType(e.target.value)}
            >
              <option value="text">Text</option>
              <option value="article">Article</option>
              <option value="video">Video</option>
            </select>

            {/* Post Button */}
            <Button
              onClick={handleCreatePost}
              className="ml-auto bg-blue-600 hover:bg-blue-700 text-white shadow-md"
            >
              Post
            </Button>
          </div>
        </Card>

        {/* 🔹 Posts Section */}
        <div className="space-y-5 pb-8">
          {posts.length === 0 ? (
            <div className="text-center text-gray-500 py-12 border border-dashed rounded-lg bg-white/60">
              <p className="text-gray-600 font-medium">
                No posts yet — start the conversation!
              </p>
              <p className="text-sm text-gray-400">
                Posts from users with similar skills or interests will appear here.
              </p>
            </div>
          ) : (
            posts.map((p) => (
              <div
                key={p._id}
                className="transition-all transform hover:scale-[1.01] hover:shadow-md"
              >
                <PostCard post={p} currentUser={currentUser} refreshFeed={fetchFeed} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
