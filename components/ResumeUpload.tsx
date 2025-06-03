import React, { useState } from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import type { TextItem } from "pdfjs-dist/types/src/display/api";
import mammoth from "mammoth";

// Initialize PDF.js worker
if (typeof window !== 'undefined') {
  GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

interface ResumeUploadProps {
  onResumeUpload: (text: string) => void;
}

const ResumeUpload: React.FC<ResumeUploadProps> = ({ onResumeUpload }) => {
  const [resumeText, setResumeText] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileType = file.type;
    let text = "";

    try {
      if (fileType === "application/pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await getDocument({ data: arrayBuffer }).promise;
        
        try {
          for (let i = 1; i <= pdf.numPages; i++) {
            try {
              const page = await pdf.getPage(i);
              const content = await page.getTextContent();
              const pageText = content.items
                .filter((item): item is TextItem => 'str' in item)
                .map((item) => item.str)
                .join(" ")
                .trim();
              text += pageText + "\n";
            } catch (pageError) {
              console.error(`Error parsing page ${i}:`, pageError);
              // Continue with next page even if one fails
            }
          }
        } catch (pdfError) {
          console.error("Error processing PDF:", pdfError);
          throw new Error("Failed to process PDF file. Please ensure it's not corrupted.");
        }
      } else if (fileType === "application/msword" || fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      } else {
        setError("Unsupported file type. Please upload a PDF or DOC file.");
        return;
      }
      
      if (!text.trim()) {
        throw new Error("No text content could be extracted from the file.");
      }
      
      setResumeText(text);
      onResumeUpload(text);
      setError("");
    } catch (err) {
      console.error("File processing error:", err);
      setError(err instanceof Error ? err.message : "Error parsing file. Please try again.");
    }
  };

  return (
    <div className="mb-4">
      <h3>Upload Resume (Optional)</h3>
      <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileUpload} />
      {error && <p className="text-red-500">{error}</p>}
      {resumeText && <p>Resume uploaded successfully!</p>}
    </div>
  );
};

export default ResumeUpload; 