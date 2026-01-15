import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../lib/api-client';
import { Button } from '../components/ui/button';
import type { DayOfWeekString } from '@time-management/shared';

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

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.getSettings(),
    onSuccess: data => {
      if (selectedDay === null) {
        setSelectedDay(data.reviewDay);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: (reviewDay: DayOfWeekString) => settingsApi.updateSettings({ reviewDay }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['review-status'] });
    },
  });

  const handleSave = () => {
    if (selectedDay) {
      updateMutation.mutate(selectedDay);
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
    </div>
  );
}
