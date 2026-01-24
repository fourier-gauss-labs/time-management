import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Plus } from 'lucide-react';
import { reviewApi, driverApi, milestoneApi, actionApi } from '../lib/api-client';
import { Button } from '../components/ui/button';

interface Driver {
  id: string;
  userId: string;
  title: string;
  description?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Milestone {
  id: string;
  userId: string;
  driverId: string;
  title: string;
  description?: string;
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
}

export function ReviewPage() {
  const queryClient = useQueryClient();
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newActionTitle, setNewActionTitle] = useState('');
  const [newMilestoneId, setNewMilestoneId] = useState<string | null>(null);
  const [createdMilestone, setCreatedMilestone] = useState<Milestone | null>(null);
  const [currentDriverId, setCurrentDriverId] = useState<string | null>(null);
  const [editingDriverTitle, setEditingDriverTitle] = useState('');
  const [editingDriverDesc, setEditingDriverDesc] = useState('');

  const { data: reviewStatus } = useQuery({
    queryKey: ['review-status'],
    queryFn: () => reviewApi.getStatus(),
  });

  const { data: driversData, isLoading: driversLoading } = useQuery({
    queryKey: ['drivers', false],
    queryFn: () => driverApi.list(false),
  });

  const completeMutation = useMutation({
    mutationFn: () => reviewApi.complete(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-status'] });
      alert('Review completed! Great work on your strategic planning.');
    },
  });

