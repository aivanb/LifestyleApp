import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { PlusIcon, XMarkIcon, InformationCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
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
  
  // UI State
  const [activeTab, setActiveTab] = useState('manage'); // 'manage' or 'new'
  const [selectedSplit, setSelectedSplit] = useState(null);
  
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

      const response = await api.createSplit(splitData);
      if (response.data.success) {
        setSuccess('Split created successfully!');
        setFormData({
          split_name: '',
          start_date: '',
          split_days: []
        });
        
        if (onSplitCreated) onSplitCreated();
        loadData(); // Reload splits
      }
    } catch (err) {
      console.error('Error creating split:', err);
      setError('Failed to create split');
    } finally {
      setIsCreating(false);
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
              <input
                type="date"
                id="start_date"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
                className="form-input"
              />
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
              <aside className="split-creator-sidebar" aria-label="Muscle status">
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
                          <div className="split-creator-status-item__top">
                            <span className="split-creator-status-sets">
                              {data.totalSets}
                            </span>
                            <span className="split-creator-status-name-wrap">
                              <span
                                className="split-creator-status-name"
                                style={{ color: getStatusColorForRange(muscleId) }}
                              >
                                {data.muscleName}
                              </span>
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
                            <span className="split-creator-status-range">
                              {Math.round(data.optimalRange.lower)}-{Math.round(data.optimalRange.upper)}
                            </span>
                          </div>
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
                                {`${data.totalSets}s`}
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
                  className={`split-creator-split-card ${split.splits_id === latestActiveSplitId ? 'split-creator-split-card--latest' : ''}`}
                >
                  <div className="split-creator-split-card__header">
                    <div className="split-creator-split-card__meta">
                      <h4 className="split-creator-split-name">{split.split_name}</h4>
                      <p className="split-creator-split-subtitle">
                        {split.split_days?.length || 0} days •
                        {split.start_date ? ` Active since ${split.start_date}` : ' Not active'}
                      </p>
                    </div>
                    <div className="split-creator-split-actions">
                      <button
                        type="button"
                        onClick={() => navigate(`/personalization/splits/${split.splits_id}/edit`, { state: { split } })}
                        className="btn btn-secondary split-creator-btn-sm"
                      >
                        Edit
                      </button>
                    </div>
                  </div>

                  {/* Start Date Assignment */}
                  <div className="split-creator-split-card__footer">
                    <label className="split-creator-inline-label" htmlFor={`split-start-${split.splits_id}`}>
                      Set Start Date
                    </label>
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
                  </div>
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
              <aside className="split-creator-sidebar" aria-label="Muscle status">
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
          background: var(--bg-secondary);
          border: none;
          border-radius: var(--radius-lg);
          padding: var(--space-5);
          box-shadow: 0 24px 55px rgba(0, 0, 0, 0.4);
          transition: transform 0.25s var(--ease-out-cubic), box-shadow 0.25s var(--ease-out-cubic);
          backdrop-filter: blur(8px);
        }

        .split-creator-section:hover {
          transform: translateY(-3px);
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.45);
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

        .split-creator-split-card {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          transition: transform 0.25s var(--ease-out-cubic), box-shadow 0.25s var(--ease-out-cubic);
        }

        .split-creator-split-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 24px 55px rgba(0, 0, 0, 0.4);
        }

        .split-creator-split-card--latest {
          border-color: var(--accent-secondary);
          box-shadow: 0 0 0 1px var(--accent-secondary-alpha);
          background: linear-gradient(180deg, var(--accent-secondary-alpha) 0%, var(--bg-tertiary) 55%);
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
          font-size: var(--text-lg);
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
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          padding: var(--space-5);
          transition: transform 0.25s var(--ease-out-cubic), box-shadow 0.25s var(--ease-out-cubic);
        }

        .split-creator-day-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 24px 55px rgba(0, 0, 0, 0.4);
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
          gap: var(--space-3);
        }

        .split-creator-target {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-secondary);
          border-radius: var(--radius-md);
          padding: var(--space-3);
        }

        .split-creator-target-row {
          display: grid;
          grid-template-columns: 1fr 120px auto auto;
          gap: var(--space-3);
          align-items: center;
        }

        .split-creator-target-select {
          min-height: 42px;
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
          margin-top: var(--space-2);
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

        .split-creator-sidebar {
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          padding: var(--space-5);
          position: sticky;
          top: var(--space-6);
          max-height: calc(100vh - var(--space-12));
          overflow: auto;
          box-shadow: 0 24px 55px rgba(0, 0, 0, 0.42);
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
          font-size: var(--text-sm);
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
          padding: var(--space-3);
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
        }

        .split-creator-status-sets,
        .split-creator-status-range {
          color: var(--text-tertiary);
          font-size: var(--text-xs);
        }

        /* ===== Splits Page Variant ===== */
        .split-creator[data-variant="splitsPage"] {
          font-size: var(--text-lg);
        }

        /* Match workout-tracker date input styling */
        .split-creator[data-variant="splitsPage"] input[type="date"] {
          padding: var(--space-4) var(--space-5);
          border: 1px solid var(--surface-overlay);
          border-radius: var(--radius-md);
          background: transparent;
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
          height: 56px;
        }

        .split-creator[data-variant="splitsPage"] input[type="date"]:focus {
          outline: none;
          border-color: var(--accent-primary);
          background: rgba(90, 166, 255, 0.12);
        }

        .split-creator[data-variant="splitsPage"] input[type="date"]:hover {
          border-color: var(--accent-primary);
          background: rgba(90, 166, 255, 0.08);
        }

        .split-creator[data-variant="splitsPage"] input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          cursor: pointer;
          opacity: 0.85;
        }

        .split-creator[data-variant="splitsPage"] input[type="date"]::-webkit-calendar-picker-indicator:hover {
          opacity: 1;
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
          font-size: var(--text-2xl);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
          text-align: left;
        }

        .split-creator[data-variant="splitsPage"] .split-creator-status-name {
          font-size: var(--text-xl);
          font-weight: var(--font-weight-semibold);
          text-align: center;
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
