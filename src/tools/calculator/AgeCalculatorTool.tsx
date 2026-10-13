import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useStorage } from '../../context/StorageContext';
import { Calendar, Clock, Heart, Award, Sparkles } from 'lucide-react';

interface AgeSuccessResult {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalWeeks: number;
  totalHours: number;
  totalMinutes: number;
  approxHeartbeats: number;
  daysToNextBday: number;
  nextBdayDayName: string;
  zodiac: string;
}

type AgeCalculationOutcome =
  | { success: true; data: AgeSuccessResult }
  | { success: false; error: string }
  | null;

export const AgeCalculatorTool: React.FC = () => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [dob, setDob] = useState<string>('2000-01-01');
  const [asOfDate, setAsOfDate] = useState<string>(todayStr);

  const { recordToolUsage } = useStorage();

  const calculateAge = (): AgeCalculationOutcome => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const targetDate = new Date(asOfDate || todayStr);

    if (birthDate > targetDate) {
      return { success: false, error: 'Date of birth cannot be after the target date.' };
    }

    let years = targetDate.getFullYear() - birthDate.getFullYear();
    let months = targetDate.getMonth() - birthDate.getMonth();
    let days = targetDate.getDate() - birthDate.getDate();

    if (days < 0) {
      months--;
      // Days in previous month of target
      const prevMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 0);
      days += prevMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    const diffTime = targetDate.getTime() - birthDate.getTime();
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.floor(totalDays / 7);
    const totalHours = totalDays * 24;
    const totalMinutes = totalHours * 60;
    const approxHeartbeats = Math.floor(totalMinutes * 75); // ~75 bpm average

    // Next birthday
    let nextBday = new Date(targetDate.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    if (nextBday < targetDate) {
      nextBday = new Date(targetDate.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());
    }
    const daysToNextBday = Math.ceil((nextBday.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const nextBdayDayName = daysOfWeek[nextBday.getDay()];

    // Zodiac
    const getZodiac = (month: number, day: number) => {
      const dates = [20, 19, 21, 20, 21, 21, 23, 23, 23, 23, 22, 22];
      const signs = [
        'Aquarius ♒', 'Pisces ♓', 'Aries ♈', 'Taurus ♉', 'Gemini ♊', 'Cancer ♋',
        'Leo ♌', 'Virgo ♍', 'Libra ♎', 'Scorpio ♏', 'Sagittarius ♐', 'Capricorn ♑'
      ];
      let monthIndex = month - 1;
      if (day < dates[monthIndex]) {
        monthIndex = monthIndex - 1 < 0 ? 11 : monthIndex - 1;
      }
      return signs[monthIndex];
    };

    const zodiac = getZodiac(birthDate.getMonth() + 1, birthDate.getDate());

    return {
      success: true,
      data: {
        years,
        months,
        days,
        totalDays,
        totalWeeks,
        totalHours,
        totalMinutes,
        approxHeartbeats,
        daysToNextBday,
        nextBdayDayName,
        zodiac,
      },
    };
  };

  const outcome = calculateAge();

  const handleCalculate = () => {
    recordToolUsage('calc-age', 'Age Calculator');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="pb-4 border-b border-border">
        <h1 className="text-2xl font-bold text-foreground">Age & Date of Birth Calculator</h1>
        <p className="text-sm text-foreground-muted">
          Calculate your exact chronological age in years, months, days, total hours, and upcoming birthday countdown.
        </p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
              Date of Birth
            </label>
            <input
              type="date"
              value={dob}
              onChange={(e) => {
                setDob(e.target.value);
                handleCalculate();
              }}
              className="w-full rounded-lg border border-border bg-surface-raised p-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
              Age as of Date (Default: Today)
            </label>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => {
                setAsOfDate(e.target.value);
                handleCalculate();
              }}
              className="w-full rounded-lg border border-border bg-surface-raised p-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </Card>

      {outcome && !outcome.success && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium">
          {outcome.error}
        </div>
      )}

      {outcome && outcome.success && (
        <div className="space-y-6">
          {/* Main Primary Age Card */}
          <Card className="p-6 bg-gradient-to-br from-primary/5 via-surface to-primary/10 border-primary/20">
            <div className="text-center space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Your Exact Age</span>
              <div className="flex items-center justify-center gap-3 sm:gap-6 flex-wrap">
                <div className="text-center">
                  <span className="text-4xl sm:text-5xl font-black text-foreground">{outcome.data.years}</span>
                  <p className="text-xs font-medium text-foreground-muted mt-1 uppercase">Years</p>
                </div>
                <span className="text-3xl text-foreground-muted font-light">:</span>
                <div className="text-center">
                  <span className="text-4xl sm:text-5xl font-black text-foreground">{outcome.data.months}</span>
                  <p className="text-xs font-medium text-foreground-muted mt-1 uppercase">Months</p>
                </div>
                <span className="text-3xl text-foreground-muted font-light">:</span>
                <div className="text-center">
                  <span className="text-4xl sm:text-5xl font-black text-foreground">{outcome.data.days}</span>
                  <p className="text-xs font-medium text-foreground-muted mt-1 uppercase">Days</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 space-y-1">
              <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5" /> Next Birthday
              </div>
              <p className="text-xl font-bold text-foreground">
                {outcome.data.daysToNextBday === 0 ? 'Today! 🎂' : `In ${outcome.data.daysToNextBday} days`}
              </p>
              <p className="text-xs text-foreground-muted">Falls on a {outcome.data.nextBdayDayName}</p>
            </Card>

            <Card className="p-4 space-y-1">
              <div className="flex items-center gap-2 text-indigo-500 text-xs font-bold uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5" /> Total Days Lived
              </div>
              <p className="text-xl font-bold text-foreground">{outcome.data.totalDays.toLocaleString()}</p>
              <p className="text-xs text-foreground-muted">{outcome.data.totalWeeks.toLocaleString()} total weeks</p>
            </Card>

            <Card className="p-4 space-y-1">
              <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5" /> Total Hours
              </div>
              <p className="text-xl font-bold text-foreground">{outcome.data.totalHours.toLocaleString()}</p>
              <p className="text-xs text-foreground-muted">{outcome.data.totalMinutes.toLocaleString()} minutes</p>
            </Card>

            <Card className="p-4 space-y-1">
              <div className="flex items-center gap-2 text-rose-500 text-xs font-bold uppercase tracking-wider">
                <Heart className="w-3.5 h-3.5" /> Heartbeats
              </div>
              <p className="text-xl font-bold text-foreground">~{outcome.data.approxHeartbeats.toLocaleString()}</p>
              <p className="text-xs text-foreground-muted">Zodiac: {outcome.data.zodiac}</p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

