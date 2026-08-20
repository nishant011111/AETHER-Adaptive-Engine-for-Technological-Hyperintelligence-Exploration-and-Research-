import { GoogleTaskList, GoogleTaskItem } from '../types';

const TASKS_API_BASE = 'https://tasks.googleapis.com/tasks/v1';

/**
 * Helper to build auth headers
 */
const getAuthHeaders = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
});

/**
 * Fetch all task lists for authenticated user
 */
export async function fetchTaskLists(accessToken: string): Promise<GoogleTaskList[]> {
  const response = await fetch(`${TASKS_API_BASE}/users/@me/lists?maxResults=100`, {
    headers: getAuthHeaders(accessToken),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Failed to fetch Google Task Lists (HTTP ${response.status})`
    );
  }

  const data = await response.json();
  return data.items || [];
}

/**
 * Create a new task list
 */
export async function createTaskList(
  accessToken: string,
  title: string
): Promise<GoogleTaskList> {
  const response = await fetch(`${TASKS_API_BASE}/users/@me/lists`, {
    method: 'POST',
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify({ title: title.trim() }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Failed to create Google Task List (HTTP ${response.status})`
    );
  }

  return await response.json();
}

/**
 * Delete a task list
 */
export async function deleteTaskList(
  accessToken: string,
  taskListId: string
): Promise<void> {
  const response = await fetch(`${TASKS_API_BASE}/users/@me/lists/${encodeURIComponent(taskListId)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(accessToken),
  });

  if (!response.ok && response.status !== 204) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Failed to delete Task List (HTTP ${response.status})`
    );
  }
}

/**
 * Fetch all tasks from a specific task list
 */
export async function fetchTasks(
  accessToken: string,
  taskListId: string,
  options?: { showCompleted?: boolean; showHidden?: boolean }
): Promise<GoogleTaskItem[]> {
  const params = new URLSearchParams({
    maxResults: '100',
    showCompleted: options?.showCompleted !== false ? 'true' : 'false',
    showHidden: options?.showHidden !== false ? 'true' : 'false',
  });

  const response = await fetch(
    `${TASKS_API_BASE}/lists/${encodeURIComponent(taskListId)}/tasks?${params.toString()}`,
    {
      headers: getAuthHeaders(accessToken),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Failed to fetch tasks (HTTP ${response.status})`
    );
  }

  const data = await response.json();
  return data.items || [];
}

/**
 * Create a new task in a list
 */
export async function createTask(
  accessToken: string,
  taskListId: string,
  task: {
    title: string;
    notes?: string;
    due?: string; // RFC 3339 formatted (e.g. 2026-08-17T00:00:00.000Z)
  }
): Promise<GoogleTaskItem> {
  const payload: Record<string, any> = {
    title: task.title.trim(),
  };

  if (task.notes?.trim()) {
    payload.notes = task.notes.trim();
  }

  if (task.due) {
    // Google Tasks requires RFC 3339 formatted date
    const dateObj = new Date(task.due);
    if (!isNaN(dateObj.getTime())) {
      payload.due = dateObj.toISOString();
    }
  }

  const response = await fetch(
    `${TASKS_API_BASE}/lists/${encodeURIComponent(taskListId)}/tasks`,
    {
      method: 'POST',
      headers: getAuthHeaders(accessToken),
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Failed to create task (HTTP ${response.status})`
    );
  }

  return await response.json();
}

/**
 * Update an existing task's title, notes, or due date
 */
export async function updateTask(
  accessToken: string,
  taskListId: string,
  taskId: string,
  patch: Partial<GoogleTaskItem>
): Promise<GoogleTaskItem> {
  const response = await fetch(
    `${TASKS_API_BASE}/lists/${encodeURIComponent(taskListId)}/tasks/${encodeURIComponent(taskId)}`,
    {
      method: 'PATCH',
      headers: getAuthHeaders(accessToken),
      body: JSON.stringify(patch),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Failed to update task (HTTP ${response.status})`
    );
  }

  return await response.json();
}

/**
 * Toggle task completion status
 */
export async function toggleTaskStatus(
  accessToken: string,
  taskListId: string,
  taskId: string,
  isCompleted: boolean
): Promise<GoogleTaskItem> {
  const payload: Partial<GoogleTaskItem> = isCompleted
    ? {
        status: 'completed',
        completed: new Date().toISOString(),
      }
    : {
        status: 'needsAction',
        completed: undefined,
      };

  return await updateTask(accessToken, taskListId, taskId, payload);
}

/**
 * Delete a single task
 */
export async function deleteTask(
  accessToken: string,
  taskListId: string,
  taskId: string
): Promise<void> {
  const response = await fetch(
    `${TASKS_API_BASE}/lists/${encodeURIComponent(taskListId)}/tasks/${encodeURIComponent(taskId)}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders(accessToken),
    }
  );

  if (!response.ok && response.status !== 204) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Failed to delete task (HTTP ${response.status})`
    );
  }
}

/**
 * Clear all completed tasks from a list
 */
export async function clearCompletedTasks(
  accessToken: string,
  taskListId: string
): Promise<void> {
  const response = await fetch(
    `${TASKS_API_BASE}/lists/${encodeURIComponent(taskListId)}/clear`,
    {
      method: 'POST',
      headers: getAuthHeaders(accessToken),
    }
  );

  if (!response.ok && response.status !== 204) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Failed to clear completed tasks (HTTP ${response.status})`
    );
  }
}
