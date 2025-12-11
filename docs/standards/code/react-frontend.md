# React Frontend Standards

This document defines React coding standards for the time-management platform, aligned with our design principles of functional minimalism, accessibility, and component-based architecture using Shadcn/UI.

## Core Principles

1. **Component-first architecture** - Build with Shadcn/UI as the foundation
2. **Functional minimalism** - UI serves function, not decoration
3. **Accessibility by default** - Preserve Radix behaviors and ARIA standards
4. **Composability** - Build complex UIs from simple, reusable pieces
5. **Type safety** - Leverage TypeScript for props and state

## Component Philosophy

Components must be:
- **Consistent** in structure, behavior, and visual tone
- **Composable** supporting modular architecture
- **Accessible** preserving keyboard navigation and screen reader support
- **Reusable** avoiding duplication of patterns
- **Minimal** with clear props and no unnecessary complexity

## Component Architecture

### Component Categories

#### 1. Atomic Components (`components/ui/`)

Atomic components are the smallest UI building blocks imported from Shadcn/UI:

```
components/ui/
  button.tsx          # Shadcn Button
  input.tsx           # Shadcn Input
  card.tsx            # Shadcn Card
  dialog.tsx          # Shadcn Dialog
  sheet.tsx           # Shadcn Sheet
  dropdown-menu.tsx   # Shadcn Dropdown
  navigation-menu.tsx # Shadcn Navigation
  avatar.tsx          # Shadcn Avatar
  tabs.tsx            # Shadcn Tabs
```

**Rules:**
- Use `npx shadcn-ui add <component>` to add atomic components
- Do NOT create custom atomic components unless absolutely necessary
- Never modify Shadcn component internals - customize through composition
- Preserve all accessibility features (focus states, ARIA, keyboard navigation)

#### 2. Layout Components (`components/layout/`)

Layout components structure content but don't encode business meaning:

```tsx
// ✅ Good: Layout component
export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 px-4 py-6 md:px-8 lg:px-12">
      {children}
    </main>
  );
}

export function TwoColumnLayout({
  sidebar,
  main
}: {
  sidebar: React.ReactNode;
  main: React.ReactNode;
}) {
  return (
    <div className="flex gap-6">
      <aside className="w-64">{sidebar}</aside>
      <main className="flex-1">{main}</main>
    </div>
  );
}
```

**Rules:**
- Layout components control structure, not content
- Never fetch data or include business logic in layouts
- Use consistent spacing and alignment from design system
- Must be responsive by default

#### 3. Composite Components (`components/domain/`)

Composite components are built from atomic components for specific features:

```tsx
// ✅ Good: Composite component
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface TaskRowProps {
  id: TaskId;
  title: string;
  dueDate?: Date;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  onToggleComplete: (id: TaskId) => void;
  onEdit: (id: TaskId) => void;
}

export function TaskRow({
  id,
  title,
  dueDate,
  completed,
  priority,
  onToggleComplete,
  onEdit
}: TaskRowProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <Checkbox
          checked={completed}
          onCheckedChange={() => onToggleComplete(id)}
        />
        <div className="flex-1">
          <h3 className={completed ? 'line-through text-muted-foreground' : ''}>
            {title}
          </h3>
          {dueDate && (
            <p className="text-sm text-muted-foreground">
              Due: {formatDate(dueDate)}
            </p>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => onEdit(id)}>
          Edit
        </Button>
      </CardContent>
    </Card>
  );
}
```

**Rules:**
- Compose from existing Shadcn primitives
- Keep props minimal and explicit - avoid opaque objects
- Encapsulate component-specific behavior
- Extract reusable logic into custom hooks
- Avoid deep nesting - split into smaller components if needed

## Component Structure

### File Organization

```
src/
  components/
    ui/              # Shadcn components
    layout/          # Layout scaffolding
      PageContainer.tsx
      AppLayout.tsx
      NavigationPanel.tsx
    domain/          # Feature-specific components
      tasks/
        TaskList.tsx
        TaskRow.tsx
        TaskForm.tsx
      calendar/
        CalendarView.tsx
        EventCard.tsx
  hooks/             # Custom React hooks
  lib/               # Utilities and helpers
  pages/             # Route-level page components
```

### File Naming

- **Components**: `PascalCase.tsx` (e.g., `TaskList.tsx`, `UserAvatar.tsx`)
- **Hooks**: `camelCase.ts` with `use` prefix (e.g., `useTaskFilter.ts`)
- **Utilities**: `kebab-case.ts` (e.g., `date-formatter.ts`)
- **Test files**: `ComponentName.test.tsx`

### Component Template

