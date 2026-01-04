import { useState, useEffect } from 'react';
import Joyride, { STATUS, EVENTS, type CallBackProps, type Step } from 'react-joyride';
import { useAuth } from '../contexts/AuthContext';

interface OnboardingTourProps {
    setShowMobileHabits?: (show: boolean) => void;
}

export function OnboardingTour({ setShowMobileHabits }: OnboardingTourProps) {
    const [run, setRun] = useState(false);
    const { currentUser } = useAuth();

    useEffect(() => {
        // Check if user has seen onboarding
        const hasSeenOnboarding = localStorage.getItem('hone_has_seen_onboarding');
        if (!hasSeenOnboarding && currentUser) {
            setTimeout(() => setRun(true), 0);
        }
    }, [currentUser]);

    const [stepIndex, setStepIndex] = useState(0);

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { action, index, status, type } = data;
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
        const isMobile = window.innerWidth < 768;

        if (finishedStatuses.includes(status)) {
            setRun(false);
            localStorage.setItem('hone_has_seen_onboarding', 'true');
            if (isMobile && setShowMobileHabits) {
                setShowMobileHabits(false); // Ensure popup closes on finish/skip
            }
            return;
        }

        if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
            // Mobile Transitions
            if (isMobile && setShowMobileHabits) {
                // Moving from Step 2 (Trigger) to Step 3 (Multi-select)
                // We need to OPEN the popup and WAIT for animation
                if (index === 2) {
                    setShowMobileHabits(true);
                    // Add delay to allow popup animation to finish before showing next step
                    setTimeout(() => {
                        setStepIndex(index + 1);
                    }, 400);
                    return; // Stop default progression
                }

                // Moving from Step 4 (Reset) to Step 5 (First Calendar Step)
                // We need to CLOSE the popup so it doesn't block the view
                if (index === 4) {
                    setShowMobileHabits(false);
                    // Small delay to allow closing animation? Optional, but good practice.
                    setTimeout(() => {
                        setStepIndex(index + 1);
                    }, 200);
                    return;
                }
            }

            // Default progression for other steps
            setStepIndex(index + (action === 'prev' ? -1 : 1));
        }
    };

    const isMobile = window.innerWidth < 768;

    const steps: Step[] = [
        {
            target: 'body',
            content: (
                <div className="text-left">
                    <h3 className="text-lg font-bold mb-2">Welcome to Hone! 👋</h3>
                    <p className="text-sm">
                        Your new minimal habit tracker. Let's explore how it works.
                    </p>
                </div>
            ),
            placement: 'center',
            disableBeacon: true,
        },
        ...(isMobile ? [
            {
                target: '#tour-mobile-sidebar-toggle',
                content: 'Tap here to switch calendars or access settings.',
            },
            {
                target: '#tour-mobile-habits-trigger',
                content: 'Open your habits menu here to add or edit habits.',
            },
            {
                target: '#mobile-habits-popup #tour-mobile-multiselect',
                content: 'Use this to check off multiple habits at once.',
            },
            {
                target: '#tour-mobile-reset',
                content: 'Reset this tour anytime from the menu.',
            }
        ] : [
            {
                target: '#tour-calendar-list',
                content: 'Switch between your different calendars here.',
            },
            {
                target: '#tour-calendar-add',
                content: 'Create new calendars to organize different life areas.',
            },
            {
                target: '#tour-sidebar-add',
                content: 'Create a new habit. Pick an icon and color.',
            },
            {
                target: '#tour-habit-list',
                content: 'Your habits live here. Drag to reorder, click to edit.',
            }
        ]),
        {
            target: '#tour-calendar-main',
            content: 'Your tracking canvas. Click a day to toggle habits.',
        },
        {
            target: '#tour-calendar-nav',
            content: 'Navigate through time. Jump to today or switch years.',
        },
        {
            target: '#tour-view-toggles',
            content: 'Switch views: "Graph" for heatmaps, "Year" for daily tracking.',
        },
        {
            target: '#tour-calendar-stats',
            content: 'Track your streaks, weekly progress, and completion rates.',
            placement: 'bottom'
        },
        ...(!isMobile ? [
            {
                target: '#tour-user-footer',
                content: 'Access your account settings and logout here.',
            }
        ] : [])
    ];

    return (
        <Joyride
            steps={steps}
            run={run}
            stepIndex={stepIndex}
            continuous
            showProgress
            showSkipButton
            callback={handleJoyrideCallback}
            locale={{
                last: 'Finish',
            }}
            styles={{
                options: {
                    arrowColor: '#18181b', // zinc-950
                    backgroundColor: '#18181b', // zinc-950
                    overlayColor: 'rgba(0, 0, 0, 0.5)',
                    primaryColor: '#ffffff',
                    textColor: '#e4e4e7', // zinc-200
                    width: 300,
                    zIndex: 10000,
                },
                tooltipContainer: {
                    textAlign: 'left',
                    fontSize: '14px',
                },
                buttonNext: {
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    padding: '8px 12px',
                    borderRadius: '4px',
                },
                buttonBack: {
                    color: '#a1a1aa', // zinc-400
                    marginRight: 10,
                },
                buttonSkip: {
                    color: '#a1a1aa', // zinc-400
                }
            }}
        />
    );
}
