import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Archive, Trash2 } from 'lucide-react';
import { driverApi } from '../lib/api-client';
import { Button } from '../components/ui/button';
import { ConfirmDialog } from '../components/ui/confirm-dialog';

interface Driver {
  id: string;
  userId: string;
  title: string;
  description?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export function DriversPage() {
  const queryClient = useQueryClient();
  const [showArchived, setShowArchived] = useState(false);
  const [newDriverTitle, setNewDriverTitle] = useState('');
  const [newDriverDescription, setNewDriverDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['drivers', showArchived],
    queryFn: () => driverApi.list(showArchived),
  });

  const createMutation = useMutation({
    mutationFn: (data: { title: string; description?: string; userId: string }) =>
      driverApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setIsCreating(false);
      setNewDriverTitle('');
      setNewDriverDescription('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { isArchived: boolean } }) =>
      driverApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => driverApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setDriverToDelete(null);
    },
  });

  const handleCreate = () => {
    if (newDriverTitle.trim()) {
      createMutation.mutate({
        title: newDriverTitle,
        description: newDriverDescription || undefined,
        userId: 'current-user', // This would come from auth context
      });
    }
  };

  const handleArchive = (driver: Driver) => {
    updateMutation.mutate({
      id: driver.id,
      data: { isArchived: !driver.isArchived },
    });
  };

  const handleDeleteClick = (driver: Driver) => {
    setDriverToDelete(driver);
  };

  const handleConfirmDelete = () => {
    if (driverToDelete) {
      deleteMutation.mutate(driverToDelete.id);
    }
  };

  const drivers = data?.drivers || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Drivers</h2>
          <p className="text-muted-foreground">
            Manage your strategic drivers - the why behind your actions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowArchived(!showArchived)}>
            <Archive className="h-4 w-4 mr-2" />
            {showArchived ? 'Hide Archived' : 'Show Archived'}
          </Button>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Driver
          </Button>
        </div>
      </div>

      {/* Create New Driver Form */}
      {isCreating && (
        <div className="border rounded-lg p-6 space-y-4 bg-card">
          <h3 className="font-semibold">Create New Driver</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={newDriverTitle}
                onChange={e => setNewDriverTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
                placeholder="What drives you?"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description (optional)</label>
              <textarea
                value={newDriverDescription}
                onChange={e => setNewDriverDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
                placeholder="Why is this important?"
                rows={3}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleCreate}
              disabled={!newDriverTitle.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Driver'}
            </Button>
            <Button variant="outline" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Drivers List */}
      {isLoading ? (
        <div>Loading drivers...</div>
      ) : drivers.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground">
            {showArchived ? 'No archived drivers' : 'No drivers yet. Create one to get started!'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {drivers.map(driver => (
            <div
              key={driver.id}
              className={`border rounded-lg p-6 ${driver.isArchived ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{driver.title}</h3>
                  {driver.description && (
                    <p className="text-sm text-muted-foreground mt-1">{driver.description}</p>
                  )}
                  <div className="flex gap-2 mt-3 text-xs text-muted-foreground">
                    <span>{!driver.isArchived ? 'Active' : 'Archived'}</span>
                    {driver.isArchived && <span>• Archived</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleArchive(driver)}
                    title={driver.isArchived ? 'Unarchive' : 'Archive'}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(driver)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!driverToDelete}
        onOpenChange={(open) => !open && setDriverToDelete(null)}
        title="Are you sure?"
        message={`Are you sure you want to delete "${driverToDelete?.title}"?`}
        confirmText="Yes"
        cancelText="No"
        onConfirm={handleConfirmDelete}
        variant="destructive"
      />
    </div>
  );
}
