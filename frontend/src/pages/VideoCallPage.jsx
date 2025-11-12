import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function VideoCallPage({ currentUser }) {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const iframeRef = useRef(null);

  // Create a unique but shared room name
  const roomName = `careerconnect-${roomId}`;

  useEffect(() => {
    // Scroll to top when loaded
    window.scrollTo(0, 0);
  }, []);

  const jitsiURL = `https://meet.jit.si/${roomName}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col items-center py-6 px-4">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-xl shadow">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="text-white hover:bg-blue-700"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="mr-2 h-5 w-5" /> Back
            </Button>
            <h1 className="font-semibold text-lg">Video Call with Mentor/Mentee 📹</h1>
          </div>
        </div>

        {/* Jitsi Iframe */}
        <iframe
          ref={iframeRef}
          src={jitsiURL}
          allow="camera; microphone; fullscreen; display-capture"
          style={{
            width: "100%",
            height: "80vh",
            border: 0,
            borderRadius: "0 0 0.75rem 0.75rem",
          }}
          title="Jitsi Video Call"
        ></iframe>
      </div>
    </div>
  );
}
