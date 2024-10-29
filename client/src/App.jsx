import { useState } from 'react';
import axios from 'axios';

function App() {
  const [jobDescription, setJobDescription] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false); 

  const handleFileChange = (e) => setResumeFile(e.target.files[0]);

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append('resume', resumeFile);
    formData.append('jobDescription', jobDescription);
     
    setLoading(true);

    try {
      const response = await axios.post('https://resume-analyzer-e14h.onrender.com/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      setResult(response.data);

    } catch (error) {
      console.error("Error analyzing resume:", error);
    }finally {
      setLoading(false); // Set loading to false when request completes
    }
  };

  return (
    <div className="flex flex-col items-center bg-gray-900 text-white min-h-screen p-8 md:flex-row md:justify-center md:space-x-8">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold mb-4 text-center md:text-left">Resume Analyzer</h1>
        <label className="block text-lg font-medium mb-2">Job Description:</label>
        <textarea
          className="w-full p-2 rounded mb-4 bg-gray-700 text-white resize-none h-32 md:h-40 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
          rows="4"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          style={{
            scrollbarWidth: 'thin',
          }}
        />
        <label className="block text-lg font-medium mb-2">Upload your Resume (PDF):</label>
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="w-full mb-4 p-2 border rounded bg-gray-700 text-white"
        />
        <button
          onClick={handleSubmit}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mt-4"
        >
          Analyze Resume
        </button>
      </div>

      {loading ? (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg mt-6 md:mt-0 md:ml-6 w-full max-w-md md:w-1/3">
          <h2 className="text-xl font-bold">Analyzing...</h2>
          <p>Please wait while we analyze your resume.</p>
        </div>
      ) : result && (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg mt-6 md:mt-0 md:ml-6 w-full max-w-md md:w-1/3">
          <h2 className="text-xl font-bold mb-2">Analysis Result</h2>
          <p>Match Score: {result.matchScore}%</p>
          
         {   result.missingSkills.length > 0 && (
          <>
          <p className="mt-2">Missing Skills:</p>
          <ul className="list-disc list-inside">
            {result.missingSkills.map((skill, index) => (
              <li key={index}>{skill}</li>
            ))}
          </ul>
            </>

        ) }
          
          <p className="mt-4 font-semibold">{result.suggestion}</p>
        </div>
      )}
    </div>
  );
}

export default App;
