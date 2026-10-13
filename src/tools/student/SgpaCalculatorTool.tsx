import React, { useState } from 'react';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { useStorage } from '../../context/StorageContext';
import { Plus, Trash2, Calculator, RotateCcw, Award } from 'lucide-react';

interface CourseRow {
  id: string;
  name: string;
  credits: number;
  gradePoint: number;
}

const DEFAULT_GRADE_OPTIONS = [
  { label: 'O (Outstanding) - 10', value: 10 },
  { label: 'A+ (Excellent) - 9', value: 9 },
  { label: 'A (Very Good) - 8', value: 8 },
  { label: 'B+ (Good) - 7', value: 7 },
  { label: 'B (Above Average) - 6', value: 6 },
  { label: 'C (Average) - 5', value: 5 },
  { label: 'P (Pass) - 4', value: 4 },
  { label: 'F (Fail) - 0', value: 0 },
];

export const SgpaCalculatorTool: React.FC = () => {
  const [courses, setCourses] = useState<CourseRow[]>([
    { id: '1', name: 'Data Structures & Algorithms', credits: 4, gradePoint: 10 },
    { id: '2', name: 'Database Management Systems', credits: 4, gradePoint: 9 },
    { id: '3', name: 'Operating Systems', credits: 3, gradePoint: 8 },
    { id: '4', name: 'Discrete Mathematics', credits: 3, gradePoint: 9 },
    { id: '5', name: 'Computer Networks Lab', credits: 2, gradePoint: 10 },
  ]);

  const [scale, setScale] = useState<'10' | '4'>('10');
  const { recordToolUsage } = useStorage();

  const addCourse = () => {
    setCourses((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        name: `Course ${prev.length + 1}`,
        credits: 3,
        gradePoint: scale === '10' ? 8 : 3.5,
      },
    ]);
  };

  const removeCourse = (id: string) => {
    if (courses.length <= 1) return;
    setCourses((prev) => prev.filter((c) => c.id !== id));
  };

  const updateCourse = (id: string, field: keyof CourseRow, value: any) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const resetCourses = () => {
    setCourses([
      { id: '1', name: 'Subject 1', credits: 4, gradePoint: 9 },
      { id: '2', name: 'Subject 2', credits: 3, gradePoint: 8 },
      { id: '3', name: 'Subject 3', credits: 3, gradePoint: 9 },
    ]);
  };

  // Calculations
  const totalCredits = courses.reduce((sum, c) => sum + (Number(c.credits) || 0), 0);
  const totalPoints = courses.reduce(
    (sum, c) => sum + (Number(c.credits) || 0) * (Number(c.gradePoint) || 0),
    0
  );

  const sgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
  const percentage =
    scale === '10'
      ? (parseFloat(sgpa) * 9.5).toFixed(1) + '%'
      : ((parseFloat(sgpa) / 4) * 100).toFixed(1) + '%';

  const handleRecord = () => {
    recordToolUsage('sgpa-calculator', `Calculated SGPA: ${sgpa} (${totalCredits} credits)`);
  };

  return (
    <div className="space-y-6">
      {/* Configuration & Summary Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center gap-4 bg-gradient-to-br from-sky-500 to-blue-600 text-white">
          <div className="p-3 bg-white/20 rounded-xl">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-sky-100 font-semibold">Your SGPA</p>
            <p className="text-3xl font-extrabold">{sgpa}</p>
            <p className="text-xs text-sky-100 mt-0.5">Approx. {percentage} marks</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total Credits</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalCredits}</p>
            <p className="text-xs text-slate-400 mt-0.5">{courses.length} courses entered</p>
          </div>
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300">
            <Calculator className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 space-y-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Grading Scale
          </label>
          <select
            value={scale}
            onChange={(e) => setScale(e.target.value as any)}
            className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          >
            <option value="10">10-Point Scale (Standard UGC / AICTE)</option>
            <option value="4">4.0 GPA Scale (US / International)</option>
          </select>
          <p className="text-[11px] text-slate-400">
            Formula: SGPA = Σ(Credit × Grade) / ΣCredits
          </p>
        </Card>
      </div>

      {/* Courses Table Card */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
              Semester Courses & Grades
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter subject titles, assigned credits, and earned grade points
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={resetCourses} icon={<RotateCcw className="w-3.5 h-3.5" />}>
              Reset
            </Button>
            <Button size="sm" onClick={addCourse} icon={<Plus className="w-3.5 h-3.5" />}>
              Add Subject
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {courses.map((course, index) => (
            <div
              key={course.id}
              className="grid grid-cols-12 gap-2 sm:gap-3 items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
            >
              <div className="col-span-12 sm:col-span-5">
                <input
                  type="text"
                  value={course.name}
                  onChange={(e) => updateCourse(course.id, 'name', e.target.value)}
                  placeholder={`Subject ${index + 1}`}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="col-span-6 sm:col-span-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">Credits:</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={course.credits}
                    onChange={(e) => updateCourse(course.id, 'credits', Math.max(1, Number(e.target.value)))}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="col-span-5 sm:col-span-3">
                {scale === '10' ? (
                  <select
                    value={course.gradePoint}
                    onChange={(e) => updateCourse(course.id, 'gradePoint', Number(e.target.value))}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    {DEFAULT_GRADE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="4"
                    value={course.gradePoint}
                    onChange={(e) => updateCourse(course.id, 'gradePoint', Number(e.target.value))}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                )}
              </div>

              <div className="col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeCourse(course.id)}
                  disabled={courses.length <= 1}
                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-md disabled:opacity-30 transition-colors"
                  title="Delete row"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 flex justify-between items-center text-xs text-slate-500">
          <span>Results update dynamically as you type.</span>
          <Button size="sm" variant="secondary" onClick={handleRecord}>
            Save to History
          </Button>
        </div>
      </Card>
    </div>
  );
};
