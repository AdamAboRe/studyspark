const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const DATA_DIR = path.join(__dirname, "data");
const JSON_DATA_FILE = path.join(DATA_DIR, "app-data.json");
const DB_FILE = path.join(DATA_DIR, "studyspark.sqlite");
const STORAGE_MODE = String(process.env.STORAGE_MODE || "sqlite").toLowerCase();
const USE_JSON_PROTOTYPE = STORAGE_MODE === "json";

fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(DB_FILE);
db.exec("PRAGMA foreign_keys = ON;");
db.exec("PRAGMA journal_mode = WAL;");

function safeJsonParse(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function safeJsonStringify(value) {
  return JSON.stringify(value ?? null);
}

function emptyState() {
  return {
    users: [],
    subjects: [],
    plans: [],
    tasks: [],
    sessions: [],
    chatHistory: [],
    calendarBlocks: [],
    friends: [],
    friendMessages: [],
    rewardHistory: []
  };
}

function readPrototypeJsonState() {
  if (!fs.existsSync(JSON_DATA_FILE)) {
    return emptyState();
  }
  const raw = fs.readFileSync(JSON_DATA_FILE, "utf8");
  const parsed = safeJsonParse(raw, null);
  if (!parsed || typeof parsed !== "object") {
    return emptyState();
  }
  return {
    ...emptyState(),
    ...parsed
  };
}

function writePrototypeJsonState(state) {
  const normalized = {
    ...emptyState(),
    ...(state || {})
  };
  fs.writeFileSync(JSON_DATA_FILE, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
}

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      provider TEXT NOT NULL DEFAULT 'email',
      google_id TEXT,
      avatar_url TEXT,
      academic_level TEXT,
      preferred_language TEXT,
      study_goal TEXT,
      daily_available_hours TEXT,
      email_verified INTEGER NOT NULL DEFAULT 0,
      created_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_date TEXT NOT NULL,
      expires_date TEXT NOT NULL,
      invalidated INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      subject_name TEXT NOT NULL,
      exam_date TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      priority TEXT NOT NULL,
      daily_hours TEXT NOT NULL,
      notes TEXT,
      created_date TEXT NOT NULL,
      FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS plans (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      plan_title TEXT NOT NULL,
      ai_summary TEXT NOT NULL,
      weekly_plan_json TEXT NOT NULL,
      today_tasks_json TEXT NOT NULL,
      study_tips_json TEXT NOT NULL,
      motivation_message TEXT,
      mood TEXT,
      created_date TEXT NOT NULL,
      saved INTEGER NOT NULL DEFAULT 1,
      raw_response TEXT,
      prompt_log_json TEXT,
      FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      date TEXT NOT NULL,
      duration TEXT NOT NULL,
      status TEXT NOT NULL,
      related_plan TEXT,
      created_date TEXT NOT NULL,
      FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS calendar_blocks (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      category TEXT NOT NULL,
      notes TEXT,
      created_date TEXT NOT NULL,
      FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS friends (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      friend_value TEXT NOT NULL,
      created_date TEXT NOT NULL,
      FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS friend_messages (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      friend_id TEXT NOT NULL,
      message_text TEXT NOT NULL,
      created_date TEXT NOT NULL,
      FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE,
      FOREIGN KEY (friend_id) REFERENCES friends(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reward_history (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      activity_key TEXT NOT NULL,
      activity_type TEXT NOT NULL,
      xp INTEGER NOT NULL DEFAULT 0,
      coins INTEGER NOT NULL DEFAULT 0,
      created_date TEXT NOT NULL,
      UNIQUE(user_email, activity_key),
      FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chat_history (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_date TEXT NOT NULL,
      FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS password_reset_codes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      expires_date TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      used INTEGER NOT NULL DEFAULT 0,
      created_date TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS email_verification_codes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      expires_date TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      resend_count INTEGER NOT NULL DEFAULT 0,
      used INTEGER NOT NULL DEFAULT 0,
      created_date TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  ensureColumn("users", "provider", "TEXT NOT NULL DEFAULT 'email'");
  ensureColumn("users", "google_id", "TEXT");
  ensureColumn("users", "avatar_url", "TEXT");

  migrateJsonDataIfNeeded();
}

function ensureColumn(tableName, columnName, definition) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  if (!columns.some((column) => column.name === columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

function metaValue(key) {
  const row = db.prepare("SELECT value FROM meta WHERE key = ?").get(key);
  return row?.value ?? null;
}

function setMetaValue(key, value) {
  db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)").run(key, value);
}

function migrateJsonDataIfNeeded() {
  // TODO(deployment): In production, replace this JSON bootstrap migration
  // with explicit PostgreSQL/Supabase migrations and schema versioning.
  if (USE_JSON_PROTOTYPE) return;
  if (metaValue("json_migrated") === "1") return;

  if (!fs.existsSync(JSON_DATA_FILE)) {
    setMetaValue("json_migrated", "1");
    return;
  }

  const raw = fs.readFileSync(JSON_DATA_FILE, "utf8");
  const state = safeJsonParse(raw, null);
  if (!state) {
    setMetaValue("json_migrated", "1");
    return;
  }

  const existingUsers = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
  if (existingUsers === 0) {
    writeState({
      users: (state.users || []).map((user) => ({
        ...user,
        emailVerified: user.emailVerified ?? true
      })),
      subjects: state.subjects || [],
      plans: state.plans || [],
      tasks: state.tasks || [],
      sessions: [],
      chatHistory: state.chatHistory || [],
      calendarBlocks: state.calendarBlocks || [],
      friends: state.friends || [],
      friendMessages: state.friendMessages || [],
      rewardHistory: state.rewardHistory || []
    });
  }

  setMetaValue("json_migrated", "1");
}

function readState() {
  // Prototype mode keeps local app-data.json writable for quick demos.
  // TODO(deployment): Replace this abstraction with PostgreSQL/Supabase repository methods.
  if (USE_JSON_PROTOTYPE) {
    return readPrototypeJsonState();
  }
  return {
    users: db.prepare("SELECT * FROM users").all().map(mapUser),
    subjects: db.prepare("SELECT * FROM subjects").all().map(mapSubject),
    plans: db.prepare("SELECT * FROM plans").all().map(mapPlan),
    tasks: db.prepare("SELECT * FROM tasks").all().map(mapTask),
    sessions: db.prepare("SELECT * FROM sessions WHERE invalidated = 0").all().map(mapSession),
    chatHistory: db.prepare("SELECT * FROM chat_history").all().map(mapChatMessage),
    calendarBlocks: db.prepare("SELECT * FROM calendar_blocks").all().map(mapCalendarBlock),
    friends: db.prepare("SELECT * FROM friends").all().map(mapFriend),
    friendMessages: db.prepare("SELECT * FROM friend_messages").all().map(mapFriendMessage),
    rewardHistory: db.prepare("SELECT * FROM reward_history").all().map(mapReward)
  };
}

function writeState(state) {
  // Prototype mode persists to JSON to avoid breaking local dev workflows.
  // TODO(deployment): Replace snapshot rewrites with transactional PostgreSQL/Supabase queries.
  if (USE_JSON_PROTOTYPE) {
    writePrototypeJsonState(state);
    return;
  }
  const verificationCodes = db.prepare("SELECT * FROM email_verification_codes").all();
  const resetCodes = db.prepare("SELECT * FROM password_reset_codes").all();
  db.exec("BEGIN IMMEDIATE;");
  try {
    db.prepare("DELETE FROM reward_history").run();
    db.prepare("DELETE FROM friend_messages").run();
    db.prepare("DELETE FROM friends").run();
    db.prepare("DELETE FROM calendar_blocks").run();
    db.prepare("DELETE FROM chat_history").run();
    db.prepare("DELETE FROM tasks").run();
    db.prepare("DELETE FROM plans").run();
    db.prepare("DELETE FROM subjects").run();
    db.prepare("DELETE FROM sessions").run();
    db.prepare("DELETE FROM users").run();

    const insertUser = db.prepare(`
      INSERT INTO users (
        id, full_name, email, password_hash, provider, google_id, avatar_url,
        academic_level, preferred_language, study_goal, daily_available_hours, email_verified, created_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const user of state.users || []) {
      insertUser.run(
        user.id,
        user.fullName || user.full_name || "",
        normalizeEmail(user.email),
        user.passwordHash || user.password_hash || "",
        user.provider || "email",
        user.googleId || user.google_id || "",
        user.avatarUrl || user.avatar_url || "",
        user.academicLevel || user.academic_level || "",
        user.preferredLanguage || user.preferred_language || "English",
        user.studyGoal || user.study_goal || "",
        String(user.dailyAvailableHours || user.daily_available_hours || ""),
        user.emailVerified === false || user.email_verified === 0 ? 0 : 1,
        user.createdDate || user.created_date || new Date().toISOString()
      );
    }

    const insertSession = db.prepare(`
      INSERT INTO sessions (token_hash, user_id, created_date, expires_date, invalidated)
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const session of state.sessions || []) {
      insertSession.run(
        session.tokenHash || session.token_hash,
        session.userId || session.user_id,
        session.createdDate || session.created_date || new Date().toISOString(),
        session.expiresDate || session.expires_date || new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
        session.invalidated ? 1 : 0
      );
    }

    const insertSubject = db.prepare(`
      INSERT INTO subjects (
        id, user_email, subject_name, exam_date, difficulty, priority, daily_hours, notes, created_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const subject of state.subjects || []) {
      insertSubject.run(
        subject.id,
        normalizeEmail(subject.userEmail || subject.user_email),
        subject.subjectName || subject.subject_name || "",
        subject.examDate || subject.exam_date || "",
        subject.difficulty || "Medium",
        subject.priority || "Medium",
        String(subject.dailyHours || subject.daily_hours || ""),
        subject.notes || "",
        subject.createdDate || subject.created_date || new Date().toISOString()
      );
    }

    const insertPlan = db.prepare(`
      INSERT INTO plans (
        id, user_email, plan_title, ai_summary, weekly_plan_json, today_tasks_json,
        study_tips_json, motivation_message, mood, created_date, saved, raw_response, prompt_log_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const plan of state.plans || []) {
      insertPlan.run(
        plan.id,
        normalizeEmail(plan.userEmail || plan.user_email),
        plan.planTitle || plan.plan_title || "Study Plan",
        plan.aiSummary || plan.ai_summary || "",
        safeJsonStringify(plan.weeklyPlan || plan.weekly_plan_json || []),
        safeJsonStringify(plan.todayTasks || plan.today_tasks_json || []),
        safeJsonStringify(plan.studyTips || plan.study_tips_json || []),
        plan.motivationMessage || plan.motivation_message || "",
        plan.mood || "",
        plan.createdDate || plan.created_date || new Date().toISOString(),
        plan.saved === false || plan.saved === 0 ? 0 : 1,
        plan.rawResponse || plan.raw_response || "",
        safeJsonStringify(plan.promptLog || plan.prompt_log_json || null)
      );
    }

    const insertTask = db.prepare(`
      INSERT INTO tasks (id, user_email, subject, date, duration, status, related_plan, created_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const task of state.tasks || []) {
      insertTask.run(
        task.id,
        normalizeEmail(task.userEmail || task.user_email),
        task.subject || "",
        task.date || "",
        String(task.duration || ""),
        task.status || "Not done",
        task.relatedPlan || task.related_plan || "",
        task.createdDate || task.created_date || new Date().toISOString()
      );
    }

    const insertCalendarBlock = db.prepare(`
      INSERT INTO calendar_blocks (id, user_email, title, date, start_time, end_time, category, notes, created_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const block of state.calendarBlocks || []) {
      insertCalendarBlock.run(
        block.id,
        normalizeEmail(block.userEmail || block.user_email),
        block.title || "",
        block.date || "",
        block.startTime || block.start_time || "",
        block.endTime || block.end_time || "",
        block.category || "busy",
        block.notes || "",
        block.createdDate || block.created_date || new Date().toISOString()
      );
    }

    const insertFriend = db.prepare(`
      INSERT INTO friends (id, user_email, friend_value, created_date)
      VALUES (?, ?, ?, ?)
    `);
    for (const friend of state.friends || []) {
      insertFriend.run(
        friend.id,
        normalizeEmail(friend.userEmail || friend.user_email),
        friend.friendValue || friend.friend_value || friend.name || friend.email || "",
        friend.createdDate || friend.created_date || new Date().toISOString()
      );
    }

    const insertFriendMessage = db.prepare(`
      INSERT INTO friend_messages (id, user_email, friend_id, message_text, created_date)
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const message of state.friendMessages || []) {
      insertFriendMessage.run(
        message.id,
        normalizeEmail(message.userEmail || message.user_email),
        message.friendId || message.friend_id || "",
        message.messageText || message.message_text || message.text || "",
        message.createdDate || message.created_date || new Date().toISOString()
      );
    }

    const insertReward = db.prepare(`
      INSERT OR IGNORE INTO reward_history (id, user_email, activity_key, activity_type, xp, coins, created_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const reward of state.rewardHistory || []) {
      insertReward.run(
        reward.id,
        normalizeEmail(reward.userEmail || reward.user_email),
        reward.activityKey || reward.activity_key || reward.id,
        reward.activityType || reward.activity_type || "activity",
        Number(reward.xp || 0),
        Number(reward.coins || 0),
        reward.createdDate || reward.created_date || new Date().toISOString()
      );
    }

    const insertChatMessage = db.prepare(`
      INSERT INTO chat_history (id, user_email, role, content, created_date)
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const message of state.chatHistory || []) {
      insertChatMessage.run(
        message.id,
        normalizeEmail(message.userEmail || message.user_email),
        message.role || "user",
        message.content || message.message || "",
        message.createdDate || message.created_date || new Date().toISOString()
      );
    }

    const restoreVerificationCode = db.prepare(`
      INSERT OR IGNORE INTO email_verification_codes (
        id, user_id, code_hash, expires_date, attempts, resend_count, used, created_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const code of verificationCodes) {
      restoreVerificationCode.run(
        code.id,
        code.user_id,
        code.code_hash,
        code.expires_date,
        code.attempts,
        code.resend_count,
        code.used,
        code.created_date
      );
    }

    const restoreResetCode = db.prepare(`
      INSERT OR IGNORE INTO password_reset_codes (
        id, user_id, code_hash, expires_date, attempts, used, created_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const code of resetCodes) {
      restoreResetCode.run(
        code.id,
        code.user_id,
        code.code_hash,
        code.expires_date,
        code.attempts,
        code.used,
        code.created_date
      );
    }
    db.exec("COMMIT;");
  } catch (error) {
    db.exec("ROLLBACK;");
    throw error;
  }
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function mapUser(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    passwordHash: row.password_hash,
    provider: row.provider || "email",
    googleId: row.google_id || "",
    avatarUrl: row.avatar_url || "",
    academicLevel: row.academic_level,
    preferredLanguage: row.preferred_language,
    studyGoal: row.study_goal,
    dailyAvailableHours: row.daily_available_hours,
    emailVerified: Boolean(row.email_verified),
    createdDate: row.created_date
  };
}

function mapSession(row) {
  return {
    tokenHash: row.token_hash,
    userId: row.user_id,
    createdDate: row.created_date,
    expiresDate: row.expires_date,
    invalidated: Boolean(row.invalidated)
  };
}

function mapSubject(row) {
  return {
    id: row.id,
    userEmail: row.user_email,
    subjectName: row.subject_name,
    examDate: row.exam_date,
    difficulty: row.difficulty,
    priority: row.priority,
    dailyHours: row.daily_hours,
    notes: row.notes,
    createdDate: row.created_date
  };
}

function mapPlan(row) {
  return {
    id: row.id,
    userEmail: row.user_email,
    planTitle: row.plan_title,
    aiSummary: row.ai_summary,
    weeklyPlan: safeJsonParse(row.weekly_plan_json, []),
    todayTasks: safeJsonParse(row.today_tasks_json, []),
    studyTips: safeJsonParse(row.study_tips_json, []),
    motivationMessage: row.motivation_message,
    mood: row.mood,
    createdDate: row.created_date,
    saved: Boolean(row.saved),
    rawResponse: row.raw_response,
    promptLog: safeJsonParse(row.prompt_log_json, null)
  };
}

function mapTask(row) {
  return {
    id: row.id,
    userEmail: row.user_email,
    subject: row.subject,
    date: row.date,
    duration: row.duration,
    status: row.status,
    relatedPlan: row.related_plan,
    createdDate: row.created_date
  };
}

function mapCalendarBlock(row) {
  return {
    id: row.id,
    userEmail: row.user_email,
    title: row.title,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    category: row.category,
    notes: row.notes,
    createdDate: row.created_date
  };
}

function mapFriend(row) {
  return {
    id: row.id,
    userEmail: row.user_email,
    friendValue: row.friend_value,
    createdDate: row.created_date
  };
}

function mapFriendMessage(row) {
  return {
    id: row.id,
    userEmail: row.user_email,
    friendId: row.friend_id,
    messageText: row.message_text,
    createdDate: row.created_date
  };
}

function mapReward(row) {
  return {
    id: row.id,
    userEmail: row.user_email,
    activityKey: row.activity_key,
    activityType: row.activity_type,
    xp: row.xp,
    coins: row.coins,
    createdDate: row.created_date
  };
}

function mapChatMessage(row) {
  return {
    id: row.id,
    userEmail: row.user_email,
    role: row.role,
    message: row.content,
    content: row.content,
    createdDate: row.created_date
  };
}

function insertEmailVerificationCode(code) {
  db.prepare(`
    INSERT INTO email_verification_codes (
      id, user_id, code_hash, expires_date, attempts, resend_count, used, created_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    code.id,
    code.userId,
    code.codeHash,
    code.expiresDate,
    code.attempts || 0,
    code.resendCount || 0,
    code.used ? 1 : 0,
    code.createdDate
  );
}

function latestEmailVerificationCode(userId) {
  const row = db.prepare(`
    SELECT * FROM email_verification_codes
    WHERE user_id = ? AND used = 0
    ORDER BY created_date DESC
    LIMIT 1
  `).get(userId);
  return row ? {
    id: row.id,
    userId: row.user_id,
    codeHash: row.code_hash,
    expiresDate: row.expires_date,
    attempts: row.attempts,
    resendCount: row.resend_count,
    used: Boolean(row.used),
    createdDate: row.created_date
  } : null;
}

function updateEmailVerificationCode(code) {
  db.prepare(`
    UPDATE email_verification_codes
    SET attempts = ?, resend_count = ?, used = ?
    WHERE id = ?
  `).run(code.attempts || 0, code.resendCount || 0, code.used ? 1 : 0, code.id);
}

function insertPasswordResetCode(code) {
  db.prepare(`
    INSERT INTO password_reset_codes (
      id, user_id, code_hash, expires_date, attempts, used, created_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    code.id,
    code.userId,
    code.codeHash,
    code.expiresDate,
    code.attempts || 0,
    code.used ? 1 : 0,
    code.createdDate
  );
}

function latestPasswordResetCode(userId) {
  const row = db.prepare(`
    SELECT * FROM password_reset_codes
    WHERE user_id = ? AND used = 0
    ORDER BY created_date DESC
    LIMIT 1
  `).get(userId);
  return row ? {
    id: row.id,
    userId: row.user_id,
    codeHash: row.code_hash,
    expiresDate: row.expires_date,
    attempts: row.attempts,
    used: Boolean(row.used),
    createdDate: row.created_date
  } : null;
}

function updatePasswordResetCode(code) {
  db.prepare(`
    UPDATE password_reset_codes
    SET attempts = ?, used = ?
    WHERE id = ?
  `).run(code.attempts || 0, code.used ? 1 : 0, code.id);
}

function invalidateUserSessions(userId) {
  db.prepare("UPDATE sessions SET invalidated = 1 WHERE user_id = ?").run(userId);
}

initDatabase();

module.exports = {
  dbFile: DB_FILE,
  initDatabase,
  readState,
  writeState,
  normalizeEmail,
  insertEmailVerificationCode,
  latestEmailVerificationCode,
  updateEmailVerificationCode,
  insertPasswordResetCode,
  latestPasswordResetCode,
  updatePasswordResetCode,
  invalidateUserSessions
};
