import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import {
  getFeedbackByInterviewId,
  getInterviewById,
} from "@/lib/actions/general.action";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/actions/auth.action";

const Feedback = async ({ params }: RouteParams) => {
  const { id } = await params;
  const user = await getCurrentUser();

  const interview = await getInterviewById(id);
  if (!interview) redirect("/");

  const feedback = await getFeedbackByInterviewId({
    interviewId: id,
    userId: user?.id ?? '',
  });

  return (
    <section className="section-feedback">
      {/* Title */}
      <div className="flex flex-row justify-center mb-2">
        <h1 className="text-4xl font-semibold text-center">
          Feedback on the Interview - <span className="capitalize">{interview.role}</span> Interview
        </h1>
      </div>

      {/* Overall Impression and Date */}
      <div className="flex flex-row justify-center mb-2">
        <div className="flex flex-row gap-5">
          {/* Overall Impression */}
          <div className="flex flex-row gap-2 items-center">
            <Image src="/star.svg" width={22} height={22} alt="star" />
            <p>
              Overall Impression: <span className="text-primary-200 font-bold">{feedback?.totalScore}</span>/100
            </p>
          </div>
          {/* Date */}
          <div className="flex flex-row gap-2">
            <Image src="/calendar.svg" width={22} height={22} alt="calendar" />
            <p>
              {feedback?.createdAt
                ? dayjs(feedback.createdAt).format("MMM D, YYYY h:mm A")
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Final Assessment */}
      <div className="mb-2">
        <p>{feedback?.finalAssessment}</p>
      </div>

      {/* Breakdown of the Interview */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-2">Breakdown of the Interview:</h2>
        <div className="flex flex-col gap-4">
          {feedback?.categoryScores?.map((category, index) => (
            <div key={index}>
              <p className="font-bold">
                {index + 1}. {category.name} <span className="font-normal">({category.score}/100)</span>
              </p>
              <p>{category.comment}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths */}
      <div className="mb-4">
        <h3 className="font-bold mb-1">Strengths</h3>
        <ul className="list-disc list-inside ml-4">
          {feedback?.strengths?.map((strength, index) => (
            <li key={index}>{strength}</li>
          ))}
        </ul>
      </div>

      {/* Areas for Improvement */}
      <div className="mb-4">
        <h3 className="font-bold mb-1">Areas for Improvement</h3>
        <ul className="list-disc list-inside ml-4">
          {feedback?.areasForImprovement?.map((area, index) => (
            <li key={index}>{area}</li>
          ))}
        </ul>
      </div>

      {/* Buttons */}
      <div className="buttons mt-8">
        <Button className="btn-secondary flex-1">
          <Link href="/" className="flex w-full justify-center">
            <p className="text-sm font-semibold text-primary-200 text-center">
              Back to dashboard
            </p>
          </Link>
        </Button>
        <Button className="btn-primary flex-1">
          <Link
            href={`/interview/${id}`}
            className="flex w-full justify-center"
          >
            <p className="text-sm font-semibold text-black text-center">
              Retake Interview
            </p>
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default Feedback;
