import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdditionalTrackersMenu from '../components/AdditionalTrackersMenu';
import WeightTracker from '../components/trackers/WeightTracker';
import WaterTracker from '../components/trackers/WaterTracker';
import BodyMeasurementTracker from '../components/trackers/BodyMeasurementTracker';
import StepsTracker from '../components/trackers/StepsTracker';
import CardioTracker from '../components/trackers/CardioTracker';
import SleepTracker from '../components/trackers/SleepTracker';
import HealthMetricsTracker from '../components/trackers/HealthMetricsTracker';

const AdditionalTrackers = () => {
  return (
    <Routes>
      <Route path="/" element={<AdditionalTrackersMenu />} />
      <Route path="/weight" element={<WeightTracker />} />
      <Route path="/water" element={<WaterTracker />} />
      <Route path="/body-measurement" element={<BodyMeasurementTracker />} />
      <Route path="/steps" element={<StepsTracker />} />
      <Route path="/cardio" element={<CardioTracker />} />
      <Route path="/sleep" element={<SleepTracker />} />
      <Route path="/health-metrics" element={<HealthMetricsTracker />} />
      <Route path="*" element={<Navigate to="/additional-trackers" replace />} />
    </Routes>
  );
};

export default AdditionalTrackers;
