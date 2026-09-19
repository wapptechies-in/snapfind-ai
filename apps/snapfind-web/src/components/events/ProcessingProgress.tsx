import React from "react";
import { Badge, Card } from "../common";
import type { ProcessingJob } from "../../types";

interface ProcessingProgressProps {
  job: ProcessingJob;
}

export const ProcessingProgress: React.FC<ProcessingProgressProps> = ({ job }) => {
  return (
    <div className="space-y-6">
      {/* Progress Overview Card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-hairline">
          <div>
            <h3 className="text-base font-semibold text-cloud">Photo Processing Pipeline</h3>
            <p className="text-xs text-dim mt-0.5">
              Derivative generation, facial landmark analysis, vector embeddings, and cloud synchronization
            </p>
          </div>
          <Badge variant={job.progressPercent === 100 ? "Active" : "Processing"}>
            Stage: {job.currentStage}
          </Badge>
        </div>

        {/* Counts Grid */}
        <div className="grid grid-cols-3 gap-4 my-6">
          <div className="p-4 rounded-xl border border-hairline bg-panel2/40 text-center">
            <p className="text-xs text-dim font-medium">Total Photos</p>
            <p className="mt-1 text-2xl font-bold text-cloud font-mono">
              {job.totalPhotos.toLocaleString()}
            </p>
          </div>
          <div className="p-4 rounded-xl border border-hairline bg-panel2/40 text-center">
            <p className="text-xs text-dim font-medium">Processed</p>
            <p className="mt-1 text-2xl font-bold text-good font-mono">
              {job.processed.toLocaleString()}
            </p>
          </div>
          <div className="p-4 rounded-xl border border-hairline bg-panel2/40 text-center">
            <p className="text-xs text-dim font-medium">Remaining</p>
            <p className="mt-1 text-2xl font-bold text-dim font-mono">
              {job.remaining.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-cloud">Overall Completion</span>
            <span className="font-mono text-violet-light font-bold">
              {job.progressPercent}%
            </span>
          </div>
          <div className="h-3.5 w-full rounded-full bg-panel2 overflow-hidden p-0.5 border border-hairline">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet via-violet-light to-good transition-all duration-500"
              style={{ width: `${job.progressPercent}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Pipeline Stages Breakdown */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-cloud mb-4">Pipeline Stages</h3>

        <div className="space-y-3">
          {job.stages.map((stage) => {
            const isCompleted = stage.status === "Completed";
            const isProcessing = stage.status === "Processing";
            const isFailed = stage.status === "Failed";

            return (
              <div
                key={stage.name}
                className="flex items-center justify-between p-3.5 rounded-lg border border-hairline bg-panel2/30"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      isCompleted
                        ? "bg-good/20 text-good"
                        : isProcessing
                        ? "bg-violet/20 text-violet-light animate-pulse"
                        : isFailed
                        ? "bg-bad/20 text-bad"
                        : "bg-panel2 text-dim"
                    }`}
                  >
                    {isCompleted ? "✓" : isProcessing ? "⟳" : isFailed ? "✕" : "•"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-cloud">{stage.name}</p>
                    {stage.detail && (
                      <p className="text-xs text-dim mt-0.5">{stage.detail}</p>
                    )}
                  </div>
                </div>

                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    isCompleted
                      ? "text-good bg-good/10"
                      : isProcessing
                      ? "text-violet-light bg-violet/10 animate-pulse font-semibold"
                      : isFailed
                      ? "text-bad bg-bad/10 font-semibold"
                      : "text-dim bg-panel2"
                  }`}
                >
                  {stage.status}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

