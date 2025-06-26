import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTutorial, TutorialStep } from '../../contexts/TutorialContext';
import { useTranslation } from 'react-i18next';

const TutorialModal: React.FC = () => {
  const { tutorialState, tutorials, nextStep, prevStep, skipTutorial, endTutorial } = useTutorial();
  const { t } = useTranslation();
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayRect, setOverlayRect] = useState({ top: 0, left: 0, width: 0, height: 0 });

  const { activeTutorial, step, run } = tutorialState;

  if (!activeTutorial || !run) return null;

  const tutorial = tutorials[activeTutorial];
  if (!tutorial) return null;

  const currentStep = tutorial.steps[step];
  const isFirstStep = step === 0;
  const isLastStep = step === tutorial.steps.length - 1;

  // Calculate position for the modal
  useEffect(() => {
    if (!currentStep || !currentStep.element) {
      setTargetElement(null);
      setShowOverlay(false);
      return;
    }

    const element = document.querySelector(currentStep.element) as HTMLElement;
    if (!element) {
      setTargetElement(null);
      setShowOverlay(false);
      return;
    }

    setTargetElement(element);
    setShowOverlay(!currentStep.disableOverlay);

    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    setOverlayRect({
      top: rect.top + scrollTop,
      left: rect.left + scrollLeft,
      width: rect.width,
      height: rect.height,
    });

    // Position the modal based on the specified position
    const position = currentStep.position || 'bottom';
    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = rect.top + scrollTop - 10 - 300; // Modal height + padding
        left = rect.left + scrollLeft + rect.width / 2 - 200; // Modal width / 2
        break;
      case 'right':
        top = rect.top + scrollTop + rect.height / 2 - 150; // Modal height / 2
        left = rect.left + scrollLeft + rect.width + 10;
        break;
      case 'bottom':
        top = rect.bottom + scrollTop + 10;
        left = rect.left + scrollLeft + rect.width / 2 - 200; // Modal width / 2
        break;
      case 'left':
        top = rect.top + scrollTop + rect.height / 2 - 150; // Modal height / 2
        left = rect.left + scrollLeft - 10 - 400; // Modal width + padding
        break;
      case 'center':
        top = window.innerHeight / 2 - 150; // Modal height / 2
        left = window.innerWidth / 2 - 200; // Modal width / 2
        break;
    }

    // Ensure the modal stays within viewport
    if (left < 20) left = 20;
    if (left + 400 > window.innerWidth) left = window.innerWidth - 420;
    if (top < 20) top = 20;
    if (top + 300 > window.innerHeight) top = window.innerHeight - 320;

    setModalPosition({ top, left });

    // Scroll element into view if needed
    if (position !== 'center') {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentStep, step]);

  // Handle clicks on the overlay
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (currentStep.spotlightClicks && targetElement) {
      // Allow clicks to pass through to the target element
      e.stopPropagation();
    }
  };

  return (
    <>
      {/* Overlay with spotlight effect */}
      {showOverlay && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50"
          onClick={handleOverlayClick}
        >
          {/* Spotlight cutout */}
          <div
            className="absolute bg-transparent border-2 border-blue-500 shadow-lg pointer-events-none"
            style={{
              top: overlayRect.top,
              left: overlayRect.left,
              width: overlayRect.width,
              height: overlayRect.height,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
              borderRadius: '4px',
            }}
          />
        </div>
      )}

      {/* Tutorial modal */}
      <div
        className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 w-[400px] max-w-[90vw]"
        style={{
          top: modalPosition.top,
          left: modalPosition.left,
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {currentStep.title}
          </h3>
          <button
            onClick={skipTutorial}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Close tutorial"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            {currentStep.content}
          </p>

          {/* Progress indicator */}
          <div className="flex justify-center mb-4">
            {tutorial.steps.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full mx-1 ${
                  i === step
                    ? 'bg-blue-600 dark:bg-blue-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between">
            <button
              onClick={isFirstStep ? skipTutorial : prevStep}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              {isFirstStep ? t('onboarding.skip') : (
                <span className="flex items-center">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {t('common.back')}
                </span>
              )}
            </button>
            <button
              onClick={isLastStep ? endTutorial : nextStep}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              {isLastStep ? t('common.finish') : (
                <span className="flex items-center">
                  {t('common.next')}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TutorialModal;
