import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi, onboardingApi } from '../lib/api-client';
import { Button } from '../components/ui/button';

type DayOfWeekString =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday';

interface UserSettings {
  userId: string;
  reviewDay: DayOfWeekString;
  createdAt: string;
  updatedAt: string;
}

const DAYS: { value: DayOfWeekString; label: string }[] = [
  { value: 'sunday', label: 'Sunday' },
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
];

export function SettingsPage() {
  const queryClient = useQueryClient();
  const [selectedDay, setSelectedDay] = useState<DayOfWeekString | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const { data: settings, isLoading } = useQuery<UserSettings>({
    queryKey: ['settings'],
    queryFn: () => settingsApi.getSettings(),
  });

  // Set initial selected day when settings load
  useEffect(() => {
    if (settings && selectedDay === null) {
      setSelectedDay(settings.reviewDay);
    }
  }, [settings, selectedDay]);

  const updateMutation = useMutation({
    mutationFn: (reviewDay: DayOfWeekString) => settingsApi.updateSettings({ reviewDay }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['review-status'] });
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => onboardingApi.reset(),
    onSuccess: () => {
      // Invalidate all queries to refresh the entire app
      queryClient.invalidateQueries();
      setShowResetConfirm(false);
      alert('User data reset successfully! Default content has been loaded.');
    },
    onError: error => {
      console.error('Reset failed:', error);
      alert('Failed to reset user data. Please try again.');
    },
  });

  const handleSave = () => {
    if (selectedDay) {
      updateMutation.mutate(selectedDay);
    }
  };

  const handleReset = () => {
    if (showResetConfirm) {
      resetMutation.mutate();
    } else {
      setShowResetConfirm(true);
    }
  };

  if (isLoading) {
    return <div>Loading settings...</div>;
  }

  const currentDay = selectedDay || settings?.reviewDay || 'sunday';
  const hasChanges = currentDay !== settings?.reviewDay;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Configure your review schedule and preferences</p>
      </div>

      <div className="border rounded-lg p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Weekly Review Day</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Choose which day of the week you prefer to conduct your weekly review. The system will
            remind you when it's time.
          </p>

          <div className="grid gap-2">
            {DAYS.map(day => (
              <label
                key={day.value}
                className={`
                  flex items-center gap-3 p-3 border rounded-md cursor-pointer transition-colors
                  ${currentDay === day.value ? 'bg-secondary border-primary' : 'hover:bg-accent'}
                `}
              >
                <input
                  type="radio"
                  name="reviewDay"
                  value={day.value}
                  checked={currentDay === day.value}
                  onChange={() => setSelectedDay(day.value)}
                  className="w-4 h-4"
                />
                <span className="font-medium">{day.label}</span>
              </label>
            ))}
          </div>
        </div>

        {hasChanges && (
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedDay(settings?.reviewDay || 'sunday')}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        )}

        {updateMutation.isSuccess && (
          <p className="text-sm text-green-600 dark:text-green-400">Settings saved successfully!</p>
        )}

        {updateMutation.isError && (
          <p className="text-sm text-destructive">Failed to save settings. Please try again.</p>
        )}
      </div>

      {/* Developer/Testing Reset Section */}
      <div className="border border-destructive/50 rounded-lg p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-destructive mb-2">
            Reset User Data (Development Only)
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            This will permanently delete all your data (drivers, milestones, actions, settings) and
            reload the default onboarding content. This action cannot be undone.
          </p>

          {showResetConfirm ? (
            <div className="space-y-4">
              <div className="bg-destructive/10 border border-destructive rounded-md p-4">
                <p className="font-semibold text-destructive mb-2">⚠️ Confirm Reset</p>
                <p className="text-sm">
                  Are you absolutely sure? This will delete all your data and cannot be reversed.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={handleReset}
                  disabled={resetMutation.isPending}
                >
                  {resetMutation.isPending ? 'Resetting...' : 'Yes, Reset Everything'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowResetConfirm(false)}
                  disabled={resetMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="destructive" onClick={handleReset}>
              Reset User Data
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
