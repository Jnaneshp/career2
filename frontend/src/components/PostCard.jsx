import { useState } from "react";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function PostCard({ post, currentUser, refreshFeed }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [likes, setLikes] = useState(Array.isArray(post.likes) ? post.likes : []);
  const [comments, setComments] = useState(Array.isArray(post.comments) ? post.comments : []);
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);

  const userId = currentUser?.id || currentUser?._id;
  const liked = Array.isArray(likes) && likes.includes(userId);

  // ✅ Like toggle
  const toggleLike = async () => {
    if (!userId) return alert("Please log in to like posts");
    setIsLiking(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/posts/like/${post._id}/${userId}`);
      const { liked: newLiked } = res.data;

      setLikes((prev) => {
        if (!Array.isArray(prev)) return [];
        if (newLiked) return [...prev, userId];
        return prev.filter((id) => id !== userId);
      });

      if (refreshFeed) refreshFeed();
    } catch (err) {
      console.error("⚠️ Like error:", err);
      alert("Failed to like post");
    } finally {
      setIsLiking(false);
    }
  };

  // ✅ Add comment
  const submitComment = async () => {
    if (!commentText.trim()) return;
    if (!userId) return alert("Please log in to comment");

    setIsCommenting(true);
    try {
      const form = new FormData();
      form.append("user_id", userId);
      form.append("user_name", currentUser?.name || "Anonymous");
      form.append("text", commentText);

      const res = await axios.post(`${BACKEND_URL}/posts/comment/${post._id}`, form);
      const newComment = res.data.comment;

      setComments((prev) => [newComment, ...prev]);
      setCommentText("");
      setShowComments(true);
      if (refreshFeed) refreshFeed();
    } catch (err) {
      console.error("⚠️ Comment error:", err);
      alert("Failed to add comment");
    } finally {
      setIsCommenting(false);
    }
  };

  return (
    <Card className="p-5 mb-4 bg-white shadow-sm border border-gray-100 hover:shadow-md transition-all rounded-xl">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
          {post.author_name?.charAt(0)?.toUpperCase() || "U"}
        </div>

        <div className="flex-1">
          {/* Author + Time */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-gray-900">{post.author_name}</div>
              <div className="text-xs text-gray-500">
                {post.created_at ? new Date(post.created_at).toLocaleString() : ""}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {Array.isArray(likes) ? likes.length : 0} ❤️
            </div>
          </div>

          {/* Post Content */}
          <p className="mt-3 text-sm whitespace-pre-wrap text-gray-800 leading-relaxed">
            {post.content}
          </p>

          {/* Post Type Label */}
          {post.post_type !== "text" && (
            <span className="text-xs text-gray-500 mt-2 inline-block">
              {post.post_type === "video" ? "🎥 Video Post" : "📰 Article"}
            </span>
          )}

          {/* Media Section (LinkedIn style) */}
          {post.media_url && (
            <div className="mt-4 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
              {post.post_type === "video" ? (
                <div className="relative w-full pb-[56.25%] bg-black">
                  <video
                    controls
                    src={post.media_url}
                    className="absolute top-0 left-0 w-full h-full object-cover"
                  />
                </div>
              ) : (
                <img
                  src={post.media_url}
                  alt="Post media"
                  className="w-full h-auto object-cover transition-transform duration-300 hover:scale-[1.02]"
                  loading="lazy"
                />
              )}
            </div>
          )}

          {/* Like / Comment Buttons */}
          <div className="mt-4 flex gap-4">
            <Button
              variant="ghost"
              disabled={isLiking}
              onClick={toggleLike}
              className={`${
                liked ? "text-red-600" : "text-gray-700"
              } hover:bg-gray-100 transition flex items-center gap-1`}
            >
              {liked ? "❤️ Liked" : "🤍 Like"}
            </Button>

            <Button
              variant="ghost"
              onClick={() => setShowComments((prev) => !prev)}
              className="text-gray-700 hover:bg-gray-100 transition flex items-center gap-1"
            >
              💬 Comments ({Array.isArray(comments) ? comments.length : 0})
            </Button>
          </div>

          {/* Comments Section */}
          {showComments && (
            <div className="mt-4 border-t pt-3">
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(Array.isArray(comments) ? comments : []).map((c) => (
                  <div key={c.id} className="text-sm border-b pb-2">
                    <div className="font-medium text-gray-900">{c.user_name}</div>
                    <div className="text-gray-700">{c.text}</div>
                    <div className="text-xs text-gray-400">
                      {c.timestamp ? new Date(c.timestamp).toLocaleString() : ""}
                    </div>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-xs text-gray-400">No comments yet.</p>
                )}
              </div>

              {/* Comment Input */}
              <div className="mt-3 flex gap-2">
                <Input
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={submitComment}
                  disabled={isCommenting}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  {isCommenting ? "Posting..." : "Send"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