  const updateDriverMutation = useMutation({
    mutationFn: ({ id, title, description }: { id: string; title: string; description?: string }) =>
      driverApi.update(id, { title, description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setSelectedDriver(null);
    },
  });

  const createMilestoneMutation = useMutation({
    mutationFn: ({ driverId, title }: { driverId: string; title: string }) =>
      milestoneApi.create(driverId, { title }),
    onSuccess: (data, variables) => {
      // eslint-disable-next-line no-console
      console.log('Milestone created:', data);
      setNewMilestoneTitle('');
      setNewMilestoneId(data.id);
      setCreatedMilestone(data);
      setCurrentDriverId(variables.driverId);
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
    },
  });

  const createActionMutation = useMutation({
    mutationFn: ({
      driverId,
      title,
      parentMilestoneId,
    }: {
      driverId: string;
      title: string;
      parentMilestoneId?: string;
    }) => {
      // eslint-disable-next-line no-console
      console.log(
        'Creating action with driverId:',
        driverId,
        'parentMilestoneId:',
        parentMilestoneId
      );
      const tokensJson = localStorage.getItem('auth_tokens');
      const tokens = tokensJson ? JSON.parse(tokensJson) : null;
      // eslint-disable-next-line no-console
      console.log('Auth token exists:', !!tokens?.idToken);
      return actionApi.create(driverId, { title, parentMilestoneId });
    },
    onSuccess: () => {
      setNewActionTitle('');
      setNewMilestoneId(null);
      setCreatedMilestone(null);
      setCurrentDriverId(null);
      queryClient.invalidateQueries({ queryKey: ['actions'] });
    },
    onError: error => {
      console.error('Error creating action:', error);
      alert(`Failed to create action: ${error}`);
    },
  });

  const handleEditDriver = (driver: Driver) => {
    setSelectedDriver(driver);
    setEditingDriverTitle(driver.title);
    setEditingDriverDesc(driver.description || '');
  };

  const handleSaveDriver = () => {
    if (selectedDriver && editingDriverTitle.trim()) {
      updateDriverMutation.mutate({
        id: selectedDriver.id,
        title: editingDriverTitle,
        description: editingDriverDesc || undefined,
      });
    }
  };

  const handleCreateMilestone = (driverId: string) => {
    if (newMilestoneTitle.trim()) {
      createMilestoneMutation.mutate({ driverId, title: newMilestoneTitle });
    }
  };

  const handleCreateAction = () => {
    if (newMilestoneId && currentDriverId && newActionTitle.trim()) {
      // eslint-disable-next-line no-console
      console.log(
        'Creating action with driverId:',
        currentDriverId,
        'parentMilestoneId:',
        newMilestoneId
      );
      createActionMutation.mutate({
        driverId: currentDriverId,
        title: newActionTitle,
        parentMilestoneId: newMilestoneId,
      });
    } else {
      // eslint-disable-next-line no-console
      console.log('Missing required fields:', { newMilestoneId, currentDriverId, newActionTitle });
    }
  };

  const drivers = driversData?.drivers || [];

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Weekly Review</h2>
            <p className="text-muted-foreground mt-1">
              Reflect on your drivers and plan the week ahead
            </p>
            {reviewStatus && (
              <p className="text-sm text-muted-foreground mt-2">
                Review day: <span className="font-medium capitalize">{reviewStatus.reviewDay}</span>
                {reviewStatus.lastCompletedAt && (
                  <>
                    {' '}
                    • Last completed: {new Date(reviewStatus.lastCompletedAt).toLocaleDateString()}
                  </>
                )}
              </p>
            )}
          </div>
          <Button
            onClick={() => completeMutation.mutate()}
            disabled={completeMutation.isPending}
            size="lg"
          >
            <Check className="h-5 w-5 mr-2" />
            {completeMutation.isPending ? 'Completing...' : 'Complete Review'}
          </Button>
        </div>
      </div>

      {/* Review Instructions */}
      <div className="bg-muted/50 border rounded-lg p-6 space-y-3">
        <h3 className="font-semibold">Review Workflow</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
          <li>Review each driver below - edit titles and descriptions as needed</li>
          <li>Create new milestones to break drivers into achievable targets</li>
          <li>Define actions for each milestone to make progress tangible</li>
          <li>When satisfied with your plan, mark the review as complete</li>
        </ol>
      </div>

      {/* Drivers */}
      {driversLoading ? (
        <div>Loading drivers...</div>
      ) : drivers.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground">No drivers yet. Go to Drivers page to create one.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {drivers.map(driver => (
            <div key={driver.id} className="border rounded-lg bg-card">
              {/* Driver Header */}
              <div className="p-6 border-b">
                {selectedDriver?.id === driver.id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editingDriverTitle}
                      onChange={e => setEditingDriverTitle(e.target.value)}
                      className="w-full text-xl font-semibold px-3 py-2 border rounded-md bg-background"
                    />
                    <textarea
                      value={editingDriverDesc}
                      onChange={e => setEditingDriverDesc(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                      rows={2}
                      placeholder="Description"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveDriver}>
                        Save Changes
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setSelectedDriver(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold">{driver.title}</h3>
                        {driver.description && (
                          <p className="text-sm text-muted-foreground mt-1">{driver.description}</p>
                        )}
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleEditDriver(driver)}>
                        Edit
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Create Milestone Section */}
              <div className="p-6 space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">Add Milestone</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMilestoneTitle}
                    onChange={e => setNewMilestoneTitle(e.target.value)}
                    placeholder="New milestone title..."
                    className="flex-1 px-3 py-2 border rounded-md bg-background"
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleCreateMilestone(driver.id);
                    }}
                  />
                  <Button
                    onClick={() => handleCreateMilestone(driver.id)}
                    disabled={!newMilestoneTitle.trim() || createMilestoneMutation.isPending}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>

                {/* Display created milestone and action input */}
                {createdMilestone && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg border space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Milestone created:
                      </p>
                      <h5 className="font-semibold mt-1">{createdMilestone.title}</h5>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Add an action:</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newActionTitle}
                          onChange={e => setNewActionTitle(e.target.value)}
                          placeholder="New action title..."
                          className="flex-1 px-3 py-2 border rounded-md bg-background text-sm"
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleCreateAction();
                          }}
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={handleCreateAction}
                          disabled={!newActionTitle.trim() || createActionMutation.isPending}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Action
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
