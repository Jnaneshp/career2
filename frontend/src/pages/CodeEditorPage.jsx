import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  ArrowLeft, Play, CheckCircle, XCircle, 
  Loader2, Lightbulb, Code 
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}`;

export default function CodeEditorPage({ currentUser }) {
  const { questionId } = useParams();
  const navigate = useNavigate();
  
  const [question, setQuestion] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    fetchQuestion();
  }, [questionId]);

  // 🧠 Fetch question details
  const fetchQuestion = async () => {
    try {
      const response = await axios.get(`${API}/interview-prep/question/${questionId}`);
      const q = response.data.question;
      setQuestion(q);

      const saved = localStorage.getItem(`code_${questionId}_${language}`);
      if (saved) {
        setCode(saved);
      } else {
        setCode(getStarterCode(q, language));
      }
    } catch (error) {
      console.error('Error fetching question:', error);
      toast.error('Failed to load question');
    }
  };

  // 🧩 Dynamically generate starter code template
  const getStarterCode = (q, lang) => {
    const funcArgs = (q?.input_format || "")
      .split(",")
      .map(arg => arg.split(":")[0].trim())
      .filter(Boolean)
      .join(", ") || "input_data";

    const examples = q?.examples?.[0];
    const sampleInput = examples ? examples.input : "";
    const sampleOutput = examples ? examples.output : "";

    const templates = {
      python: `def solve(${funcArgs}):\n    # Write your code here\n    pass\n\n# Example Test\nprint(solve(${sampleInput}))  # Expected Output: ${sampleOutput}`,
      javascript: `function solve(${funcArgs}) {\n    // Write your code here\n}\n\n// Example Test\nconsole.log(solve(${sampleInput})); // Expected Output: ${sampleOutput}`,
      java: `public class Solution {\n    public static Object solve(${funcArgs}) {\n        // Write your code here\n        return null;\n    }\n    public static void main(String[] args) {\n        System.out.println(solve(${sampleInput})); // Expected: ${sampleOutput}\n    }\n}`,
      cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\n${q.output_format?.includes("vector") ? "vector<int>" : "int"} solve(${funcArgs}) {\n    // Write your code here\n}\n\nint main() {\n    cout << solve(${sampleInput}); // Expected: ${sampleOutput}\n    return 0;\n}`
    };

    return templates[lang] || templates.python;
  };

  // 💾 Auto-save user code in localStorage
  useEffect(() => {
    if (code) {
      localStorage.setItem(`code_${questionId}_${language}`, code);
    }
  }, [code, language, questionId]);

  // 🔄 Language change handler
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    if (question) {
      const saved = localStorage.getItem(`code_${questionId}_${newLang}`);
      setCode(saved || getStarterCode(question, newLang));
    }
  };

  // 🚀 Submit code to backend
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setResult(null);
    
    try {
      const response = await axios.post(`${API}/interview-prep/submit`, {
        student_id: currentUser.id,
        question_id: questionId,
        code: code,
        language: language
      });
      
      setResult(response.data);
      
      if (response.data.status === 'accepted') {
        toast.success('All test cases passed! 🎉');
      } else {
        toast.error('Some test cases failed. Try again!');
      }
    } catch (error) {
      console.error('Error submitting code:', error);
      toast.error('Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!question) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // 🟩 Difficulty color tags
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/interview-prep')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{question.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getDifficultyColor(question.difficulty)}>
                {question.difficulty}
              </Badge>
              <Badge variant="outline">{question.category}</Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-2"
          >
            <Lightbulb className="w-4 h-4" />
            Hint
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Submit Code
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Problem Description */}
        <div className="w-1/2 border-r overflow-y-auto bg-white p-6">
          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold mb-4">Problem Description</h2>
            <p className="text-gray-700 mb-6">{question.description}</p>

            <h3 className="text-lg font-semibold mb-3">Examples</h3>
            {question.examples?.map((example, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg mb-4 font-mono text-sm">
                <div className="mb-2">
                  <strong>Input:</strong> {example.input}
                </div>
                <div className="mb-2">
                  <strong>Output:</strong> {example.output}
                </div>
                {example.explanation && (
                  <div className="text-gray-600 mt-2">
                    <strong>Explanation:</strong> {example.explanation}
                  </div>
                )}
              </div>
            ))}

            <h3 className="text-lg font-semibold mb-3">Constraints</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              {question.constraints?.map((constraint, index) => (
                <li key={index}>{constraint}</li>
              ))}
            </ul>

            {showHint && question.hint && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Hint</h3>
                </div>
                <p className="text-blue-800">{question.hint}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Editor + Results */}
        <div className="w-1/2 flex flex-col h-full overflow-hidden">
          {/* Language Selector */}
          <div className="bg-gray-800 px-4 py-2 flex items-center gap-3">
            <Code className="w-4 h-4 text-gray-400" />
            <select
              className="bg-gray-700 text-white px-3 py-1 rounded text-sm border-none outline-none"
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 border-b overflow-hidden">
            <Editor
              height="100%"
              language={language}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>

          {/* Results Section */}
          {result && (
            <div className="max-h-64 bg-gray-100 border-t overflow-y-auto p-4">
              <div className="flex items-center gap-2 mb-4">
                {result.status === 'accepted' ? (
                  <>
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <h3 className="text-lg font-bold text-green-600">Accepted!</h3>
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6 text-red-600" />
                    <h3 className="text-lg font-bold text-red-600">Wrong Answer</h3>
                  </>
                )}
              </div>

              <div className="mb-4 text-sm text-gray-700">
                <p>Test Cases Passed: <strong>{result.passed}/{result.total}</strong></p>
                <p>Readiness Score: <strong className="text-blue-600">{result.readiness_score}%</strong></p>
              </div>

              <div className="space-y-3">
                {result.test_results?.map((test, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg ${
                      test.passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {test.passed ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <strong className="text-sm">Test Case {index + 1}</strong>
                    </div>
                    {!test.passed && (
                      <div className="text-sm mt-2 space-y-1">
                        <div><strong>Expected:</strong> {test.test_case.expected_output}</div>
                        <div><strong>Got:</strong> {test.output}</div>
                        {test.error && (
                          <div className="text-red-600"><strong>Error:</strong> {test.error}</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
