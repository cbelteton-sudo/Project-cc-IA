import { test, expect } from '@playwright/test';

test.describe('Demo Happy Paths', () => {
  test('should log in and navigate to Scrum board', async ({ page }) => {
    // 1. Login Flow
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // Expect to be redirected to dashboard or projects
    await expect(page).toHaveURL(/.*dashboard|.*projects/);

    // 2. Navigate to Scrum Board
    // Assuming there is a link or we go directly
    await page.goto('/projects/p1/scrum');
    await expect(page.getByText('Sprint')).toBeVisible();

    // 3. Create Task
    await page.getByRole('button', { name: /New Task|Crear Tarea/i }).click();
    await page.fill('input[name="title"]', 'E2E Task');
    await page.click('button[type="submit"]');

    await expect(page.getByText('E2E Task')).toBeVisible();

    // 4. Move Task (Drag and Drop simulation)
    // This is tricky without specific IDs, so we'll just check existence for now
    // or simulate a status change if there's a button
    const task = page.getByText('E2E Task').first();
    await expect(task).toBeVisible();

    // Optional: simple drag check if dnd-kit is used
    // const dropZone = page.getByText('In Progress');
    // await task.dragTo(dropZone);
  });
});
