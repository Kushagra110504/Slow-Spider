export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  role: UserRole;
  is_active?: boolean;
  created_at: string;
}

export type ProjectStatus = 'active' | 'at_risk' | 'overdue' | 'completed' | 'frozen' | 'trashed';
export type TeamCategory = 'Design team' | 'Product team' | 'Engineering team' | 'Growth team' | 'Marketing team' | 'Ops team';
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'critical' | 'warning' | 'normal' | 'info';
export type MilestoneStatus = 'done' | 'upcoming' | 'overdue';
export type InboxType = 'IDEA' | 'TASK' | 'NOTE' | 'PROJECT';
export type InboxItemType = 'TASK' | 'PROJECT' | 'IDEA' | 'NOTE';
export type InboxItemStatus = 'inbox' | 'converted' | 'archived';

export interface Project {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  status: ProjectStatus;
  progress: number;
  due_date: string;
  team_category: TeamCategory;
  tags: string[];
  members?: User[];
  last_active_at: string;
  trashed_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string;
  estimate?: string;
  assignee_id?: string;
  assignee?: User;
  trashed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: MilestoneStatus;
  due_date: string;
  trashed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InboxItem {
  id: string;
  user_id: string;
  type: InboxItemType;
  title: string;
  content?: string;
  status: InboxItemStatus;
  created_at: string;
}

export type AttachmentType = 'image' | 'pdf' | 'doc' | 'sheet';

export interface Attachment {
  id: string;
  project_id: string;
  name: string;
  file_type: AttachmentType;
  size_bytes: number;
  url: string;
  created_at: string;
}

export type NotificationType = 'info' | 'warning' | 'critical' | 'success';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  link?: string;
  invitation_id?: string;
  connection_id?: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  project_id: string;
  user_id?: string;
  user_name: string;
  user_avatar?: string;
  action_type: 'task_completed' | 'comment' | 'status_change' | 'alert' | 'archived' | 'restored' | 'created';
  description: string;
  created_at: string;
}

export interface TrashItem {
  id: string;
  original_id: string;
  entity_type: 'Project' | 'Task' | 'Milestone';
  title: string;
  deleted_at: string;
  source_workspace: string;
  days_remaining: number;
  data: Project | Task | Milestone;
}

export interface TeamInvitation {
  id: string;
  project_id: string;
  project_name: string;
  inviter_id: string;
  inviter_name: string;
  inviter_avatar?: string;
  invitee_email: string;
  role: 'member' | 'viewer';
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

export type ConnectionStatus = 'pending' | 'accepted' | 'declined' | 'blocked';

export interface UserConnection {
  id: string;
  requester_id: string;
  requester_name: string;
  requester_avatar?: string;
  requester_email?: string;
  recipient_id: string;
  recipient_name: string;
  recipient_avatar?: string;
  recipient_email?: string;
  status: ConnectionStatus;
  created_at: string;
  updated_at?: string;
}

export interface AdminPlatformStats {
  total_users: number;
  active_users: number;
  total_projects: number;
  active_projects: number;
  cold_store_projects: number;
  trashed_projects: number;
  total_tasks: number;
  completed_tasks: number;
  avg_completion_rate: number;
  database_status: 'Connected' | 'Local Mode';
  recent_logins_24h: number;
}
