import { Prescription } from './supabase';

/**
 * Compute a health score (0–100) from the user's prescription history.
 *
 * Factors:
 *  - Illness frequency: more frequent = lower score
 *  - Antibiotic usage: penalty for heavy antibiotic use
 *  - Recovery gaps: longer gaps between illnesses = better
 *  - Recency: recent illnesses weigh more
 */

const ANTIBIOTIC_KEYWORDS = [
  'amoxicillin', 'azithromycin', 'ciprofloxacin', 'doxycycline',
  'metronidazole', 'cephalexin', 'levofloxacin', 'augmentin',
  'cefixime', 'ofloxacin', 'erythromycin', 'clindamycin',
];

export function computeHealthScore(prescriptions: Prescription[]): number {
  if (!prescriptions || prescriptions.length === 0) return 85; // Default for new users

  let score = 100;
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  // Sort by date descending
  const sorted = [...prescriptions]
    .filter(p => p.date)
    .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());

  // 1. Illness frequency penalty (last 6 months)
  const recentCount = sorted.filter(
    p => new Date(p.date!) >= sixMonthsAgo
  ).length;

  if (recentCount >= 6) score -= 25;
  else if (recentCount >= 4) score -= 15;
  else if (recentCount >= 2) score -= 8;
  else if (recentCount === 1) score -= 3;

  // 2. Antibiotic usage penalty
  let antibioticCount = 0;
  for (const rx of sorted) {
    if (rx.medicines && Array.isArray(rx.medicines)) {
      for (const med of rx.medicines) {
        if (ANTIBIOTIC_KEYWORDS.some(ab => med.name?.toLowerCase().includes(ab))) {
          antibioticCount++;
        }
      }
    }
  }

  if (antibioticCount >= 5) score -= 15;
  else if (antibioticCount >= 3) score -= 10;
  else if (antibioticCount >= 1) score -= 5;

  // 3. Recovery gap bonus (average days between illnesses)
  if (sorted.length >= 2) {
    let totalGap = 0;
    let gaps = 0;
    for (let i = 0; i < sorted.length - 1; i++) {
      const d1 = new Date(sorted[i].date!);
      const d2 = new Date(sorted[i + 1].date!);
      const gap = (d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24);
      if (gap > 0) {
        totalGap += gap;
        gaps++;
      }
    }
    const avgGap = gaps > 0 ? totalGap / gaps : 0;

    if (avgGap >= 90) score += 5;      // 3+ months between illnesses
    else if (avgGap >= 60) score += 2;  // 2+ months
    else if (avgGap < 14) score -= 10;  // less than 2 weeks — very frequent
  }

  // 4. Recency penalty — if last illness was very recent
  if (sorted.length > 0) {
    const lastDate = new Date(sorted[0].date!);
    const daysSince = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 7) score -= 5;
    else if (daysSince > 90) score += 5;
  }

  // 5. Total prescriptions over 1 year
  const yearCount = sorted.filter(p => new Date(p.date!) >= oneYearAgo).length;
  if (yearCount > 8) score -= 10;

  return Math.max(10, Math.min(100, Math.round(score)));
}

export function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 85) return { label: 'Excellent', color: '#22C55E' };
  if (score >= 70) return { label: 'Good', color: '#2EC4B6' };
  if (score >= 50) return { label: 'Fair', color: '#F59E0B' };
  return { label: 'Needs Attention', color: '#E63946' };
}
