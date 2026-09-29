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
      <Card className="p-6 bg-slate-panel border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h3 className="text-base font-serif font-semibold text-soft-white">Photo Processing Pipeline</h3>
            <p className="text-xs text-muted mt-0.5">
              Derivative generation, facial landmark analysis, vector embeddings, and indexing
            </p>
          </div>
          <Badge variant={job.progressPercent === 100 ? "Active" : "Processing"}>
            Stage: {job.currentStage}
          </Badge>
        </div>

        {/* Counts Grid */}
        <div className={`grid ${typeof job.failed === 'number' && job.failed > 0 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'} gap-4 my-6`}>
          <div className="p-4 rounded-xl border border-slate-800 bg-midnight/40 text-center">
            <p className="text-xs text-muted font-medium">Total Photos</p>
            <p className="mt-1 text-2xl font-bold text-soft-white font-mono">
              {job.totalPhotos.toLocaleString()}
            </p>
          </div>
          <div className="p-4 rounded-xl border border-slate-800 bg-midnight/40 text-center">
            <p className="text-xs text-muted font-medium">Processed</p>
            <p className="mt-1 text-2xl font-bold text-sage font-mono">
              {job.processed.toLocaleString()}
            </p>
          </div>
          <div className="p-4 rounded-xl border border-slate-800 bg-midnight/40 text-center">
            <p className="text-xs text-muted font-medium">Remaining</p>
            <p className="mt-1 text-2xl font-bold text-muted font-mono">
              {job.remaining.toLocaleString()}
            </p>
          </div>
          {typeof job.failed === "number" && job.failed > 0 && (
            <div className="p-4 rounded-xl border border-coral/30 bg-coral/5 text-center">
              <p className="text-xs text-coral font-medium">Failed</p>
              <p className="mt-1 text-2xl font-bold text-coral font-mono">
                {job.failed.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-soft-white">Overall Completion</span>
            <span className="font-mono text-gold font-bold">
              {job.progressPercent}%
            </span>
          </div>
          <div className="h-3.5 w-full rounded-full bg-midnight overflow-hidden p-0.5 border border-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold/70 via-gold to-sage transition-all duration-500"
              style={{ width: `${job.progressPercent}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Stage Breakdown */}
      <Card className="p-6 bg-slate-panel border-slate-800 shadow-sm">
        <h3 className="text-sm font-semibold text-soft-white mb-4">Pipeline Pipeline Stages</h3>
        <div className="space-y-3">
          {job.stages.map((stage) => {
            const isCompleted = stage.status === "Completed";
            const isProcessing = stage.status === "Processing";
            const isFailed = stage.status === "Failed";

            return (
              <div
                key={stage.name}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800/80 bg-midnight/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${
                      isCompleted
                        ? "bg-sage"
                        : isProcessing
                        ? "bg-gold animate-ping"
                        : isFailed
                        ? "bg-coral"
                        : "bg-slate-700"
                    }`}
                  />
                  <div>
                    <p className="text-xs font-semibold text-soft-white">{stage.name}</p>
                    {stage.detail && (
                      <p className="text-[11px] text-muted">{stage.detail}</p>
                    )}
                  </div>
                </div>
                <span
                  className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    isCompleted
                      ? "bg-sage/15 text-sage border border-sage/25"
                      : isProcessing
                      ? "bg-gold/15 text-gold border border-gold/25"
                      : isFailed
                      ? "bg-coral/15 text-coral border border-coral/25"
                      : "bg-slate-800 text-muted border border-slate-700"
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
