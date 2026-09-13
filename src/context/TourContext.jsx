import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getTourSteps } from "../tour/tourSteps";
import { useAuth } from "./AuthContext";

const TourContext = createContext(null);

export const TourProvider = ({ children }) => {
  const [isActive, setIsActive]     = useState(false);
  const [stepIndex, setStepIndex]   = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  // The step list automatically switches between the Boat Owner walkthrough
  // and the Boat Driver walkthrough once the user's role is known (after
  // login). Everything before that point (welcome/register/login/profile)
  // is identical for both roles.
  const TOUR_STEPS = useMemo(() => getTourSteps(user?.role), [user?.role]);

  const currentStep = isActive ? TOUR_STEPS[stepIndex] : null;

  const goToStep = useCallback((index) => {
    if (index < 0 || index >= TOUR_STEPS.length) {
      setIsActive(false);
      setStepIndex(0);
      return;
    }

    const step = TOUR_STEPS[index];
    setStepIndex(index);

    // ✅ Navigate only if step doesn't require auth OR user is logged in
    if (!step.requiresAuth || user) {
      navigate(step.path);
    }
  }, [navigate, user, TOUR_STEPS]);

  const startTour = useCallback(() => {
    setIsActive(true);
    setStepIndex(0);
    const firstStep = TOUR_STEPS[0];
    navigate(firstStep.path);
  }, [navigate, TOUR_STEPS]);

  const nextStep = useCallback(() => {
    goToStep(stepIndex + 1);
  }, [goToStep, stepIndex]);

  const prevStep = useCallback(() => {
    goToStep(stepIndex - 1);
  }, [goToStep, stepIndex]);

  const endTour = useCallback(() => {
    setIsActive(false);
    setStepIndex(0);
  }, []);

  return (
    <TourContext.Provider
      value={{
        isActive,
        stepIndex,
        currentStep,
        totalSteps: TOUR_STEPS.length,
        startTour,
        nextStep,
        prevStep,
        endTour,
        goToStep,
      }}
    >
      {children}
    </TourContext.Provider>
  );
};

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used inside <TourProvider>");
  }
  return context;
};