```tsx
import React from 'react';
import type { TaskId } from '@time-management/shared';

interface TaskListProps {
  tasks: Task[];
  onTaskComplete: (id: TaskId) => void;
  className?: string;
}

/**
 * Displays a list of tasks with completion actions.
 *
 * @param tasks - Array of tasks to display
 * @param onTaskComplete - Callback when task is marked complete
 * @param className - Optional additional CSS classes
 */
export function TaskList({
  tasks,
  onTaskComplete,
  className
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No tasks found
      </div>
    );
  }

  return (
    <div className={className}>
      {tasks.map(task => (
        <TaskRow
          key={task.id}
          {...task}
          onToggleComplete={onTaskComplete}
        />
      ))}
    </div>
  );
}
```

## Props and TypeScript

### Explicit Prop Types

**✅ Good:**
```tsx
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  icon?: React.ReactNode;
}

export function CustomButton({
  label,
  onClick,
  variant = 'primary',
  disabled = false,
  icon
}: ButtonProps) {
  // ...
}
```

**❌ Avoid:**
```tsx
// No type definition
export function CustomButton(props: any) {
  // ...
}

// Overly permissive
export function CustomButton(props: Record<string, unknown>) {
  // ...
}
```

### Children Props

```tsx
// For single child element
interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

// For specific child components
interface TabsProps {
  children: React.ReactElement<TabProps> | React.ReactElement<TabProps>[];
}
```

### Event Handlers

```tsx
interface FormProps {
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  onChange?: (field: string, value: unknown) => void;
}
```

### Optional vs Required Props

```tsx
interface TaskFormProps {
  // Required
  onSave: (task: CreateTaskInput) => Promise<void>;

  // Optional - for edit mode
  initialData?: Task;

  // Optional with default
  showPriorityField?: boolean;  // defaults to true
}
```

## State Management

### Component State

Use `useState` for local UI state:

```tsx
export function TaskForm({ onSave }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSave({ title, description });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... */}
    </form>
  );
}
```

### Keep State Shallow

**✅ Good:**
```tsx
const [title, setTitle] = useState('');
const [dueDate, setDueDate] = useState<Date | null>(null);
const [priority, setPriority] = useState<Priority>('medium');
```

**❌ Avoid (deep nested state):**
```tsx
const [form, setForm] = useState({
  task: {
    details: {
      title: '',
      description: ''
    }
  }
});
```

### Derived State

Compute, don't store:

```tsx
export function TaskList({ tasks }: TaskListProps) {
  // ✅ Good: Computed value
  const completedCount = tasks.filter(t => t.completed).length;
  const pendingTasks = tasks.filter(t => !t.completed);

  // ❌ Avoid: Storing derived state
  // const [completedCount, setCompletedCount] = useState(0);

  return (
    <div>
      <p>{completedCount} completed</p>
      {pendingTasks.map(task => <TaskRow key={task.id} {...task} />)}
    </div>
  );
}
```

### Form State

For complex forms, consider using a form library:

```tsx
import { useForm } from 'react-hook-form';

export function TaskForm({ onSave }: TaskFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<TaskInput>();

  return (
    <form onSubmit={handleSubmit(onSave)}>
      <input {...register('title', { required: true })} />
      {errors.title && <span>Title is required</span>}

      <textarea {...register('description')} />

      <button type="submit">Save</button>
    </form>
  );
}
```

## Custom Hooks

Extract reusable logic into custom hooks:

### Data Fetching Hook

```tsx
export function useTasks(userId: UserId) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchTasks() {
      try {
        setLoading(true);
        const data = await taskService.fetchUserTasks(userId);
        if (!cancelled) {
          setTasks(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchTasks();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { tasks, loading, error };
}
```

### UI Logic Hook

```tsx
export function useDisclosure(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  return { isOpen, open, close, toggle };
}

// Usage
function TaskDialog() {
  const { isOpen, open, close } = useDisclosure();

  return (
    <>
      <Button onClick={open}>Create Task</Button>
      <Dialog open={isOpen} onOpenChange={close}>
        {/* ... */}
      </Dialog>
    </>
  );
}
```

### Media Query Hook

```tsx
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

// Usage
function NavigationPanel() {
  const isMobile = useMediaQuery('(max-width: 640px)');

  return isMobile ? <NavigationDrawer /> : <NavigationSidebar />;
}
```

## Effects and Side Effects

### Use Effects Sparingly

**✅ Good use cases:**
- Data fetching
- Subscribing to external events
- DOM manipulation (rare)
- Setting up timers

**❌ Avoid:**
- Updating state based on props (use derived state instead)
- Triggering renders unnecessarily

### Effect Cleanup

Always cleanup subscriptions and async operations:

