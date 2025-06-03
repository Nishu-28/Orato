"use client";

import React, { useState } from "react";
import Agent from "@/components/Agent";
import ResumeUpload from "@/components/ResumeUpload";

interface InterviewContentProps {
  userName: string;
  userId: string;
  interviewId: string;
  questions: string[];
  feedbackId?: string;
  jobRole: string;
  jobLevel?: string;
  techStack?: string[];
}

const InterviewContent = ({
  userName,
  userId,
  interviewId,
  questions,
  feedbackId,
  jobRole,
  jobLevel,
  techStack,
}: InterviewContentProps) => {
  const [resumeText, setResumeText] = useState<string>("");

  const handleResumeUpload = (text: string) => {
    setResumeText(text);
  };

  return (
    <>
      <ResumeUpload onResumeUpload={handleResumeUpload} />

      <Agent
        userName={userName}
        userId={userId}
        interviewId={interviewId}
        type="interview"
        questions={questions}
        feedbackId={feedbackId}
        resumeText={resumeText}
        jobRole={jobRole}
        jobLevel={jobLevel}
        techStack={techStack}
      />
    </>
  );
};

export default InterviewContent; 