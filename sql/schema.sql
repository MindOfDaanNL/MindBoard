-- ============================================================================
-- MindBoard 2.0 — MariaDB schema
-- Uitgebreid projectbeheer met accounts, rollen, organisaties en kanban-borden
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS activity_log;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS checklist_items;
DROP TABLE IF EXISTS checklists;
DROP TABLE IF EXISTS task_tags;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS columns;
DROP TABLE IF EXISTS boards;
DROP TABLE IF EXISTS project_members;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS invitations;
DROP TABLE IF EXISTS org_members;
DROP TABLE IF EXISTS orgs;
DROP TABLE IF EXISTS sessions;
-- users tabel NIET droppen om bestaande accounts te behouden
SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- Users (accounts + globale rollen)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email         VARCHAR(255) NOT NULL,
  username      VARCHAR(64)  NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(128) DEFAULT NULL,
  avatar_color  VARCHAR(16)  DEFAULT '#4f46e5',
  avatar_url    VARCHAR(512) DEFAULT NULL,
  role          ENUM('admin','user') NOT NULL DEFAULT 'user',
  status        ENUM('active','disabled','invited') NOT NULL DEFAULT 'active',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Sessions (JWT refresh tokens)
-- ----------------------------------------------------------------------------
CREATE TABLE sessions (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED NOT NULL,
  token_hash    CHAR(64) NOT NULL,
  user_agent    VARCHAR(255) DEFAULT NULL,
  ip            VARCHAR(64)  DEFAULT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at    DATETIME NOT NULL,
  last_used_at  DATETIME DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_sessions_user (user_id),
  KEY idx_sessions_token (token_hash),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- Organisaties
-- ----------------------------------------------------------------------------
CREATE TABLE orgs (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(128) NOT NULL,
  slug        VARCHAR(64)  NOT NULL,
  description TEXT DEFAULT NULL,
  owner_id    INT UNSIGNED NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_orgs_slug (slug),
  CONSTRAINT fk_orgs_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Leden van een organisatie (met rol)
CREATE TABLE org_members (
  org_id      INT UNSIGNED NOT NULL,
  user_id     INT UNSIGNED NOT NULL,
  role        ENUM('owner','admin','member','viewer') NOT NULL DEFAULT 'member',
  joined_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (org_id, user_id),
  KEY idx_orgmembers_user (user_id),
  CONSTRAINT fk_orgmembers_org  FOREIGN KEY (org_id)  REFERENCES orgs(id) ON DELETE CASCADE,
  CONSTRAINT fk_orgmembers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Uitnodigingen voor organisaties
CREATE TABLE invitations (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_id     INT UNSIGNED NOT NULL,
  email      VARCHAR(255) NOT NULL,
  role       ENUM('admin','member','viewer') NOT NULL DEFAULT 'member',
  token      VARCHAR(64)  NOT NULL,
  invited_by INT UNSIGNED NOT NULL,
  status     ENUM('pending','accepted','revoked','expired') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_invitations_token (token),
  KEY idx_invitations_email (email),
  CONSTRAINT fk_invitations_org  FOREIGN KEY (org_id)     REFERENCES orgs(id) ON DELETE CASCADE,
  CONSTRAINT fk_invitations_user FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Projecten (binnen een organisatie)
-- ----------------------------------------------------------------------------
CREATE TABLE projects (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_id      INT UNSIGNED NOT NULL,
  name        VARCHAR(128) NOT NULL,
  description TEXT DEFAULT NULL,
  color       VARCHAR(16) DEFAULT '#4f46e5',
  icon        VARCHAR(8)  DEFAULT '📋',
  status      ENUM('active','archived') NOT NULL DEFAULT 'active',
  created_by  INT UNSIGNED NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_projects_org (org_id),
  CONSTRAINT fk_projects_org  FOREIGN KEY (org_id)     REFERENCES orgs(id) ON DELETE CASCADE,
  CONSTRAINT fk_projects_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Leden per project (optionele extra rol tov organisatierol)
CREATE TABLE project_members (
  project_id INT UNSIGNED NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  role       ENUM('admin','member','viewer') NOT NULL DEFAULT 'member',
  PRIMARY KEY (project_id, user_id),
  KEY idx_projectmembers_user (user_id),
  CONSTRAINT fk_projectmembers_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_projectmembers_user    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- Kanban borden
-- ----------------------------------------------------------------------------
CREATE TABLE boards (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id INT UNSIGNED NOT NULL,
  name       VARCHAR(128) NOT NULL,
  position   INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_boards_project (project_id),
  CONSTRAINT fk_boards_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Kolommen binnen een bord
CREATE TABLE columns (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  board_id   INT UNSIGNED NOT NULL,
  name       VARCHAR(128) NOT NULL,
  color      VARCHAR(16) DEFAULT '#e2e8f0',
  position   INT NOT NULL DEFAULT 0,
  wip_limit  INT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_columns_board (board_id),
  CONSTRAINT fk_columns_board FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Taken
-- ----------------------------------------------------------------------------
CREATE TABLE tasks (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  board_id    INT UNSIGNED NOT NULL,
  column_id   INT UNSIGNED NOT NULL,
  title       VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  priority    ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  due_date    DATE DEFAULT NULL,
  position    INT NOT NULL DEFAULT 0,
  assignee_id INT UNSIGNED DEFAULT NULL,
  created_by  INT UNSIGNED NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tasks_board (board_id),
  KEY idx_tasks_column (column_id),
  KEY idx_tasks_assignee (assignee_id),
  CONSTRAINT fk_tasks_board    FOREIGN KEY (board_id)    REFERENCES boards(id)    ON DELETE CASCADE,
  CONSTRAINT fk_tasks_column   FOREIGN KEY (column_id)   REFERENCES columns(id)   ON DELETE CASCADE,
  CONSTRAINT fk_tasks_assignee FOREIGN KEY (assignee_id) REFERENCES users(id)     ON DELETE SET NULL,
  CONSTRAINT fk_tasks_creator  FOREIGN KEY (created_by)  REFERENCES users(id)     ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tags per taak
CREATE TABLE tags (
  id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(64) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tags_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE task_tags (
  task_id INT UNSIGNED NOT NULL,
  tag_id  INT UNSIGNED NOT NULL,
  PRIMARY KEY (task_id, tag_id),
  CONSTRAINT fk_tasktags_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  CONSTRAINT fk_tasktags_tag  FOREIGN KEY (tag_id)  REFERENCES tags(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- Checklists & checklist-items (subtaken per taak)
-- ----------------------------------------------------------------------------
CREATE TABLE checklists (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  task_id    INT UNSIGNED NOT NULL,
  title      VARCHAR(255) NOT NULL,
  position   INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_checklists_task (task_id),
  CONSTRAINT fk_checklists_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE checklist_items (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  checklist_id INT UNSIGNED NOT NULL,
  task_id      INT UNSIGNED NOT NULL,
  title        VARCHAR(255) NOT NULL,
  is_done      TINYINT(1) NOT NULL DEFAULT 0,
  position     INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ci_checklist (checklist_id),
  KEY idx_ci_task (task_id),
  CONSTRAINT fk_ci_checklist FOREIGN KEY (checklist_id) REFERENCES checklists(id) ON DELETE CASCADE,
  CONSTRAINT fk_ci_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Comments
-- ----------------------------------------------------------------------------
CREATE TABLE comments (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  task_id    INT UNSIGNED NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  body       TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_comments_task (task_id),
  CONSTRAINT fk_comments_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Activiteitenlog
-- ----------------------------------------------------------------------------
CREATE TABLE activity_log (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_id      INT UNSIGNED NOT NULL,
  user_id     INT UNSIGNED NOT NULL,
  action      VARCHAR(64)  NOT NULL,
  entity_type VARCHAR(32)  DEFAULT NULL,
  entity_id   INT UNSIGNED DEFAULT NULL,
  entity_name VARCHAR(255) DEFAULT NULL,
  metadata    JSON DEFAULT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_activity_org (org_id),
  KEY idx_activity_user (user_id),
  CONSTRAINT fk_activity_org  FOREIGN KEY (org_id)  REFERENCES orgs(id)  ON DELETE CASCADE,
  CONSTRAINT fk_activity_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- Notificaties
-- ----------------------------------------------------------------------------
CREATE TABLE notifications (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  type       VARCHAR(32)  DEFAULT 'info',
  title      VARCHAR(255) NOT NULL,
  body       TEXT DEFAULT NULL,
  link       VARCHAR(255) DEFAULT NULL,
  is_read    TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notifications_user (user_id, is_read),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;