import { User, ReminderTier, DeadlineReminder } from '../types/database';
import { dataService } from './dataService';
import { oneSignalEmailService } from './oneSignalEmailService';

const EMAIL_PREF_KEY = 'pv_email_notifications_enabled';

class DeadlineService {
  private lastCheckTime: number = 0;
  private isChecking: boolean = false;

  public isEmailAlertsEnabled(): boolean {
    const val = localStorage.getItem(EMAIL_PREF_KEY);
    return val !== 'false';
  }

  public setEmailAlertsEnabled(enabled: boolean): void {
    localStorage.setItem(EMAIL_PREF_KEY, enabled ? 'true' : 'false');
  }

  public async checkAndDispatchDeadlines(currentUser?: User | null): Promise<void> {
    if (!currentUser || this.isChecking) return;

    // Limit checks to at most once per 60 seconds
    const now = Date.now();
    if (now - this.lastCheckTime < 60 * 1000) return;

    this.isChecking = true;
    this.lastCheckTime = now;

    try {
      const emailEnabled = this.isEmailAlertsEnabled();
      const allProjects = dataService.getProjects(currentUser);
      const allTasks = dataService.getTasks(undefined, currentUser);

      // Map projects for fast name lookup
      const projectMap = new Map(allProjects.map(p => [p.id, p]));

      // 1. Evaluate Active Tasks
      for (const task of allTasks) {
        if (task.status === 'done' || task.trashed_at || !task.due_date) continue;

        const targetUser = task.assignee || (task.assignee_id ? dataService.getUserById(task.assignee_id) : null);
        const recipient = targetUser || currentUser;
        if (!recipient || !recipient.email) continue;

        // Only evaluate if recipient is current logged in user (or assigned to them)
        if (recipient.id !== currentUser.id && recipient.email.toLowerCase() !== currentUser.email.toLowerCase()) {
          continue;
        }

        const dueTime = new Date(task.due_date).getTime();
        const remainingMs = dueTime - now;

        const tierMatch = this.getMatchingTier(remainingMs);
        if (!tierMatch) continue;

        const { tier, timeRemainingText } = tierMatch;

        // Check deduplication
        if (dataService.isDeadlineReminderSent('task', task.id, recipient.email, tier)) {
          continue;
        }

        const project = projectMap.get(task.project_id);
        const projectName = project ? project.name : 'Workspace Project';

        // 1. In-App Notification Drawer Alert
        dataService.sendNotification({
          user_id: recipient.id,
          title: `Deadline Alert: ${timeRemainingText}`,
          message: `"${task.title}" in ${projectName} is due soon (${new Date(task.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}).`,
          type: tier === '1h' ? 'critical' : tier === '12h' ? 'warning' : 'info',
        });

        // 2. Dispatch OneSignal Email if enabled
        if (emailEnabled) {
          await oneSignalEmailService.sendDeadlineEmail({
            recipientEmail: recipient.email,
            recipientName: recipient.name,
            taskTitle: task.title,
            projectName,
            entityType: 'task',
            entityId: task.id,
            tier,
            dueDate: task.due_date,
            timeRemainingText,
          });
        }

        // 3. Record sent log to prevent duplicate emails
        const reminderRecord: DeadlineReminder = {
          id: `rem-task-${task.id}-${tier}-${Date.now()}`,
          entity_type: 'task',
          entity_id: task.id,
          recipient_id: recipient.id,
          recipient_email: recipient.email,
          reminder_tier: tier,
          sent_at: new Date().toISOString(),
        };
        dataService.recordDeadlineReminder(reminderRecord);
      }

      // 2. Evaluate Active Projects
      for (const project of allProjects) {
        if (project.status === 'completed' || project.status === 'frozen' || project.trashed_at || !project.due_date) continue;

        const isParticipant = project.owner_id === currentUser.id || project.members?.some(m => m.id === currentUser.id);
        if (!isParticipant || !currentUser.email) continue;

        const dueTime = new Date(project.due_date).getTime();
        const remainingMs = dueTime - now;

        const tierMatch = this.getMatchingTier(remainingMs);
        if (!tierMatch) continue;

        const { tier, timeRemainingText } = tierMatch;

        if (dataService.isDeadlineReminderSent('project', project.id, currentUser.email, tier)) {
          continue;
        }

        // 1. In-App Notification
        dataService.sendNotification({
          user_id: currentUser.id,
          title: `Project Deadline Alert: ${timeRemainingText}`,
          message: `Project "${project.name}" is approaching its final delivery deadline.`,
          type: tier === '1h' ? 'critical' : tier === '12h' ? 'warning' : 'info',
        });

        // 2. Dispatch OneSignal Email
        if (emailEnabled) {
          await oneSignalEmailService.sendDeadlineEmail({
            recipientEmail: currentUser.email,
            recipientName: currentUser.name,
            taskTitle: project.name,
            projectName: project.name,
            entityType: 'project',
            entityId: project.id,
            tier,
            dueDate: project.due_date,
            timeRemainingText,
          });
        }

        // 3. Record Log
        const reminderRecord: DeadlineReminder = {
          id: `rem-proj-${project.id}-${tier}-${Date.now()}`,
          entity_type: 'project',
          entity_id: project.id,
          recipient_id: currentUser.id,
          recipient_email: currentUser.email,
          reminder_tier: tier,
          sent_at: new Date().toISOString(),
        };
        dataService.recordDeadlineReminder(reminderRecord);
      }
    } catch (err) {
      console.warn('Deadline evaluation error:', err);
    } finally {
      this.isChecking = false;
    }
  }

  private getMatchingTier(remainingMs: number): { tier: ReminderTier; timeRemainingText: string } | null {
    const ONE_HOUR = 60 * 60 * 1000;
    const TWELVE_HOURS = 12 * ONE_HOUR;
    const TWENTY_FOUR_HOURS = 24 * ONE_HOUR;

    if (remainingMs > 0 && remainingMs <= ONE_HOUR) {
      const minutes = Math.max(1, Math.round(remainingMs / (60 * 1000)));
      return {
        tier: '1h',
        timeRemainingText: minutes <= 1 ? 'Due Now' : `${minutes} Minutes Remaining`,
      };
    }

    if (remainingMs > ONE_HOUR && remainingMs <= TWELVE_HOURS) {
      const hours = Math.round(remainingMs / ONE_HOUR);
      return {
        tier: '12h',
        timeRemainingText: `${hours} Hours Remaining`,
      };
    }

    if (remainingMs > TWELVE_HOURS && remainingMs <= TWENTY_FOUR_HOURS) {
      return {
        tier: '24h',
        timeRemainingText: '24 Hours Remaining',
      };
    }

    return null;
  }
}

export const deadlineService = new DeadlineService();