```tsx
useEffect(() => {
  const controller = new AbortController();

  async function loadData() {
    try {
      const data = await fetch('/api/tasks', {
        signal: controller.signal
      });
      setTasks(await data.json());
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err);
      }
    }
  }

  loadData();

  return () => {
    controller.abort();
  };
}, []);
```

### Dependency Arrays

Be explicit with dependencies:

```tsx
// ✅ Good
useEffect(() => {
  fetchUserTasks(userId);
}, [userId]);

// ❌ Avoid
useEffect(() => {
  fetchUserTasks(userId);
}, []); // Missing dependency!
```

## Styling and Theming

### Use Tailwind Utility Classes

```tsx
export function TaskCard({ title, priority }: TaskCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <h3 className="font-semibold text-foreground">{title}</h3>
      <span className={cn(
        "text-sm",
        priority === 'high' && "text-red-500",
        priority === 'medium' && "text-amber-500",
        priority === 'low' && "text-green-500"
      )}>
        {priority}
      </span>
    </div>
  );
}
```

### Theme Variables

Use CSS variables from the theme:

```tsx
// ✅ Good: Uses theme tokens
<div className="bg-background text-foreground border-border">
  <p className="text-muted-foreground">Secondary text</p>
</div>

// ❌ Avoid: Hardcoded colors
<div style={{ backgroundColor: '#0D0D0D', color: '#E5E7EB' }}>
  <p style={{ color: '#9CA3AF' }}>Secondary text</p>
</div>
```

### Conditional Styling

Use `cn` utility for conditional classes:

```tsx
import { cn } from '@/lib/utils';

export function Button({
  variant = 'default',
  size = 'md',
  className
}: ButtonProps) {
  return (
    <button
      className={cn(
        "rounded-md font-medium transition-colors",
        variant === 'default' && "bg-primary text-primary-foreground",
        variant === 'ghost' && "hover:bg-accent",
        size === 'sm' && "px-3 py-1 text-sm",
        size === 'md' && "px-4 py-2",
        size === 'lg' && "px-6 py-3 text-lg",
        className
      )}
    >
      {/* ... */}
    </button>
  );
}
```

### Responsive Design

Use Tailwind breakpoints:

```tsx
<div className="px-4 py-6 md:px-8 lg:px-12">
  <h1 className="text-2xl md:text-3xl lg:text-4xl">
    Time Management
  </h1>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {/* ... */}
  </div>
</div>
```

## Layout Patterns

### Global Layout Structure

```tsx
export function AppLayout({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(true);
  const isMobile = useMediaQuery('(max-width: 1024px)');

  return (
    <div className="min-h-screen bg-background">
      <TopBanner onToggleNav={() => setNavOpen(!navOpen)} />

      <div className="flex">
        <NavigationPanel
          isOpen={navOpen}
          isMobile={isMobile}
          onClose={() => setNavOpen(false)}
        />

        <PageContainer>
          {children}
        </PageContainer>
      </div>
    </div>
  );
}
```

### Top Banner Component

```tsx
export function TopBanner({ onToggleNav }: { onToggleNav: () => void }) {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b bg-background px-4 py-3">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onToggleNav}>
          <MenuIcon />
        </Button>
        <h1 className="text-lg font-semibold">Time Management</h1>
      </div>

      <UserAvatar />
    </header>
  );
}
```

### Navigation Panel

```tsx
export function NavigationPanel({
  isOpen,
  isMobile,
  onClose
}: NavigationPanelProps) {
  const items = [
    { label: 'Today', href: '/today', icon: <CalendarIcon /> },
    { label: 'Tasks', href: '/tasks', icon: <TaskIcon /> },
    { label: 'Calendar', href: '/calendar', icon: <CalendarIcon /> },
    { label: 'Settings', href: '/settings', icon: <SettingsIcon /> },
  ];

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left">
          <NavigationItems items={items} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className={cn(
      "h-[calc(100vh-64px)] border-r bg-background transition-all",
      isOpen ? "w-64" : "w-0 overflow-hidden"
    )}>
      <NavigationItems items={items} />
    </aside>
  );
}
```

## Accessibility

### Semantic HTML

```tsx
// ✅ Good
<nav aria-label="Primary navigation">
  <ul>
    <li><a href="/tasks">Tasks</a></li>
  </ul>
</nav>

<main>
  <h1>Task List</h1>
  <article>
    <h2>Task Title</h2>
  </article>
</main>

// ❌ Avoid
<div className="nav">
  <div className="link">Tasks</div>
</div>
```

### ARIA Labels

```tsx
<Button
  variant="ghost"
  size="sm"
  aria-label="Close dialog"
  onClick={onClose}
>
  <XIcon aria-hidden="true" />
</Button>

<input
  type="text"
  aria-label="Task title"
  aria-required="true"
  aria-invalid={hasError}
  aria-describedby={hasError ? "title-error" : undefined}
/>
{hasError && <span id="title-error">Title is required</span>}
```

