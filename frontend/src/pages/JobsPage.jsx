import { useState, useEffect } from "react";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function JobsPage({ currentUser }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const userSkills = currentUser?.skills?.join(",") || "developer";
        const res = await axios.get(`${BACKEND_URL}/jobs/recommendations`, {
          params: { skills: userSkills, location: "India" },
        });
        setJobs(res.data.jobs || []);
      } catch (err) {
        console.error("⚠️ Error fetching jobs:", err);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) fetchJobs();
  }, [currentUser]);

  const handleBack = () => navigate(-1);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-500">
        <p>Loading job recommendations...</p>
        <Button
          onClick={handleBack}
          variant="outline"
          className="mt-4 text-blue-600 border-blue-500 hover:bg-blue-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          💼 Recommended Jobs for You
        </h1>
        <Button
          onClick={handleBack}
          variant="outline"
          className="text-blue-600 border-blue-500 hover:bg-blue-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {jobs.length === 0 ? (
        <p className="text-center text-gray-500">
          No jobs found. Try updating your skills!
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map((job, idx) => (
            <Card
              key={idx}
              className="p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
            >
              <h2 className="text-lg font-semibold text-gray-900">
                {job.title}
              </h2>
              <p className="text-sm text-gray-600">{job.company}</p>
              <p className="text-sm text-gray-500">{job.location}</p>
              <p className="text-xs text-gray-400 mt-2">
                {job.employment_type}
              </p>
              <p className="text-sm text-gray-700 mt-3">
                {job.description}...
              </p>
              <a href={job.apply_link} target="_blank" rel="noreferrer">
                <Button className="mt-4 w-full bg-blue-600 text-white hover:bg-blue-700">
                  Apply Now
                </Button>
              </a>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
