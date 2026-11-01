import React from 'react';
import { ConcentricRings } from './ConcentricRings';
import { CircularProgressIndicator } from './CircularProgressIndicator';
import { EnergyWave } from './EnergyWave';
import { SourceFileCard } from './SourceFileCard';
import { OutputFileCard } from './OutputFileCard';
import { TransformationSuccess } from './TransformationSuccess';
import { FinalResultCard } from './FinalResultCard';
import { AIIntentBanner } from './AIIntentBanner';
import { ProcessedFile } from '../../../services/ai/toolRegistry';
import { ExecutionPlan, ExecutionStep } from '../../../services/ai/workflowEngine';
import { RotateCcw, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '../../common/Button';

export interface FileTransformationAnimationProps {
  isAnalyzing?: boolean;
  isExecuting: boolean;
  progress: number;
  statusMessage: string;
  subMessage?: string;
  sourceFiles: File[];
  sourcePreviews: { id: string; name: string; size: number; type: string; url?: string }[];
  outputFiles: ProcessedFile[];
  textOutput?: string | null;
  errorMessage?: string | null;
  currentPlan?: ExecutionPlan | null;
  activeStep?: ExecutionStep;
  durationMs?: number;
  onReset: () => void;
  onContinueWithAI: (file: ProcessedFile) => void;
  onPreviewFile?: (file: ProcessedFile) => void;
  onRetry?: () => void;
}

export const FileTransformationAnimation: React.FC<FileTransformationAnimationProps> = ({
  isAnalyzing = false,
  isExecuting,
  progress,
  statusMessage,
  subMessage,
  sourceFiles,
  sourcePreviews,
  outputFiles,
  textOutput,
  errorMessage,
  currentPlan,
  activeStep,
  durationMs,
  onReset,
  onContinueWithAI,
  onPreviewFile,
  onRetry,
}) => {
  const isCompleted = !isAnalyzing && !isExecuting && !errorMessage && (outputFiles.length > 0 || !!textOutput);

  // Derive target format hint from plan or active step
  let targetFormatHint = 'Output Artifact';
  if (currentPlan && currentPlan.steps.length > 0) {
    const lastStep = currentPlan.steps[currentPlan.steps.length - 1];
    if (lastStep.toolId === 'image-converter') {
      targetFormatHint = `${lastStep.parameters.format?.toUpperCase() || 'IMAGE'} File`;
    } else if (lastStep.toolId === 'images-to-pdf' || lastStep.toolId === 'pdf-merge' || lastStep.toolId === 'pdf-split') {
      targetFormatHint = 'PDF Document';
    } else if (lastStep.toolId === 'file-zip-create') {
      targetFormatHint = 'ZIP Archive';
    } else if (lastStep.toolId === 'image-compressor') {
      targetFormatHint = `Optimized Image ${lastStep.parameters.targetKb ? `(<${lastStep.parameters.targetKb}KB)` : ''}`;
    } else if (lastStep.toolId === 'dev-json-formatter') {
      targetFormatHint = 'Formatted JSON';
    } else {
      targetFormatHint = lastStep.toolName;
    }
  }

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-slate-200/90 dark:border-slate-800 shadow-xl bg-gradient-to-b from-blue-50/70 via-white to-sky-50/50 dark:from-slate-900/90 dark:via-[#0c1222] dark:to-slate-950 p-4 sm:p-7 select-none transition-all">
      {/* Background Concentric Rings & Soft Radial Glow */}
      <ConcentricRings isAnalyzing={isAnalyzing} isCompleted={isCompleted} />

      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center space-y-5">
        {/* Top Header Badge */}
        <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              isCompleted
                ? 'bg-emerald-500'
                : isAnalyzing
                ? 'bg-violet-600 animate-ping'
                : isExecuting
                ? 'bg-blue-600 animate-ping'
                : errorMessage
                ? 'bg-rose-500'
                : 'bg-slate-400'
            }`}
          />
          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            {isAnalyzing && <Sparkles className="w-3.5 h-3.5 text-violet-500 animate-spin-slow" />}
            {isCompleted
              ? 'Transformation Completed'
              : isAnalyzing
              ? 'AI Intent Understanding & Reasoning'
              : isExecuting
              ? 'AI Engine Synthesizing'
              : errorMessage
              ? 'Execution Error'
              : 'Transformation Stage'}
          </span>
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
            • {isAnalyzing ? 'Google Gemini AI Backend' : '100% Client-Side Engine'}
          </span>
        </div>

        {/* AI Intent Comprehension Banner (Shows what AI understood before and during execution) */}
        {(currentPlan?.understoodIntent || isAnalyzing) && (
          <div className="w-full max-w-2xl">
            <AIIntentBanner
              plan={currentPlan}
              isAnalyzing={isAnalyzing}
              isExecuting={isExecuting}
              isCompleted={isCompleted}
            />
          </div>
        )}

        {/* Horizontal Layout for Desktop / Tablet */}
        <div className="hidden md:flex w-full items-center justify-center gap-2 lg:gap-4 my-2">
          {/* Left: Source File Card */}
          <div className="flex-shrink-0">
            <SourceFileCard
              files={sourceFiles}
              previews={sourcePreviews}
              instruction={currentPlan?.userPrompt}
            />
          </div>

          {/* Left Energy Wave */}
          <div className="flex-1 flex justify-center min-w-0">
            <EnergyWave isVertical={false} isAnalyzing={isAnalyzing} isCompleted={isCompleted} />
          </div>

          {/* Center: Circular Progress Indicator */}
          <div className="flex-shrink-0 px-2">
            <CircularProgressIndicator
              progress={progress}
              isAnalyzing={isAnalyzing}
              isCompleted={isCompleted}
              statusMessage={statusMessage}
              subMessage={subMessage}
            />
          </div>

          {/* Right Energy Wave */}
          <div className="flex-1 flex justify-center min-w-0">
            <EnergyWave isVertical={false} isAnalyzing={isAnalyzing} isCompleted={isCompleted} />
          </div>

          {/* Right: Output File Card */}
          <div className="flex-shrink-0">
            <OutputFileCard
              isExecuting={isExecuting || isAnalyzing}
              isCompleted={isCompleted}
              outputFiles={outputFiles}
              textOutput={textOutput}
              errorMessage={errorMessage}
              targetFormatHint={isAnalyzing ? 'Analyzing Intent...' : targetFormatHint}
              onPreview={onPreviewFile}
            />
          </div>
        </div>

        {/* Vertical Stacked Layout for Mobile Screens */}
        <div className="flex md:hidden flex-col items-center w-full space-y-3">
          {/* Top: Source File Card */}
          <div className="w-full flex justify-center">
            <SourceFileCard
              files={sourceFiles}
              previews={sourcePreviews}
              instruction={currentPlan?.userPrompt}
            />
          </div>

          {/* Downward Energy Wave 1 */}
          <EnergyWave isVertical isAnalyzing={isAnalyzing} isCompleted={isCompleted} />

          {/* Center: Circular Progress Indicator */}
          <CircularProgressIndicator
            progress={progress}
            isAnalyzing={isAnalyzing}
            isCompleted={isCompleted}
            statusMessage={statusMessage}
            subMessage={subMessage}
          />

          {/* Downward Energy Wave 2 */}
          <EnergyWave isVertical isAnalyzing={isAnalyzing} isCompleted={isCompleted} />

          {/* Bottom: Output File Card */}
          <div className="w-full flex justify-center">
            <OutputFileCard
              isExecuting={isExecuting || isAnalyzing}
              isCompleted={isCompleted}
              outputFiles={outputFiles}
              textOutput={textOutput}
              errorMessage={errorMessage}
              targetFormatHint={isAnalyzing ? 'Analyzing Intent...' : targetFormatHint}
              onPreview={onPreviewFile}
            />
          </div>
        </div>

        {/* Error State Retry Banner */}
        {errorMessage && (
          <div className="w-full max-w-lg p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-center justify-between text-xs gap-3 animate-scale-bounce">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            {onRetry && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onRetry}
                className="text-xs font-bold bg-white dark:bg-slate-900 flex-shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Retry
              </Button>
            )}
          </div>
        )}

        {/* Success Banner */}
        {isCompleted && (
          <TransformationSuccess
            durationMs={durationMs}
            outputCount={outputFiles.length}
          />
        )}

        {/* Final Results & Action Controls */}
        {isCompleted && (
          <FinalResultCard
            files={outputFiles}
            textOutput={textOutput}
            onReset={onReset}
            onContinueWithAI={onContinueWithAI}
            onPreviewFile={onPreviewFile}
          />
        )}
      </div>
    </div>
  );
};

export default FileTransformationAnimation;
