import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { PlusIcon, XMarkIcon, InformationCircleIcon, TrashIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { getMuscleDescription } from '../utils/muscleDescriptions';

const SplitCreator = ({
  onSplitCreated,
  editorMode = false,
  editorSplit = null,
  editorSplitId = null,
  uiVariant = 'default', // 'default' | 'splitsPage'
  editorKind = 'edit', // 'edit' | 'new'
}) => {
  const navigate = useNavigate();
  const isSplitsPage = uiVariant === 'splitsPage';
  const [muscles, setMuscles] = useState([]);
  const [musclePriorities, setMusclePriorities] = useState([]);
  const [splits, setSplits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [analysis, setAnalysis] = useState({});
  const [activeMuscleDescription, setActiveMuscleDescription] = useState(null);
  const [openCalendarKey, setOpenCalendarKey] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  
  // UI State
  const [activeTab, setActiveTab] = useState('manage'); // 'manage' or 'new'
  const [selectedSplit, setSelectedSplit] = useState(null);
  const [mobileMuscleSidebarOpen, setMobileMuscleSidebarOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    split_name: '',
    start_date: '',
    split_days: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [musclesResponse, prioritiesResponse, splitsResponse] = await Promise.all([
        api.getMuscles(),
        api.getMusclePriorities(),
        api.getSplits()
      ]);
      
      if (musclesResponse.data.success) {
        setMuscles(musclesResponse.data.data);
      }
      
      if (prioritiesResponse.data.success) {
        setMusclePriorities(prioritiesResponse.data.data);
      }

      if (splitsResponse.data.success) {
        setSplits(splitsResponse.data.data);
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalysis = useCallback(() => {
    if (formData.split_days.length === 0 || musclePriorities.length === 0) {
      setAnalysis({});
      return;
    }

    const analysisData = {};
    const numDays = formData.split_days.length;

    musclePriorities.forEach(muscleLog => {
      const priority = muscleLog.priority;
      const muscleId = muscleLog.muscle_id;
      
      // Calculate total activation across all days
      let totalActivation = 0;
      let frequencyDays = 0; // F = number of days this muscle appears in the split
      formData.split_days.forEach(day => {
        const target = day.targets?.find(t => `${t.muscle}` === `${muscleId}`);
        if (target) {
          totalActivation += target.target_activation;
          frequencyDays += 1;
        }
      });

      // Calculate optimal range.
      // Default variant keeps the existing equation.
      // Splits page variant uses:
      // lowRange = 0.85 * (1700 * (P/100)^2 * sqrt(F))
      // highRange = 1.15 * (1700 * (P/100)^2 * sqrt(F))
      const safeF = Math.max(1, frequencyDays);
      const pRatio = priority / 100;
      const baseSplitsRange = 1700 * Math.pow(pRatio, 2) * Math.sqrt(safeF);

      const lowerEnd = isSplitsPage
        ? 0.85 * baseSplitsRange
        : (90 * (10 + 0.1 * priority) * 7 / numDays);

      const upperEnd = isSplitsPage
        ? 1.15 * baseSplitsRange
        : (90 * (20 + 0.1 * priority) * 7 * numDays);

      analysisData[muscleId] = {
        totalActivation,
        optimalActivation: lowerEnd, // Use lower bound as optimal for autofill
        optimalRange: { lower: lowerEnd, upper: upperEnd },
        priority,
        muscleName: muscleLog.muscle_name,
        muscleGroup: muscleLog.muscle_group,
        totalSets: isSplitsPage ? Math.floor(totalActivation / 85) : Math.round(totalActivation / 85),
        optimalSets: Math.round(lowerEnd / 85)
      };
    });

    setAnalysis(analysisData);
  }, [formData.split_days, musclePriorities, isSplitsPage]);

  useEffect(() => {
    calculateAnalysis();
  }, [calculateAnalysis]);

  const handleMuscleInfoClick = (muscleName) => {
    if (!isSplitsPage) return;
    setActiveMuscleDescription((prev) => (prev === muscleName ? null : muscleName));
  };

  const toYmd = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const parseYmdToDate = (ymd) => {
    if (!ymd || typeof ymd !== 'string') return null;
    const [yyyy, mm, dd] = ymd.split('-').map((v) => parseInt(v, 10));
    if (!yyyy || !mm || !dd) return null;
    return new Date(yyyy, mm - 1, dd);
  };

  const getCalendarDaysForMonth = useCallback(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const firstDow = firstOfMonth.getDay(); // 0..6 (Sun..Sat)

    const gridStart = new Date(year, month, 1 - firstDow);
    const days = [];
    for (let i = 0; i < 42; i += 1) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      days.push({
        day: d.getDate(),
        date: toYmd(d),
        isCurrentMonth: d.getMonth() === month,
      });
    }
    return days;
  }, [calendarMonth]);

  const toggleCalendar = (key, existingValue = '') => {
    if (!isSplitsPage) return;
    setOpenCalendarKey((prev) => {
      const next = prev === key ? null : key;
      if (next) {
        const parsed = parseYmdToDate(existingValue);
        setCalendarMonth(parsed || new Date());
      }
      return next;
    });
  };

  useEffect(() => {
    if (!openCalendarKey) return undefined;
    const handleClickOutside = (event) => {
      const target = event.target;
      if (target && target.closest && target.closest('.sc-date-picker')) return;
      setOpenCalendarKey(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openCalendarKey]);

  const getMuscleNameById = (muscleId) => {
    const found = muscles.find((m) => `${m.muscles_id}` === `${muscleId}`);
    return found?.muscle_name || '';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addSplitDay = () => {
    setFormData(prev => ({
      ...prev,
      split_days: [...prev.split_days, {
        day_name: '',
        day_order: prev.split_days.length + 1,
        targets: []
      }]
    }));
  };

  const removeSplitDay = (index) => {
    setFormData(prev => ({
      ...prev,
      split_days: prev.split_days.filter((_, i) => i !== index).map((day, i) => ({
        ...day,
        day_order: i + 1
      }))
    }));
  };

  const addTarget = (dayIndex) => {
    setFormData(prev => ({
      ...prev,
      split_days: prev.split_days.map((day, i) => 
        i === dayIndex 
          ? { ...day, targets: [...day.targets, { muscle: '', target_activation: 225 }] }
          : day
      )
    }));
  };

  const getOptimalActivation = (muscleId) => {
    if (!musclePriorities.length || !formData.split_days.length) return 225;
    
    const muscleLog = musclePriorities.find(ml => ml.muscle_id === muscleId);
    if (!muscleLog) return 225;
    
    const priority = muscleLog.priority;
    const numDays = formData.split_days.length;
    if (isSplitsPage) {
      // New minimum equation (lowRange) for /personalization/splits:
      // lowRange = 0.85 * (1700 * (P/100)^2 * sqrt(F))
      // P = muscle priority, F = number of days muscle appears in split.
      const safeF = Math.max(
        1,
        formData.split_days.reduce((count, day) => {
          const hasMuscle = (day.targets || []).some(t => `${t.muscle}` === `${muscleId}`);
          return count + (hasMuscle ? 1 : 0);
        }, 0)
      );
      const pRatio = priority / 100;
      const base = 1700 * Math.pow(pRatio, 2) * Math.sqrt(safeF);
      return Math.round(0.85 * base);
    }

    // Default variant equation (legacy)
    const lowerActivation = 90 * (10 + 0.1 * priority) * 7 / numDays;
    return Math.round(lowerActivation);
  };

  const loadSplitForEditing = (split) => {
    setSelectedSplit(split);
    setFormData({
      split_name: split.split_name,
      start_date: split.start_date || '',
      split_days: split.split_days || []
    });
  };

  useEffect(() => {
    const hydrateEditor = async () => {
      if (!editorMode) return;

      // Prefer the split passed via navigation state to avoid extra calls.
      if (editorSplit) {
        loadSplitForEditing(editorSplit);
        return;
      }

      if (!editorSplitId) return;

      try {
        const response = await api.getSplit(editorSplitId);
        if (response?.data?.success && response.data.data) {
          loadSplitForEditing(response.data.data);
        } else {
          // Fallback: try to locate it in already-loaded list if API shape differs.
          const found = splits.find(s => `${s.splits_id}` === `${editorSplitId}`);
          if (found) loadSplitForEditing(found);
        }
      } catch (e) {
        setError('Failed to load split for editing');
      }
    };

    hydrateEditor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorMode, editorSplit, editorSplitId]);

  const removeTarget = (dayIndex, targetIndex) => {
    setFormData(prev => ({
      ...prev,
      split_days: prev.split_days.map((day, i) => 
        i === dayIndex 
          ? { ...day, targets: day.targets.filter((_, j) => j !== targetIndex) }
          : day
      )
    }));
  };

  const updateDayName = (dayIndex, value) => {
    setFormData(prev => ({
      ...prev,
      split_days: prev.split_days.map((day, i) => 
        i === dayIndex ? { ...day, day_name: value } : day
      )
    }));
  };

  const updateTarget = (dayIndex, targetIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      split_days: prev.split_days.map((day, i) => 
        i === dayIndex 
          ? { 
              ...day, 
              targets: day.targets.map((target, j) => 
                j === targetIndex ? { ...target, [field]: value } : target
              )
            }
          : day
      )
    }));
  };

  const getMuscleStatus = (muscleId) => {
    const muscleAnalysis = analysis[muscleId];
    if (!muscleAnalysis) return { status: 'warning', color: '#E74C3C', label: 'No activation' };
    
    const { totalActivation, optimalRange } = muscleAnalysis;
    
    if (totalActivation === 0) {
      return { status: 'warning', color: '#E74C3C', label: 'No activation' };
    } else if (totalActivation < optimalRange.lower) {
      return { status: 'below', color: '#95A5A6', label: 'Below optimal' };
    } else if (totalActivation <= optimalRange.upper * 1.15) {
      return { status: 'optimal', color: '#27AE60', label: 'Within optimal' };
    } else {
      return { status: 'above', color: '#E74C3C', label: 'Above optimal' };
    }
  };

  const handleSplitActivation = async (splitId, startDate) => {
    try {
      await api.activateSplit(splitId, startDate);
      setSuccess('Split activated successfully!');
      loadData(); // Reload splits to get updated data
    } catch (err) {
      setError('Failed to activate split');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    setError('');
    setSuccess('');

    const editingId =
      editorMode && editorKind === 'edit' && selectedSplit?.splits_id != null
        ? selectedSplit.splits_id
        : null;

    try {
      // Backend expects `start_date` to be a valid date or null/omitted.
      // An empty string triggers DRF DateField validation errors (400).
      const sanitizedStartDate =
        formData.start_date && `${formData.start_date}`.trim() !== '' ? formData.start_date : undefined;

      const splitData = {
        split_name: formData.split_name,
        ...(sanitizedStartDate ? { start_date: sanitizedStartDate } : {}),
        split_days: formData.split_days.map(day => ({
          ...day,
          targets: day.targets.map(target => ({
            muscle: parseInt(target.muscle),
            target_activation: parseInt(target.target_activation)
          }))
        }))
      };

      if (editingId) {
        const response = await api.updateSplit(editingId, splitData);
        if (response.data.success) {
          setSuccess('Split updated successfully!');
          loadData();
          if (onSplitCreated) onSplitCreated();
          if (isSplitsPage) {
            navigate('/personalization/splits');
          }
        }
      } else {
        const response = await api.createSplit(splitData);
        if (response.data.success) {
          setSuccess('Split created successfully!');
          setFormData({
            split_name: '',
            start_date: '',
            split_days: []
          });

          if (onSplitCreated) onSplitCreated();
          loadData();
          if (isSplitsPage) {
            navigate('/personalization/splits');
          }
        }
      }
    } catch (err) {
      console.error('Error saving split:', err);
      setError(editingId != null ? 'Failed to update split' : 'Failed to create split');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteSplit = async (e, split) => {
    e.preventDefault();
    e.stopPropagation();
    if (!split?.splits_id) return;
    if (!window.confirm(`Delete split "${split.split_name}"? This cannot be undone.`)) return;
    try {
      await api.deleteSplit(split.splits_id);
      setSuccess('Split deleted.');
      loadData();
    } catch (err) {
      console.error('Error deleting split:', err);
      setError('Failed to delete split');
    }
  };

  const getAvailableMuscles = (dayIndex, currentTargetIndex) => {
    // Get all muscles that are not already used in this day (except the current target)
    const usedMuscleIds = formData.split_days[dayIndex]?.targets
      .map((target, index) => index !== currentTargetIndex ? target.muscle : null)
      .filter(Boolean) || [];
    
    return muscles.filter(muscle => !usedMuscleIds.includes(muscle.muscles_id.toString()));
  };

  if (loading) {
    return <div className="text-center p-8">Loading data...</div>;
  }

  const getStatusColorForRange = (muscleId) => {
    const muscleAnalysis = analysis[muscleId];
    if (!muscleAnalysis) return 'var(--accent-danger)';

    const { totalActivation, optimalRange } = muscleAnalysis;
    const lower = optimalRange.lower;
    const upper = optimalRange.upper;

    // Use rounded bounds so the color matches the displayed range.
    const lowerRounded = Math.round(lower);
    const upperRounded = Math.round(upper);

    if (totalActivation >= lowerRounded && totalActivation <= upperRounded) {
      return 'var(--accent-secondary)';
    }

    const withinUnder20 = totalActivation >= lowerRounded * 0.8;
    const withinOver20 = totalActivation <= upperRounded * 1.2;

    if (withinUnder20 && totalActivation < lowerRounded) {
      return 'var(--accent-warning)';
    }

    if (withinOver20 && totalActivation > upperRounded) {
      return 'var(--accent-warning)';
    }

    return 'var(--accent-danger)';
  };

  const sortedSplits = [...splits].sort((a, b) => {
    const aDate = a?.start_date ? new Date(a.start_date).getTime() : -Infinity;
    const bDate = b?.start_date ? new Date(b.start_date).getTime() : -Infinity;
    // Most recent first; splits with no start date go last.
    return bDate - aDate;
  });

  /** Splits ascending by start_date for day-diff calculation. */
  const splitsByStartAsc = [...splits]
    .filter(s => s?.start_date)
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

  const getDayCounterForSplit = (split) => {
    if (!split?.start_date) return null;
    const start = new Date(split.start_date);
    start.setHours(0, 0, 0, 0);
    const idx = splitsByStartAsc.findIndex(s => s.splits_id === split.splits_id);
    let end;
    if (idx >= 0 && idx < splitsByStartAsc.length - 1) {
      end = new Date(splitsByStartAsc[idx + 1].start_date);
    } else {
      end = new Date();
    }
    end.setHours(0, 0, 0, 0);
    const diffMs = end.getTime() - start.getTime();
    const days = Math.max(0, Math.floor(diffMs / (24 * 60 * 60 * 1000)));
    return days;
  };

  const latestActiveSplitId = sortedSplits.find(s => !!s.start_date)?.splits_id ?? null;

  return (
    <div className="split-creator" data-variant={isSplitsPage ? 'splitsPage' : 'default'}>
      {!isSplitsPage && (
        <div className="split-creator-header">
          <div className="split-creator-header-row">
            <h2 className="split-creator-title mb-0">
              {editorMode
                ? (editorKind === 'new' ? 'Add Split' : 'Edit Split')
                : 'Split Creator'}
            </h2>
            {editorMode && (
              <button
                type="button"
                className="btn btn-secondary split-creator-btn-sm split-creator-back-btn"
                onClick={() => navigate('/personalization/splits')}
              >
                Back
              </button>
            )}
          </div>
          <p className="split-creator-subtitle mb-0">
            {editorMode ? 'Edit an existing split.' : 'Create and manage your workout splits.'}
          </p>
        </div>
      )}

      {error && (
        <div className="split-creator-notice split-creator-notice--error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="split-creator-notice split-creator-notice--success" role="status">
          {success}
        </div>
      )}

      {editorMode ? (
        <form onSubmit={handleSubmit} className="split-creator-form" aria-label="Edit split">
          {!isSplitsPage && selectedSplit && (
            <div className="split-creator-banner" role="status">
              <span className="split-creator-banner-text">
                Editing: <strong>{selectedSplit.split_name}</strong>
              </span>
            </div>
          )}

          <div className={`split-creator-top-fields ${isSplitsPage ? 'split-creator-top-fields--wide' : ''}`}>
            {/* Split Name */}
            <div className="split-creator-field">
              <label htmlFor="split_name" className="form-label">Split Name</label>
              <input
                type="text"
                id="split_name"
                name="split_name"
                value={formData.split_name}
                onChange={handleInputChange}
                className="form-input"
                required
                placeholder="e.g., Push/Pull/Legs"
              />
            </div>

            {/* Start Date */}
            <div className="split-creator-field">
              <label htmlFor="start_date" className="form-label">Start Date</label>
              {isSplitsPage ? (
                <div className={`sc-date-picker sc-date-picker--full ${openCalendarKey === 'form-start-date' ? 'sc-date-picker--open' : ''}`}>
                  <input
                    type="text"
                    id="start_date"
                    name="start_date"
                    value={formData.start_date}
                    readOnly
                    className="form-input sc-date-input"
                    onClick={() => toggleCalendar('form-start-date', formData.start_date)}
                    title="Click to open calendar"
                  />

                  {openCalendarKey === 'form-start-date' && (
                    <div className="sc-calendar-popup" role="dialog" aria-modal="true">
                      <div className="sc-calendar-header">
                        <button
                          type="button"
                          onClick={() =>
                            setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))
                          }
                          aria-label="Previous month"
                          title="Previous month"
                        >
                          ←
                        </button>
                        <span>
                          {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))
                          }
                          aria-label="Next month"
                          title="Next month"
                        >
                          →
                        </button>
                      </div>

                      <div className="sc-calendar-grid">
                        <div className="sc-calendar-day-header">Sun</div>
                        <div className="sc-calendar-day-header">Mon</div>
                        <div className="sc-calendar-day-header">Tue</div>
                        <div className="sc-calendar-day-header">Wed</div>
                        <div className="sc-calendar-day-header">Thu</div>
                        <div className="sc-calendar-day-header">Fri</div>
                        <div className="sc-calendar-day-header">Sat</div>
                        {getCalendarDaysForMonth().map((day, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className={`sc-calendar-day ${day.isCurrentMonth ? 'current-month' : 'other-month'} ${
                              day.date === (formData.start_date || '') ? 'selected' : ''
                            }`}
                            disabled={!day.isCurrentMonth}
                            onClick={() => {
                              setFormData((prev) => ({ ...prev, start_date: day.date }));
                              setOpenCalendarKey(null);
                            }}
                          >
                            {day.day}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  className="form-input"
                />
              )}
            </div>
          </div>

          {/* Split Days */}
          <div className="split-creator-edit-layout">
            <div className="split-creator-days">
              <div className="split-creator-days-header">
                <label className="form-label split-creator-days-label">Split Days</label>
                <div className="split-creator-help">
                  <InformationCircleIcon className="split-creator-help-icon" aria-hidden="true" />
                  <span className="split-creator-help-text">
                    {isSplitsPage
                      ? (
                        <span className="split-creator-equations" aria-label="Activation range equations">
                          <span className="split-creator-equation-line">
                            <span className="eq-var">lowRange</span>
                            <span className="eq-op"> = </span>
                            <span className="eq-math">0.85 × (1700 × (</span>
                            <span className="eq-var">P</span>
                            <span className="eq-math">/100)</span>
                            <span className="eq-math">² × √</span>
                            <span className="eq-var">F</span>
                            <span className="eq-math">)</span>
                          </span>
                          <span className="split-creator-equation-line">
                            <span className="eq-var">highRange</span>
                            <span className="eq-op"> = </span>
                            <span className="eq-math">1.15 × (1700 × (</span>
                            <span className="eq-var">P</span>
                            <span className="eq-math">/100)</span>
                            <span className="eq-math">² × √</span>
                            <span className="eq-var">F</span>
                            <span className="eq-math">)</span>
                          </span>
                          <span className="split-creator-equation-line split-creator-equation-line--legend">
                            <span className="eq-math">where </span>
                            <span className="eq-var">P</span>
                            <span className="eq-math"> = muscle priority, </span>
                            <span className="eq-var">F</span>
                            <span className="eq-math"> = number of split days the muscle appears</span>
                          </span>
                        </span>
                      )
                      : 'Add muscles to each day. Activation auto-calculated using R(P,D) = 90⋅(10+0.1P)⋅7/D formula.'}
                  </span>
                </div>
              </div>

              <div className="split-creator-days-list">
                {formData.split_days.map((day, dayIndex) => (
                  <div key={dayIndex} className="split-creator-day-card">
                    <div className="split-creator-day-card__header">
                      <input
                        type="text"
                        value={day.day_name}
                        onChange={(e) => updateDayName(dayIndex, e.target.value)}
                        className="form-input split-creator-day-name"
                        placeholder="Day name (e.g., Push Day)"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => removeSplitDay(dayIndex)}
                        className="btn-close"
                        aria-label="Remove split day"
                        title="Remove split day"
                      >
                        <TrashIcon className="split-creator-icon split-creator-icon--md" />
                      </button>
                    </div>

                    <div className="split-creator-targets">
                      {day.targets.map((target, targetIndex) => (
                        <div key={targetIndex} className="split-creator-target">
                          <div className="split-creator-target-row">
                            <select
                              value={target.muscle}
                              onChange={(e) => {
                                const muscleId = e.target.value;
                                updateTarget(dayIndex, targetIndex, 'muscle', muscleId);
                                if (muscleId) {
                                  const optimalActivation = getOptimalActivation(parseInt(muscleId));
                                  updateTarget(dayIndex, targetIndex, 'target_activation', optimalActivation);
                                }
                              }}
                              className="form-select split-creator-target-select"
                              required
                            >
                              <option value="">Select muscle</option>
                              {getAvailableMuscles(dayIndex, targetIndex).map(muscle => (
                                <option key={muscle.muscles_id} value={muscle.muscles_id}>
                                  {muscle.muscle_name}
                                </option>
                              ))}
                            </select>

                            <input
                              type="number"
                              min="0"
                              max={isSplitsPage ? undefined : 1000}
                              value={target.target_activation}
                              onChange={(e) => updateTarget(dayIndex, targetIndex, 'target_activation', e.target.value)}
                              className="form-input split-creator-activation-input"
                              required
                              aria-label="Target activation"
                            />

                            {!isSplitsPage && target.muscle && (
                              <button
                                type="button"
                                onClick={() => {
                                  const optimalActivation = getOptimalActivation(parseInt(target.muscle));
                                  updateTarget(dayIndex, targetIndex, 'target_activation', optimalActivation);
                                }}
                                className="btn btn-secondary split-creator-btn-xs"
                                title="Reset to optimal activation"
                              >
                                Reset
                              </button>
                            )}

                            {isSplitsPage && target.muscle && (
                              <button
                                type="button"
                                className="split-creator-info-btn"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const muscleName = getMuscleNameById(parseInt(target.muscle));
                                  if (muscleName) handleMuscleInfoClick(muscleName);
                                }}
                                aria-label="Muscle info"
                                title="View muscle info"
                              >
                                <InformationCircleIcon className="split-creator-info-icon" aria-hidden="true" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => removeTarget(dayIndex, targetIndex)}
                              className="btn-close"
                              aria-label="Remove target"
                              title="Remove target"
                            >
                              <XMarkIcon className="split-creator-icon" />
                            </button>
                          </div>

                          {!isSplitsPage && target.muscle && (
                            <div className="split-creator-target-help">
                              <span className="split-creator-target-help-text">
                                Lower bound auto-calculated: R(P,D) = 90⋅(10+0.1P)⋅7/D
                              </span>
                              <span
                                className="split-creator-target-help-sparkle"
                                title="Auto-calculated optimal activation"
                                aria-hidden="true"
                              >
                                ✨
                              </span>
                            </div>
                          )}
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => addTarget(dayIndex)}
                        className="btn btn-secondary split-creator-btn-sm"
                      >
                        <PlusIcon className="split-creator-icon" />
                        <span>Add Target</span>
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addSplitDay}
                  className="btn btn-primary split-creator-add-day"
                >
                  <PlusIcon className="split-creator-icon" />
                  <span>Add Split Day</span>
                </button>
              </div>
            </div>

            {/* Muscle Status Sidebar */}
            {Object.keys(analysis).length > 0 && (
              <>
                <button
                  type="button"
                  className="split-creator-mobile-sidebar-toggle"
                  onClick={() => setMobileMuscleSidebarOpen(true)}
                  aria-label="Open muscle status"
                >
                  <ChartBarIcon className="split-creator-mobile-sidebar-toggle-icon" aria-hidden="true" />
                </button>
                {mobileMuscleSidebarOpen && (
                  <div
                    className="split-creator-sidebar-overlay"
                    onClick={() => setMobileMuscleSidebarOpen(false)}
                    aria-hidden="true"
                  />
                )}
                <aside
                  className={`split-creator-sidebar ${mobileMuscleSidebarOpen ? 'split-creator-sidebar--mobile-open' : ''}`}
                  aria-label="Muscle status"
                >
                  <button
                    type="button"
                    className="split-creator-sidebar-close"
                    onClick={() => setMobileMuscleSidebarOpen(false)}
                    aria-label="Close muscle status"
                  >
                    <XMarkIcon className="split-creator-icon" aria-hidden="true" />
                  </button>
                  <h4 className="split-creator-sidebar-title">Muscle Status</h4>
                  <div className="split-creator-status-list">
                  {Object.entries(analysis).map(([muscleId, data]) => {
                    const status = getMuscleStatus(muscleId);
                    const isOptimal = status.status === 'optimal';
                    const isBelow = status.status === 'below';
                    const isAbove = status.status === 'above';

                    return (
                      <div key={muscleId} className="split-creator-status-item">
                        {isSplitsPage ? (
                          <>
                            <div className="split-creator-status-item__top">
                              <span className="split-creator-status-sets">
                                <span className="split-creator-status-activation-value">
                                  {Math.round(data.totalActivation)}
                                </span>
                                <span className="split-creator-status-separator"> : </span>
                                <span className="split-creator-status-sets-value">
                                  {data.totalSets}
                                </span>
                              </span>
                              <span className="split-creator-status-name-wrap">
                                <span
                                  className="split-creator-status-name"
                                  style={{ color: getStatusColorForRange(muscleId) }}
                                >
                                  {data.muscleName}
                                  <button
                                    type="button"
                                    className="split-creator-info-btn split-creator-info-btn--inline"
                                    onClick={() => handleMuscleInfoClick(data.muscleName)}
                                    aria-label={`Muscle info: ${data.muscleName}`}
                                    title="View muscle info"
                                  >
                                    <InformationCircleIcon className="split-creator-info-icon" aria-hidden="true" />
                                  </button>
                                </span>
                              </span>
                              <span className="split-creator-status-range">
                                {Math.round(data.optimalRange.lower)}-{Math.round(data.optimalRange.upper)}
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="split-creator-status-item__top">
                              <span
                                className="split-creator-status-name"
                                style={{
                                  color: (isOptimal ? '#27AE60' :
                                    isBelow ? '#95A5A6' :
                                      isAbove ? '#E74C3C' :
                                        '#E74C3C')
                                }}
                              >
                                {data.muscleName}
                              </span>
                              <span className="split-creator-status-sets">
                                <span className="split-creator-status-activation-value">
                                  {Math.round(data.totalActivation)}
                                </span>
                                <span className="split-creator-status-separator"> : </span>
                                <span className="split-creator-status-sets-value">
                                  {data.totalSets}s
                                </span>
                              </span>
                            </div>
                            <div className="split-creator-status-range">
                              {Math.round(data.optimalRange.lower)}-{Math.round(data.optimalRange.upper)}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
                </aside>
              </>
            )}
          </div>

          <button
            type="submit"
            disabled={isCreating || formData.split_days.length === 0}
            className="btn btn-primary split-creator-submit"
          >
            {isCreating ? 'Saving...' : 'Save Split'}
          </button>
        </form>
      ) : (
        <>
      {!isSplitsPage && (
        <>
          {/* Tab Navigation */}
          <div className="tabs-container">
            <div className="tabs" role="tablist" aria-label="Split creator tabs">
              <button
                type="button"
                onClick={() => setActiveTab('manage')}
                className={`tab ${activeTab === 'manage' ? 'active' : ''}`}
                role="tab"
                aria-selected={activeTab === 'manage'}
              >
                Manage Splits
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedSplit(null);
                  setFormData({ split_name: '', start_date: '', split_days: [] });
                  setActiveTab('new');
                }}
                className={`tab ${activeTab === 'new' ? 'active' : ''}`}
                role="tab"
                aria-selected={activeTab === 'new'}
              >
                New Split
              </button>
            </div>
          </div>
        </>
      )}

      {/* Manage Splits Tab */}
      {(isSplitsPage || activeTab === 'manage') && (
        <section className="split-creator-section" aria-label="Manage splits">
          <div className="split-creator-section-header">
            <h3 className="split-creator-section-title">Existing Splits</h3>
          </div>

          {splits.length === 0 ? (
            <div className="split-creator-empty">
              No splits found. Create a new split in the New Split tab.
            </div>
          ) : (
            <div className="split-creator-split-list">
              {sortedSplits.map((split) => (
                <div
                  key={split.splits_id}
                  className={`split-creator-split-card-wrap ${split.splits_id === latestActiveSplitId ? 'split-creator-split-card-wrap--latest' : ''}`}
                >
                <button
                  type="button"
                  className={`split-creator-split-card ${split.splits_id === latestActiveSplitId ? 'split-creator-split-card--latest' : ''} ${openCalendarKey === `split-start-${split.splits_id}` ? 'split-creator-split-card--calendar-open' : ''}`}
                  onClick={() => navigate(`/personalization/splits/${split.splits_id}/edit`, { state: { split } })}
                >
                  <div className="split-creator-split-card__header">
                    <div className="split-creator-split-card__meta">
                      <h4 className="split-creator-split-name">{split.split_name}</h4>
                      <p className="split-creator-split-subtitle">
                        {split.split_days?.length || 0} days
                        {split.start_date
                          ? (() => {
                              const days = getDayCounterForSplit(split);
                              return days != null ? ` • ${days} days` : '';
                            })()
                          : ' • Not active'}
                      </p>
                    </div>
                  </div>

                  {/* Start Date Assignment - stopPropagation so clicking here doesn't navigate */}
                  <div className="split-creator-split-card__footer" onClick={(e) => e.stopPropagation()}>
                    <label className="split-creator-inline-label" htmlFor={`split-start-${split.splits_id}`}>
                      Set Start Date
                    </label>
                    {isSplitsPage ? (
                      <div className={`sc-date-picker sc-date-picker--inline ${openCalendarKey === `split-start-${split.splits_id}` ? 'sc-date-picker--open' : ''}`}>
                        <input
                          id={`split-start-${split.splits_id}`}
                          type="text"
                          readOnly
                          className="form-input split-creator-date-input sc-date-input"
                          value={split.start_date || ''}
                          onClick={() => toggleCalendar(`split-start-${split.splits_id}`, split.start_date || '')}
                          title="Click to open calendar"
                        />

                        {openCalendarKey === `split-start-${split.splits_id}` && (
                          <div className="sc-calendar-popup" role="dialog" aria-modal="true">
                            <div className="sc-calendar-header">
                              <button
                                type="button"
                                onClick={() =>
                                  setCalendarMonth(
                                    new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)
                                  )
                                }
                                aria-label="Previous month"
                                title="Previous month"
                              >
                                ←
                              </button>
                              <span>
                                {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setCalendarMonth(
                                    new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)
                                  )
                                }
                                aria-label="Next month"
                                title="Next month"
                              >
                                →
                              </button>
                            </div>

                            <div className="sc-calendar-grid">
                              <div className="sc-calendar-day-header">Sun</div>
                              <div className="sc-calendar-day-header">Mon</div>
                              <div className="sc-calendar-day-header">Tue</div>
                              <div className="sc-calendar-day-header">Wed</div>
                              <div className="sc-calendar-day-header">Thu</div>
                              <div className="sc-calendar-day-header">Fri</div>
                              <div className="sc-calendar-day-header">Sat</div>
                              {getCalendarDaysForMonth().map((day, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  className={`sc-calendar-day ${day.isCurrentMonth ? 'current-month' : 'other-month'} ${
                                    day.date === (split.start_date || '') ? 'selected' : ''
                                  }`}
                                  disabled={!day.isCurrentMonth}
                                  onClick={() => {
                                    handleSplitActivation(split.splits_id, day.date);
                                    setOpenCalendarKey(null);
                                  }}
                                >
                                  {day.day}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <input
                        id={`split-start-${split.splits_id}`}
                        key={`split-start-${split.splits_id}-${split.start_date || 'none'}`}
                        type="date"
                        className="form-input split-creator-date-input"
                        defaultValue={split.start_date || ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            handleSplitActivation(split.splits_id, e.target.value);
                          }
                        }}
                      />
                    )}
                  </div>
                </button>
                <button
                  type="button"
                  className="split-creator-split-card-delete"
                  aria-label={`Delete ${split.split_name}`}
                  title="Delete split"
                  onClick={(e) => handleDeleteSplit(e, split)}
                >
                  <XMarkIcon className="split-creator-split-card-delete-icon" aria-hidden />
                </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* New Split Tab */}
      {!isSplitsPage && activeTab === 'new' && (
        <form onSubmit={handleSubmit} className="split-creator-form" aria-label="New split">
          {/* Split Name */}
          <div className="split-creator-field">
            <label htmlFor="split_name" className="form-label">Split Name</label>
            <input
              type="text"
              id="split_name"
              name="split_name"
              value={formData.split_name}
              onChange={handleInputChange}
              className="form-input"
              required
              placeholder="e.g., Push/Pull/Legs"
            />
          </div>

          {/* Start Date */}
          <div className="split-creator-field">
            <label htmlFor="start_date" className="form-label">Start Date</label>
            <input
              type="date"
              id="start_date"
              name="start_date"
              value={formData.start_date}
              onChange={handleInputChange}
              className="form-input"
            />
          </div>

          {/* Split Days */}
          <div className="split-creator-edit-layout">
            <div className="split-creator-days">
              <div className="split-creator-days-header">
                <label className="form-label split-creator-days-label">Split Days</label>
                <div className="split-creator-help">
                  <InformationCircleIcon className="split-creator-help-icon" aria-hidden="true" />
                  <span className="split-creator-help-text">
                    Add muscles to each day. Activation auto-calculated using R(P,D) = 90⋅(10+0.1P)⋅7/D formula.
                  </span>
                </div>
              </div>

              <div className="split-creator-days-list">
                {formData.split_days.map((day, dayIndex) => (
                  <div key={dayIndex} className="split-creator-day-card">
                    <div className="split-creator-day-card__header">
                      <input
                        type="text"
                        value={day.day_name}
                        onChange={(e) => updateDayName(dayIndex, e.target.value)}
                        className="form-input split-creator-day-name"
                        placeholder="Day name (e.g., Push Day)"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => removeSplitDay(dayIndex)}
                        className="btn-close"
                        aria-label="Remove split day"
                        title="Remove split day"
                      >
                        <TrashIcon className="split-creator-icon split-creator-icon--md" />
                      </button>
                    </div>

                    <div className="split-creator-targets">
                      {day.targets.map((target, targetIndex) => (
                        <div key={targetIndex} className="split-creator-target">
                          <div className="split-creator-target-row">
                            <select
                              value={target.muscle}
                              onChange={(e) => {
                                const muscleId = e.target.value;
                                updateTarget(dayIndex, targetIndex, 'muscle', muscleId);
                                if (muscleId) {
                                  const optimalActivation = getOptimalActivation(parseInt(muscleId));
                                  updateTarget(dayIndex, targetIndex, 'target_activation', optimalActivation);
                                }
                              }}
                              className="form-select split-creator-target-select"
                              required
                            >
                              <option value="">Select muscle</option>
                              {getAvailableMuscles(dayIndex, targetIndex).map(muscle => (
                                <option key={muscle.muscles_id} value={muscle.muscles_id}>
                                  {muscle.muscle_name}
                                </option>
                              ))}
                            </select>

                            <input
                              type="number"
                              min="0"
                              max={isSplitsPage ? undefined : 1000}
                              value={target.target_activation}
                              onChange={(e) => updateTarget(dayIndex, targetIndex, 'target_activation', e.target.value)}
                              className="form-input split-creator-activation-input"
                              required
                              aria-label="Target activation"
                            />

                            {target.muscle && (
                              <button
                                type="button"
                                onClick={() => {
                                  const optimalActivation = getOptimalActivation(parseInt(target.muscle));
                                  updateTarget(dayIndex, targetIndex, 'target_activation', optimalActivation);
                                }}
                                className="btn btn-secondary split-creator-btn-xs"
                                title="Reset to optimal activation"
                              >
                                Reset
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => removeTarget(dayIndex, targetIndex)}
                              className="btn-close"
                              aria-label="Remove target"
                              title="Remove target"
                            >
                              <XMarkIcon className="split-creator-icon" />
                            </button>
                          </div>

                          {target.muscle && (
                            <div className="split-creator-target-help">
                              <span className="split-creator-target-help-text">
                                Lower bound auto-calculated: R(P,D) = 90⋅(10+0.1P)⋅7/D
                              </span>
                              <span
                                className="split-creator-target-help-sparkle"
                                title="Auto-calculated optimal activation"
                                aria-hidden="true"
                              >
                                ✨
                              </span>
                            </div>
                          )}
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => addTarget(dayIndex)}
                        className="btn btn-secondary split-creator-btn-sm"
                      >
                        <PlusIcon className="split-creator-icon" />
                        <span>Add Target</span>
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addSplitDay}
                  className="btn btn-primary split-creator-add-day"
                >
                  <PlusIcon className="split-creator-icon" />
                  <span>Add Split Day</span>
                </button>
              </div>
            </div>

            {/* Muscle Status Sidebar */}
            {Object.keys(analysis).length > 0 && (
              <>
                <button
                  type="button"
                  className="split-creator-mobile-sidebar-toggle"
                  onClick={() => setMobileMuscleSidebarOpen(true)}
                  aria-label="Open muscle status"
                >
                  <ChartBarIcon className="split-creator-mobile-sidebar-toggle-icon" aria-hidden="true" />
                </button>
                {mobileMuscleSidebarOpen && (
                  <div
                    className="split-creator-sidebar-overlay"
                    onClick={() => setMobileMuscleSidebarOpen(false)}
                    aria-hidden="true"
                  />
                )}
                <aside
                  className={`split-creator-sidebar ${mobileMuscleSidebarOpen ? 'split-creator-sidebar--mobile-open' : ''}`}
                  aria-label="Muscle status"
                >
                  <button
                    type="button"
                    className="split-creator-sidebar-close"
                    onClick={() => setMobileMuscleSidebarOpen(false)}
                    aria-label="Close muscle status"
                  >
                    <XMarkIcon className="split-creator-icon" aria-hidden="true" />
                  </button>
                  <h4 className="split-creator-sidebar-title">Muscle Status</h4>
                  <div className="split-creator-status-list">
                  {Object.entries(analysis).map(([muscleId, data]) => {
                    const status = getMuscleStatus(muscleId);
                    const isOptimal = status.status === 'optimal';
                    const isBelow = status.status === 'below';
                    const isAbove = status.status === 'above';

                    return (
                      <div key={muscleId} className="split-creator-status-item">
                        <div className="split-creator-status-item__top">
                          <span
                            className="split-creator-status-name"
                            style={{
                              color: isOptimal ? '#27AE60' :
                                isBelow ? '#95A5A6' :
                                  isAbove ? '#E74C3C' :
                                    '#E74C3C'
                            }}
                          >
                            {data.muscleName}
                          </span>
                          <span className="split-creator-status-sets">
                            {isSplitsPage ? data.totalSets : `${data.totalSets}s`}
                          </span>
                        </div>
                        <div className="split-creator-status-range">
                          {Math.round(data.optimalRange.lower)}-{Math.round(data.optimalRange.upper)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                </aside>
              </>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isCreating || formData.split_days.length === 0}
            className="btn btn-primary split-creator-submit"
          >
            {isCreating ? 'Creating Split...' : 'Create Split'}
          </button>
        </form>
      )}
        </>
      )}

      {isSplitsPage && activeMuscleDescription && (
        <div
          className="sc-muscle-description-overlay"
          onClick={() => setActiveMuscleDescription(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="sc-muscle-description-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sc-muscle-description-header">
              <div className="sc-muscle-description-title">{activeMuscleDescription}</div>
              <button
                type="button"
                className="sc-close-overlay-button"
                onClick={() => setActiveMuscleDescription(null)}
                aria-label="Close"
                title="Close"
              >
                <XMarkIcon className="sc-close-overlay-icon" aria-hidden="true" />
              </button>
            </div>
            <div className="sc-muscle-description-content">
              <div className="sc-muscle-description-detail">
                <strong>Description:</strong> {getMuscleDescription(activeMuscleDescription).description}
              </div>
              <div className="sc-muscle-description-detail">
                <strong>Location:</strong> {getMuscleDescription(activeMuscleDescription).location}
              </div>
              <div className="sc-muscle-description-detail">
                <strong>Function:</strong> {getMuscleDescription(activeMuscleDescription).function}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .split-creator {
          width: 100%;
          max-width: none;
          margin: 0;
        }

        .split-creator-header {
          margin-bottom: var(--space-3);
          padding-bottom: var(--space-2);
        }

        .split-creator-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-3);
          margin-bottom: var(--space-1);
        }

        .split-creator-title {
          font-size: var(--text-2xl);
          font-weight: var(--font-weight-bold);
          margin: 0;
        }

        .split-creator-subtitle {
          margin: 0;
          color: var(--text-secondary);
          font-size: var(--text-sm);
        }

        .split-creator-notice {
          border-radius: var(--radius-lg);
          padding: var(--space-3) var(--space-4);
          border: 1px solid var(--border-primary);
          margin: var(--space-3) 0;
          color: var(--text-primary);
          background: var(--bg-secondary);
        }

        .split-creator-notice--error {
          background: var(--accent-danger-alpha);
          border-color: var(--accent-danger);
        }

        .split-creator-notice--success {
          background: var(--accent-secondary-alpha);
          border-color: var(--accent-secondary);
        }

        /* Compact tabs for this page */
        .split-creator .tabs {
          padding: 0;
          gap: var(--space-1);
        }

        .split-creator .tab {
          padding: var(--space-2) var(--space-3);
          font-size: var(--text-sm);
          border-radius: var(--radius-md);
        }

        .split-creator-section {
          background: var(--profile-card-bg, var(--bg-secondary));
          border: 1px solid var(--profile-card-border, var(--border-primary));
          border-radius: var(--radius-lg);
          padding: var(--space-5);
          box-shadow: var(--shadow-md);
          transition: border-color 0.2s var(--ease-out-cubic);
        }

        .split-creator-section:hover {
          border-color: var(--profile-card-border, var(--border-primary));
        }

        .split-creator-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-4);
        }

        .split-creator-section-title {
          margin: 0;
          font-size: var(--text-xl);
          font-weight: var(--font-weight-semibold);
          color: var(--text-primary);
        }

        .split-creator-empty {
          padding: var(--space-8) var(--space-4);
          text-align: center;
          color: var(--text-tertiary);
        }

        .split-creator-split-list {
          display: grid;
          gap: var(--space-4);
        }

        .split-creator-split-card-wrap {
          display: flex;
          flex-direction: row;
          align-items: stretch;
          gap: var(--space-2);
        }

        .split-creator-split-card {
          display: block;
          flex: 1;
          min-width: 0;
          text-align: left;
          cursor: pointer;
          background: var(--profile-card-bg, var(--bg-secondary));
          border: 1px solid var(--profile-card-border, var(--border-primary));
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          transition: border-color 0.2s var(--ease-out-cubic), box-shadow 0.2s var(--ease-out-cubic);
        }

        .split-creator-split-card:hover {
          border-color: var(--profile-card-border, var(--border-primary));
          box-shadow: none;
        }

        .split-creator-split-card--latest {
          border: 3px solid var(--accent-secondary);
          box-shadow: none;
        }

        .split-creator-split-card--latest:hover {
          border-color: var(--accent-secondary);
          box-shadow: none;
        }

        .split-creator-split-card-delete {
          flex-shrink: 0;
          align-self: stretch;
          width: 44px;
          min-width: 44px;
          max-width: 44px;
          min-height: 0;
          border-radius: var(--radius-md);
          border: 1px solid var(--profile-card-border, var(--border-primary));
          background: var(--profile-card-bg, var(--bg-secondary));
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s var(--ease-out-cubic), border-color 0.2s, background 0.2s;
        }

        .split-creator-split-card-delete:hover {
          color: var(--accent-danger);
          border-color: var(--accent-danger);
          background: var(--accent-danger-alpha);
        }

        .split-creator-split-card-delete-icon {
          width: 20px;
          height: 20px;
        }

        @media (max-width: 768px) {
          .split-creator-split-card-wrap {
            width: 100%;
          }
          .split-creator-split-card {
            flex: 1 1 0;
            min-width: 0;
          }
          .split-creator-split-card-delete {
            flex: 0 0 15%;
            width: 15%;
            max-width: 15%;
            min-width: 0;
          }
          .split-creator-split-card-delete-icon {
            width: 18px;
            height: 18px;
          }
        }

        .split-creator-split-card__header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: var(--space-4);
          margin-bottom: var(--space-4);
        }

        .split-creator-split-name {
          margin: 0;
          font-size: var(--text-2xl);
          font-weight: var(--font-weight-semibold);
          color: var(--text-primary);
        }

        .split-creator-split-subtitle {
          margin: var(--space-2) 0 0 0;
          color: var(--text-tertiary);
          font-size: var(--text-sm);
        }

        .split-creator-split-card__footer {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          flex-wrap: wrap;
        }

        .split-creator-inline-label {
          color: var(--text-secondary);
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
        }

        .split-creator-date-input {
          width: auto;
          min-width: 180px;
        }

        .split-creator-form {
          display: grid;
          gap: var(--space-6);
          width: 100%;
        }

        .split-creator-top-fields {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-6);
          width: 100%;
        }

        .split-creator-top-fields--wide {
          grid-template-columns: 1fr 1fr;
          gap: var(--space-6);
          width: 100%;
        }

        .split-creator-field {
          margin: 0;
        }

        .split-creator-banner {
          border-radius: var(--radius-lg);
          border: 1px solid var(--accent-primary);
          background: var(--accent-primary-alpha);
          padding: var(--space-4);
        }

        .split-creator-banner-text {
          color: var(--text-primary);
          font-size: var(--text-sm);
        }

        .split-creator-edit-layout {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: var(--space-6);
          align-items: start;
        }

        .split-creator-days-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: var(--space-4);
          margin-bottom: var(--space-4);
        }

        .split-creator-days-label {
          margin: 0;
        }

        .split-creator-help {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          color: var(--text-tertiary);
          font-size: var(--text-sm);
          line-height: var(--leading-normal);
          max-width: 560px;
        }

        .split-creator-help-icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          color: var(--accent-info);
        }

        .split-creator-days-list {
          display: grid;
          gap: var(--space-4);
        }

        .split-creator-day-card {
          background: var(--profile-card-bg, var(--bg-secondary));
          border: 1px solid var(--profile-card-border, var(--border-primary));
          border-radius: var(--radius-lg);
          padding: var(--space-5);
          transition: border-color 0.2s var(--ease-out-cubic), box-shadow 0.2s var(--ease-out-cubic);
        }

        .split-creator-day-card:hover {
          border-color: var(--profile-card-border, var(--border-primary));
          box-shadow: none;
        }

        .split-creator-day-card__header {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-4);
        }

        .split-creator-day-name {
          flex: 1;
          margin: 0;
        }

        .split-creator-targets {
          display: grid;
          gap: var(--space-2);
        }

        .split-creator-target {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-secondary);
          border-radius: var(--radius-md);
          padding: var(--space-2);
        }

        .split-creator-target-row {
          display: grid;
          grid-template-columns: 1fr 120px auto auto;
          gap: var(--space-2);
          align-items: center;
        }

        .split-creator-target-select {
          min-height: 42px;
          background: var(--bg-secondary);
          color: var(--text-primary);
          border: none !important;
        }
        .split-creator-target-select:focus,
        .split-creator-target-select:hover {
          outline: none;
          box-shadow: none;
        }

        .split-creator .form-input,
        .split-creator .form-select {
          min-height: 48px;
          border: 1px solid var(--input-border);
          border-radius: var(--radius-md);
          background: var(--bg-tertiary);
          color: var(--text-primary);
          font-size: var(--text-base);
        }

        .split-creator .form-input:focus,
        .split-creator .form-select:focus {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(var(--accent-primary-rgb), 0.12);
          outline: none;
        }

        .split-creator .sc-date-input,
        .split-creator #split_name.form-input {
          background: var(--bg-tertiary) !important;
        }

        [data-theme='light'] .split-creator .sc-date-input,
        [data-theme='light'] .split-creator #split_name.form-input {
          background: var(--bg-tertiary) !important;
        }

        .split-creator-activation-input {
          text-align: center;
          min-width: 0;
        }

        .split-creator-target-help {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-2);
          margin-top: var(--space-1);
        }

        .split-creator-target-help-text {
          color: var(--text-tertiary);
          font-size: var(--text-xs);
          line-height: var(--leading-normal);
        }

        .split-creator-target-help-sparkle {
          color: var(--accent-primary);
          font-size: var(--text-xs);
          flex-shrink: 0;
        }

        .split-creator-mobile-sidebar-toggle {
          display: none;
        }

        .split-creator-sidebar-close {
          display: none;
        }

        .split-creator-sidebar {
          background: var(--profile-card-bg, var(--bg-secondary));
          border: 1px solid var(--profile-card-border, var(--border-primary));
          border-radius: var(--radius-lg);
          padding: var(--space-5);
          position: sticky;
          top: var(--space-6);
          max-height: calc(100vh - var(--space-12));
          overflow: auto;
          box-shadow: var(--shadow-md);
        }

        .split-creator-status-name-wrap {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          justify-content: center;
          min-width: 0;
        }

        .split-creator-info-btn {
          background: transparent;
          border: none;
          padding: 0;
          color: var(--text-tertiary);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s var(--ease-out-cubic), color 0.2s var(--ease-out-cubic);
        }

        .split-creator-info-btn:hover {
          color: var(--accent-primary);
          transform: translateY(-1px);
        }

        .split-creator-info-btn--inline {
          margin-left: var(--space-1);
        }

        .split-creator-info-icon {
          width: 18px;
          height: 18px;
        }

        /* Tooltip modal (workout-tracker interaction style) */
        .sc-muscle-description-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-6);
          z-index: 9999;
        }

        .sc-muscle-description-modal {
          width: min(720px, 100%);
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.45);
          border: 1px solid var(--border-primary);
          overflow: hidden;
          font-family: var(--font-primary);
        }

        .sc-muscle-description-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-5) var(--space-6);
          border-bottom: 1px solid var(--border-primary);
        }

        .sc-muscle-description-title {
          margin: 0;
          font-size: var(--text-xl);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
        }

        .sc-close-overlay-button {
          background: transparent;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
          padding: var(--space-1) var(--space-2);
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .sc-close-overlay-button:hover {
          color: var(--text-primary);
        }

        .sc-close-overlay-icon {
          width: 22px;
          height: 22px;
        }

        .sc-muscle-description-content {
          padding: var(--space-6);
          display: grid;
          gap: var(--space-3);
          color: var(--text-secondary);
          font-size: var(--text-base);
        }

        .sc-muscle-description-detail strong {
          color: var(--text-primary);
        }

        .split-creator-sidebar-title {
          margin: 0 0 var(--space-3) 0;
          font-size: calc(var(--text-sm) * 2);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
          font-weight: var(--font-weight-medium);
        }

        .split-creator-status-list {
          display: grid;
          gap: var(--space-2);
        }

        .split-creator-status-item {
          padding: var(--space-2);
          border: 1px solid var(--border-secondary);
          border-radius: var(--radius-md);
          background: var(--bg-tertiary);
        }

        .split-creator-status-item__top {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: var(--space-2);
        }

        .split-creator-status-name {
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
          text-align: center;
          flex: 1;
          padding-left: var(--space-2);
          display: inline-flex;
          align-items: center;
        }

        .split-creator-status-sets,
        .split-creator-status-range {
          color: var(--text-tertiary);
          font-size: 0.7rem;
        }

        .split-creator-status-activation-value {
          font-weight: 400 !important;
        }

        .split-creator-status-sets-value {
          font-weight: 700;
        }

        .split-creator-status-activation {
          margin-top: var(--space-1);
          font-size: var(--text-xs);
          color: var(--text-tertiary);
        }

        /* ===== Splits Page Variant ===== */
        .split-creator[data-variant="splitsPage"] {
          font-size: var(--text-lg);
        }

        /* Match workout-tracker date input styling */
        .split-creator[data-variant="splitsPage"] input[type="date"] {
          padding: var(--space-3) var(--space-4);
          border: 1px solid var(--surface-overlay);
          border-radius: var(--radius-md);
          background: var(--bg-tertiary);
          font-size: var(--text-base);
          color: var(--text-primary);
          transition: border-color 0.3s ease, background 0.3s ease, color 0.3s ease;
          font-family: var(--font-primary);
          min-width: 220px;
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          text-align: center;
          letter-spacing: 0.08em;
          box-shadow: none;
          min-height: 46px;
          height: auto;
        }

        [data-theme='light'] .split-creator[data-variant="splitsPage"] input[type="date"] {
          background: var(--bg-tertiary);
        }

        .split-creator[data-variant="splitsPage"] input[type="date"]:focus {
          outline: none;
          border-color: var(--accent-primary);
          background: var(--bg-tertiary);
        }

        [data-theme='light'] .split-creator[data-variant="splitsPage"] input[type="date"]:focus {
          background: var(--bg-tertiary);
        }

        .split-creator[data-variant="splitsPage"] input[type="date"]:hover {
          border-color: var(--accent-primary);
          background: var(--bg-tertiary);
        }

        [data-theme='light'] .split-creator[data-variant="splitsPage"] input[type="date"]:hover {
          background: var(--bg-tertiary);
        }

        .split-creator[data-variant="splitsPage"] #split_name.form-input {
          background: var(--bg-tertiary);
        }

        [data-theme='light'] .split-creator[data-variant="splitsPage"] #split_name.form-input {
          background: var(--bg-tertiary);
        }

        .split-creator[data-variant="splitsPage"] #split_name.form-input:focus {
          background: var(--bg-tertiary);
        }

        [data-theme='light'] .split-creator[data-variant="splitsPage"] #split_name.form-input:focus {
          background: var(--bg-tertiary);
        }

        .split-creator[data-variant="splitsPage"] #split_name.form-input:hover {
          background: var(--bg-tertiary);
        }

        [data-theme='light'] .split-creator[data-variant="splitsPage"] #split_name.form-input:hover {
          background: var(--bg-tertiary);
        }

        .split-creator[data-variant="splitsPage"] input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          cursor: pointer;
          opacity: 0.85;
        }

        .split-creator[data-variant="splitsPage"] input[type="date"]::-webkit-calendar-picker-indicator:hover {
          opacity: 1;
        }

        /* Custom calendar popup (match /workout-tracker date picker) */
        .sc-date-picker {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
        }

        .sc-date-picker--open {
          z-index: 10000;
        }

        .sc-date-picker--full {
          width: 100%;
          max-width: none;
        }

        .sc-date-picker--full .sc-date-input {
          width: 100%;
          min-width: 0;
        }

        .sc-date-picker--inline .sc-date-input {
          width: auto;
          min-width: 220px;
        }

        .sc-date-input {
          padding: var(--space-3) var(--space-4);
          border: 1px solid var(--surface-overlay);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          font-size: var(--text-base);
          color: var(--text-primary);
          transition: border-color 0.3s ease, background 0.3s ease, color 0.3s ease;
          font-family: var(--font-primary);
          min-width: 220px;
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          text-align: center;
          letter-spacing: 0.08em;
          box-shadow: none;
          min-height: 46px;
          height: auto;
        }

        .split-creator .sc-date-input:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(var(--accent-primary-rgb), 0.12);
          background: var(--bg-tertiary) !important;
        }

        [data-theme='light'] .split-creator .sc-date-input:focus {
          background: var(--bg-tertiary) !important;
        }

        .sc-date-input:hover {
          border-color: var(--accent-primary);
          background: rgba(90, 166, 255, 0.08);
        }

        .split-creator .sc-date-input:hover {
          border-color: var(--input-border);
          background: var(--bg-tertiary) !important;
          box-shadow: none;
        }

        [data-theme='light'] .split-creator .sc-date-input:hover {
          background: var(--bg-tertiary) !important;
        }

        .split-creator #split_name.form-input:focus {
          background: var(--bg-tertiary) !important;
        }

        [data-theme='light'] .split-creator #split_name.form-input:focus {
          background: var(--bg-tertiary) !important;
        }

        .split-creator #split_name.form-input:hover {
          background: var(--bg-tertiary) !important;
        }

        [data-theme='light'] .split-creator #split_name.form-input:hover {
          background: var(--bg-tertiary) !important;
        }

        .sc-calendar-popup {
          position: absolute;
          top: 100%;
          right: 0;
          left: auto;
          background: var(--bg-tertiary);
          border-radius: var(--radius-xl);
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.45);
          z-index: 10001;
          padding: var(--space-6);
          min-width: 350px;
          max-width: 400px;
          margin-top: var(--space-3);
          border: none;
          animation: scMenuFloatIn 0.25s var(--ease-out-cubic);
        }

        .split-creator-split-card--calendar-open {
          position: relative;
          z-index: 10000;
        }

        @keyframes scMenuFloatIn {
          from {
            transform: translateY(-6px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .sc-calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-5);
          padding-bottom: var(--space-4);
        }

        .sc-calendar-header button {
          background: transparent;
          border: none;
          border-radius: var(--radius-full);
          color: var(--text-secondary);
          padding: var(--space-2) var(--space-3);
          cursor: pointer;
          font-size: var(--text-base);
          font-weight: var(--font-weight-medium);
          transition: transform 0.3s ease, color 0.3s ease;
        }

        .sc-calendar-header button:hover {
          color: var(--accent-primary);
          transform: translateY(-2px);
        }

        .sc-calendar-header span {
          font-size: var(--text-lg);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
        }

        .sc-calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: var(--space-2);
        }

        .sc-calendar-day-header {
          color: var(--text-tertiary);
          font-size: var(--text-xs);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-weight: var(--font-weight-semibold);
          text-align: center;
          padding-bottom: var(--space-2);
        }

        .sc-calendar-day {
          border: none;
          border-radius: var(--radius-md);
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-primary);
          cursor: pointer;
          height: 40px;
          font-weight: var(--font-weight-medium);
          transition: transform 0.2s var(--ease-out-cubic), background 0.2s var(--ease-out-cubic);
        }

        .sc-calendar-day:hover {
          background: rgba(90, 166, 255, 0.18);
          transform: translateY(-2px);
        }

        .sc-calendar-day.other-month {
          opacity: 0.35;
        }

        .sc-calendar-day:disabled {
          cursor: not-allowed;
          opacity: 0.25;
        }

        .sc-calendar-day.selected {
          background: var(--accent-primary);
          color: #ffffff;
        }

        .split-creator[data-variant="splitsPage"] .split-creator-header {
          text-align: center;
          margin-bottom: var(--space-4);
        }

        .split-creator[data-variant="splitsPage"] .split-creator-header-row {
          justify-content: center;
          position: relative;
        }

        .split-creator[data-variant="splitsPage"] .split-creator-back-btn {
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
        }

        .split-creator[data-variant="splitsPage"] .split-creator-top-fields--wide .form-input {
          min-height: 46px;
        }

        .split-creator[data-variant="splitsPage"] .split-creator-top-fields--wide .split-creator-field {
          min-width: 0;
        }

        /* Workaround: other pages inject global .form-input width overrides */
        .split-creator[data-variant="splitsPage"] .split-creator-top-fields .form-input {
          width: 100% !important;
          max-width: none !important;
        }

        .split-creator[data-variant="splitsPage"] .split-creator-edit-layout {
          grid-template-columns: 1fr 1fr;
        }

        .split-creator[data-variant="splitsPage"] .split-creator-help {
          max-width: none;
          width: 100%;
          justify-content: center;
          font-size: var(--text-base);
          color: var(--text-secondary);
        }

        .split-creator[data-variant="splitsPage"] .split-creator-days-header {
          flex-direction: column;
          align-items: stretch;
        }

        .split-creator[data-variant="splitsPage"] .split-creator-help-icon {
          display: none;
        }

        .split-creator[data-variant="splitsPage"] .split-creator-equations {
          display: grid;
          gap: var(--space-2);
          width: 100%;
        }

        .split-creator[data-variant="splitsPage"] .split-creator-equation-line {
          display: block;
          font-size: var(--text-base);
          line-height: var(--leading-normal);
          color: var(--text-secondary);
          word-break: break-word;
        }

        .split-creator[data-variant="splitsPage"] .split-creator-equation-line--legend {
          margin-top: var(--space-1);
          font-size: var(--text-sm);
          color: var(--text-tertiary);
        }

        .split-creator[data-variant="splitsPage"] .eq-fn {
          color: var(--text-primary);
          font-weight: var(--font-weight-semibold);
        }

        .split-creator[data-variant="splitsPage"] .eq-var {
          color: var(--accent-primary);
          font-weight: var(--font-weight-medium);
        }

        .split-creator[data-variant="splitsPage"] .eq-math,
        .split-creator[data-variant="splitsPage"] .eq-op,
        .split-creator[data-variant="splitsPage"] .eq-paren,
        .split-creator[data-variant="splitsPage"] .eq-sep {
          color: var(--text-secondary);
        }

        .split-creator[data-variant="splitsPage"] .split-creator-sidebar {
          position: static;
          max-height: none;
        }

        .split-creator[data-variant="splitsPage"] .split-creator-status-item__top {
          display: grid;
          grid-template-columns: 88px 1fr 180px;
          align-items: baseline;
          gap: var(--space-3);
        }

        .split-creator[data-variant="splitsPage"] .split-creator-status-sets {
          font-size: var(--text-lg);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
          text-align: left;
        }

        .split-creator[data-variant="splitsPage"] .split-creator-status-name {
          font-size: var(--text-xl);
          font-weight: var(--font-weight-semibold);
          text-align: center;
          min-width: 140px;
          white-space: nowrap;
        }

        .split-creator[data-variant="splitsPage"] .split-creator-status-range {
          font-size: var(--text-lg);
          color: var(--text-secondary);
          white-space: nowrap;
          text-align: right;
        }

        .split-creator[data-variant="splitsPage"] .split-creator-day-name {
          background: var(--bg-tertiary) !important;
          border-color: var(--border-secondary) !important;
        }

        .split-creator-icon {
          width: 16px;
          height: 16px;
          color: currentColor;
        }

        .split-creator-icon--md {
          width: 18px;
          height: 18px;
        }

        .split-creator-btn-sm {
          padding: var(--space-2) var(--space-3);
          font-size: var(--text-sm);
        }

        .split-creator-btn-xs {
          padding: var(--space-1) var(--space-3);
          font-size: var(--text-xs);
          height: 32px;
        }

        .split-creator-add-day {
          justify-self: start;
        }

        .split-creator-submit {
          width: 100%;
          background: #79b5fb;
          border-color: #79b5fb;
          color: #040508;
        }

        .split-creator-submit:hover:not(:disabled) {
          filter: brightness(0.95);
        }

        @media (max-width: 1024px) {
          .split-creator-edit-layout {
            grid-template-columns: 1fr;
          }

          .split-creator-sidebar {
            position: static;
            max-height: none;
          }
        }

        @media (max-width: 768px) {
          .split-creator {
            padding-left: 0;
            padding-right: 0;
            display: flex;
            flex-direction: column;
            align-items: stretch;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            margin: 0;
            min-height: 0;
          }

          .split-creator-header,
          .split-creator-form,
          .split-creator-edit-layout,
          .split-creator-days,
          .split-creator-days-list,
          .split-creator-day-card,
          .split-creator-section,
          .split-creator-banner {
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
          }

          .split-creator-form {
            flex: 1;
            min-height: 0;
            display: flex;
            flex-direction: column;
          }

          .split-creator-edit-layout {
            flex: 1;
            min-height: 0;
            display: flex;
            flex-direction: column;
          }

          .split-creator-days {
            flex: 1;
            min-height: 0;
            display: flex;
            flex-direction: column;
          }

          .split-creator-days-list {
            flex: 1;
            min-height: 0;
            overflow-y: auto;
          }

          .split-creator-header {
            padding-left: 0;
            padding-right: 0;
          }

          .split-creator-form {
            padding-left: 0;
            padding-right: 0;
          }

          .split-creator-section {
            padding-left: 0;
            padding-right: 0;
          }

          /* Make main content more compact on mobile for splits pages */
          .split-creator[data-variant="splitsPage"] .split-creator-section {
            padding-top: var(--space-3);
            padding-bottom: var(--space-3);
            margin-top: var(--space-2);
            margin-bottom: var(--space-3);
          }

          .split-creator-top-fields,
          .split-creator-field,
          .split-creator-banner {
            padding-left: 0;
            padding-right: 0;
          }

          .split-creator-edit-layout {
            padding-left: 0;
            padding-right: 0;
          }

          /* Match WorkoutLoggingDashboard .workout-mobile-muscle-toggle */
          .split-creator-mobile-sidebar-toggle {
            order: unset;
            position: fixed;
            bottom: calc(var(--space-4) + env(safe-area-inset-bottom, 0px) + 40px);
            right: auto;
            top: auto;
            left: var(--space-3);
            z-index: 1000;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: var(--space-3) var(--space-3);
            min-width: 6rem;
            max-width: 8.25rem;
            min-height: 50px;
            width: auto;
            height: auto;
            margin: 0;
            font-size: var(--text-base);
            font-weight: var(--font-weight-semibold);
            letter-spacing: 0.02em;
            border-radius: var(--radius-lg);
            border: 1px solid rgba(128, 128, 128, 0.55);
            background: var(--profile-card-bg, var(--bg-secondary));
            color: var(--text-primary);
            box-shadow: var(--shadow-md);
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
            outline: none;
            transition: background 0.2s ease, border-color 0.2s ease;
          }

          .split-creator-mobile-sidebar-toggle:hover,
          .split-creator-mobile-sidebar-toggle:focus,
          .split-creator-mobile-sidebar-toggle:focus-visible {
            background: var(--profile-card-bg, var(--bg-secondary));
            color: var(--text-primary);
            border-color: rgba(128, 128, 128, 0.65);
            box-shadow: var(--shadow-md);
            outline: none;
          }

          .split-creator-mobile-sidebar-toggle-icon {
            width: 22px;
            height: 22px;
            color: inherit;
            flex-shrink: 0;
          }

          .split-creator-days {
            order: 0;
          }

          .split-creator-days-header,
          .split-creator-days-list {
            padding-left: 0;
            padding-right: 0;
          }

          .split-creator-top-fields {
            display: flex;
            flex-direction: column;
          }

          .split-creator-top-fields .split-creator-field:first-of-type {
            order: 1;
          }

          .split-creator-top-fields .split-creator-field:last-of-type {
            order: 2;
          }

          .split-creator-edit-layout {
            min-width: 0;
          }

          .split-creator-days {
            min-width: 0;
          }

          .split-creator-days-header {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: var(--space-2);
          }

          @media (max-width: 480px) {
            .split-creator-mobile-sidebar-toggle {
              bottom: calc(var(--space-3) + env(safe-area-inset-bottom, 0px) + 36px);
              right: auto;
              left: var(--space-3);
            }
            .split-creator-mobile-sidebar-toggle-icon {
              width: 20px;
              height: 20px;
            }
          }

          .split-creator-sidebar-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.55);
            z-index: 1001;
          }

          .split-creator[data-variant="splitsPage"] .split-creator-sidebar {
            position: fixed;
            top: auto;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            max-width: none;
            height: 82vh;
            max-height: 82vh;
            transform: translateY(100%);
            transition: transform 0.25s ease;
            z-index: 1002;
            border-radius: var(--radius-lg) var(--radius-lg) 0 0;
            border: 1px solid var(--border-primary);
            border-bottom: none;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            visibility: hidden;
            pointer-events: none;
          }

          .split-creator[data-variant="splitsPage"] .split-creator-sidebar.split-creator-sidebar--mobile-open {
            transform: translateY(0);
            visibility: visible;
            pointer-events: auto;
          }

          .split-creator-sidebar .split-creator-status-list {
            flex: 1;
            min-height: 0;
            overflow-y: auto;
          }

          .split-creator-sidebar-close {
            display: flex;
            position: absolute;
            top: var(--space-2);
            right: var(--space-2);
            padding: var(--space-2);
            background: transparent;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
          }

          .split-creator-sidebar-title {
            padding-right: 36px;
            font-size: 20px;
          }

          /* Mobile status typography priorities:
             - activation + sets value larger
             - name + range smaller
             (keep everything readable) */
          .split-creator[data-variant="splitsPage"] .split-creator-status-item,
          .split-creator[data-variant="splitsPage"] .split-creator-status-item__top,
          .split-creator[data-variant="splitsPage"] .split-creator-status-sets,
          .split-creator[data-variant="splitsPage"] .split-creator-status-separator,
          .split-creator[data-variant="splitsPage"] .split-creator-status-name-wrap {
            font-size: 12px;
          }

          .split-creator[data-variant="splitsPage"] .split-creator-status-activation-value,
          .split-creator[data-variant="splitsPage"] .split-creator-status-sets-value {
            font-size: 16px;
            font-weight: 700;
          }

          .split-creator[data-variant="splitsPage"] .split-creator-status-name {
            font-size: 12px;
          }

          .split-creator[data-variant="splitsPage"] .split-creator-status-range {
            font-size: 11px;
          }

          .split-creator-day-card {
            padding: var(--space-2);
            font-size: var(--text-sm);
          }

          .split-creator-targets {
            gap: var(--space-2);
            margin-top: var(--space-2);
          }

          .split-creator-target {
            padding: var(--space-2) 0;
          }

          .split-creator-day-card__header {
            margin-bottom: var(--space-3);
            gap: var(--space-3);
          }

          /* Extra internal spacing for splitsPage day cards on mobile */
          .split-creator[data-variant="splitsPage"] .split-creator-day-card {
            padding: var(--space-3);
          }

          .split-creator[data-variant="splitsPage"] .split-creator-day-card__header {
            margin-bottom: var(--space-3);
            gap: var(--space-3);
          }

          .split-creator[data-variant="splitsPage"] .split-creator-targets {
            gap: var(--space-2);
            margin-top: var(--space-2);
          }

          .split-creator[data-variant="splitsPage"] .split-creator-target {
            padding: var(--space-2) var(--space-2);
          }

          .split-creator-days-list {
            gap: var(--space-2);
          }

          .split-creator-target-row {
            gap: var(--space-2);
            display: flex;
            flex-wrap: wrap;
            align-items: center;
          }

          .split-creator-target-row .split-creator-target-select {
            order: 0;
            flex: 1 1 100%;
            min-width: 0;
          }

          .split-creator-target-row .split-creator-activation-input {
            order: 1;
            flex: 1;
            min-width: 72px;
          }

          .split-creator-target-row .split-creator-info-btn {
            order: 2;
            flex-shrink: 0;
          }

          .split-creator-target-row .btn-close {
            order: 3;
            flex-shrink: 0;
            align-self: center;
          }

          .split-creator-target-row .split-creator-btn-xs {
            order: 4;
          }

          .split-creator-days-header {
            margin-bottom: var(--space-2);
          }

          .split-creator-btn-sm {
            padding: var(--space-4) var(--space-5);
            font-size: var(--text-base);
            min-height: 48px;
            font-weight: var(--font-weight-semibold);
          }

          .split-creator-add-day {
            width: 100%;
            max-width: 100%;
            padding: var(--space-2) var(--space-4);
            min-height: 40px;
            font-size: var(--text-sm);
            font-weight: var(--font-weight-semibold);
          }

          .split-creator-btn-xs {
            padding: var(--space-2) var(--space-3);
            font-size: var(--text-sm);
          }

          .split-creator-submit {
            padding: var(--space-2) var(--space-3);
            font-size: var(--text-sm);
          }
        }

        @media (max-width: 640px) {
          .split-creator-target-row {
            grid-template-columns: 1fr;
            align-items: stretch;
          }

          .split-creator-date-input {
            width: 100%;
            min-width: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default SplitCreator;
