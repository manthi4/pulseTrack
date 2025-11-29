import { Card } from './ui/Card';
import { DonutChart } from './DonutChart';
import { type Activity, type Session } from '../lib/db';
import { type TimePeriod } from './TimePeriodSelector';

interface ActivityCardProps {
    activity: Activity;
    sessions: Session[];
    timePeriod: TimePeriod;
    selectedDate: Date;
    onSelectActivity: (syncId: string) => void;
}

export function ActivityCard({
    activity,
    sessions,
    timePeriod,
    selectedDate,
    onSelectActivity,
}: ActivityCardProps) {
    return (
        <Card
            padding="sm"
            hover={true}
            className="relative group cursor-pointer"
            onClick={() => activity.sync_id && onSelectActivity(activity.sync_id)}
        >
            <h3 className="font-semibold text-center mb-2">{activity.name}</h3>
            <div className="h-48">
                <DonutChart
                    activity={activity}
                    sessions={sessions}
                    timePeriod={timePeriod}
                    selectedDate={selectedDate}
                    showPeriodLabel={false}
                />
            </div>
        </Card>
    );
}
