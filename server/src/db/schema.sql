CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  full_name     VARCHAR(120)   NOT NULL,
  email         VARCHAR(255)   NOT NULL,
  password_hash VARCHAR(255)   NOT NULL,
  created_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS projects (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED NOT NULL,
  name        VARCHAR(150) NOT NULL,
  description TEXT         NULL,
  status      ENUM('not_started', 'in_progress', 'completed') NOT NULL DEFAULT 'not_started',
  start_date  DATE         NULL,
  end_date    DATE         NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_projects_user_status (user_id, status),
  KEY idx_projects_user_name (user_id, name),
  CONSTRAINT fk_projects_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tasks (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id  INT UNSIGNED NOT NULL,
  user_id     INT UNSIGNED NOT NULL,
  name        VARCHAR(150) NOT NULL,
  description TEXT         NULL,
  priority    ENUM('low', 'medium', 'high')                 NOT NULL DEFAULT 'medium',
  status      ENUM('pending', 'in_progress', 'completed')    NOT NULL DEFAULT 'pending',
  due_date    DATE         NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tasks_project (project_id),
  KEY idx_tasks_user_status (user_id, status),
  KEY idx_tasks_user_priority (user_id, priority),
  KEY idx_tasks_user_name (user_id, name),
  CONSTRAINT fk_tasks_project
    FOREIGN KEY (project_id) REFERENCES projects (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_tasks_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS revoked_tokens (
  jti        CHAR(36)     NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  expires_at DATETIME     NOT NULL,
  revoked_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (jti),
  KEY idx_revoked_expires (expires_at),
  CONSTRAINT fk_revoked_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED    NULL,
  action      VARCHAR(40)     NOT NULL,
  entity_type VARCHAR(30)     NOT NULL,
  entity_id   INT UNSIGNED    NULL,
  metadata    JSON            NULL,
  ip_address  VARCHAR(45)     NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_user_created (user_id, created_at),
  CONSTRAINT fk_audit_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
