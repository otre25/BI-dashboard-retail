import { useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, EVENTS } from 'react-joyride';
import { useTutorialStore } from '../../store/useTutorialStore';
import { tutorialSteps } from './tutorialSteps';

export function Tutorial() {
  const { isRunning, hasSeenTutorial, stopTutorial, startTutorial } = useTutorialStore();

  // Auto-start tutorial on first visit
  useEffect(() => {
    if (!hasSeenTutorial) {
      // Delay to ensure DOM is ready
      const timer = setTimeout(() => {
        startTutorial();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [hasSeenTutorial, startTutorial]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      stopTutorial();
    }

    // Log events for debugging
    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      console.log('[Tutorial]', type, data);
    }
  };

  return (
    <Joyride
      steps={tutorialSteps}
      run={isRunning}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#06b6d4', // cyan-500
          textColor: '#1f2937', // gray-800
          backgroundColor: '#ffffff',
          arrowColor: '#ffffff',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 10000,
        },
        buttonNext: {
          backgroundColor: '#06b6d4',
          fontSize: 14,
          borderRadius: '0.5rem',
          padding: '0.5rem 1rem',
        },
        buttonBack: {
          color: '#6b7280',
          fontSize: 14,
        },
        buttonSkip: {
          color: '#9ca3af',
          fontSize: 14,
        },
        tooltip: {
          borderRadius: '0.75rem',
          padding: '1.5rem',
        },
        tooltipContent: {
          padding: '0.5rem 0',
        },
      }}
      locale={{
        back: 'Indietro',
        close: 'Chiudi',
        last: 'Fine',
        next: 'Avanti',
        skip: 'Salta tutorial',
      }}
    />
  );
}
