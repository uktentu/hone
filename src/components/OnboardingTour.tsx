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
            setRun(true);
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
                        Your new minimal habit tracker. Let's explore how to get the most out of it.
                    </p>
                </div>
            ),
            placement: 'center',
            disableBeacon: true,
        },
        ...(isMobile ? [
            {
                target: '#tour-mobile-habits-trigger',
                content: 'Tap button to open your habits menu. You can add, edit, and reorder habits from there.',
            }
        ] : [
            {
                target: '#tour-sidebar-add',
                content: 'Start by creating a habit. Choose an icon and color to customize it.',
            },
            {
                target: '#tour-habit-list',
                content: 'Your habits live here. Drag to reorder them, or click the edit icon to make changes.',
            }
        ]),
        {
            target: '#tour-calendar-main',
            content: 'This is your tracking canvas. Tap a day to complete a habit (or multiple in multi-select mode).',
        },
        {
            target: '#tour-calendar-nav',
            content: 'Travel through time. Navigate between years easily.',
        },
        {
            target: '#tour-view-toggles',
            content: 'Switch perspectives. Use "Graph" for GitHub-style visualizations or "Year" for the classic view.',
        },
        {
            target: '#tour-calendar-stats',
            content: 'Track your consistency. See your streaks, weekly progress, and completion rates at a glance.',
            placement: 'bottom'
        },
        {
            target: '#tour-mobile-multiselect',
            content: 'Power user tip: Toggle multi-select to update or compare multiple habits at once.',
            placement: 'bottom',
        }
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
