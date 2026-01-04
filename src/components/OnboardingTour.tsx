import { useState, useEffect } from 'react';
import Joyride, { STATUS, type CallBackProps, type Step } from 'react-joyride';
import { useAuth } from '../contexts/AuthContext';

export function OnboardingTour() {
    const [run, setRun] = useState(false);
    const { currentUser } = useAuth();

    useEffect(() => {
        // Check if user has seen onboarding
        const hasSeenOnboarding = localStorage.getItem('hone_has_seen_onboarding');
        if (!hasSeenOnboarding && currentUser) {
            setTimeout(() => setRun(true), 0);
        }
    }, [currentUser]);

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status } = data;
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            setRun(false);
            localStorage.setItem('hone_has_seen_onboarding', 'true');
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
                target: '#tour-mobile-multiselect',
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
            continuous
            showProgress
            showSkipButton
            callback={handleJoyrideCallback}
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