### Keyboard Navigation

```tsx
export function TaskRow({ task, onSelect }: TaskRowProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(task.id);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyPress}
      onClick={() => onSelect(task.id)}
      className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
    >
      {task.title}
    </div>
  );
}
```

### Focus Management

```tsx
export function Dialog({ isOpen, onClose, children }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.focus();
    }
  }, [isOpen]);

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onClose}>
      <DialogPrimitive.Content ref={dialogRef} tabIndex={-1}>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Root>
  );
}
```

## Performance

### Memoization

Use `useMemo` for expensive computations:

```tsx
export function TaskList({ tasks }: TaskListProps) {
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) =>
      a.dueDate.getTime() - b.dueDate.getTime()
    );
  }, [tasks]);

  return (
    <div>
      {sortedTasks.map(task => <TaskRow key={task.id} {...task} />)}
    </div>
  );
}
```

Use `useCallback` for stable function references:

```tsx
export function TaskForm({ onSave }: TaskFormProps) {
  const handleSubmit = useCallback(async (data: TaskInput) => {
    await onSave(data);
  }, [onSave]);

  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
}
```

### React.memo

Memoize components that receive stable props:

```tsx
export const TaskRow = React.memo(function TaskRow({
  task,
  onComplete
}: TaskRowProps) {
  return (
    <div>
      {task.title}
      <Button onClick={() => onComplete(task.id)}>Complete</Button>
    </div>
  );
});
```

### Lazy Loading

```tsx
import { lazy, Suspense } from 'react';

const CalendarView = lazy(() => import('./CalendarView'));

export function CalendarPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CalendarView />
    </Suspense>
  );
}
```

## Error Handling

### Error Boundaries

```tsx
import { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-8 text-center">
          <h2 className="text-xl font-semibold text-destructive">
            Something went wrong
          </h2>
          <p className="text-muted-foreground mt-2">
            {this.state.error?.message}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Async Error Handling

```tsx
export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTasks() {
      try {
        setLoading(true);
        setError(null);
        const data = await taskService.fetchTasks();
        setTasks(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tasks');
      } finally {
        setLoading(false);
      }
    }

    loadTasks();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (tasks.length === 0) return <EmptyState />;

  return (
    <div>
      {tasks.map(task => <TaskRow key={task.id} {...task} />)}
    </div>
  );
}
```

## Testing

### Component Tests

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskRow } from './TaskRow';

describe('TaskRow', () => {
  it('renders task title', () => {
    const task = {
      id: '1',
      title: 'Buy groceries',
      completed: false,
      priority: 'medium' as const
    };

    render(<TaskRow {...task} onToggleComplete={() => {}} />);

    expect(screen.getByText('Buy groceries')).toBeInTheDocument();
  });

  it('calls onToggleComplete when checkbox clicked', () => {
    const onToggleComplete = vi.fn();
    const task = {
      id: '1',
      title: 'Buy groceries',
      completed: false,
      priority: 'medium' as const
    };

    render(<TaskRow {...task} onToggleComplete={onToggleComplete} />);

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(onToggleComplete).toHaveBeenCalledWith('1');
  });
});
```

## Common Patterns

### Loading States

```tsx
export function TaskList() {
  const { tasks, loading, error } = useTasks();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  return <div>{/* render tasks */}</div>;
}
```

### Empty States

```tsx
export function EmptyTaskList() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <TaskIcon className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">No tasks yet</h3>
      <p className="text-muted-foreground mt-2 mb-4">
        Create your first task to get started
      </p>
      <Button onClick={onCreateTask}>Create Task</Button>
    </div>
  );
}
```

### Confirmation Dialogs

```tsx
export function DeleteTaskDialog({
  isOpen,
  onClose,
  onConfirm
}: DeleteTaskDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete task?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

## Summary

- Build with **Shadcn/UI** components as the foundation
- Maintain **functional minimalism** - UI serves function
- Ensure **accessibility** by preserving Radix behaviors
- Use **TypeScript** for all props and state
- Keep components **small and focused**
- Extract logic into **custom hooks**
- Follow the **layout structure** from design specs
- Use **Tailwind** with theme variables
- Test components with **Vitest** and Testing Library
- Handle errors gracefully with boundaries and loading states

Refer to the design documents for:
- [Component Guidelines](../../design/component-guidelines.md)
- [Design Principles](../../design/design-principles.md)
- [Layout Specifications](../../design/layout-specifications.md)
- [Navigation Specification](../../design/navigation-specification.md)
- [Style Guide](../../design/style-guide.md)
