import { describe, it, expect } from 'vitest';

describe('Academic & Financial Calculation Formulas', () => {
  it('calculates weighted SGPA correctly', () => {
    // 3 subjects: (4 credits * 10) + (3 credits * 9) + (3 credits * 8) = 40 + 27 + 24 = 91 points
    // Total credits = 10
    // SGPA = 91 / 10 = 9.1
    const courses = [
      { credits: 4, gradePoint: 10 },
      { credits: 3, gradePoint: 9 },
      { credits: 3, gradePoint: 8 },
    ];
    const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
    const totalPoints = courses.reduce((sum, c) => sum + c.credits * c.gradePoint, 0);
    const sgpa = parseFloat((totalPoints / totalCredits).toFixed(2));

    expect(totalCredits).toBe(10);
    expect(totalPoints).toBe(91);
    expect(sgpa).toBe(9.1);
  });

  it('calculates attendance percentage and safe skips accurately', () => {
    const attended = 40;
    const total = 45;
    const target = 75;

    const currentPercent = (attended / total) * 100;
    expect(currentPercent).toBeCloseTo(88.89, 1);

    // If target is 75%, how many can be skipped?
    // 40 / (45 + x) >= 0.75  =>  45 + x <= 40 / 0.75 = 53.33 => x <= 8.33 => 8 skips
    const safeSkips = Math.floor((attended * 100) / target - total);
    expect(safeSkips).toBe(8);

    // Verify after 8 skips: 40 / (45 + 8) = 40 / 53 = 75.47% >= 75%
    expect((attended / (total + 8)) * 100).toBeGreaterThanOrEqual(75);
    // After 9 skips: 40 / 54 = 74.07% < 75% (unsafe)
    expect((attended / (total + 9)) * 100).toBeLessThan(75);
  });

  it('calculates attendance shortage classes needed', () => {
    const attended = 30;
    const total = 50; // currently 60%
    const target = 75; // target is 75%

    // (30 + y) / (50 + y) >= 0.75  =>  30 + y >= 37.5 + 0.75y  =>  0.25y >= 7.5  =>  y >= 30 classes
    const needed = Math.ceil((target * total - 100 * attended) / (100 - target));
    expect(needed).toBe(30);

    // After 30 consecutive classes: (30 + 30) / (50 + 30) = 60 / 80 = 75.0%
    expect(((attended + needed) / (total + needed)) * 100).toBe(75);
  });

  it('calculates monthly EMI loan repayment correctly', () => {
    const principal = 1000000; // 10 Lakhs
    const annualRate = 8.5; // 8.5%
    const tenureMonths = 60; // 5 years

    const monthlyRate = annualRate / 12 / 100;
    const emi = Math.round(
      (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
        (Math.pow(1 + monthlyRate, tenureMonths) - 1)
    );

    // Standard banking formula expected: ~20,517
    expect(emi).toBe(20517);
    const totalPayment = emi * tenureMonths;
    expect(totalPayment).toBe(1231020);
    const totalInterest = totalPayment - principal;
    expect(totalInterest).toBe(231020);
  });
});
