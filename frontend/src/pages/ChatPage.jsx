import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Video } from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function ChatPage({ currentUser }) {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const ws = useRef(null);
  const reconnectTimer = useRef(null);
  const hasConnected = useRef(false);
  const endRef = useRef(null);

  // ✅ Fetch chat history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/chat/history/${roomId}`);
        setMessages(res.data.messages || []);
      } catch (err) {
        console.error("⚠️ Failed to load chat history:", err);
      }
    };
    if (roomId) fetchHistory();
  }, [roomId]);

  // ✅ Build correct WebSocket URL
  const getWebSocketURL = () => {
    const base = BACKEND_URL.replace("http://", "ws://")
      .replace("https://", "wss://")
      .replace(/\/api$/, "");
    return `${base}/api/chat/ws/${roomId}/${currentUser.id}`;
  };

  // ✅ Connect WebSocket once
  const connectWebSocket = () => {
    if (hasConnected.current) {
      console.log("⚠️ WebSocket already connected — skipping duplicate");
      return;
    }
    hasConnected.current = true;

    const wsURL = getWebSocketURL();
    console.log("🔗 Connecting WebSocket:", wsURL);
    ws.current = new WebSocket(wsURL);

    ws.current.onopen = () => console.log("✅ Chat connected");

    ws.current.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.sender_id === msg.sender_id && last.message === msg.message) {
            return prev;
          }
          return [...prev, msg];
        });
      } catch (err) {
        console.error("⚠️ Error parsing message:", err);
      }
    };

    ws.current.onerror = (e) => {
      console.error("⚠️ WebSocket error:", e);
    };

    ws.current.onclose = (e) => {
      hasConnected.current = false;
      if (!e.wasClean) {
        console.warn("🔌 Chat disconnected. Retrying in 3s...");
        reconnectTimer.current = setTimeout(connectWebSocket, 3000);
      }
    };
  };

  // ✅ Initialize connection
  useEffect(() => {
    if (!currentUser || !roomId) return;
    connectWebSocket();

    return () => {
      console.log("🧹 Cleaning up WebSocket");
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
      hasConnected.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [roomId, currentUser?.id]);

  // ✅ Auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ Send message
  const sendMessage = () => {
    if (!input.trim()) return;

    const messageData = {
      sender_id: currentUser.id,
      message: input.trim(),
      timestamp: new Date().toISOString(),
    };

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(messageData));
      setInput("");
    } else {
      console.warn("⚠️ WebSocket not open");
    }
  };

  const handleBack = () => navigate(-1);

  // ✅ Navigate to video call
  const handleVideoCall = () => {
    navigate(`/video-call/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col items-center py-8 px-4">
      <Card className="w-full max-w-2xl h-[80vh] flex flex-col shadow-lg rounded-2xl overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="text-white hover:bg-blue-700"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              Back
            </Button>
            <h1 className="font-semibold text-lg">Mentor-Mentee Chat 💬</h1>
          </div>
          {/* ✅ Video Call Button */}
          <Button
            onClick={handleVideoCall}
            className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-1"
          >
            <Video className="w-4 h-4" />
            Video Call
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 mt-10">
              No messages yet. Start the conversation 👋
            </div>
          )}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.sender_id === currentUser.id
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`px-4 py-2 rounded-xl max-w-xs break-words text-sm shadow-sm ${
                  msg.sender_id === currentUser.id
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-100 text-gray-900 rounded-bl-none"
                }`}
              >
                {msg.message}
                <div className="text-[10px] opacity-70 mt-1 text-right">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))}
          <div ref={endRef}></div>
        </div>

        {/* Input Box */}
        <div className="border-t bg-gray-50 p-3 flex gap-2 items-center">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <Button
            onClick={sendMessage}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
          >
            Send
          </Button>
        </div>
      </Card>
    </div>
  );
}
