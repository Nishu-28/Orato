"use server";

import { generateObject, generateText } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { feedbackSchema } from "@/constants";
import { SavedMessage } from "@/components/Agent";

interface CreateFeedbackParams {
  interviewId: string;
  userId: string;
  transcript: SavedMessage[];
  feedbackId?: string;
  resumeText?: string;
}

export async function createFeedback(params: CreateFeedbackParams) {
  const { interviewId, userId, transcript, feedbackId, resumeText } = params;

  try {
    const formattedTranscript = transcript
      .map(
        (sentence: { role: string; content: string }) =>
          `- ${sentence.role}: ${sentence.content}\n`
      )
      .join("");

    const { object } = await generateObject({
      model: google("gemini-2.0-flash-001", {
        structuredOutputs: false,
      }),
      schema: feedbackSchema,
      prompt: `
        You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
        Transcript:
        ${formattedTranscript}

        Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided:
        - **Communication Skills**: Clarity, articulation, structured responses.
        - **Technical Knowledge**: Understanding of key concepts for the role.
        - **Problem-Solving**: Ability to analyze problems and propose solutions.
        - **Cultural & Role Fit**: Alignment with company values and job role.
        - **Confidence & Clarity**: Confidence in responses, engagement, and clarity.
        `,
      system:
        "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
    });

    let resumeFeedback;
    if (resumeText) {
      // Generate ATS score and feedback for the resume
      const resumePrompt = `You are an AI resume reviewer. Your task is to evaluate the candidate's resume and provide an ATS score (out of 100) and detailed feedback.\nResume:\n${resumeText}\n\nPlease provide:\n1. An ATS score (0-100) - Start your response with \"ATS score: [number]\"\n2. Detailed feedback on strengths and areas for improvement.`;
      const resumeResponse = await generateText({
        model: google("gemini-2.0-flash-001"),
        prompt: resumePrompt,
      });
      const feedbackText = resumeResponse.text || "";
      const atsScoreMatch = feedbackText.match(/ATS score:\s*(\d+)/i);
      const atsScore = atsScoreMatch ? parseInt(atsScoreMatch[1]) : 0;
      resumeFeedback = {
        atsScore,
        feedback: feedbackText,
      };
    }

    const feedback = {
      interviewId: interviewId,
      userId: userId,
      totalScore: object.totalScore,
      categoryScores: object.categoryScores,
      strengths: object.strengths,
      areasForImprovement: object.areasForImprovement,
      finalAssessment: object.finalAssessment,
      createdAt: new Date().toISOString(),
      ...(resumeFeedback ? { resumeFeedback } : {}),
    };

    let feedbackRef;

    if (feedbackId) {
      feedbackRef = db.collection("feedback").doc(feedbackId);
    } else {
      feedbackRef = db.collection("feedback").doc();
    }

    await feedbackRef.set(feedback);

    return { success: true, feedbackId: feedbackRef.id };
  } catch (error) {
    console.error("Error saving feedback:", error);
    return { success: false };
  }
}

export async function getInterviewById(id: string): Promise<Interview | null> {
  const interview = await db.collection("interviews").doc(id).get();

  return interview.data() as Interview | null;
}

export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId, userId } = params;

  // Validate required parameters
  if (!interviewId || !userId) {
    console.warn("Missing required parameters for getFeedbackByInterviewId:", { interviewId, userId });
    return null;
  }

  try {
    const querySnapshot = await db
      .collection("feedback")
      .where("interviewId", "==", interviewId)
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (querySnapshot.empty) return null;

    const feedbackDoc = querySnapshot.docs[0];
    const data = feedbackDoc.data();
    
    if (!data) return null;

    return {
      id: feedbackDoc.id,
      interviewId: data.interviewId,
      userId: data.userId,
      totalScore: data.totalScore || 0,
      categoryScores: data.categoryScores || [],
      strengths: data.strengths || [],
      areasForImprovement: data.areasForImprovement || [],
      finalAssessment: data.finalAssessment || "",
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      resumeFeedback: data.resumeFeedback || { atsScore: 0, feedback: "" }
    } as Feedback;
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return null;
  }
}

export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
  const { userId, limit = 20 } = params;

  const interviews = await db
    .collection("interviews")
    .orderBy("createdAt", "desc")
    .where("finalized", "==", true)
    .where("userId", "!=", userId)
    .limit(limit)
    .get();

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}

export async function getInterviewsByUserId(
  userId: string
): Promise<Interview[] | null> {
  if (!userId) return null;
  const interviews = await db
    .collection("interviews")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}

export const generatePersonalizedQuestions = async (
  resumeText: string,
  jobRole: string,
  jobLevel?: string,
  techStack?: string[]
): Promise<string> => {
  const prompt = `You are an expert interviewer preparing for a${jobLevel ? ` ${jobLevel}` : ""} ${jobRole} interview${techStack && techStack.length ? ` with a tech stack including ${techStack.join(", ")}` : ""}.
Carefully read the following resume and generate at least 5 personalized interview questions.

- Each question should focus on a different aspect of the candidate's resume, such as their projects, skills, work experience, education, certifications, or other notable fields.
- Make sure the questions are highly relevant to the job role, level, and required skills.
- Randomly vary the focus of each question so that not all questions are about the same section.
- Make the questions specific to the actual content in the resume (e.g., ask about particular projects, skills, or experiences mentioned).
- Format each question on a new line, starting with a dash.
- Do not include any extra commentary or text, only the questions.

Resume:
${resumeText}`;

  const response = await generateText({
    model: google("gemini-2.0-flash-001"),
    prompt,
  });
  return response.text || "";
};
