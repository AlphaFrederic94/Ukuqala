import React, { lazy } from 'react';
import { RouteObject } from 'react-router-dom';

// Lazy load prediction pages
const HeartDisease = lazy(() => import('../pages/predictions/HeartDisease'));
const Diabetes = lazy(() => import('../pages/predictions/Diabetes'));
const BrainCancer = lazy(() => import('../pages/predictions/BrainCancer'));
const SkinCancer = lazy(() => import('../pages/predictions/SkinCancer'));
const SymptomsPrediction = lazy(() => import('../pages/predictions/SymptomsPredictionSimple'));

// Define prediction routes
export const predictionRoutes: RouteObject[] = [
  {
    path: '/predictions/heart-disease',
    element: <HeartDisease />
  },
  {
    path: '/predictions/diabetes',
    element: <Diabetes />
  },
  {
    path: '/predictions/brain-cancer',
    element: <BrainCancer />
  },
  {
    path: '/predictions/skin-cancer',
    element: <SkinCancer />
  },
  {
    path: '/predictions/symptoms',
    element: <SymptomsPrediction />
  }
];

export default predictionRoutes;
