'use client';

import React, { useState, useEffect, useMemo, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { collection, onSnapshot, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { SCHEDULE_DATA } from '@/constants/events';

const COHORTS = [
  "A1", "A2", "A3", "A4", "A5",
  "B1", "B2", "B3", "B4",
  "C1", "C2", "C3", "C4",
  "D1", "D2", "D3", "D4", "D5",
  "E1", "E2", "E3", "E4", "E5",
  "F1", "F2", "F3", "F4", "F5",
  "G1", "G2", "G3", "G4", "G5",
  "H1", "H2", "H3", "H4", "H5",
  "I1", "I2", "I3",
  "J1", "J2", "J3",
  "K1", "K2", "K3",
  "L1", "L2", "L3"
];

// ============================================================================
// CUSTOM GEOMETRIC SVG ICONS (Gradient-free, Sharp, Heavy-mitre)
// ============================================================================

const CustomLoaderIcon = ({ className = '', size = 18 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3.2" 
    strokeLinecap="square" 
    className={`animate-spin ${className}`}
  >
    <path d="M12 2A10 10 0 0 1 22 12" />
  </svg>
);

const CustomMessageIcon = ({ className = '', size = 18 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="square" 
    strokeLinejoin="miter" 
    className={className}
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const CustomStarIcon = ({ className = '', size = 24, filled = false }: { className?: string; size?: number; filled?: boolean }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill={filled ? "#FF9A00" : "none"} 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="square" 
    strokeLinejoin="miter" 
    className={className}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const CustomCheckIcon = ({ className = '', size = 18 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3.2" 
    strokeLinecap="square" 
    strokeLinejoin="miter" 
    className={className}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CustomDownloadIcon = ({ className = '', size = 18 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="square" 
    strokeLinejoin="miter" 
    className={className}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const CustomSettingsIcon = ({ className = '', size = 18 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="square" 
    strokeLinejoin="miter" 
    className={className}
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const CustomLockIcon = ({ className = '', size = 18 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="square" 
    strokeLinejoin="miter" 
    className={className}
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const CustomAlertCircleIcon = ({ className = '', size = 18 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="square" 
    strokeLinejoin="miter" 
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const CustomLightbulbIcon = ({ className = '', size = 18 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="square" 
    strokeLinejoin="miter" 
    className={className}
  >
    <path d="M9 21h6" />
    <path d="M9 18h6" />
    <path d="M10 15H14c.55 0 1-.45 1-1v-1c1.2-1.2 2-2.8 2-4.5C17 5.02 14.76 3 12 3S7 5.02 7 8.5c0 1.7.8 3.3 2 4.5v1c0 .55.45 1 1 1z" />
  </svg>
);

// ============================================================================
// DEFAULT QUESTIONS SEED GENERATOR
// ============================================================================
function generateDefaultFormsMap(): Record<string, { questions: any[] }> {
  const forms: Record<string, { questions: any[] }> = {};
  
  SCHEDULE_DATA.forEach((daySchedule) => {
    const questions: any[] = [];
    let qCount = 1;
    
    daySchedule.events.forEach((evt) => {
      const t = evt.title.toUpperCase();
      if (t === 'BREAKFAST' || t === 'LUNCH' || t === 'SNACKS' || t === 'DINNER' || t === 'REST') {
        return;
      }
      
      questions.push({
        id: `q_${daySchedule.day.replace(' ', '_').toLowerCase()}_rating_${qCount++}`,
        type: 'rating',
        label: evt.title,
        required: false
      });
    });
    
    questions.push({
      id: `q_${daySchedule.day.replace(' ', '_').toLowerCase()}_text_1`,
      type: 'text',
      label: "What did you like most about today's events?",
      required: false
    });
    questions.push({
      id: `q_${daySchedule.day.replace(' ', '_').toLowerCase()}_text_2`,
      type: 'text',
      label: "What should be improved tomorrow / next time?",
      required: false
    });
    questions.push({
      id: `q_${daySchedule.day.replace(' ', '_').toLowerCase()}_text_3`,
      type: 'text',
      label: "Any other suggestions for future squad sessions?",
      required: false
    });
    
    forms[daySchedule.day] = { questions };
  });
  
  return forms;
}

const DEFAULT_GLOBAL_QUESTIONS = [
  { id: 'q_global_rating_1', type: 'rating', label: 'How would you rate your day overall?', required: true },
  { id: 'q_global_mcq_1', type: 'mcq', label: "How was the day's pace?", options: ['Too Fast', 'Just Right', 'Too Slow'], required: true },
  { id: 'q_global_mcq_2', type: 'mcq', label: 'Did you feel engaged throughout the day?', options: ['Yes', 'Partially', 'No'], required: true },
  { id: 'q_global_rating_2', type: 'rating', label: "How relevant and valuable were today's activities for you?", required: true },
  { id: 'q_global_rating_3', type: 'rating', label: 'How clearly was information communicated throughout the day?', required: true },
  { id: 'q_global_rating_4', type: 'rating', label: "How comfortable were today's arrangements?", required: true },
  { id: 'q_global_rating_5', type: 'rating', label: 'How supported did you feel by your Cohort Leader / OH Team today?', required: true },
  { id: 'q_global_text_1', type: 'text', label: 'What was the highlight of your day?', required: false },
  { id: 'q_global_text_2', type: 'text', label: 'What could have been better today?', required: false },
  { id: 'q_global_mcq_3', type: 'mcq', label: 'What was your energy level at the end of the day?', options: ['😴 Exhausted', '😐 Okay', '😃 Pumped Up'], required: true }
];

export default function AdminFeedbackAnalytics() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-20 w-full min-h-[400px]">
        <div className="text-center space-y-4">
          <CustomLoaderIcon className="text-brand-ink mx-auto" size={40} />
          <p className="text-brand-ink/50 text-[10px] font-black uppercase tracking-widest animate-pulse">
            Loading Feedback Hub...
          </p>
        </div>
      </div>
    }>
      <FeedbackAnalyticsContent />
    </Suspense>
  );
}

function FeedbackAnalyticsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') as any) || 'analytics';

  const [loading, setLoading] = useState(true);

  // Data States
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('all');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>('all');
  const [selectedCohortFilter, setSelectedCohortFilter] = useState<string>('all');
  const [exporting, setExporting] = useState(false);

  // Suggestions Filters
  const [suggestionStatusFilter, setSuggestionStatusFilter] = useState<'all' | 'pending' | 'reviewed'>('all');
  const [suggestionDateSort, setSuggestionDateSort] = useState<'desc' | 'asc'>('desc');
  const [suggestionSearch, setSuggestionSearch] = useState<string>('');

  // Complaints Filters
  const [complaintStatusFilter, setComplaintStatusFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [complaintDepartmentFilter, setComplaintDepartmentFilter] = useState<string>('all');
  const [complaintDateSort, setComplaintDateSort] = useState<'desc' | 'asc'>('desc');
  const [complaintSearch, setComplaintSearch] = useState<string>('');

  const pendingComplaintsCount = useMemo(() => {
    return complaints.filter((item) => item.status !== 'resolved').length;
  }, [complaints]);

  const pendingSuggestionsCount = useMemo(() => {
    return suggestions.filter((item) => item.status !== 'reviewed').length;
  }, [suggestions]);

  const complaintDepartments = useMemo(() => {
    const depts = new Set<string>();
    complaints.forEach((item) => {
      if (item.department) depts.add(item.department);
    });
    return Array.from(depts);
  }, [complaints]);

  const filteredComplaints = useMemo(() => {
    let list = [...complaints];
    
    if (complaintStatusFilter === 'pending') {
      list = list.filter(item => item.status !== 'resolved');
    } else if (complaintStatusFilter === 'resolved') {
      list = list.filter(item => item.status === 'resolved');
    }

    if (complaintDepartmentFilter !== 'all') {
      list = list.filter(item => item.department === complaintDepartmentFilter);
    }

    if (complaintSearch.trim()) {
      const query = complaintSearch.toLowerCase();
      list = list.filter(item => 
        (item.description || '').toLowerCase().includes(query) ||
        (item.studentName || '').toLowerCase().includes(query) ||
        (item.department || '').toLowerCase().includes(query)
      );
    }

    list.sort((a, b) => {
      const tA = a.submittedAt?.toMillis?.() ?? 0;
      const tB = b.submittedAt?.toMillis?.() ?? 0;
      return complaintDateSort === 'desc' ? tB - tA : tA - tB;
    });

    return list;
  }, [complaints, complaintStatusFilter, complaintDepartmentFilter, complaintSearch, complaintDateSort]);

  const filteredSuggestions = useMemo(() => {
    let list = [...suggestions];

    if (suggestionStatusFilter === 'pending') {
      list = list.filter(item => item.status !== 'reviewed');
    } else if (suggestionStatusFilter === 'reviewed') {
      list = list.filter(item => item.status === 'reviewed');
    }

    if (suggestionSearch.trim()) {
      const query = suggestionSearch.toLowerCase();
      list = list.filter(item => 
        (item.suggestion || '').toLowerCase().includes(query)
      );
    }

    list.sort((a, b) => {
      const tA = a.submittedAt?.toMillis?.() ?? 0;
      const tB = b.submittedAt?.toMillis?.() ?? 0;
      return suggestionDateSort === 'desc' ? tB - tA : tA - tB;
    });

    return list;
  }, [suggestions, suggestionStatusFilter, suggestionSearch, suggestionDateSort]);

  // Settings / Form Configurator States
  const [accessActiveDayIdx, setAccessActiveDayIdx] = useState<number>(0);
  const [builderActiveDayIdx, setBuilderActiveDayIdx] = useState<number>(0);
  const [configActiveBatch, setConfigActiveBatch] = useState<string>("Batch 1");
  const [batchForms, setBatchForms] = useState<Record<string, any[]>>({});
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [liveActiveDayId, setLiveActiveDayId] = useState<string>('Day 01');
  const [liveFormOpen, setLiveFormOpen] = useState<boolean>(true);

  // Only allow auto-save after Firebase has hydrated state for the first time.
  const hasLoadedFromDB = useRef(false);

  // Deep Dive Active Rating Question State
  const [selectedRatingQId, setSelectedRatingQId] = useState<string>('');

  const firebaseReady = isFirebaseConfigured();

  // Load Feedbacks, Complaints, Suggestions & Configurations
  useEffect(() => {
    if (!firebaseReady || !db) {
      setLoading(false);
      return;
    }

    const unsubFeedbacks = onSnapshot(collection(db, 'feedback'), (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
      docs.sort((a, b) => {
        const tA = (a.submittedAt ?? a.timestamp)?.toMillis?.() ?? 0;
        const tB = (b.submittedAt ?? b.timestamp)?.toMillis?.() ?? 0;
        return tB - tA;
      });
      setFeedbacks(docs);
      setLoading(false);
    }, (err) => {
      console.warn("Feedbacks snapshot connection error / permission denied:", err);
    });

    const unsubComplaints = onSnapshot(collection(db, 'complaints'), (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
      docs.sort((a, b) => {
        const tA = a.submittedAt?.toMillis?.() ?? 0;
        const tB = b.submittedAt?.toMillis?.() ?? 0;
        return tB - tA;
      });
      setComplaints(docs);
    }, (err) => {
      console.warn("Complaints snapshot connection error / permission denied:", err);
    });

    const unsubSuggestions = onSnapshot(collection(db, 'suggestions'), (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
      docs.sort((a, b) => {
        const tA = a.submittedAt?.toMillis?.() ?? 0;
        const tB = b.submittedAt?.toMillis?.() ?? 0;
        return tB - tA;
      });
      setSuggestions(docs);
    }, (err) => {
      console.warn("Suggestions snapshot connection error / permission denied:", err);
    });

    let isFirstLoad = true;
    const unsubSettings = onSnapshot(doc(db, 'settings', 'feedback'), (settingsDoc) => {
      try {
        let activeDayIdx = 0;
        let dbBatchForms: Record<string, any[]> = {};
        let dbFormOpen = true;
        let dbActiveDayId = 'Day 01';
        
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          dbActiveDayId = data.activeDayId || 'Day 01';
          const dayIdx = SCHEDULE_DATA.findIndex(d => d.day === dbActiveDayId);
          if (dayIdx !== -1) activeDayIdx = dayIdx;
          dbBatchForms = data.batchForms || {};
          dbFormOpen = data.isFormOpen !== undefined ? data.isFormOpen : true;
        }
        
        const seededBatches: Record<string, any[]> = { ...dbBatchForms };
        ['Batch 1', 'Batch 2', 'Batch 3', 'Batch 4'].forEach((batch) => {
          if (!seededBatches[batch]) {
            seededBatches[batch] = [...DEFAULT_GLOBAL_QUESTIONS];
          }
        });
        
        setLiveActiveDayId(dbActiveDayId);
        setLiveFormOpen(dbFormOpen);

        // Sync local builder options on DB updates (only when first loading)
        if (isFirstLoad) {
          setAccessActiveDayIdx(activeDayIdx);
          setBatchForms(seededBatches);
          setIsFormOpen(dbFormOpen);
          isFirstLoad = false;
          // Mark DB as loaded AFTER state is set, so auto-save effects
          // won't fire until the user makes a real change.
          setTimeout(() => { hasLoadedFromDB.current = true; }, 0);
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      }
    }, (err) => {
      console.warn("Settings snapshot connection error / permission denied:", err);
    });

    return () => {
      unsubFeedbacks();
      unsubComplaints();
      unsubSuggestions();
      unsubSettings();
    };
  }, [firebaseReady]);

  const handleToggleComplaintStatus = async (id: string, currentStatus: string) => {
    if (!db) return;
    try {
      const nextStatus = currentStatus === 'resolved' ? 'pending' : 'resolved';
      await setDoc(doc(db, 'complaints', id), { status: nextStatus }, { merge: true });
    } catch (err) {
      console.error('Error toggling complaint status:', err);
    }
  };

  const handleToggleSuggestionStatus = async (id: string, currentStatus: string) => {
    if (!db) return;
    try {
      const nextStatus = currentStatus === 'reviewed' ? 'pending' : 'reviewed';
      await setDoc(doc(db, 'suggestions', id), { status: nextStatus }, { merge: true });
    } catch (err) {
      console.error('Error toggling suggestion status:', err);
    }
  };

  const parsedSubmissions = useMemo(() => {
    return feedbacks.map((f) => {
      if (f.answers) return f;
      
      // Fallback/Legacy parsing for older responses that used the default static fields
      const answers: Record<string, any> = {};
      const ratings = f.ratings || {};
      const comments = f.comments || {};
      
      const batchKey = f.batch ? (String(f.batch).startsWith('Batch') ? String(f.batch) : `Batch ${f.batch}`) : 'Batch 1';
      const questions = batchForms[batchKey] || DEFAULT_GLOBAL_QUESTIONS;
      
      questions.forEach((q) => {
        let val: any = undefined;
        
        // Map legacy fields
        const l = q.label.toLowerCase();
        if (q.type === 'rating') {
          if (l.includes('rate your day') || l.includes('overall')) {
            val = f.dayOverallRating || ratings['How would you rate your day overall?'] || ratings[q.label];
          } else if (l.includes('communicated') || l.includes('clear')) {
            val = f.infoClear || ratings['How clearly was information communicated?'] || ratings[q.label];
          } else if (l.includes('arrangements') || l.includes('comfort') || l.includes('facilities')) {
            val = f.arrangementsComfort || ratings["How comfortable were today's arrangements (venue, food, facilities)?"] || ratings[q.label];
          } else if (l.includes('supported') || l.includes('cohort')) {
            val = f.supported || ratings['How supported did you feel by your Cohort Leader / OH Team?'] || ratings[q.label];
          } else if (l.includes('facilitator') || l.includes('presenter')) {
            val = f.facilitatorRating || ratings['Facilitator Rating: How would you rate the presenter / facilitator?'] || ratings[q.label];
          } else {
            val = ratings[q.label];
          }
        } else if (q.type === 'text') {
          if (l.includes('like') || l.includes('highlight')) {
            val = f.highlight || f.likedMost || comments['What was the highlight of your day?'] || comments[q.label];
          } else if (l.includes('improve') || l.includes('better')) {
            val = f.better || f.improvements || comments['What could have been better today?'] || comments[q.label];
          } else if (l.includes('pace')) {
            val = f.pace || comments["How was the day's pace?"] || comments[q.label];
          } else if (l.includes('vibe') || l.includes('energy')) {
            val = f.energyVibe || f.energyEnd || comments['How was the energy / vibe throughout the day?'] || comments[q.label];
          } else if (l.includes('engaged')) {
            val = f.engaged || comments['Did you feel engaged throughout the day?'] || comments[q.label];
          } else {
            val = comments[q.label] || f[q.label];
          }
        }
        
        if (val !== undefined && val !== null) {
          answers[q.id] = {
            type: q.type,
            label: q.label,
            value: val,
            comment: ''
          };
        }
      });
      
      return { ...f, answers };
    });
  }, [feedbacks, batchForms]);

  const filteredSubmissions = useMemo(() => {
    let result = parsedSubmissions;
    if (selectedDayFilter !== 'all') {
      result = result.filter((f) => f.day === selectedDayFilter);
    }
    if (selectedBatchFilter !== 'all') {
      result = result.filter((f) => f.batch === selectedBatchFilter);
    }
    if (selectedCohortFilter !== 'all') {
      result = result.filter((f) => f.studentCohort === selectedCohortFilter);
    }
    return result;
  }, [parsedSubmissions, selectedDayFilter, selectedBatchFilter, selectedCohortFilter]);

  const totalFormsSubmitted = filteredSubmissions.length;

  const activeQuestionsForFilter = useMemo(() => {
    const all: any[] = [];
    const addedLabels = new Set<string>();
    
    // 1. Gather questions from batchForms matching the selected day
    Object.keys(batchForms).forEach((key) => {
      if (selectedDayFilter === 'all' || key.startsWith(`${selectedDayFilter}_`)) {
        const questions = batchForms[key] || [];
        questions.forEach((q) => {
          const normLabel = q.label.trim().toLowerCase();
          if (!addedLabels.has(normLabel)) {
            all.push(q);
            addedLabels.add(normLabel);
          }
        });
      }
    });

    // 2. Also gather questions from actual answers in filteredSubmissions (robust fallback for fallback form queries)
    filteredSubmissions.forEach((f) => {
      const answers = f.answers || {};
      Object.keys(answers).forEach((qId) => {
        const ans = answers[qId];
        if (ans && ans.label) {
          const normLabel = ans.label.trim().toLowerCase();
          if (!addedLabels.has(normLabel)) {
            all.push({
              id: qId,
              type: ans.type,
              label: ans.label,
              required: false
            });
            addedLabels.add(normLabel);
          }
        }
      });
    });

    if (all.length === 0) {
      return DEFAULT_GLOBAL_QUESTIONS;
    }

    return all;
  }, [batchForms, selectedDayFilter, filteredSubmissions]);

  const ratingQuestionsList = useMemo(() => {
    return activeQuestionsForFilter.filter(q => q.type === 'rating');
  }, [activeQuestionsForFilter]);

  useEffect(() => {
    if (ratingQuestionsList.length > 0) {
      const exists = ratingQuestionsList.some(q => q.id === selectedRatingQId);
      if (!exists) {
        setSelectedRatingQId(ratingQuestionsList[0].id);
      }
    } else {
      setSelectedRatingQId('');
    }
  }, [ratingQuestionsList, selectedRatingQId]);

  const questionStats = useMemo(() => {
    const stats: Record<string, { ratings: number[]; comments: { rating: number; text: string; date: string }[]; textAnswers: { text: string; date: string }[]; mcqCounts: Record<string, number> }> = {};

    filteredSubmissions.forEach((f) => {
      const dateStr = f.submittedAt?.toDate ? f.submittedAt.toDate().toLocaleDateString() : '';
      const answers = f.answers || {};

      Object.keys(answers).forEach((qId) => {
        const ans = answers[qId];
        const key = ans.label ? ans.label.trim().toLowerCase() : qId.trim().toLowerCase();
        if (!stats[key]) {
          stats[key] = { ratings: [], comments: [], textAnswers: [], mcqCounts: {} };
        }

        if (ans.type === 'rating') {
          const val = Number(ans.value);
          if (val >= 1 && val <= 5) {
            stats[key].ratings.push(val);
            if (ans.comment?.trim()) {
              stats[key].comments.push({
                rating: val,
                text: ans.comment.trim(),
                date: dateStr
              });
            }
          }
        } else if (ans.type === 'mcq') {
          const val = ans.value?.trim();
          if (val) {
            stats[key].mcqCounts[val] = (stats[key].mcqCounts[val] || 0) + 1;
          }
        } else if (ans.type === 'text' || ans.type === 'date') {
          const val = ans.value?.trim();
          if (val) {
            stats[key].textAnswers.push({
              text: val,
              date: dateStr
            });
          }
        }
      });
    });

    return stats;
  }, [filteredSubmissions]);

  const selectedRatingStats = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const selectedQ = activeQuestionsForFilter.find(q => q.id === selectedRatingQId);
    const key = selectedQ ? selectedQ.label.trim().toLowerCase() : selectedRatingQId.trim().toLowerCase();
    const stats = questionStats[key] || { ratings: [], comments: [] };
    let total = 0;
    stats.ratings.forEach((val) => {
      if (val >= 1 && val <= 5) {
        counts[val as keyof typeof counts]++;
        total++;
      }
    });

    const distribution = [1, 2, 3, 4, 5].map((stars) => {
      const count = counts[stars as keyof typeof counts];
      const percentage = total ? (count / total) * 100 : 0;
      return { label: `${stars} Star${stars > 1 ? 's' : ''}`, count, percentage };
    });

    const sum = stats.ratings.reduce((a, b) => a + b, 0);
    const avg = total ? (sum / total).toFixed(1) : '0.0';

    return { distribution, avg, total };
  }, [questionStats, selectedRatingQId, activeQuestionsForFilter]);

  const globalAvgRating = useMemo(() => {
    let sum = 0;
    let count = 0;
    ratingQuestionsList.forEach((q) => {
      const key = q.label.trim().toLowerCase();
      const stats = questionStats[key] || { ratings: [] };
      stats.ratings.forEach((val) => {
        sum += val;
        count++;
      });
    });
    return count ? (sum / count).toFixed(1) : '0.0';
  }, [ratingQuestionsList, questionStats]);

  const ratingPerformanceList = useMemo(() => {
    return ratingQuestionsList.map((q) => {
      const key = q.label.trim().toLowerCase();
      const stats = questionStats[key] || { ratings: [], comments: [] };
      const totalAnswers = stats.ratings.length;
      const sum = stats.ratings.reduce((a, b) => a + b, 0);
      const avg = totalAnswers ? (sum / totalAnswers).toFixed(1) : '0.0';
      const fiveStars = totalAnswers 
        ? Math.round((stats.ratings.filter(r => r === 5).length / totalAnswers) * 100) 
        : 0;

      return {
        id: q.id,
        title: q.label,
        totalAnswers,
        avg,
        fiveStars,
        comments: stats.comments
      };
    });
  }, [ratingQuestionsList, questionStats]);

  const dynamicTextAnswers = useMemo(() => {
    const list: any[] = [];
    activeQuestionsForFilter.filter(q => q.type === 'text' || q.type === 'date').forEach((q) => {
      const key = q.label.trim().toLowerCase();
      const stats = questionStats[key] || { textAnswers: [] };
      if (stats.textAnswers.length > 0) {
        list.push({
          qId: q.id,
          label: q.label,
          answers: stats.textAnswers
        });
      }
    });
    return list;
  }, [activeQuestionsForFilter, questionStats]);

  const mcqStatsList = useMemo(() => {
    return activeQuestionsForFilter
      .filter((q) => q.type === 'mcq')
      .map((q) => {
        const key = q.label.trim().toLowerCase();
        const stats = questionStats[key] || { mcqCounts: {} };
        const counts = stats.mcqCounts || {};
        const options = q.options || [];

        let total = 0;
        Object.values(counts).forEach((c) => {
          total += Number(c || 0);
        });

        const distributions = options.map((opt: string) => {
          const count = counts[opt] || 0;
          const percentage = total ? (count / total) * 100 : 0;
          return { option: opt, count, percentage };
        });

        return {
          id: q.id,
          label: q.label,
          total,
          distributions
        };
      })
      .filter((mcq) => mcq.distributions.length > 0);
  }, [activeQuestionsForFilter, questionStats]);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const excelRows: any[] = [];

      filteredSubmissions.forEach((f) => {
        const dateStr = f.submittedAt?.toDate ? f.submittedAt.toDate().toLocaleString() : '';
        const answers = f.answers || {};

        Object.keys(answers).forEach((qId) => {
          const ans = answers[qId];
          excelRows.push({
            'Timestamp': dateStr,
            'Evaluated Day': f.day,
            'Date': f.date || '',
            'Student Name': f.studentName || (f.anonymous ? 'Anonymous' : 'N/A'),
            'Batch': f.batch || 'N/A',
            'Cohort': f.studentCohort || (f.anonymous ? 'Anonymous' : 'N/A'),
            'Question ID': qId,
            'Question Label': ans.label,
            'Question Type': ans.type,
            'Value / Rating': ans.value,
            'Specific Comment': ans.comment || ''
          });
        });

        if (Object.keys(answers).length === 0) {
          excelRows.push({
            'Timestamp': dateStr,
            'Evaluated Day': f.day,
            'Date': f.date || '',
            'Student Name': f.studentName || (f.anonymous ? 'Anonymous' : 'N/A'),
            'Batch': f.batch || 'N/A',
            'Cohort': f.studentCohort || (f.anonymous ? 'Anonymous' : 'N/A'),
            'Question ID': 'N/A',
            'Question Label': 'None Rated',
            'Question Type': 'N/A',
            'Value / Rating': '',
            'Specific Comment': ''
          });
        }
      });

      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Dynamic Feedback');

      if (excelRows.length > 0) {
        worksheet.addRow(Object.keys(excelRows[0]));
        excelRows.forEach((row) => worksheet.addRow(Object.values(row)));
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const fileDate = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `Sabrang26_Feedback_Dynamic_${fileDate}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);

      const performer = auth?.currentUser?.email || auth?.currentUser?.uid || 'Feedback Operator';
      try {
        const { logAdminAction } = await import('@/lib/audit');
        await logAdminAction('FEEDBACK_EXPORT_EXCEL', 'feedbacks', `Exported ${filteredSubmissions.length} feedback submissions to Excel`, performer);
      } catch (err) {
        console.error("Failed to log export action:", err);
      }
    } finally {
      setExporting(false);
    }
  };

  const activeConfigDay = SCHEDULE_DATA[builderActiveDayIdx].day;
  const activeConfigDate = SCHEDULE_DATA[builderActiveDayIdx].date;
  const builderActiveKey = `${activeConfigDay}_${configActiveBatch}`;
  const configQuestionsList = batchForms[builderActiveKey] || batchForms[configActiveBatch] || [];

  const handleAddQuestion = (type: 'rating' | 'text' | 'mcq' | 'date') => {
    const newQuestion: any = {
      id: `q_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type,
      label: type === 'rating' ? 'New Star Rating Question' : type === 'text' ? 'New Written Question' : type === 'mcq' ? 'New Multiple Choice Question' : 'New Date Question',
      required: false
    };
    if (type === 'mcq') {
      newQuestion.options = ['Option 1', 'Option 2'];
    }
    setBatchForms((prev) => {
      const current = prev[builderActiveKey] || prev[configActiveBatch] || [...DEFAULT_GLOBAL_QUESTIONS];
      return { ...prev, [builderActiveKey]: [...current, newQuestion] };
    });
  };

  const handleAddMCQOption = (qId: string) => {
    setBatchForms((prev) => {
      const current = prev[builderActiveKey] || prev[configActiveBatch] || [...DEFAULT_GLOBAL_QUESTIONS];
      const updated = current.map((q) => {
        if (q.id === qId) {
          const opts = q.options || [];
          return { ...q, options: [...opts, `Option ${opts.length + 1}`] };
        }
        return q;
      });
      return { ...prev, [builderActiveKey]: updated };
    });
  };

  const handleUpdateMCQOption = (qId: string, optIdx: number, val: string) => {
    setBatchForms((prev) => {
      const current = prev[builderActiveKey] || prev[configActiveBatch] || [...DEFAULT_GLOBAL_QUESTIONS];
      const updated = current.map((q) => {
        if (q.id === qId) {
          const opts = [...(q.options || [])];
          opts[optIdx] = val;
          return { ...q, options: opts };
        }
        return q;
      });
      return { ...prev, [builderActiveKey]: updated };
    });
  };

  const handleRemoveMCQOption = (qId: string, optIdx: number) => {
    setBatchForms((prev) => {
      const current = prev[builderActiveKey] || prev[configActiveBatch] || [...DEFAULT_GLOBAL_QUESTIONS];
      const updated = current.map((q) => {
        if (q.id === qId) {
          const opts = (q.options || []).filter((_: any, idx: number) => idx !== optIdx);
          return { ...q, options: opts };
        }
        return q;
      });
      return { ...prev, [builderActiveKey]: updated };
    });
  };

  const handleUpdateQuestionLabel = (qId: string, label: string) => {
    setBatchForms((prev) => {
      const current = prev[builderActiveKey] || prev[configActiveBatch] || [];
      const updated = current.map((q) => (q.id === qId ? { ...q, label } : q));
      return { ...prev, [builderActiveKey]: updated };
    });
  };

  const handleToggleQuestionRequired = (qId: string) => {
    setBatchForms((prev) => {
      const current = prev[builderActiveKey] || prev[configActiveBatch] || [];
      const updated = current.map((q) => (q.id === qId ? { ...q, required: !q.required } : q));
      return { ...prev, [builderActiveKey]: updated };
    });
  };

  const handleRemoveQuestion = (qId: string) => {
    setBatchForms((prev) => {
      const current = prev[builderActiveKey] || prev[configActiveBatch] || [];
      const filtered = current.filter((q) => q.id !== qId);
      return { ...prev, [builderActiveKey]: filtered };
    });
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    setBatchForms((prev) => {
      const current = [...(prev[builderActiveKey] || prev[configActiveBatch] || [])];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex >= 0 && targetIndex < current.length) {
        const temp = current[index];
        current[index] = current[targetIndex];
        current[targetIndex] = temp;
      }
      return { ...prev, [builderActiveKey]: current };
    });
  };

  // Auto-save settings and questions whenever they change, with debouncing for text input changes
  useEffect(() => {
    // Guard: do not save until DB has hydrated state for the first time.
    if (!hasLoadedFromDB.current) return;

    setSaveStatus('saving');

    const delayDebounceFn = setTimeout(async () => {
      if (!db) return;
      try {
        const activeDayId = SCHEDULE_DATA[accessActiveDayIdx]?.day || 'Day 01';
        const sanitizedForms = JSON.parse(JSON.stringify(batchForms || {}));
        
        await setDoc(doc(db, 'settings', 'feedback'), {
          activeDayId: activeDayId,
          batchForms: sanitizedForms,
          isFormOpen: isFormOpen ?? true,
          updatedAt: serverTimestamp(),
        }, { merge: true });

        const performer = auth?.currentUser?.email || auth?.currentUser?.uid || 'Admin';
        try {
          const { logAdminAction } = await import('@/lib/audit');
          await logAdminAction('FEEDBACK_SAVE_SETTINGS', 'settings/feedback', `Auto-saved feedback settings: set active day to ${activeDayId}, form open: ${isFormOpen}`, performer);
        } catch (err) {
          console.error("Failed to log auto-save settings action:", err);
        }

        setSaveStatus('saved');
      } catch (err) {
        console.error('Error auto-saving settings:', err);
        setSaveStatus('idle');
      }
    }, 1000); // Debounce for 1 second

    return () => {
      clearTimeout(delayDebounceFn);
    };
  }, [batchForms, isFormOpen, accessActiveDayIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20 w-full min-h-[400px]">
        <div className="text-center space-y-4">
          <CustomLoaderIcon className="text-brand-ink mx-auto" size={40} />
          <p className="text-brand-ink/50 text-[10px] font-black uppercase tracking-widest animate-pulse">
            Loading Feedback Hub Data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in ">
      
      {/* ============================================================================
          TAB: SENTIMENT ANALYSIS (ANALYTICS)
          ============================================================================ */}
      {activeTab === 'analytics' && (
        <div className="space-y-8 animate-fade-in">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-brand-ink/10 pb-4">
            <div>
              <h1 className="text-3xl font-display font-black uppercase text-brand-ink mb-2">
                Feedback Responses
              </h1>
              <p className="text-brand-ink/50 text-xs font-bold uppercase tracking-wider">
                Real-time feedback statistics and satisfaction analysis
              </p>
            </div>
            
            {/* Live status badge */}
            <div className="flex items-center gap-2 text-xs shrink-0">
              <span className="hidden sm:inline font-bold text-brand-ink/50 uppercase">Live Form:</span>
              <div className="flex items-center gap-2 border-2 border-brand-ink px-3 py-1 rounded bg-brand-cloud shadow-comic-sm bg-white">
                {liveFormOpen ? (
                  <>
                    <span className="font-black uppercase text-brand-ink text-[11px]">{liveActiveDayId}</span>
                    <span className="w-2 h-2 rounded-full border border-brand-ink bg-green-500 animate-pulse" />
                    <span className="font-black uppercase text-brand-ink text-[9px] tracking-wider">OPEN</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full border border-brand-ink bg-red-500" />
                    <span className="font-black uppercase text-brand-ink text-[9px] tracking-wider">CLOSED</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          
          {/* Day Filters & Export Button */}
          <div className="bg-white border-4 border-brand-ink p-5 shadow-[6px_6px_0px_0px_#030404] rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <span className="text-xs font-black uppercase text-brand-ink/65 tracking-wider shrink-0 font-mono">
                  Day:
                </span>
                <select
                  value={selectedDayFilter}
                  onChange={(e) => setSelectedDayFilter(e.target.value)}
                  className="bg-white border-2 border-brand-ink text-brand-ink text-xs font-bold rounded-md py-2 px-4 focus:outline-none focus:border-brand-orange transition-colors w-full md:w-48"
                >
                  <option value="all">All Days Combined</option>
                  {SCHEDULE_DATA.map((day) => (
                    <option key={day.day} value={day.day}>
                      {day.day} ({day.date})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <span className="text-xs font-black uppercase text-brand-ink/65 tracking-wider shrink-0 font-mono">
                  Batch:
                </span>
                <select
                  value={selectedBatchFilter}
                  onChange={(e) => setSelectedBatchFilter(e.target.value)}
                  className="bg-white border-2 border-brand-ink text-brand-ink text-xs font-bold rounded-md py-2 px-4 focus:outline-none focus:border-brand-orange transition-colors w-full md:w-48"
                >
                  <option value="all">All Batches</option>
                  <option value="Batch 1">Batch 1</option>
                  <option value="Batch 2">Batch 2</option>
                  <option value="Batch 3">Batch 3</option>
                  <option value="Batch 4">Batch 4</option>
                </select>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <span className="text-xs font-black uppercase text-brand-ink/65 tracking-wider shrink-0 font-mono">
                  Cohort:
                </span>
                <select
                  value={selectedCohortFilter}
                  onChange={(e) => setSelectedCohortFilter(e.target.value)}
                  className="bg-white border-2 border-brand-ink text-brand-ink text-xs font-bold rounded-md py-2 px-4 focus:outline-none focus:border-brand-orange transition-colors w-full md:w-48"
                >
                  <option value="all">All Cohorts</option>
                  {COHORTS.map((cohort) => (
                    <option key={cohort} value={cohort}>{cohort}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleExportExcel}
              disabled={feedbacks.length === 0 || exporting}
              className="comic-btn-primary shrink-0"
            >
              <CustomDownloadIcon size={14} />
              <span>{exporting ? 'Exporting Report...' : 'Download Excel Report'}</span>
            </button>
          </div>

          {/* Quick Metrics & Chart Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <div className="lg:col-span-2 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border-4 border-brand-ink p-6 shadow-[6px_6px_0px_0px_#030404] rounded-lg flex items-center gap-5">
                  <div className="p-3 border-2 border-brand-ink bg-brand-orange/15 rounded-md shadow-comic-sm shrink-0">
                    <CustomMessageIcon size={24} className="text-brand-orange" />
                  </div>
                  <div>
                    <span className="block text-[9px] font-black uppercase text-brand-ink/50 tracking-wider">
                      Feedback Reports Submitted
                    </span>
                    <strong className="text-3xl font-display font-black text-brand-ink leading-tight">
                      {totalFormsSubmitted}
                    </strong>
                  </div>
                </div>

                <div className="bg-white border-4 border-brand-ink p-6 shadow-[6px_6px_0px_0px_#030404] rounded-lg flex items-center gap-5">
                  <div className="p-3 border-2 border-brand-ink bg-brand-orange/15 rounded-md shadow-comic-sm shrink-0">
                    <CustomStarIcon size={24} filled className="text-brand-orange" />
                  </div>
                  <div>
                    <span className="block text-[9px] font-black uppercase text-brand-ink/50 tracking-wider">
                      Global Average Rating
                    </span>
                    <strong className="text-3xl font-display font-black text-brand-ink leading-tight">
                      {globalAvgRating} <span className="text-xs text-brand-ink/40 font-bold uppercase tracking-wider font-mono">/ 5.0</span>
                    </strong>
                  </div>
                </div>
              </div>

              {/* Star Rating Distribution Graph */}
              <div className="bg-white border-4 border-brand-ink p-6 md:p-8 shadow-[8px_8px_0px_0px_#030404] rounded-lg space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-brand-ink pb-3">
                  <h2 className="text-sm font-display font-black uppercase text-brand-ink">
                    Star Distribution Graph
                  </h2>
                  
                  {ratingQuestionsList.length > 0 && (
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <span className="text-[9px] font-black uppercase tracking-wider text-brand-ink/50 shrink-0 font-mono">Question:</span>
                      <select
                        value={selectedRatingQId}
                        onChange={(e) => setSelectedRatingQId(e.target.value)}
                        className="bg-brand-cloud border-2 border-brand-ink text-brand-ink text-[10px] font-bold rounded py-1 px-2.5 focus:outline-none w-full md:w-64 truncate font-mono"
                      >
                        {ratingQuestionsList.map((q) => (
                          <option key={q.id} value={q.id}>
                            {q.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {totalFormsSubmitted === 0 || !selectedRatingQId ? (
                  <div className="text-center p-8 bg-brand-cloud border-2 border-brand-ink border-dashed rounded-md text-brand-ink/50 text-xs font-bold uppercase font-mono">
                    No active star rating responses logged for this selection.
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold uppercase text-brand-ink/50">Average Score:</span>
                      <span className="text-lg font-black text-brand-pink">{selectedRatingStats.avg} / 5.0</span>
                      <span className="text-[10px] font-bold text-brand-ink/35">({selectedRatingStats.total} responses)</span>
                    </div>
                    <PureReactColumnChart data={selectedRatingStats.distribution} />
                  </div>
                )}
              </div>

            </div>

            {/* Side Column: Dynamic Paragraph Written Summary Observations */}
            <div className="bg-white border-4 border-brand-ink p-6 shadow-[8px_8px_0px_0px_#030404] rounded-lg flex flex-col max-h-[560px] overflow-hidden">
              <div className="border-b-2 border-brand-ink pb-3 mb-4 shrink-0">
                <h2 className="text-sm font-display font-black uppercase text-brand-ink">
                  Written Feedback Stream
                </h2>
              </div>

              {dynamicTextAnswers.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-center p-8 bg-brand-cloud border-2 border-brand-ink border-dashed rounded-md text-brand-ink/50 text-xs font-bold uppercase font-mono">
                  No text observations recorded.
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-thin">
                  {dynamicTextAnswers.map((stream) => (
                    <div key={stream.qId} className="space-y-3">
                      <span className="block text-[10px] font-black text-brand-orange tracking-wider border-b border-brand-ink/10 pb-1 font-mono">
                        <span className="uppercase">Topic:</span> {stream.label}
                      </span>
                      <div className="space-y-3">
                        {stream.answers.map((ans: any, idx: number) => (
                          <div
                            key={idx}
                            className="bg-brand-cloud border-2 border-brand-ink p-3 rounded-md shadow-comic-sm space-y-1.5"
                          >
                            <p className="text-xs font-mono font-bold text-brand-ink/85 leading-relaxed">
                              &ldquo;{ans.text}&rdquo;
                            </p>
                            <span className="block text-[8px] text-right font-black uppercase text-brand-ink/40 font-mono tracking-widest">
                              {ans.date || 'Today'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* MCQ Responses Distribution Graph */}
          {mcqStatsList.length > 0 && (
            <div className="bg-white border-4 border-brand-ink p-6 md:p-8 shadow-[8px_8px_0px_0px_#030404] rounded-lg space-y-6">
              <h2 className="text-base font-display font-black uppercase text-brand-ink border-b-2 border-brand-ink pb-3">
                Multiple Choice Question (MCQ) Distribution
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {mcqStatsList.map((mcq) => (
                  <div key={mcq.id} className="space-y-4 border-2 border-brand-ink/10 p-4 rounded-md">
                    <h3 className="text-xs font-black text-brand-pink tracking-wider leading-relaxed">
                      {mcq.label} <span className="text-[10px] font-bold text-brand-ink/40">({mcq.total} responses)</span>
                    </h3>
                    <div className="space-y-3">
                      {mcq.distributions.map((dist: any, dIdx: number) => (
                        <div key={dIdx} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-brand-ink">
                            <span>{dist.option}</span>
                            <span>{dist.count} ({Math.round(dist.percentage)}%)</span>
                          </div>
                          <div className="w-full bg-brand-cloud border-2 border-brand-ink h-4 rounded-md overflow-hidden relative shadow-comic-sm">
                            <div 
                              className="bg-brand-pink h-full border-r-2 border-brand-ink transition-all duration-300"
                              style={{ width: `${dist.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dynamic star rating items comparisons table */}
          <div className="bg-white border-4 border-brand-ink p-6 md:p-8 shadow-[8px_8px_0px_0px_#030404] rounded-lg space-y-6">
            <div className="border-b-2 border-brand-ink pb-3">
              <h2 className="text-base font-display font-black uppercase text-brand-ink">
                Session Performance & Attendee Comments
              </h2>
            </div>

            {ratingPerformanceList.length === 0 ? (
              <div className="text-center p-8 bg-brand-cloud border-2 border-brand-ink border-dashed rounded-md text-brand-ink/50 text-xs font-bold uppercase font-mono">
                No star rating elements compiled for this selection.
              </div>
            ) : (
              <div className="space-y-6">
                {ratingPerformanceList.map((evt) => (
                  <div 
                    key={evt.id}
                    className="border-2 border-brand-ink p-5 shadow-[4px_4px_0px_0px_#030404] rounded-lg bg-white space-y-4"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-brand-ink/10 pb-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-black tracking-tight text-brand-ink break-words">
                          {evt.title}
                        </h3>
                      </div>

                      <div className="flex gap-6 items-center shrink-0">
                        <div className="text-center shrink-0">
                          <span className="block text-[8px] font-black uppercase text-brand-ink/40 tracking-wider font-mono">Answers</span>
                          <strong className="text-lg font-black text-brand-ink tabular-nums">{evt.totalAnswers}</strong>
                        </div>
                        <div className="text-center shrink-0">
                          <span className="block text-[8px] font-black uppercase text-brand-ink/40 tracking-wider font-mono">Avg Rating</span>
                          <strong className="text-lg font-black text-brand-pink tabular-nums">{evt.avg}</strong>
                        </div>
                        <div className="text-center shrink-0">
                          <span className="block text-[8px] font-black uppercase text-brand-ink/40 tracking-wider font-mono">5-Star Ratio</span>
                          <strong className="text-lg font-black text-green-600 tabular-nums">{evt.fiveStars}%</strong>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="block text-[9px] font-black uppercase text-brand-ink/40 tracking-wider font-mono">Attendee Notes Feed:</span>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {evt.comments.map((comment: any, cIdx: number) => (
                          <div key={cIdx} className="bg-brand-cloud/40 border border-brand-ink/10 p-3 rounded-md text-xs leading-relaxed text-brand-ink font-bold relative shadow-comic-sm">
                            <div className="flex justify-between items-center mb-1">
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <CustomStarIcon
                                    key={s}
                                    size={8}
                                    filled={s <= comment.rating}
                                    className={s <= comment.rating ? 'text-brand-ink' : 'text-brand-ink/10'}
                                  />
                                ))}
                              </div>
                              <span className="text-[8px] font-black text-brand-ink/40 uppercase tracking-widest font-mono">
                                {comment.date}
                              </span>
                            </div>
                            &ldquo;{comment.text}&rdquo;
                          </div>
                        ))}
                        {evt.comments.length === 0 && (
                          <p className="text-[10px] font-bold text-brand-ink/35 uppercase tracking-wide">
                            No written comments logged for this evaluation item.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ============================================================================
          TAB: COMPLAINTS
          ============================================================================ */}
      {activeTab === 'complaints' && (
        <div className="space-y-8 animate-fade-in">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-brand-ink/10 pb-4">
            <div>
              <h1 className="text-3xl font-display font-black uppercase text-brand-ink mb-2">
                Student Complaints
              </h1>
              <p className="text-brand-ink/50 text-xs font-bold uppercase tracking-wider">
                Manage and route student grievances submitted through the Complaint Portal
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex gap-4 shrink-0">
              <div className="bg-white border-2 border-brand-ink px-4 py-2 rounded-md shadow-[3px_3px_0px_0px_#030404] text-center min-w-[70px]">
                <span className="block text-[8px] font-black uppercase text-brand-ink/40 tracking-wider font-mono">Total</span>
                <strong className="text-base font-black text-brand-ink">{complaints.length}</strong>
              </div>
              <div className="bg-white border-2 border-brand-ink px-4 py-2 rounded-md shadow-[3px_3px_0px_0px_#030404] text-center min-w-[70px]">
                <span className="block text-[8px] font-black uppercase text-brand-ink/40 tracking-wider font-mono">Pending</span>
                <strong className="text-base font-black text-brand-pink">{pendingComplaintsCount}</strong>
              </div>
              <div className="bg-white border-2 border-brand-ink px-4 py-2 rounded-md shadow-[3px_3px_0px_0px_#030404] text-center min-w-[70px]">
                <span className="block text-[8px] font-black uppercase text-brand-ink/40 tracking-wider font-mono">Resolved</span>
                <strong className="text-base font-black text-green-600">{complaints.length - pendingComplaintsCount}</strong>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white border-4 border-brand-ink p-4 md:p-5 shadow-[6px_6px_0px_0px_#030404] rounded-lg space-y-4 md:space-y-0 md:flex md:items-center md:justify-between md:gap-4">
            <div className="grid grid-cols-2 md:flex md:flex-wrap gap-3 items-center flex-1">
              <div className="col-span-1 flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-brand-ink/50 tracking-wider">Status:</span>
                <select
                  value={complaintStatusFilter}
                  onChange={(e) => setComplaintStatusFilter(e.target.value as any)}
                  className="bg-brand-cloud border-2 border-brand-ink text-brand-ink text-xs font-bold rounded p-1.5 focus:outline-none w-full md:w-auto"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div className="col-span-1 flex items-center gap-2 md:order-3">
                <span className="text-[10px] font-black uppercase text-brand-ink/50 tracking-wider">Sort:</span>
                <select
                  value={complaintDateSort}
                  onChange={(e) => setComplaintDateSort(e.target.value as any)}
                  className="bg-brand-cloud border-2 border-brand-ink text-brand-ink text-xs font-bold rounded p-1.5 focus:outline-none w-full md:w-auto"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>

              <div className="col-span-2 flex items-center gap-2 md:order-2 md:min-w-[160px]">
                <span className="text-[10px] font-black uppercase text-brand-ink/50 tracking-wider">Dept:</span>
                <select
                  value={complaintDepartmentFilter}
                  onChange={(e) => setComplaintDepartmentFilter(e.target.value)}
                  className="bg-brand-cloud border-2 border-brand-ink text-brand-ink text-xs font-bold rounded p-1.5 focus:outline-none w-full md:w-auto"
                >
                  <option value="all">All Departments</option>
                  {complaintDepartments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="w-full md:w-64">
              <input
                type="text"
                value={complaintSearch}
                onChange={(e) => setComplaintSearch(e.target.value)}
                placeholder="Search complaints..."
                className="w-full bg-white border-2 border-brand-ink rounded py-1.5 px-3 focus:outline-none focus:border-brand-pink text-xs font-bold text-brand-ink placeholder:text-brand-ink/30"
              />
            </div>
          </div>

          {/* List */}
          <div className="space-y-6">
            {filteredComplaints.length === 0 ? (
              <div className="bg-white border-4 border-brand-ink p-12 shadow-[6px_6px_0px_0px_#030404] rounded-lg text-center">
                <p className="text-sm font-black text-brand-ink/40 uppercase tracking-widest font-mono">
                  No matching complaints found
                </p>
              </div>
            ) : (
              filteredComplaints.map((item) => {
                const dateStr = item.submittedAt?.toDate ? item.submittedAt.toDate().toLocaleString() : 'N/A';
                const isPending = item.status !== 'resolved';
                
                return (
                  <div 
                    key={item.id} 
                    className="bg-white border-4 border-brand-ink p-6 shadow-[6px_6px_0px_0px_#030404] rounded-lg space-y-4 animate-fade-in"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-brand-ink/10 pb-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="bg-brand-pink/15 text-brand-pink border-2 border-brand-ink px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#030404]">
                          {item.department || 'General'}
                        </span>
                        <span className={`border-2 border-brand-ink px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#030404] ${
                          isPending ? 'bg-brand-orange/15 text-brand-orange' : 'bg-green-100 text-green-600'
                        }`}>
                          {item.status || 'pending'}
                        </span>
                        {item.anonymous ? (
                          <span className="bg-brand-cloud border-2 border-brand-ink px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider text-brand-ink/60">
                            Anonymous
                          </span>
                        ) : (
                          <span className="bg-brand-blue/15 text-brand-blue border-2 border-brand-ink px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#030404]">
                            {item.studentName} ({item.studentBatch}{item.studentCohort ? `, ${item.studentCohort}` : ''})
                          </span>
                        )}
                      </div>
                      
                      <span className="text-[10px] font-black text-brand-ink/40 uppercase tracking-widest sm:text-right font-mono">
                        {dateStr}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-brand-ink leading-relaxed bg-brand-cloud/30 border-2 border-brand-ink/5 p-4 rounded-md">
                      {item.description}
                    </div>

                    {/* Attachments */}
                    {item.attachmentUrls && item.attachmentUrls.length > 0 && (
                      <div className="space-y-2">
                        <span className="block text-[9px] font-black uppercase text-brand-ink/40 tracking-wider font-mono">
                          Attachments ({item.attachmentUrls.length}):
                        </span>
                        <div className="flex flex-wrap gap-3">
                          {item.attachmentUrls.map((url: string, index: number) => {
                            const isVideo = url.includes('.mp4') || url.includes('.webm') || url.includes('.mov');
                            return (
                              <a
                                key={index}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 border-2 border-brand-ink bg-brand-cloud hover:bg-brand-cloud/80 text-brand-ink text-[10px] font-black px-3 py-1.5 shadow-[2px_2px_0px_0px_#030404] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#030404] transition-all rounded cursor-pointer"
                              >
                                <CustomDownloadIcon size={12} />
                                <span>Attachment {index + 1} ({isVideo ? 'Video' : 'Image'})</span>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => handleToggleComplaintStatus(item.id, item.status)}
                        className={`border-2 border-brand-ink font-display text-[11px] font-black px-4 py-2.5 rounded shadow-[3px_3px_0px_0px_#030404] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all duration-100 cursor-pointer uppercase tracking-wider ${
                          isPending 
                            ? 'bg-green-500 hover:bg-green-600 text-slate-900' 
                            : 'bg-brand-orange hover:bg-brand-orange/90 text-brand-ink'
                        }`}
                      >
                        {isPending ? 'Mark as Resolved' : 'Mark as Pending'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ============================================================================
          TAB: SUGGESTIONS
          ============================================================================ */}
      {activeTab === 'suggestions' && (
        <div className="space-y-8 animate-fade-in">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-brand-ink/10 pb-4">
            <div>
              <h1 className="text-3xl font-display font-black uppercase text-brand-ink mb-2">
                Student Suggestions
              </h1>
              <p className="text-brand-ink/50 text-xs font-bold uppercase tracking-wider">
                Suggestions collected from the Idea Capsule Suggestion Box
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-4 shrink-0">
              <div className="bg-white border-2 border-brand-ink px-4 py-2 rounded-md shadow-[3px_3px_0px_0px_#030404] text-center min-w-[70px]">
                <span className="block text-[8px] font-black uppercase text-brand-ink/40 tracking-wider font-mono">Total</span>
                <strong className="text-base font-black text-brand-ink">{suggestions.length}</strong>
              </div>
              <div className="bg-white border-2 border-brand-ink px-4 py-2 rounded-md shadow-[3px_3px_0px_0px_#030404] text-center min-w-[70px]">
                <span className="block text-[8px] font-black uppercase text-brand-ink/40 tracking-wider font-mono">Pending</span>
                <strong className="text-base font-black text-brand-orange">{pendingSuggestionsCount}</strong>
              </div>
              <div className="bg-white border-2 border-brand-ink px-4 py-2 rounded-md shadow-[3px_3px_0px_0px_#030404] text-center min-w-[70px]">
                <span className="block text-[8px] font-black uppercase text-brand-ink/40 tracking-wider font-mono">Reviewed</span>
                <strong className="text-base font-black text-green-600">{suggestions.length - pendingSuggestionsCount}</strong>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white border-4 border-brand-ink p-4 md:p-5 shadow-[6px_6px_0px_0px_#030404] rounded-lg space-y-4 md:space-y-0 md:flex md:items-center md:justify-between md:gap-4">
            <div className="grid grid-cols-2 md:flex md:flex-wrap gap-3 items-center flex-1">
              <div className="col-span-1 flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-brand-ink/50 tracking-wider">Status:</span>
                <select
                  value={suggestionStatusFilter}
                  onChange={(e) => setSuggestionStatusFilter(e.target.value as any)}
                  className="bg-brand-cloud border-2 border-brand-ink text-brand-ink text-xs font-bold rounded p-1.5 focus:outline-none w-full md:w-auto"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                </select>
              </div>

              <div className="col-span-1 flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-brand-ink/50 tracking-wider">Sort:</span>
                <select
                  value={suggestionDateSort}
                  onChange={(e) => setSuggestionDateSort(e.target.value as any)}
                  className="bg-brand-cloud border-2 border-brand-ink text-brand-ink text-xs font-bold rounded p-1.5 focus:outline-none w-full md:w-auto"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            </div>

            <div className="w-full md:w-64">
              <input
                type="text"
                value={suggestionSearch}
                onChange={(e) => setSuggestionSearch(e.target.value)}
                placeholder="Search suggestions..."
                className="w-full bg-white border-2 border-brand-ink rounded py-1.5 px-3 focus:outline-none focus:border-brand-pink text-xs font-bold text-brand-ink placeholder:text-brand-ink/30"
              />
            </div>
          </div>

          {/* List */}
          <div className="space-y-6">
            {filteredSuggestions.length === 0 ? (
              <div className="bg-white border-4 border-brand-ink p-12 shadow-[6px_6px_0px_0px_#030404] rounded-lg text-center">
                <p className="text-sm font-black text-brand-ink/40 uppercase tracking-widest font-mono">
                  No matching suggestions found
                </p>
              </div>
            ) : (
              filteredSuggestions.map((item) => {
                const dateStr = item.submittedAt?.toDate ? item.submittedAt.toDate().toLocaleString() : 'N/A';
                const isPending = item.status !== 'reviewed';
                
                return (
                  <div 
                    key={item.id} 
                    className="bg-white border-4 border-brand-ink p-6 shadow-[6px_6px_0px_0px_#030404] rounded-lg space-y-4 animate-fade-in"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-brand-ink/10 pb-4">
                      <div className="flex items-center gap-3">
                        <span className="bg-brand-orange/15 text-brand-orange border-2 border-brand-ink px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#030404]">
                          Idea Capsule
                        </span>
                        <span className={`border-2 border-brand-ink px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#030404] ${
                          isPending ? 'bg-brand-orange/15 text-brand-orange' : 'bg-green-100 text-green-600'
                        }`}>
                          {item.status || 'pending'}
                        </span>
                      </div>
                      
                      <span className="text-[10px] font-black text-brand-ink/40 uppercase tracking-widest sm:text-right font-mono">
                        {dateStr}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-brand-ink leading-relaxed bg-brand-cloud/30 border-2 border-brand-ink/5 p-4 rounded-md">
                      {item.suggestion}
                    </div>

                    {/* Attachments */}
                    {item.attachmentUrls && item.attachmentUrls.length > 0 && (
                      <div className="space-y-2">
                        <span className="block text-[9px] font-black uppercase text-brand-ink/40 tracking-wider font-mono">
                          Attachments ({item.attachmentUrls.length}):
                        </span>
                        <div className="flex flex-wrap gap-3">
                          {item.attachmentUrls.map((url: string, index: number) => {
                            const isVideo = url.includes('.mp4') || url.includes('.webm') || url.includes('.mov');
                            return (
                              <a
                                key={index}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 border-2 border-brand-ink bg-brand-cloud hover:bg-brand-cloud/80 text-brand-ink text-[10px] font-black px-3 py-1.5 shadow-[2px_2px_0px_0px_#030404] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#030404] transition-all rounded cursor-pointer"
                              >
                                <CustomDownloadIcon size={12} />
                                <span>Attachment {index + 1} ({isVideo ? 'Video' : 'Image'})</span>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => handleToggleSuggestionStatus(item.id, item.status)}
                        className={`border-2 border-brand-ink font-display text-[11px] font-black px-4 py-2.5 rounded shadow-[3px_3px_0px_0px_#030404] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all duration-100 cursor-pointer uppercase tracking-wider ${
                          isPending 
                            ? 'bg-green-500 hover:bg-green-600 text-slate-900' 
                            : 'bg-brand-orange hover:bg-brand-orange/90 text-brand-ink'
                        }`}
                      >
                        {isPending ? 'Mark as Reviewed' : 'Mark as Pending'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ============================================================================
          TAB: FORM ACCESS CONTROL
          ============================================================================ */}
      {activeTab === 'access' && (
        <div className="bg-white border-4 border-brand-ink p-6 md:p-8 shadow-[8px_8px_0px_0px_#030404] rounded-lg space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-brand-ink/10 pb-4">
            <div>
              <h1 className="text-3xl font-display font-black uppercase text-brand-ink mb-2">
                Form Access Control
              </h1>
              <p className="text-brand-ink/50 text-xs font-bold uppercase tracking-wider">
                Configure active evaluation day and toggle form visibility for students
              </p>
            </div>
            
            {/* Live status badge */}
            <div className="flex items-center gap-2 text-xs shrink-0">
              <span className="hidden sm:inline font-bold text-brand-ink/50 uppercase">Live Form:</span>
              <div className="flex items-center gap-2 border-2 border-brand-ink px-3 py-1 rounded bg-brand-cloud shadow-comic-sm bg-white">
                {liveFormOpen ? (
                  <>
                    <span className="font-black uppercase text-brand-ink text-[11px]">{liveActiveDayId}</span>
                    <span className="w-2 h-2 rounded-full border border-brand-ink bg-green-500 animate-pulse" />
                    <span className="font-black uppercase text-brand-ink text-[9px] tracking-wider">OPEN</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full border border-brand-ink bg-red-500" />
                    <span className="font-black uppercase text-brand-ink text-[9px] tracking-wider">CLOSED</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Active Day Selection */}
              <div className="bg-brand-cloud/40 border-2 border-brand-ink p-6 rounded-md shadow-comic-sm space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-brand-ink">
                    Select Active Day
                  </h3>
                  <p className="text-[10px] text-brand-ink/50 font-bold uppercase mt-1">
                    Choose which day&apos;s form students can access
                  </p>
                </div>
                <div className="pt-2">
                  <select
                    value={accessActiveDayIdx}
                    onChange={(e) => setAccessActiveDayIdx(Number(e.target.value))}
                    className="bg-white border-2 border-brand-ink text-brand-ink text-sm font-bold rounded-md py-3 px-4 focus:outline-none focus:border-brand-pink transition-colors w-full shadow-inner"
                  >
                    {SCHEDULE_DATA.map((day, idx) => (
                      <option key={day.day} value={idx}>
                        {day.day} ({day.date})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Form Status Open/Close Selection */}
              <div className="bg-brand-cloud/40 border-2 border-brand-ink p-6 rounded-md shadow-comic-sm space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-brand-ink">
                    Form Visibility Status
                  </h3>
                  <p className="text-[10px] text-brand-ink/50 font-bold uppercase mt-1">
                    Open or close submissions for the active day
                  </p>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    key="open"
                    type="button"
                    onClick={() => setIsFormOpen(true)}
                    className={`flex-1 py-2.5 px-4 font-display text-xs font-black uppercase tracking-wider transition-all rounded-md cursor-pointer border-2 ${
                      isFormOpen
                        ? 'bg-green-500 text-slate-900 border-brand-ink shadow-[3px_3px_0px_0px_#030404] translate-x-[-1px] translate-y-[-1px]'
                        : 'bg-white text-brand-ink/65 border-brand-ink shadow-[3px_3px_0px_0px_#030404] hover:bg-brand-cloud'
                    }`}
                  >
                    Open
                  </button>
                  <button
                    key="closed"
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className={`flex-1 py-2.5 px-4 font-display text-xs font-black uppercase tracking-wider transition-all rounded-md cursor-pointer border-2 ${
                      !isFormOpen
                        ? 'bg-red-500 text-slate-900 border-brand-ink shadow-[3px_3px_0px_0px_#030404] translate-x-[-1px] translate-y-[-1px]'
                        : 'bg-white text-brand-ink/65 border-brand-ink shadow-[3px_3px_0px_0px_#030404] hover:bg-brand-cloud'
                    }`}
                  >
                    Closed
                  </button>
                </div>
              </div>
            </div>

            {/* Auto-save Status Indicator */}
            <div className="flex items-center justify-between gap-4 pt-6 border-t-2 border-brand-ink/10 text-xs font-black uppercase tracking-wider">
              <div className="flex items-center gap-2">
                {saveStatus === 'saving' && (
                  <>
                    <CustomLoaderIcon size={16} className="text-brand-pink shrink-0 animate-spin" />
                    <span className="text-brand-pink">Saving changes to database...</span>
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <CustomCheckIcon size={16} className="text-green-600 shrink-0" />
                    <span className="text-green-600">All changes saved live!</span>
                  </>
                )}
                {saveStatus === 'idle' && (
                  <span className="text-brand-ink/40">Ready</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================
          TAB: FORM CONFIGURATOR (FORM BUILDER)
          ============================================================================ */}
      {activeTab === 'configurator' && (
        <div className="bg-white border-4 border-brand-ink p-6 md:p-8 shadow-[8px_8px_0px_0px_#030404] rounded-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-brand-ink/10 pb-4 mb-6">
            <div>
              <h1 className="text-3xl font-display font-black uppercase text-brand-ink mb-2">
                Form Builder
              </h1>
              <p className="text-brand-ink/50 text-xs font-bold uppercase tracking-wider">
                Configuring active day: <span className="text-brand-blue font-black font-mono">{activeConfigDay}</span> ({activeConfigDate})
              </p>
            </div>
            
            {/* Live status badge */}
            <div className="flex items-center gap-2 text-xs shrink-0">
              <span className="hidden sm:inline font-bold text-brand-ink/50 uppercase">Live Form:</span>
              <div className="flex items-center gap-2 border-2 border-brand-ink px-3 py-1 rounded bg-brand-cloud shadow-comic-sm bg-white">
                {liveFormOpen ? (
                  <>
                    <span className="font-black uppercase text-brand-ink text-[11px]">{liveActiveDayId}</span>
                    <span className="w-2 h-2 rounded-full border border-brand-ink bg-green-500 animate-pulse" />
                    <span className="font-black uppercase text-brand-ink text-[9px] tracking-wider">OPEN</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full border border-brand-ink bg-red-500" />
                    <span className="font-black uppercase text-brand-ink text-[9px] tracking-wider">CLOSED</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              {/* Day Selection */}
              <div className="bg-brand-cloud/40 border-2 border-brand-ink p-6 rounded-md shadow-comic-sm space-y-4">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-brand-ink">
                    Select Day to Edit Questions
                  </h3>
                </div>
                <div className="pt-2">
                  <select
                    value={builderActiveDayIdx}
                    onChange={(e) => setBuilderActiveDayIdx(Number(e.target.value))}
                    className="bg-white border-2 border-brand-ink text-brand-ink text-xs font-bold rounded-md py-2.5 px-4 focus:outline-none focus:border-brand-pink transition-colors w-full shadow-inner"
                  >
                    {SCHEDULE_DATA.map((day, idx) => (
                      <option key={day.day} value={idx}>
                        {day.day} ({day.date})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Batch Selection */}
              <div className="bg-brand-cloud/40 border-2 border-brand-ink p-6 rounded-md shadow-comic-sm space-y-4">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-brand-ink">
                    Select Batch to Edit Questions
                  </h3>
                </div>
                <div className="flex gap-2 flex-wrap pt-2">
                  {['Batch 1', 'Batch 2', 'Batch 3', 'Batch 4'].map((batch) => (
                    <button
                      key={batch}
                      type="button"
                      onClick={() => setConfigActiveBatch(batch)}
                      className={`py-2.5 px-5 font-display text-xs font-black uppercase tracking-wider transition-all rounded-md cursor-pointer border-2 ${
                        configActiveBatch === batch
                          ? 'bg-brand-blue text-slate-900 border-brand-ink shadow-[3px_3px_0px_0px_#030404] translate-x-[-1px] translate-y-[-1px]'
                          : 'bg-white text-brand-ink/65 border-brand-ink shadow-[3px_3px_0px_0px_#030404] hover:bg-brand-cloud'
                      }`}
                    >
                      {batch}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-6">
              <div className="border-b-2 border-brand-ink pb-2">
                <h3 className="text-xs font-black uppercase text-brand-ink/75 tracking-wider">
                  Questions on this Form ({configActiveBatch})
                </h3>
              </div>

              <div className="space-y-4">
                {configQuestionsList.map((q, qIdx) => (
                  <div 
                    key={q.id}
                    className="bg-brand-cloud/30 border-2 border-brand-ink p-4 rounded-md shadow-comic-sm flex flex-col gap-4 animate-fade-in"
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-mono font-black text-brand-ink">
                          #{String(qIdx + 1).padStart(2, '0')}
                        </span>
                        <span className={`border-2 border-brand-ink px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider shadow-[1px_1px_0px_0px_#030404] ${
                          q.type === 'rating' ? 'bg-brand-orange/15 text-brand-orange' : q.type === 'mcq' ? 'bg-brand-blue/15 text-brand-blue' : q.type === 'text' ? 'bg-brand-pink/15 text-brand-pink' : 'bg-purple-500/15 text-purple-600'
                        }`}>
                          {q.type === 'rating' ? '★ Rating' : q.type === 'mcq' ? '☰ MCQ' : q.type === 'text' ? '✏️ Text' : '📅 Date'}
                        </span>
                        <label className="inline-flex items-center gap-1.5 cursor-pointer ">
                          <input
                            type="checkbox"
                            checked={!!q.required}
                            onChange={() => handleToggleQuestionRequired(q.id)}
                            className="w-3.5 h-3.5 border-2 border-brand-ink accent-brand-blue rounded cursor-pointer"
                          />
                          <span className="text-[9px] font-bold uppercase text-brand-ink tracking-wider font-mono">Mandatory</span>
                        </label>
                      </div>

                      <div className="flex-1 w-full">
                        <input
                          type="text"
                          value={q.label}
                          onChange={(e) => handleUpdateQuestionLabel(q.id, e.target.value)}
                          className="w-full bg-white border-2 border-brand-ink rounded py-2 px-3 focus:outline-none focus:border-brand-pink text-xs text-brand-ink font-black"
                          placeholder="Type question text..."
                          required
                        />
                      </div>

                      <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(qIdx, 'up')}
                          disabled={qIdx === 0}
                          className="border-2 border-brand-ink disabled:opacity-30 disabled:pointer-events-none hover:bg-brand-cloud text-brand-ink text-xs font-black shadow-[2px_2px_0px_0px_#030404] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#030404] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100 px-2 py-1 rounded cursor-pointer"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(qIdx, 'down')}
                          disabled={qIdx === configQuestionsList.length - 1}
                          className="border-2 border-brand-ink disabled:opacity-30 disabled:pointer-events-none hover:bg-brand-cloud text-brand-ink text-xs font-black shadow-[2px_2px_0px_0px_#030404] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#030404] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100 px-2 py-1 rounded cursor-pointer"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(q.id)}
                          className="border-2 border-brand-ink hover:bg-brand-pink/15 text-brand-pink text-[10px] font-black shadow-[2px_2px_0px_0px_#030404] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#030404] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100 px-3 py-1.5 rounded cursor-pointer uppercase tracking-wider flex-1 md:flex-initial md:w-auto text-center"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* MCQ Options */}
                    {q.type === 'mcq' && (
                      <div className="pl-6 pt-2 border-t border-brand-ink/10 space-y-2">
                        <div className="text-[10px] font-black uppercase text-brand-ink/65 tracking-wider font-mono">
                          Configure Choices
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(q.options || []).map((opt: string, optIdx: number) => (
                            <div key={optIdx} className="flex items-center gap-1">
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => handleUpdateMCQOption(q.id, optIdx, e.target.value)}
                                className="flex-1 bg-white border-2 border-brand-ink rounded py-1 px-2 focus:outline-none focus:border-brand-pink text-xs text-brand-ink font-semibold"
                                placeholder={`Option ${optIdx + 1}`}
                                required
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveMCQOption(q.id, optIdx)}
                                disabled={(q.options || []).length <= 2}
                                className="border-2 border-brand-ink bg-white disabled:opacity-30 disabled:pointer-events-none hover:bg-brand-pink/15 text-brand-pink text-[10px] font-black p-1.5 rounded cursor-pointer shrink-0"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddMCQOption(q.id)}
                          className="inline-flex items-center text-[10px] font-black uppercase text-brand-blue hover:text-brand-blue/80 gap-1 cursor-pointer font-mono"
                        >
                          + Add Choice Option
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {configQuestionsList.length === 0 && (
                  <p className="text-center py-12 text-xs font-black text-brand-ink/40 uppercase tracking-widest font-mono">
                    This form is empty. Add a question below to start building!
                  </p>
                )}
              </div>

              {/* Add Question Controls */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-brand-ink/10">
                <button
                  type="button"
                  onClick={() => handleAddQuestion('rating')}
                  className="flex-1 border-2 border-brand-ink bg-brand-orange/15 hover:bg-brand-orange/30 text-brand-ink text-xs font-black py-3 px-4 shadow-[3px_3px_0px_0px_#030404] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#030404] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all duration-100 rounded-md cursor-pointer uppercase tracking-wider text-center"
                >
                  + Add Star Rating
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion('text')}
                  className="flex-1 border-2 border-brand-ink bg-brand-pink/15 hover:bg-brand-pink/30 text-brand-ink text-xs font-black py-3 px-4 shadow-[3px_3px_0px_0px_#030404] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#030404] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all duration-100 rounded-md cursor-pointer uppercase tracking-wider text-center"
                >
                  + Add Written Question
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion('mcq')}
                  className="flex-1 border-2 border-brand-ink bg-brand-blue/15 hover:bg-brand-blue/30 text-brand-ink text-xs font-black py-3 px-4 shadow-[3px_3px_0px_0px_#030404] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#030404] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all duration-100 rounded-md cursor-pointer uppercase tracking-wider text-center"
                >
                  + Add MCQ Option
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion('date')}
                  className="flex-1 border-2 border-brand-ink bg-purple-500/15 hover:bg-purple-500/30 text-brand-ink text-xs font-black py-3 px-4 shadow-[3px_3px_0px_0px_#030404] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#030404] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all duration-100 rounded-md cursor-pointer uppercase tracking-wider text-center"
                >
                  + Add Date Question
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const suffix = configActiveBatch.toLowerCase().replace(' ', '_');
                    setBatchForms((prev) => ({
                      ...prev,
                      [builderActiveKey]: [
                        { id: `q_${suffix}_rating_1`, type: 'rating', label: 'How would you rate your day overall?', required: true },
                        { id: `q_${suffix}_mcq_1`, type: 'mcq', label: "How was the day's pace?", options: ['Too Fast', 'Just Right', 'Too Slow'], required: true },
                        { id: `q_${suffix}_mcq_2`, type: 'mcq', label: 'Did you feel engaged throughout the day?', options: ['Yes', 'Partially', 'No'], required: true },
                        { id: `q_${suffix}_rating_2`, type: 'rating', label: "How relevant and valuable were today's activities for you?", required: true },
                        { id: `q_${suffix}_rating_3`, type: 'rating', label: 'How clearly was information communicated throughout the day?', required: true },
                        { id: `q_${suffix}_rating_4`, type: 'rating', label: "How comfortable were today's arrangements?", required: true },
                        { id: `q_${suffix}_rating_5`, type: 'rating', label: 'How supported did you feel by your Cohort Leader / OH Team today?', required: true },
                        { id: `q_${suffix}_text_1`, type: 'text', label: 'What was the highlight of your day?', required: false },
                        { id: `q_${suffix}_text_2`, type: 'text', label: 'What could have been better today?', required: false },
                        { id: `q_${suffix}_mcq_3`, type: 'mcq', label: 'What was your energy level at the end of the day?', options: ['😴 Exhausted', '😐 Okay', '😃 Pumped Up'], required: true }
                      ]
                    }));
                  }}
                  className="flex-1 border-2 border-brand-ink bg-brand-cloud hover:bg-brand-ink/10 text-brand-ink text-xs font-black py-3 px-4 shadow-[3px_3px_0px_0px_#030404] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#030404] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all duration-100 rounded-md cursor-pointer uppercase tracking-wider text-center"
                >
                  Reset Defaults
                </button>
              </div>
            </div>

            {/* Auto-save Status Indicator */}
            <div className="flex items-center justify-between gap-4 pt-6 border-t-2 border-brand-ink text-xs font-black uppercase tracking-wider">
              <div className="flex items-center gap-2">
                {saveStatus === 'saving' && (
                  <>
                    <CustomLoaderIcon size={16} className="text-brand-pink shrink-0 animate-spin" />
                    <span className="text-brand-pink">Saving changes to database...</span>
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <CustomCheckIcon size={16} className="text-green-600 shrink-0" />
                    <span className="text-green-600">All changes saved live!</span>
                  </>
                )}
                {saveStatus === 'idle' && (
                  <span className="text-brand-ink/40">Ready</span>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// ============================================================================
// COMPONENT: PURE REACT COLUMN CHART
// ============================================================================
function PureReactColumnChart({ data }: { data: { label: string; count: number; percentage: number }[] }) {
  const maxCount = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3 h-48 pt-6 border-b-2 border-brand-ink">
        {data.map((bar, i) => {
          const heightPercent = Math.max((bar.count / maxCount) * 100, 4);
          return (
            <div key={i} className="flex-1 flex flex-col items-center group h-full justify-end ">
              <div className="opacity-0 group-hover:opacity-100 bg-brand-ink text-slate-900 text-[9px] font-black px-2 py-1 rounded border border-slate-300 mb-2 transition-all duration-100 pointer-events-none uppercase tracking-wide shrink-0">
                {bar.count} Ratings ({Math.round(bar.percentage)}%)
              </div>
              <div 
                style={{ height: `${heightPercent}%` }}
                className="w-full bg-brand-orange border-2 border-brand-ink shadow-[2px_-2px_0px_0px_#030404] transition-all duration-300 hover:bg-brand-pink cursor-pointer"
              />
              <span className="text-[10px] font-black text-brand-ink uppercase tracking-wider mt-3 text-center">
                {bar.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[9px] font-black text-brand-ink/50 uppercase tracking-widest pt-1 font-mono">
        <span>Lowest Rating</span>
        <span>Highest Rating</span>
      </div>
    </div>
  );
}
