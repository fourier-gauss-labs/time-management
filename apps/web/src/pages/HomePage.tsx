import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlertCircle, Calendar } from 'lucide-react';
import { reviewApi } from '../lib/api-client';
import { Button } from '../components/ui/button';

export function HomePage() {
  const { data: reviewStatus, isLoading } = useQuery({
    queryKey: ['review-status'],
    queryFn: () => reviewApi.getStatus(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Welcome Back</h2>
        <p className="text-muted-foreground">Strategic planning for intentional living</p>
      </div>

      {/* Review Reminder */}
      {!isLoading && reviewStatus?.isDue && (
        <div className="border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-md">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-yellow-900 dark:text-yellow-200">
                Weekly Review Due
              </h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
                Your weekly review is overdue. Take time to reflect on your drivers and plan the
                week ahead.
              </p>
              <Link to="/review">
                <Button variant="outline" size="sm" className="mt-3">
                  <Calendar className="h-4 w-4 mr-2" />
                  Start Review
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/drivers"
          className="block p-6 border rounded-lg hover:bg-accent transition-colors"
        >
          <h3 className="font-semibold text-lg mb-2">Drivers</h3>
          <p className="text-sm text-muted-foreground">
            Manage your strategic drivers and milestones
          </p>
        </Link>

        <Link
          to="/review"
          className="block p-6 border rounded-lg hover:bg-accent transition-colors"
        >
          <h3 className="font-semibold text-lg mb-2">Weekly Review</h3>
          <p className="text-sm text-muted-foreground">Reflect on your progress and plan ahead</p>
        </Link>

        <Link
          to="/settings"
          className="block p-6 border rounded-lg hover:bg-accent transition-colors"
        >
          <h3 className="font-semibold text-lg mb-2">Settings</h3>
          <p className="text-sm text-muted-foreground">
            Configure your review schedule and preferences
          </p>
        </Link>
      </div>
    </div>
  );
}
