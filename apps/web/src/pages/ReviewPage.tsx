import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  Plus,
  ChevronRight,
  ChevronDown,
  Circle,
  CircleDot,
  X,
  ArrowRight,
  Trash2,
  GitBranch,
} from 'lucide-react';
import {
  reviewApi,
  driverApi,
  milestoneApi,
  actionApi,
  valuesApi,
  type ActionStatus,
  type Action,
} from '../lib/api-client';
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
  const [expandedDrivers, setExpandedDrivers] = useState<Set<string>>(new Set());

  const { data: reviewStatus } = useQuery({
    queryKey: ['review-status'],
    queryFn: () => reviewApi.getStatus(),
  });

  const { data: driversData, isLoading: driversLoading } = useQuery({
    queryKey: ['drivers', false],
    queryFn: () => driverApi.list(false),
  });

  const { data: hierarchy } = useQuery({
    queryKey: ['values-hierarchy'],
    queryFn: () => valuesApi.getHierarchy(),
  });

  // Helper function to get children of a node
  const getChildren = (parentId: string) => {
    if (!hierarchy) return [];

    const childEdges = hierarchy.edges
      .filter(edge => edge.parentNodeId === parentId)
      .sort((a, b) => a.order - b.order);

    return childEdges
      .map(edge => hierarchy.nodes.find(node => (node as Driver).id === edge.childNodeId))
      .filter(Boolean);
  };

  const toggleDriver = (driverId: string) => {
    const newExpanded = new Set(expandedDrivers);
    if (newExpanded.has(driverId)) {
      newExpanded.delete(driverId);
    } else {
      newExpanded.add(driverId);
    }
    setExpandedDrivers(newExpanded);
  };

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
      queryClient.invalidateQueries({ queryKey: ['values-hierarchy'] });
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
      queryClient.invalidateQueries({ queryKey: ['values-hierarchy'] });
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
      queryClient.invalidateQueries({ queryKey: ['values-hierarchy'] });
    },
    onError: error => {
      console.error('Error creating action:', error);
      alert(`Failed to create action: ${error}`);
    },
  });
  const updateActionMutation = useMutation({
    mutationFn: ({ actionId, updates }: { actionId: string; updates: Partial<Action> }) =>
      actionApi.update(actionId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['values-hierarchy'] });
    },
  });

  const deleteMilestoneMutation = useMutation({
    mutationFn: (milestoneId: string) => milestoneApi.delete(milestoneId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['values-hierarchy'] });
    },
  });

  const deleteActionMutation = useMutation({
    mutationFn: (actionId: string) => actionApi.delete(actionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['values-hierarchy'] });
    },
  });

  const convertActionMutation = useMutation({
    mutationFn: (actionId: string) => actionApi.convertToMilestone(actionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['values-hierarchy'] });
    },
    onError: error => {
      console.error('Error converting action to milestone:', error);
      alert(
        `Failed to convert action: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    },
  });

  // Helper: Get icon component for action status
  const getStatusIcon = (status: ActionStatus) => {
    switch (status) {
      case 'not-started':
        return Circle;
      case 'in-progress':
        return CircleDot;
      case 'complete':
        return Check;
      case 'canceled':
        return X;
      case 'carried-over':
        return ArrowRight;
      default:
        return Circle;
    }
  };

  // Helper: Cycle to next status
  const getNextStatus = (current: ActionStatus): ActionStatus => {
    const statusCycle: ActionStatus[] = [
      'not-started',
      'in-progress',
      'complete',
      'canceled',
      'carried-over',
    ];
    const currentIndex = statusCycle.indexOf(current);
    const nextIndex = (currentIndex + 1) % statusCycle.length;
    return statusCycle[nextIndex];
  };

  const handleCycleActionStatus = (action: Action) => {
    const nextStatus = getNextStatus(action.status);
    updateActionMutation.mutate({
      actionId: action.id,
      updates: { status: nextStatus },
    });
  };

  const handleConvertActionToMilestone = (actionId: string, actionTitle: string) => {
    console.log('Converting action to milestone:', { actionId, actionTitle });
    convertActionMutation.mutate(actionId);
  };

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
  const hasDrivers = drivers.length > 0;
  const isFirstReview = !reviewStatus?.lastCompletedAt;

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
          {hasDrivers && (
            <Button
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
              size="lg"
            >
              <Check className="h-5 w-5 mr-2" />
              {completeMutation.isPending ? 'Completing...' : 'Complete Review'}
            </Button>
          )}
        </div>
      </div>

      {/* Content based on review state */}
      {driversLoading ? (
        <div>Loading drivers...</div>
      ) : !hasDrivers ? (
        <div className="bg-muted/50 border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-lg">Welcome to Your First Weekly Review</h3>
          <p className="text-muted-foreground">
            To begin your weekly review practice, you'll need to create at least one driver. Drivers
            represent your strategic goals and provide the "why" behind your work.
          </p>
          <p className="text-muted-foreground">
            Once you have drivers, you can return here to break them down into milestones and
            actions during your weekly review.
          </p>
          <div className="pt-2">
            <Button onClick={() => (window.location.href = '/drivers')}>Go to Drivers Page</Button>
          </div>
        </div>
      ) : isFirstReview ? (
        <>
          {/* First review with drivers - show instructions */}
          <div className="bg-muted/50 border rounded-lg p-6 space-y-4">
            <h3 className="font-semibold">Starting Your Weekly Review Practice</h3>
            <p className="text-muted-foreground">
              This is your first weekly review. Take time to reflect on your drivers and set up
              milestones and actions for the week ahead.
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Review each driver below - edit titles and descriptions as needed</li>
              <li>Create new milestones to break drivers into achievable targets</li>
              <li>Define actions for each milestone to make progress tangible</li>
              <li>When satisfied with your plan, mark the review as complete</li>
            </ol>
          </div>
          {/* Drivers Section */}
          <div className="space-y-4">
            {drivers.map(driver => {
              const isExpanded = expandedDrivers.has(driver.id);
              const driverMilestones = getChildren(driver.id) as Milestone[];

              return (
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
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedDriver(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleDriver(driver.id)}
                                className="p-1 hover:bg-muted rounded"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-5 w-5" />
                                ) : (
                                  <ChevronRight className="h-5 w-5" />
                                )}
                              </button>
                              <h3 className="text-xl font-semibold">{driver.title}</h3>
                            </div>
                            {driver.description && (
                              <p className="text-sm text-muted-foreground mt-1 ml-9">
                                {driver.description}
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditDriver(driver)}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Hierarchy Display */}
                  {isExpanded && driverMilestones.length > 0 && (
                    <div className="p-6 pt-4 border-b bg-muted/30">
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">
                        Milestones & Actions
                      </h4>
                      <div className="space-y-3">
                        {driverMilestones.map(milestone => {
                          const milestoneActions = getChildren(milestone.id) as Action[];
                          return (
                            <div key={milestone.id} className="pl-4 border-l-2 border-muted">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <h5 className="font-medium">{milestone.title}</h5>
                                  {milestone.description && (
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                      {milestone.description}
                                    </p>
                                  )}
                                  {milestoneActions.length > 0 && (
                                    <div className="mt-2 ml-4 space-y-1.5">
                                      {milestoneActions.map(action => {
                                        const StatusIcon = getStatusIcon(action.status);
                                        return (
                                          <div
                                            key={action.id}
                                            className="text-sm flex items-center gap-2 group hover:bg-muted/50 p-1 rounded"
                                          >
                                            <button
                                              onClick={() => handleCycleActionStatus(action)}
                                              className="flex-shrink-0 hover:bg-muted rounded p-0.5"
                                              title={`Status: ${action.status} (click to cycle)`}
                                            >
                                              <StatusIcon className="h-4 w-4" />
                                            </button>
                                            <span className="flex-1">{action.title}</span>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <button
                                                onClick={() =>
                                                  handleConvertActionToMilestone(
                                                    action.id,
                                                    action.title
                                                  )
                                                }
                                                className="p-1 hover:bg-muted rounded"
                                                title="Convert to milestone"
                                              >
                                                <GitBranch className="h-3 w-3" />
                                              </button>
                                              <button
                                                onClick={() =>
                                                  deleteActionMutation.mutate(action.id)
                                                }
                                                className="p-1 hover:bg-destructive hover:text-destructive-foreground rounded"
                                                title="Delete action"
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => deleteMilestoneMutation.mutate(milestone.id)}
                                    className="p-1.5 hover:bg-destructive hover:text-destructive-foreground rounded"
                                    title="Delete milestone"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

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
              );
            })}
          </div>
        </>
      ) : (
        <>
          {/* Subsequent reviews - show standard workflow */}
          <div className="bg-muted/50 border rounded-lg p-6 space-y-3">
            <h3 className="font-semibold">Review Workflow</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Review each driver below - edit titles and descriptions as needed</li>
              <li>Create new milestones to break drivers into achievable targets</li>
              <li>Define actions for each milestone to make progress tangible</li>
              <li>When satisfied with your plan, mark the review as complete</li>
            </ol>
          </div>
          {/* Drivers Section */}
          <div className="space-y-4">
            {drivers.map(driver => {
              const isExpanded = expandedDrivers.has(driver.id);
              const driverMilestones = getChildren(driver.id) as Milestone[];

              return (
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
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedDriver(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleDriver(driver.id)}
                                className="p-1 hover:bg-muted rounded"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-5 w-5" />
                                ) : (
                                  <ChevronRight className="h-5 w-5" />
                                )}
                              </button>
                              <h3 className="text-xl font-semibold">{driver.title}</h3>
                            </div>
                            {driver.description && (
                              <p className="text-sm text-muted-foreground mt-1 ml-9">
                                {driver.description}
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditDriver(driver)}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Hierarchy Display */}
                  {isExpanded && driverMilestones.length > 0 && (
                    <div className="p-6 pt-4 border-b bg-muted/30">
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">
                        Milestones & Actions
                      </h4>
                      <div className="space-y-3">
                        {driverMilestones.map(milestone => {
                          const milestoneActions = getChildren(milestone.id) as Action[];
                          return (
                            <div key={milestone.id} className="pl-4 border-l-2 border-muted">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <h5 className="font-medium">{milestone.title}</h5>
                                  {milestone.description && (
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                      {milestone.description}
                                    </p>
                                  )}
                                  {milestoneActions.length > 0 && (
                                    <div className="mt-2 ml-4 space-y-1.5">
                                      {milestoneActions.map(action => {
                                        const StatusIcon = getStatusIcon(action.status);
                                        return (
                                          <div
                                            key={action.id}
                                            className="text-sm flex items-center gap-2 group hover:bg-muted/50 p-1 rounded"
                                          >
                                            <button
                                              onClick={() => handleCycleActionStatus(action)}
                                              className="flex-shrink-0 hover:bg-muted rounded p-0.5"
                                              title={`Status: ${action.status} (click to cycle)`}
                                            >
                                              <StatusIcon className="h-4 w-4" />
                                            </button>
                                            <span className="flex-1">{action.title}</span>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <button
                                                onClick={() =>
                                                  handleConvertActionToMilestone(
                                                    action.id,
                                                    action.title
                                                  )
                                                }
                                                className="p-1 hover:bg-muted rounded"
                                                title="Convert to milestone"
                                              >
                                                <GitBranch className="h-3 w-3" />
                                              </button>
                                              <button
                                                onClick={() =>
                                                  deleteActionMutation.mutate(action.id)
                                                }
                                                className="p-1 hover:bg-destructive hover:text-destructive-foreground rounded"
                                                title="Delete action"
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => deleteMilestoneMutation.mutate(milestone.id)}
                                    className="p-1.5 hover:bg-destructive hover:text-destructive-foreground rounded"
                                    title="Delete milestone"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}{' '}
                      </div>
                    </div>
                  )}

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
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
