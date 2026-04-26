const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { URL } = require("node:url");
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const {
  dbFile,
  readState,
  writeState,
  normalizeEmail,
  insertEmailVerificationCode,
  latestEmailVerificationCode,
  updateEmailVerificationCode,
  insertPasswordResetCode,
  latestPasswordResetCode,
  updatePasswordResetCode,
  invalidateUserSessions,
} = require("./database");

const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, "data");
const DATA_FILE = path.join(DATA_DIR, "app-data.json");
const PUBLIC_FILES = new Set(["index.html", "styles.css", "app.js", "README.md"]);
const ASSET_EXTENSIONS = new Map([
  [".png", "image/png"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
]);
const PORT = Number(process.env.PORT || 3000);
const MAX_REQUEST_BODY_BYTES = Number(process.env.MAX_REQUEST_BODY_BYTES || 1_000_000);
const APP_BASE_URL = process.env.APP_BASE_URL || `http://localhost:${PORT}`;
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const ALLOWED_ORIGINS = new Set(
  String(process.env.ALLOWED_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);

loadEnvFile(path.join(ROOT_DIR, ".env"));
validateEnvironment();

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    if (req.method === "OPTIONS") {
      applySecurityHeaders(res);
      res.writeHead(204);
      res.end();
      return;
    }

    if (requestUrl.pathname.startsWith("/api/")) {
      if (!isOriginAllowed(req)) {
        sendJson(res, 403, { error: "origin_not_allowed", message: "Request origin is not allowed." });
        return;
      }
      await handleApi(req, res, requestUrl);
      return;
    }

    serveStaticFile(req, res, requestUrl.pathname);
  } catch (error) {
    console.error("Unhandled request error:", error);
    sendJson(res, 500, {
      error: "server_error",
      message: "Something went wrong while processing the request.",
    });
  }
});

server.listen(PORT, () => {
  console.log(`StudySpark server running at http://localhost:${PORT}`);
  console.log(`SQLite database: ${dbFile}`);
});

async function handleApi(req, res, requestUrl) {
  const { pathname } = requestUrl;

  if (req.method === "GET" && pathname === "/api/health") {
    sendJson(res, 200, {
      ok: true,
      app: "StudySpark",
      hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
    });
    return;
  }

  if (req.method === "GET" && pathname === "/api/config") {
    sendJson(res, 200, {
      hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
      apiReady: Boolean(process.env.OPENAI_API_KEY),
      foundationReady: true,
      googleReady: isGoogleOAuthConfigured(),
    });
    return;
  }

  if (req.method === "GET" && pathname === "/api/auth/google") {
    if (!isGoogleOAuthConfigured()) {
      sendText(res, 503, "Google sign-in is not configured.", "text/plain; charset=utf-8", req);
      return;
    }

    const oauthClient = createGoogleOAuthClient();
    const stateToken = createOAuthStateToken();
    const redirectUrl = oauthClient.generateAuthUrl({
      access_type: "offline",
      scope: ["openid", "email", "profile"],
      prompt: "select_account",
      state: stateToken,
    });

    res.writeHead(302, {
      ...securityHeaders(req),
      "Set-Cookie": `studyspark_oauth_state=${stateToken}; HttpOnly; SameSite=Lax; Path=/; Max-Age=600`,
      Location: redirectUrl,
    });
    res.end();
    return;
  }

  if (req.method === "GET" && pathname === "/api/auth/google/callback") {
    await handleGoogleCallback(req, res, requestUrl);
    return;
  }

  if (isRateLimited(req, res, pathname)) {
    return;
  }

  if (requiresVerifiedEmail(pathname)) {
    const state = readState();
    const user = requireUser(req, state);
    if (user && !user.emailVerified) {
      sendJson(res, 403, {
        error: "email_not_verified",
        message: "Please verify your email first.",
      });
      return;
    }
  }

  if (req.method === "POST" && pathname === "/api/auth/register") {
    try {
      const payload = await readJsonBody(req);
      const state = readState();
      const email = requireEmail(payload, "email");
      const password = requirePassword(payload, "password");
      const fullName = requireString(payload, "fullName", { min: 2, max: 80 });

      if (!fullName || !isValidEmail(email) || !password) {
        sendJson(res, 400, { error: "validation_error", message: "Missing required registration fields." });
        return;
      }

      if (!isStrongPassword(password)) {
        sendJson(res, 400, {
          error: "weak_password",
          message: "Password must be at least 8 characters and include at least one letter and one number.",
        });
        return;
      }

      const existingUser = state.users.find((user) => normalizeEmail(user.email) === email);
      if (existingUser) {
        sendJson(res, 409, { error: "email_exists", message: "Email already exists." });
        return;
      }

      const user = {
        id: uid("user"),
        fullName,
        email,
        passwordHash: hashPassword(password),
        provider: "email",
        googleId: "",
        avatarUrl: "",
        academicLevel: "",
        preferredLanguage: "",
        studyGoal: "",
        dailyAvailableHours: "",
        emailVerified: false,
        createdDate: new Date().toISOString(),
      };

      const session = createSession(state, user.id);
      state.users.push(user);
      writeState(state);
      // TODO: Re-enable email verification for production.
      const verificationDelivery = { delivered: false, mode: "disabled", devCode: "" };

      // TODO: Re-enable email verification for production.
      sendJson(res, 201, {
        token: session.token,
        user: sanitizeUser(user),
        requiresVerification: false,
        message: "Account created successfully.",
        emailDelivery: verificationDelivery.mode,
        ...(canExposeDevCodes(verificationDelivery) ? { devVerificationCode: verificationDelivery.devCode } : {}),
      });
      return;
    } catch (error) {
      console.error("Register failed:", error);
      sendJson(res, 500, { error: "registration_failed", message: "Registration failed." });
      return;
    }
  }

  if (req.method === "POST" && pathname === "/api/auth/login") {
    const payload = await readJsonBody(req);
    const state = readState();
    const email = requireEmail(payload, "email");
    const password = requirePassword(payload, "password");
    const user = state.users.find((entry) => normalizeEmail(entry.email) === email);
    const passwordMatches = user ? verifyPassword(password, user.passwordHash) : false;
    if (!IS_PRODUCTION) {
      console.log("Login attempt:", email);
      console.log("User found:", Boolean(user));
      console.log("Password match:", Boolean(passwordMatches));
    }

    if (!user || !passwordMatches) {
      sendJson(res, 401, { error: "invalid_credentials", message: "Invalid email or password." });
      return;
    }

    const session = createSession(state, user.id);
    writeState(state);
    // TODO: Re-enable email verification for production.
    const verificationDelivery = null;

    // TODO: Re-enable email verification for production.
    sendJson(res, 200, {
      token: session.token,
      user: sanitizeUser(user),
      requiresVerification: false,
      message: "Welcome back.",
      emailDelivery: verificationDelivery?.mode || null,
      ...(canExposeDevCodes(verificationDelivery) ? { devVerificationCode: verificationDelivery.devCode } : {}),
    });
    return;
  }

  if (!IS_PRODUCTION && req.method === "POST" && pathname === "/api/dev/reset-users") {
    const state = readState();
    state.users = [];
    state.sessions = [];
    writeState(state);
    sendJson(res, 200, { ok: true, message: "Development users and sessions were cleared." });
    return;
  }

  if (req.method === "POST" && pathname === "/api/auth/logout") {
    const state = readState();
    const sessionToken = getSessionToken(req);
    const tokenHash = hashSessionToken(sessionToken);
    state.sessions = state.sessions.filter((session) => session.tokenHash !== tokenHash);
    writeState(state);
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "POST" && pathname === "/api/auth/verify-email") {
    const state = readState();
    const user = requireUser(req, state);
    if (!user) {
      sendJson(res, 401, { error: "unauthorized", message: "Please log in first." });
      return;
    }

    const payload = await readJsonBody(req);
    const code = normalizeSixDigitCode(payload.code);
    const verification = latestEmailVerificationCode(user.id);
    if (!verification || !code || new Date(verification.expiresDate) < new Date() || verification.attempts >= 5) {
      sendJson(res, 400, { error: "invalid_code", message: "Invalid or expired verification code." });
      return;
    }

    verification.attempts += 1;
    if (!verifyShortCode(code, verification.codeHash)) {
      updateEmailVerificationCode(verification);
      sendJson(res, 400, { error: "invalid_code", message: "Invalid or expired verification code." });
      return;
    }

    verification.used = true;
    updateEmailVerificationCode(verification);
    user.emailVerified = true;
    writeState(state);

    sendJson(res, 200, {
      user: sanitizeUser(user),
      message: "Email verified successfully.",
    });
    return;
  }

  if (req.method === "POST" && pathname === "/api/auth/resend-verification") {
    const state = readState();
    const user = requireUser(req, state);
    if (!user) {
      sendJson(res, 401, { error: "unauthorized", message: "Please log in first." });
      return;
    }

    if (user.emailVerified) {
      sendJson(res, 200, { message: "Your email is already verified." });
      return;
    }

    const latest = latestEmailVerificationCode(user.id);
    if (latest && latest.resendCount >= 3 && Date.now() - new Date(latest.createdDate).getTime() < 10 * 60 * 1000) {
      sendJson(res, 429, { error: "too_many_requests", message: "Please wait before requesting another code." });
      return;
    }

    if (latest) {
      latest.resendCount += 1;
      latest.used = true;
      updateEmailVerificationCode(latest);
    }

    const verificationDelivery = await sendVerificationCode(user);
    sendJson(res, 200, {
      message: verificationDelivery.delivered
        ? "A new verification code was sent."
        : "Local mode: use the new verification code shown on this screen.",
      emailDelivery: verificationDelivery.mode,
      ...(canExposeDevCodes(verificationDelivery) ? { devVerificationCode: verificationDelivery.devCode } : {}),
    });
    return;
  }

  if (req.method === "POST" && pathname === "/api/auth/forgot-password") {
    const payload = await readJsonBody(req);
    const state = readState();
    const email = requireEmail(payload, "email");
    if (!email) {
      sendJson(res, 400, { error: "validation_error", message: "A valid email is required." }, req);
      return;
    }
    const user = state.users.find((entry) => entry.email === email);

    let resetDelivery = null;
    if (user) {
      resetDelivery = await sendPasswordResetCode(user);
    }

    sendJson(res, 200, {
      message: "If this email exists, a reset code was sent.",
      ...(canExposeDevCodes(resetDelivery) ? { devResetCode: resetDelivery.devCode } : {}),
    });
    return;
  }

  if (req.method === "POST" && pathname === "/api/auth/reset-password") {
    const payload = await readJsonBody(req);
    const state = readState();
    const email = requireEmail(payload, "email");
    const code = normalizeSixDigitCode(payload.code);
    const newPassword = requirePassword(payload, "password");
    const user = state.users.find((entry) => entry.email === email);

    if (!isStrongPassword(newPassword)) {
      sendJson(res, 400, {
        error: "weak_password",
        message: "Password must be at least 8 characters and include at least one letter and one number.",
      });
      return;
    }

    if (!user) {
      sendJson(res, 400, { error: "invalid_code", message: "Invalid or expired reset code." });
      return;
    }

    const resetCode = latestPasswordResetCode(user.id);
    if (!resetCode || !code || new Date(resetCode.expiresDate) < new Date() || resetCode.attempts >= 5) {
      sendJson(res, 400, { error: "invalid_code", message: "Invalid or expired reset code." });
      return;
    }

    resetCode.attempts += 1;
    if (!verifyShortCode(code, resetCode.codeHash)) {
      updatePasswordResetCode(resetCode);
      sendJson(res, 400, { error: "invalid_code", message: "Invalid or expired reset code." });
      return;
    }

    resetCode.used = true;
    updatePasswordResetCode(resetCode);
    user.passwordHash = hashPassword(newPassword);
    user.provider = user.provider || "email";
    state.sessions = state.sessions.filter((session) => session.userId !== user.id);
    invalidateUserSessions(user.id);
    writeState(state);

    sendJson(res, 200, { message: "Password updated. Please log in again." });
    return;
  }

  if (req.method === "GET" && pathname === "/api/bootstrap") {
    const state = readState();
    const user = requireUser(req, state);
    if (!user) {
      sendJson(res, 401, { error: "unauthorized", message: "Please log in first." });
      return;
    }

    sendJson(res, 200, buildBootstrapPayload(state, user));
    return;
  }

  if (req.method === "PUT" && pathname === "/api/onboarding") {
    const state = readState();
    const user = requireUser(req, state);
    if (!user) {
      sendJson(res, 401, { error: "unauthorized", message: "Please log in first." });
      return;
    }

    const payload = await readJsonBody(req);
    user.academicLevel = String(payload.academicLevel || "").trim();
    user.preferredLanguage = String(payload.preferredLanguage || "").trim();
    user.studyGoal = String(payload.studyGoal || "").trim();
    user.dailyAvailableHours = String(payload.dailyAvailableHours || "").trim();
    writeState(state);

    sendJson(res, 200, { user: sanitizeUser(user) });
    return;
  }

  if (req.method === "GET" && pathname === "/api/subjects") {
    const state = readState();
    const user = requireUser(req, state);
    if (!user) {
      sendJson(res, 401, { error: "unauthorized", message: "Please log in first." });
      return;
    }

    sendJson(res, 200, {
      subjects: getUserSubjects(state, user.email),
    });
    return;
  }

  if (req.method === "POST" && pathname === "/api/subjects") {
    const state = readState();
    const user = requireUser(req, state);
    if (!user) {
      sendJson(res, 401, { error: "unauthorized", message: "Please log in first." });
      return;
    }

    const payload = await readJsonBody(req);
    const subject = {
      id: uid("subject"),
      userEmail: user.email,
      subjectName: String(payload.subjectName || "").trim(),
      examDate: String(payload.examDate || "").trim(),
      difficulty: String(payload.difficulty || "").trim(),
      priority: String(payload.priority || "").trim(),
      dailyHours: String(payload.dailyHours || "").trim(),
      notes: String(payload.notes || "").trim(),
      createdDate: new Date().toISOString(),
    };

    if (!subject.subjectName || !subject.examDate) {
      sendJson(res, 400, { error: "validation_error", message: "Subject name and exam date are required." });
      return;
    }

    state.subjects.push(subject);
    writeState(state);
    sendJson(res, 201, { subject });
    return;
  }

  if (req.method === "PUT" && pathname.startsWith("/api/subjects/")) {
    const state = readState();
    const user = requireUser(req, state);
    if (!user) {
      sendJson(res, 401, { error: "unauthorized", message: "Please log in first." });
      return;
    }

    const subjectId = pathname.split("/").pop();
    const subject = state.subjects.find((entry) => entry.id === subjectId && entry.userEmail === user.email);
    if (!subject) {
      sendJson(res, 404, { error: "not_found", message: "Subject not found." });
      return;
    }

    const payload = await readJsonBody(req);
    subject.subjectName = String(payload.subjectName || subject.subjectName).trim();
    subject.examDate = String(payload.examDate || subject.examDate).trim();
    subject.difficulty = String(payload.difficulty || subject.difficulty).trim();
    subject.priority = String(payload.priority || subject.priority).trim();
    subject.dailyHours = String(payload.dailyHours || subject.dailyHours).trim();
    subject.notes = String(payload.notes || subject.notes).trim();
    writeState(state);

    sendJson(res, 200, { subject });
    return;
  }

  if (req.method === "DELETE" && pathname.startsWith("/api/subjects/")) {
    const state = readState();
    const user = requireUser(req, state);
    if (!user) {
      sendJson(res, 401, { error: "unauthorized", message: "Please log in first." });
      return;
    }

    const subjectId = pathname.split("/").pop();
    const initialLength = state.subjects.length;
    state.subjects = state.subjects.filter((entry) => !(entry.id === subjectId && entry.userEmail === user.email));

    if (state.subjects.length === initialLength) {
      sendJson(res, 404, { error: "not_found", message: "Subject not found." });
      return;
    }

    writeState(state);
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "GET" && pathname === "/api/foundation/status") {
    const state = readState();
    sendJson(res, 200, {
      ready: true,
      users: state.users.length,
      sessions: state.sessions.length,
      storageFile: dbFile,
    });
    return;
  }

  if (req.method === "POST" && pathname === "/api/plan/generate") {
    const state = readState();
    const user = requireUser(req, state);
    if (!user) {
      sendJson(res, 401, { error: "unauthorized", message: "Please log in first." });
      return;
    }

    const subjects = getUserSubjects(state, user.email);
    if (!subjects.length) {
      sendJson(res, 400, { error: "missing_subjects", message: "Add at least one subject before generating a plan." });
      return;
    }

    const fallbackPlan = createLocalStudyPlan(user, subjects);
    let responsePayload = {
      source: "local",
      ...fallbackPlan,
    };

    if (process.env.OPENAI_API_KEY) {
      try {
        const aiResult = await generateAIStudyPlan(user, subjects, fallbackPlan.plan);
        responsePayload = {
          source: "openai",
          plan: {
            ...fallbackPlan.plan,
            aiSummary: aiResult.aiSummary || fallbackPlan.plan.aiSummary,
            weeklyPlan: Array.isArray(aiResult.weeklyPlan) && aiResult.weeklyPlan.length ? normalizeWeeklyPlan(aiResult.weeklyPlan, fallbackPlan.plan.weeklyPlan) : fallbackPlan.plan.weeklyPlan,
            studyTips: Array.isArray(aiResult.studyTips) && aiResult.studyTips.length ? aiResult.studyTips : fallbackPlan.plan.studyTips,
            motivationMessage: aiResult.motivationMessage || fallbackPlan.plan.motivationMessage,
            promptLog: {
              ...fallbackPlan.plan.promptLog,
              openAIModel: aiResult.model || process.env.OPENAI_MODEL || "gpt-5.4-mini",
            },
          },
          tasks: normalizeTodayTasks(
            Array.isArray(aiResult.todayTasks) && aiResult.todayTasks.length ? aiResult.todayTasks : fallbackPlan.tasks,
            user.email,
            fallbackPlan.plan.id
          ),
        };
      } catch (error) {
        responsePayload.warning = `OpenAI plan generation failed. Local planner fallback was used instead. ${error.message}`;
      }
    }

    state.plans.push(responsePayload.plan);
    state.tasks.push(...responsePayload.tasks);
    writeState(state);

    sendJson(res, 200, responsePayload);
    return;
  }

  if (req.method === "POST" && pathname === "/api/plan/save") {
    const state = readState();
    const user = requireUser(req, state);
    if (!user) {
      sendJson(res, 401, { error: "unauthorized", message: "Please log in first." });
      return;
    }

    const payload = await readJsonBody(req);
    const planId = uid("plan");
    const tasks = normalizeTodayTasks(payload.todayTasks || [], user.email, planId);
    const plan = {
      id: planId,
      userEmail: user.email,
      planTitle: payload.planTitle || "Personalized AI Study Plan",
      aiSummary: payload.aiSummary || "",
      weeklyPlan: normalizeWeeklyPlan(payload.weeklyPlan || [], payload.weeklyPlan || []),
      todayTasks: tasks,
      studyTips: Array.isArray(payload.studyTips) ? payload.studyTips : [],
      motivationMessage: payload.motivationMessage || "",
      promptLog: {
        source: payload.source || "client",
        model: payload.model || null,
      },
      createdDate: new Date().toISOString(),
      saved: true,
    };

    state.plans.push(plan);
    state.tasks.push(...tasks);
    writeState(state);
    sendJson(res, 200, { plan, tasks });
    return;
  }

  if (req.method === "POST" && pathname === "/api/plan/improve") {
    const state = readState();
    const user = requireUser(req, state);
    if (!user) {
      sendJson(res, 401, { error: "unauthorized", message: "Please log in first." });
      return;
    }

    const payload = await readJsonBody(req);
    const currentPlan = payload.currentPlan || state.plans.filter((plan) => plan.userEmail === user.email).sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate))[0];
    if (!currentPlan) {
      sendJson(res, 400, { error: "missing_plan", message: "Generate a plan before improving it." });
      return;
    }

    const subjects = getUserSubjects(state, user.email);
    if (!subjects.length) {
      sendJson(res, 400, { error: "missing_subjects", message: "Add at least one subject before improving a plan." });
      return;
    }

    const fallbackPlan = createLocalStudyPlan(user, subjects);
    const context = {
      tasks: payload.tasks || state.tasks.filter((task) => task.userEmail === user.email),
      calendarBlocks: payload.calendarBlocks || (state.calendarBlocks || []).filter((block) => block.userEmail === user.email),
      metrics: payload.metrics || null,
      profile: payload.profile || sanitizeUser(user),
    };
    let improvedPayload = {
      source: "local",
      plan: {
        ...fallbackPlan.plan,
        aiSummary: `Improved version: ${currentPlan.aiSummary || fallbackPlan.plan.aiSummary}`,
      },
      tasks: fallbackPlan.tasks,
    };

    if (process.env.OPENAI_API_KEY) {
      try {
        const aiResult = await generateImprovedAIStudyPlan(user, subjects, currentPlan, fallbackPlan.plan, context);
        improvedPayload = {
          source: "openai",
          plan: {
            ...fallbackPlan.plan,
            aiSummary: aiResult.aiSummary || currentPlan.aiSummary || fallbackPlan.plan.aiSummary,
            weeklyPlan:
              Array.isArray(aiResult.weeklyPlan) && aiResult.weeklyPlan.length
                ? normalizeWeeklyPlan(aiResult.weeklyPlan, currentPlan.weeklyPlan || fallbackPlan.plan.weeklyPlan)
                : currentPlan.weeklyPlan || fallbackPlan.plan.weeklyPlan,
            studyTips: Array.isArray(aiResult.studyTips) && aiResult.studyTips.length ? aiResult.studyTips : currentPlan.studyTips || fallbackPlan.plan.studyTips,
            motivationMessage: aiResult.motivationMessage || currentPlan.motivationMessage || fallbackPlan.plan.motivationMessage,
            promptLog: {
              ...(currentPlan.promptLog || fallbackPlan.plan.promptLog || {}),
              source: "openai-improve",
              openAIModel: aiResult.model || process.env.OPENAI_MODEL || "gpt-5.4-mini",
            },
          },
          tasks: normalizeTodayTasks(
            Array.isArray(aiResult.todayTasks) && aiResult.todayTasks.length ? aiResult.todayTasks : currentPlan.todayTasks || fallbackPlan.tasks,
            user.email,
            fallbackPlan.plan.id
          ),
        };
      } catch (error) {
        improvedPayload.warning = `Plan improvement fell back to local optimization. ${error.message}`;
      }
    }

    // Preview-only endpoint: client confirms before overwriting/saving.
    sendJson(res, 200, improvedPayload);
    return;
  }

  if (req.method === "PATCH" && pathname.startsWith("/api/tasks/")) {
    const state = readState();
    const user = requireUser(req, state);
    if (!user) {
      sendJson(res, 401, { error: "unauthorized", message: "Please log in first." });
      return;
    }

    const taskId = pathname.split("/").pop();
    const task = state.tasks.find((entry) => entry.id === taskId && entry.userEmail === user.email);
    if (!task) {
      sendJson(res, 404, { error: "not_found", message: "Task not found." });
      return;
    }

    const payload = await readJsonBody(req);
    task.status = payload.status === "Done" ? "Done" : "Not done";
    writeState(state);
    sendJson(res, 200, { task });
    return;
  }

  if (req.method === "POST" && pathname === "/api/calendar-blocks") {
    const state = readState();
    const user = requireUser(req, state);
    if (!user) {
      sendJson(res, 401, { error: "unauthorized", message: "Please log in first." });
      return;
    }

    const payload = await readJsonBody(req);
    const block = {
      id: uid("block"),
      userEmail: user.email,
      title: requireString(payload, "title", { min: 1, max: 120 }),
      date: requireString(payload, "date", { min: 10, max: 10, pattern: /^\d{4}-\d{2}-\d{2}$/ }),
      startTime: requireString(payload, "startTime", { min: 5, max: 5, pattern: /^\d{2}:\d{2}$/ }),
      endTime: requireString(payload, "endTime", { min: 5, max: 5, pattern: /^\d{2}:\d{2}$/ }),
      category: requireString(payload, "category", { min: 1, max: 50 }) || "Busy block",
      notes: requireString(payload, "notes", { min: 0, max: 400 }),
      createdDate: new Date().toISOString(),
    };

    if (!block.title || !block.date || !block.startTime || !block.endTime) {
      sendJson(res, 400, { error: "validation_error", message: "Calendar title, date, start time, and end time are required." });
      return;
    }

    state.calendarBlocks = state.calendarBlocks || [];
    state.calendarBlocks.push(block);
    writeState(state);
    sendJson(res, 201, { block });
    return;
  }

  if (req.method === "DELETE" && pathname.startsWith("/api/calendar-blocks/")) {
    const state = readState();
    const user = requireUser(req, state);
    if (!user) {
      sendJson(res, 401, { error: "unauthorized", message: "Please log in first." });
      return;
    }

    const blockId = pathname.split("/").pop();
    const before = (state.calendarBlocks || []).length;
    state.calendarBlocks = (state.calendarBlocks || []).filter((block) => !(block.id === blockId && block.userEmail === user.email));
    if (state.calendarBlocks.length === before) {
      sendJson(res, 404, { error: "not_found", message: "Calendar block not found." });
      return;
    }

    writeState(state);
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "POST" && pathname === "/api/rewards") {
    const state = readState();
    const user = requireUser(req, state);
    if (!user) {
      sendJson(res, 401, { error: "unauthorized", message: "Please log in first." });
      return;
    }

    const payload = await readJsonBody(req);
    const activityKey = String(payload.activityKey || "").trim();
    if (!activityKey) {
      sendJson(res, 400, { error: "validation_error", message: "Reward activity key is required." });
      return;
    }

    state.rewardHistory = state.rewardHistory || [];
    const exists = state.rewardHistory.some((reward) => reward.userEmail === user.email && reward.activityKey === activityKey);
    if (!exists) {
      state.rewardHistory.push({
        id: uid("reward"),
        userEmail: user.email,
        activityKey,
        activityType: String(payload.activityType || "activity").trim(),
        xp: Number(payload.xp || 0),
        coins: Number(payload.coins || 0),
        createdDate: new Date().toISOString(),
      });
      writeState(state);
    }

    sendJson(res, 200, { rewardAdded: !exists });
    return;
  }

  if (req.method === "POST" && pathname === "/api/friends") {
    const state = readState();
    const user = requireUser(req, state);
    if (!user) {
      sendJson(res, 401, { error: "unauthorized", message: "Please log in first." });
      return;
    }

    const payload = await readJsonBody(req);
    const friendValue = String(payload.friendValue || payload.name || payload.email || "").trim();
    if (!friendValue) {
      sendJson(res, 400, { error: "validation_error", message: "Friend name or email is required." });
      return;
    }

    const friend = {
      id: uid("friend"),
      userEmail: user.email,
      friendValue,
      createdDate: new Date().toISOString(),
    };
    state.friends = state.friends || [];
    state.friends.push(friend);
    writeState(state);
    sendJson(res, 201, { friend });
    return;
  }

  if (req.method === "POST" && pathname.startsWith("/api/friends/") && pathname.endsWith("/messages")) {
    const state = readState();
    const user = requireUser(req, state);
    if (!user) {
      sendJson(res, 401, { error: "unauthorized", message: "Please log in first." });
      return;
    }

    const friendId = pathname.split("/")[3];
    const friend = (state.friends || []).find((entry) => entry.id === friendId && entry.userEmail === user.email);
    if (!friend) {
      sendJson(res, 404, { error: "not_found", message: "Friend not found." });
      return;
    }

    const payload = await readJsonBody(req);
    const messageText = String(payload.messageText || "").trim();
    if (!messageText) {
      sendJson(res, 400, { error: "validation_error", message: "Message is required." });
      return;
    }

    const message = {
      id: uid("friend_msg"),
      userEmail: user.email,
      friendId,
      messageText,
      createdDate: new Date().toISOString(),
    };
    state.friendMessages = state.friendMessages || [];
    state.friendMessages.push(message);
    writeState(state);
    sendJson(res, 201, { message });
    return;
  }

  if (req.method === "POST" && pathname === "/api/chat") {
    const state = readState();
    const user = requireUser(req, state);
    if (!user) {
      sendJson(res, 401, { error: "unauthorized", message: "Please log in first." });
      return;
    }

    const payload = await readJsonBody(req);
    const message = String(payload.message || "").trim();
    if (!message) {
      sendJson(res, 400, { error: "validation_error", message: "Message is required." });
      return;
    }

    const userHistory = state.chatHistory.filter((entry) => entry.userEmail === user.email).slice(-8);
    const subjects = getUserSubjects(state, user.email);
    let reply = buildLocalCoachReply(user, subjects, message);
    let source = "local";
    let model = null;

    if (process.env.OPENAI_API_KEY) {
      try {
        const aiReply = await getAIChatReply(user, subjects, userHistory, message);
        reply = aiReply.text;
        source = "openai";
        model = aiReply.model;
      } catch (error) {
        reply = `${reply}\n\nNote: OpenAI was unavailable just now, so this answer used the local study coach fallback.`;
      }
    }

    const now = new Date().toISOString();
    const chatPair = [
      {
        id: uid("chat"),
        userEmail: user.email,
        role: "user",
        message,
        createdDate: now,
      },
      {
        id: uid("chat"),
        userEmail: user.email,
        role: "assistant",
        message: reply,
        createdDate: now,
        source,
        model,
      },
    ];

    state.chatHistory.push(...chatPair);
    writeState(state);
    sendJson(res, 200, {
      reply,
      source,
      model,
      messages: state.chatHistory.filter((entry) => entry.userEmail === user.email).slice(-12),
    });
    return;
  }

  if (req.method === "POST" && pathname === "/api/chat/save") {
    const state = readState();
    const user = requireUser(req, state);
    if (!user) {
      sendJson(res, 401, { error: "unauthorized", message: "Please log in first." });
      return;
    }

    const payload = await readJsonBody(req);
    const userMessage = String(payload.userMessage || "").trim();
    const assistantMessage = String(payload.assistantMessage || "").trim();
    if (!userMessage || !assistantMessage) {
      sendJson(res, 400, { error: "validation_error", message: "Both chat messages are required." });
      return;
    }

    const now = new Date().toISOString();
    const chatPair = [
      {
        id: uid("chat"),
        userEmail: user.email,
        role: "user",
        message: userMessage,
        createdDate: now,
      },
      {
        id: uid("chat"),
        userEmail: user.email,
        role: "assistant",
        message: assistantMessage,
        createdDate: now,
        source: payload.source || "client",
        model: payload.model || null,
      },
    ];

    state.chatHistory.push(...chatPair);
    writeState(state);
    sendJson(res, 200, { messages: state.chatHistory.filter((entry) => entry.userEmail === user.email).slice(-12) });
    return;
  }

  sendJson(res, 404, { error: "not_found", message: "Route not found." });
}

function serveStaticFile(req, res, pathname) {
  const requestedFile = pathname === "/" ? "index.html" : pathname.slice(1);

  if (requestedFile.startsWith("assets/")) {
    serveAssetFile(res, requestedFile);
    return;
  }

  if (!PUBLIC_FILES.has(requestedFile)) {
    sendText(res, 404, "Not found", "text/plain; charset=utf-8");
    return;
  }

  const filePath = path.join(ROOT_DIR, requestedFile);
  if (!fs.existsSync(filePath)) {
    sendText(res, 404, "Not found", "text/plain; charset=utf-8");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeType =
    ext === ".html"
      ? "text/html; charset=utf-8"
      : ext === ".css"
        ? "text/css; charset=utf-8"
        : ext === ".js"
          ? "application/javascript; charset=utf-8"
          : "text/plain; charset=utf-8";

  res.writeHead(200, {
    ...securityHeaders(),
    "Content-Type": mimeType,
  });
  fs.createReadStream(filePath).pipe(res);
}

function serveAssetFile(res, requestedFile) {
  const safeRelativePath = path.normalize(requestedFile);
  if (safeRelativePath.includes("..")) {
    sendText(res, 404, "Not found", "text/plain; charset=utf-8");
    return;
  }

  const filePath = path.join(ROOT_DIR, safeRelativePath);
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = ASSET_EXTENSIONS.get(ext);
  if (!mimeType || !fs.existsSync(filePath)) {
    sendText(res, 404, "Not found", "text/plain; charset=utf-8");
    return;
  }

  res.writeHead(200, {
    ...securityHeaders(),
    "Content-Type": mimeType,
  });
  fs.createReadStream(filePath).pipe(res);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_REQUEST_BODY_BYTES) {
        reject(new Error("Request body too large."));
        req.destroy();
        return;
      }
      body += chunk;
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        const parsed = JSON.parse(body);
        if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
          reject(new Error("Invalid JSON body."));
          return;
        }
        resolve(parsed);
      } catch (error) {
        reject(new Error("Invalid JSON body."));
      }
    });
    req.on("error", reject);
  });
}

function securityHeadersBase() {
  return {
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,X-Session-Token",
    "Vary": "Origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  };
}

function securityHeadersForRequest(req) {
  const headers = securityHeadersBase();
  const origin = normalizeOrigin(req?.headers?.origin);
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  } else if (!origin) {
    headers["Access-Control-Allow-Origin"] = "http://localhost:3000";
  }
  return headers;
}

function securityHeaders(req) {
  return securityHeadersForRequest(req);
}

function isOriginAllowed(req) {
  const origin = normalizeOrigin(req?.headers?.origin);
  if (!origin) return true;
  return ALLOWED_ORIGINS.has(origin);
}

function normalizeOrigin(origin) {
  const raw = String(origin || "").trim();
  if (!raw) return "";
  try {
    const parsed = new URL(raw);
    return parsed.origin;
  } catch {
    return "";
  }
}

function requireString(payload, key, { min = 1, max = 200, pattern } = {}) {
  const value = String(payload?.[key] || "").trim();
  if (value.length < min || value.length > max) return "";
  if (pattern && !pattern.test(value)) return "";
  return value;
}

function requireEmail(payload, key = "email") {
  const email = normalizeEmail(payload?.[key]);
  return isValidEmail(email) ? email : "";
}

function requirePassword(payload, key = "password") {
  const password = String(payload?.[key] || "");
  if (password.length < 8 || password.length > 256) return "";
  return password;
}

function sendJson(res, statusCode, payload, req) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(statusCode, {
    ...securityHeadersForRequest(req),
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function sendText(res, statusCode, text, contentType, req) {
  res.writeHead(statusCode, {
    ...securityHeadersForRequest(req),
    "Content-Type": contentType,
    "Content-Length": Buffer.byteLength(text),
  });
  res.end(text);
}

function applySecurityHeaders(res, req) {
  for (const [key, value] of Object.entries(securityHeadersForRequest(req))) {
    res.setHeader(key, value);
  }
}

const rateLimitBuckets = new Map();

function isRateLimited(req, res, pathname) {
  if (pathname.startsWith("/api/auth/")) {
    return enforceRateLimit(req, res, `auth:${pathname}`, 12, 15 * 60 * 1000);
  }

  if (pathname === "/api/chat" || pathname === "/api/plan/generate" || pathname === "/api/plan/improve") {
    return enforceRateLimit(req, res, `ai:${pathname}`, 20, 15 * 60 * 1000);
  }

  return false;
}

function enforceRateLimit(req, res, bucketName, maxRequests, windowMs) {
  const ip = req.socket.remoteAddress || "local";
  const key = `${bucketName}:${ip}`;
  const now = Date.now();
  const current = rateLimitBuckets.get(key) || { count: 0, resetAt: now + windowMs };

  if (current.resetAt < now) {
    current.count = 0;
    current.resetAt = now + windowMs;
  }

  current.count += 1;
  rateLimitBuckets.set(key, current);

  if (current.count > maxRequests) {
    sendJson(res, 429, {
      error: "too_many_requests",
      message: "Too many attempts. Please wait a little and try again.",
    });
    return true;
  }

  return false;
}

function requiresVerifiedEmail(pathname) {
  // TODO: Re-enable email verification for production.
  return false;

  /*
  const publicPaths = new Set([
    "/api/health",
    "/api/config",
    "/api/auth/register",
    "/api/auth/login",
    "/api/auth/logout",
    "/api/auth/verify-email",
    "/api/auth/resend-verification",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
  ]);

  return pathname.startsWith("/api/") && !publicPaths.has(pathname);
  */
}

function uid(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ""));
}

function isStrongPassword(password) {
  return String(password || "").length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
}

function normalizeSixDigitCode(value) {
  const code = String(value || "").replace(/\D/g, "");
  return code.length === 6 ? code : "";
}

function hashPassword(password) {
  return `bcrypt:${bcrypt.hashSync(String(password), 12)}`;
}

function verifyPassword(password, storedHash) {
  if (String(storedHash || "").startsWith("bcrypt:")) {
    return bcrypt.compareSync(String(password), String(storedHash).slice("bcrypt:".length));
  }

  const [salt, originalHash] = String(storedHash || "").split(":");
  if (!salt || !originalHash) {
    return false;
  }

  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  const hashBuffer = Buffer.from(hash, "hex");
  const originalBuffer = Buffer.from(originalHash, "hex");
  return hashBuffer.length === originalBuffer.length && crypto.timingSafeEqual(hashBuffer, originalBuffer);
}

function hashShortCode(code) {
  return `bcrypt:${bcrypt.hashSync(String(code), 12)}`;
}

function verifyShortCode(code, storedHash) {
  if (String(storedHash || "").startsWith("bcrypt:")) {
    return bcrypt.compareSync(String(code), String(storedHash).slice("bcrypt:".length));
  }

  const [salt, originalHash] = String(storedHash || "").split(":");
  if (!salt || !originalHash) return false;
  const hash = crypto.scryptSync(String(code), salt, 32).toString("hex");
  const hashBuffer = Buffer.from(hash, "hex");
  const originalBuffer = Buffer.from(originalHash, "hex");
  return hashBuffer.length === originalBuffer.length && crypto.timingSafeEqual(hashBuffer, originalBuffer);
}

function createSixDigitCode() {
  return String(crypto.randomInt(100000, 1000000));
}

function isGoogleOAuthConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REDIRECT_URI);
}

function createGoogleOAuthClient() {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

function createOAuthStateToken() {
  const secret = process.env.SESSION_SECRET || "studyspark-local-dev";
  const nonce = crypto.randomBytes(18).toString("hex");
  const signature = crypto.createHmac("sha256", secret).update(nonce).digest("hex");
  return `${nonce}.${signature}`;
}

function verifyOAuthStateToken(value) {
  const [nonce, signature] = String(value || "").split(".");
  if (!nonce || !signature) return false;
  const secret = process.env.SESSION_SECRET || "studyspark-local-dev";
  const expected = crypto.createHmac("sha256", secret).update(nonce).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(signature, "hex");
  return expectedBuffer.length === actualBuffer.length && crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

function getCookieValue(req, name) {
  const cookies = String(req.headers.cookie || "").split(";").map((part) => part.trim());
  const cookie = cookies.find((part) => part.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : "";
}

async function handleGoogleCallback(req, res, requestUrl) {
  const code = requestUrl.searchParams.get("code") || "";
  const state = requestUrl.searchParams.get("state") || "";
  const cookieState = getCookieValue(req, "studyspark_oauth_state");

  if (!code || !state || state !== cookieState || !verifyOAuthStateToken(state)) {
    redirectWithAuthError(res, "Google sign-in could not be verified.");
    return;
  }

  try {
    const oauthClient = createGoogleOAuthClient();
    const { tokens } = await oauthClient.getToken(code);
    if (!tokens.id_token) {
      redirectWithAuthError(res, "Google did not return an identity token.");
      return;
    }

    const ticket = await oauthClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const profile = ticket.getPayload();
    const email = normalizeEmail(profile?.email);
    if (!email || !profile?.sub) {
      redirectWithAuthError(res, "Google account did not include a verified email.");
      return;
    }

    const stateData = readState();
    let user = stateData.users.find((entry) => entry.email === email);
    if (user) {
      user.provider = user.provider || "google";
      user.googleId = user.googleId || profile.sub;
      user.avatarUrl = profile.picture || user.avatarUrl || "";
      user.emailVerified = true;
      user.fullName = user.fullName || profile.name || email;
    } else {
      user = {
        id: uid("user"),
        fullName: profile.name || email,
        email,
        passwordHash: "",
        provider: "google",
        googleId: profile.sub,
        avatarUrl: profile.picture || "",
        academicLevel: "",
        preferredLanguage: "",
        studyGoal: "",
        dailyAvailableHours: "",
        emailVerified: true,
        createdDate: new Date().toISOString(),
      };
      stateData.users.push(user);
    }

    const session = createSession(stateData, user.id);
    writeState(stateData);
    res.writeHead(302, {
      ...securityHeaders(req),
      "Set-Cookie": "studyspark_oauth_state=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0",
      Location: `${APP_BASE_URL}/?token=${encodeURIComponent(session.token)}`,
    });
    res.end();
  } catch (error) {
    console.error("Google OAuth error:", error);
    redirectWithAuthError(res, "Google sign-in failed. Please try again.");
  }
}

function redirectWithAuthError(res, message) {
  res.writeHead(302, {
    ...securityHeaders(),
    "Set-Cookie": "studyspark_oauth_state=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0",
    Location: `${APP_BASE_URL}/?authError=${encodeURIComponent(message)}`,
  });
  res.end();
}

async function sendVerificationCode(user) {
  const code = createSixDigitCode();
  insertEmailVerificationCode({
    id: uid("verify"),
    userId: user.id,
    codeHash: hashShortCode(code),
    expiresDate: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    attempts: 0,
    resendCount: 0,
    used: false,
    createdDate: new Date().toISOString(),
  });

  return sendEmail({
    to: user.email,
    subject: "Verify your StudySpark email",
    text: `Your StudySpark verification code is ${code}. It expires in 10 minutes.`,
    devCode: code,
  });
}

async function sendPasswordResetCode(user) {
  const code = createSixDigitCode();
  insertPasswordResetCode({
    id: uid("reset"),
    userId: user.id,
    codeHash: hashShortCode(code),
    expiresDate: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    attempts: 0,
    used: false,
    createdDate: new Date().toISOString(),
  });

  return sendEmail({
    to: user.email,
    subject: "Reset your StudySpark password",
    text: `Your StudySpark password reset code is ${code}. It expires in 10 minutes.`,
    devCode: code,
  });
}

async function sendEmail({ to, subject, text, devCode }) {
  if (process.env.RESEND_API_KEY) {
    const result = await sendEmailWithResend({ to, subject, text });
    if (result.delivered) {
      return result;
    }
    console.warn(`Resend email failed, falling back to SMTP/dev log: ${result.error}`);
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[DEV EMAIL] ${subject} to ${to}: ${devCode}`);
    return { delivered: false, mode: "dev-log", devCode };
  }

  let nodemailer = null;
  try {
    nodemailer = require("nodemailer");
  } catch {
    console.warn("SMTP is configured, but nodemailer is not installed. Email code logged for local development.");
    console.log(`[DEV EMAIL] ${subject} to ${to}: ${devCode}`);
    return { delivered: false, mode: "dev-log", devCode };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
  });

  return { delivered: true, mode: "smtp" };
}

async function sendEmailWithResend({ to, subject, text }) {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || process.env.SMTP_FROM || "StudySpark <onboarding@resend.dev>",
        to,
        subject,
        text,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { delivered: false, mode: "resend", error: data?.message || data?.error || "Resend request failed." };
    }

    return { delivered: true, mode: "resend", id: data.id || "" };
  } catch (error) {
    return { delivered: false, mode: "resend", error: error.message };
  }
}

function canExposeDevCodes(delivery) {
  return Boolean(delivery?.devCode && !delivery.delivered && process.env.NODE_ENV !== "production");
}

function createSession(state, userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const session = {
    token,
    tokenHash: hashSessionToken(token),
    userId,
    createdDate: new Date().toISOString(),
    expiresDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
  };
  state.sessions = state.sessions.filter((entry) => entry.userId !== userId);
  state.sessions.push(session);
  return session;
}

function hashSessionToken(token) {
  return crypto.createHash("sha256").update(String(token || "")).digest("hex");
}

function getSessionToken(req) {
  return req.headers["x-session-token"] || "";
}

function requireUser(req, state) {
  const token = getSessionToken(req);
  if (!token) {
    return null;
  }

  const tokenHash = hashSessionToken(token);
  const session = state.sessions.find((entry) => entry.tokenHash === tokenHash && new Date(entry.expiresDate) > new Date());
  if (!session) {
    return null;
  }

  return state.users.find((user) => user.id === session.userId) || null;
}

function sanitizeUser(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    academicLevel: user.academicLevel,
    preferredLanguage: user.preferredLanguage,
    studyGoal: user.studyGoal,
    dailyAvailableHours: user.dailyAvailableHours,
    emailVerified: Boolean(user.emailVerified),
    provider: user.provider || "email",
    avatarUrl: user.avatarUrl || "",
    createdDate: user.createdDate,
  };
}

function getUserSubjects(state, email) {
  return state.subjects
    .filter((subject) => subject.userEmail === email)
    .sort((a, b) => new Date(a.examDate) - new Date(b.examDate));
}

function buildBootstrapPayload(state, user) {
  const subjects = getUserSubjects(state, user.email);
  const plans = state.plans
    .filter((plan) => plan.userEmail === user.email)
    .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
  const tasks = state.tasks.filter((task) => task.userEmail === user.email);
  const chatHistory = state.chatHistory.filter((entry) => entry.userEmail === user.email).slice(-12);
  const calendarBlocks = (state.calendarBlocks || []).filter((block) => block.userEmail === user.email);
  const friends = (state.friends || []).filter((friend) => friend.userEmail === user.email);
  const friendMessages = (state.friendMessages || []).filter((message) => message.userEmail === user.email);
  const rewardHistory = (state.rewardHistory || []).filter((reward) => reward.userEmail === user.email);
  const completedTasks = tasks.filter((task) => task.status === "Done").length;

  return {
    user: sanitizeUser(user),
    subjects,
    plans,
    tasks,
    calendarBlocks,
    friends,
    friendMessages,
    rewardHistory,
    metrics: {
      totalSubjects: subjects.length,
      totalPlans: plans.length,
      completedTasks,
      apiReady: Boolean(process.env.OPENAI_API_KEY),
    },
    chatHistory,
  };
}

function createLocalStudyPlan(user, subjects) {
  const profile = sanitizeUser(user);
  const availableDailyHours = Math.max(1, Number(profile.dailyAvailableHours) || 2);
  const weightedSubjects = subjects.map((subject) => {
    const urgency = 1 / (daysUntil(subject.examDate) + 1);
    const score =
      urgency * 6 +
      getDifficultyWeight(subject.difficulty) * 2 +
      getPriorityWeight(subject.priority) * 2 +
      Math.min(Number(subject.dailyHours) || 1, availableDailyHours);

    return { ...subject, score };
  });

  const topSubjects = [...weightedSubjects]
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((subject) => subject.subjectName);

  const weeklyPlan = getWeekDates().map((date) => {
    const ranked = [...weightedSubjects].sort((a, b) => {
      const dateDiff = daysUntil(a.examDate) - daysUntil(b.examDate);
      return dateDiff !== 0 ? dateDiff : b.score - a.score;
    });

    let usedHours = 0;
    const tasks = [];

    for (const subject of ranked) {
      if (usedHours >= availableDailyHours) {
        break;
      }

      const maxForSubject = Math.min(Number(subject.dailyHours) || 1, availableDailyHours - usedHours, 2.5);
      const duration =
        subject.priority === "High" || subject.difficulty === "Hard"
          ? Math.max(1, Math.min(maxForSubject, 2))
          : Math.max(0.5, Math.min(maxForSubject, 1.5));

      tasks.push({
        subject: subject.subjectName,
        duration: Number(duration.toFixed(1)),
        priority: subject.priority,
      });
      usedHours += duration;
    }

    return {
      dayName: DAY_NAMES[date.getDay()],
      date: date.toISOString(),
      tasks: tasks.slice(0, 3),
    };
  });

  const planId = uid("plan");
  const promptLog = {
    system: STUDY_PLAN_SYSTEM_PROMPT,
    user: buildStudyPlanPrompt(profile, subjects),
  };
  const tasks = normalizeTodayTasks(weeklyPlan[0]?.tasks || [], profile.email, planId);

  return {
    plan: {
      id: planId,
      userEmail: profile.email,
      planTitle: "Personalized AI Study Plan",
      aiSummary: `This plan balances ${profile.studyGoal || "your study goals"} with ${availableDailyHours} available hours per day, while prioritizing ${topSubjects.join(" and ") || subjects[0].subjectName}.`,
      weeklyPlan,
      todayTasks: tasks,
      studyTips: [
        "Start each session with the hardest topic while your focus is strongest.",
        "Use 45 to 60 minute study blocks and keep breaks short and intentional.",
        "Leave the final 10 minutes of each session for recap and self-testing.",
      ],
      motivationMessage: `${profile.fullName.split(" ")[0]}, calm consistency beats last-minute stress. Follow the next small step and let progress build.`,
      promptLog,
      createdDate: new Date().toISOString(),
      saved: true,
    },
    tasks,
  };
}

async function generateAIStudyPlan(user, subjects, fallbackPlan) {
  const prompt = `${buildStudyPlanPrompt(sanitizeUser(user), subjects)}

Return JSON only with this exact shape:
{
  "aiSummary": "string",
  "weeklyPlan": [
    {
      "dayName": "Monday",
      "tasks": [
        { "subject": "Math", "duration": 2 }
      ]
    }
  ],
  "todayTasks": [
    { "subject": "Math", "duration": 2 }
  ],
  "studyTips": ["tip 1", "tip 2", "tip 3"],
  "motivationMessage": "string"
}

Keep the answer realistic, balanced, and concise.
Use the fallback weekly structure below as a helpful reference, but improve it if needed:
${JSON.stringify(fallbackPlan.weeklyPlan)}`;

  const data = await callOpenAI({
    instructions: STUDY_PLAN_SYSTEM_PROMPT,
    input: prompt,
    model: process.env.OPENAI_MODEL || "gpt-5.4-mini",
  });

  const text = extractResponseText(data);
  const parsed = parseJsonFromText(text);
  return {
    ...parsed,
    model: data.model || process.env.OPENAI_MODEL || "gpt-5.4-mini",
  };
}

async function generateImprovedAIStudyPlan(user, subjects, currentPlan, fallbackPlan, context = {}) {
  const profile = sanitizeUser(user);
  const prompt = `You are improving an existing student study plan.

Student profile:
Name: ${profile.fullName}
Academic level: ${profile.academicLevel || "Unknown"}
Preferred language: ${profile.preferredLanguage || "English"}
Study goal: ${profile.studyGoal || "Mixed"}
Daily available hours: ${profile.dailyAvailableHours || "Unknown"}

Subjects:
${subjects
  .map(
    (subject) =>
      `- ${subject.subjectName} | Exam: ${subject.examDate} | Difficulty: ${subject.difficulty} | Priority: ${subject.priority} | Daily hours: ${subject.dailyHours}`
  )
  .join("\n")}

Current plan to improve (JSON):
${JSON.stringify(currentPlan || {}, null, 2)}

Current tasks (JSON):
${JSON.stringify(context.tasks || [], null, 2)}

Current calendar blocks (JSON):
${JSON.stringify(context.calendarBlocks || [], null, 2)}

Improve this plan for:
1) better balance,
2) sustainable workload,
3) clearer daily tasks.
4) avoid busy calendar blocks when possible,
5) keep exam dates and hard-subject spacing in mind.

Return JSON only with this exact shape:
{
  "aiSummary": "string",
  "weeklyPlan": [
    {
      "dayName": "Monday",
      "tasks": [
        { "subject": "Math", "duration": 2, "priority": "Medium" }
      ]
    }
  ],
  "todayTasks": [
    { "subject": "Math", "duration": 2, "priority": "Medium" }
  ],
  "studyTips": ["tip 1", "tip 2", "tip 3"],
  "motivationMessage": "string"
}

Fallback weekly reference:
${JSON.stringify(fallbackPlan.weeklyPlan)}`;

  const data = await callOpenAI({
    instructions:
      "You are an expert study plan optimizer. Improve structure and clarity while keeping workload realistic. Return only valid JSON.",
    input: prompt,
    model: process.env.OPENAI_MODEL || "gpt-5.4-mini",
  });

  const text = extractResponseText(data);
  const parsed = parseJsonFromText(text);
  return {
    ...parsed,
    model: data.model || process.env.OPENAI_MODEL || "gpt-5.4-mini",
  };
}

async function getAIChatReply(user, subjects, history, message) {
  const conversationHistory = history
    .map((entry) => `${entry.role === "assistant" ? "Assistant" : "Student"}: ${entry.message}`)
    .join("\n");

  const profile = sanitizeUser(user);
  const subjectList = subjects
    .map((subject) => `${subject.subjectName} (${subject.difficulty}, ${subject.priority}, exam ${subject.examDate})`)
    .join(", ");

  const input = `Student profile:
Name: ${profile.fullName}
Academic level: ${profile.academicLevel || "Unknown"}
Preferred language: ${profile.preferredLanguage || "English"}
Study goal: ${profile.studyGoal || "Mixed"}
Daily available hours: ${profile.dailyAvailableHours || "Unknown"}
Subjects: ${subjectList || "No subjects added yet"}

Recent conversation:
${conversationHistory || "No prior messages."}

Student message:
${message}`;

  const data = await callOpenAI({
    instructions: `${STUDY_COACH_SYSTEM_PROMPT}
Keep answers practical, warm, student-friendly, and concise.`,
    input,
    model: process.env.OPENAI_CHAT_MODEL || process.env.OPENAI_MODEL || "gpt-5.4-mini",
  });

  return {
    text: extractResponseText(data),
    model: data.model || process.env.OPENAI_CHAT_MODEL || process.env.OPENAI_MODEL || "gpt-5.4-mini",
  };
}

async function callOpenAI({ instructions, input, model }) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      instructions,
      input,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || "OpenAI request failed.");
  }

  return data;
}

function extractResponseText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const outputs = Array.isArray(data.output) ? data.output : [];
  for (const output of outputs) {
    const content = Array.isArray(output.content) ? output.content : [];
    for (const part of content) {
      if (typeof part.text === "string" && part.text.trim()) {
        return part.text.trim();
      }
    }
  }

  throw new Error("OpenAI returned no text output.");
}

function parseJsonFromText(text) {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch (error) {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error("Could not parse JSON plan output.");
  }
}

function normalizeTodayTasks(tasks, userEmail, planId) {
  return tasks.map((task) => ({
    id: uid("task"),
    userEmail,
    subject: task.subject,
    date: startOfDay(new Date()).toISOString(),
    duration: Number(task.duration || 1),
    status: "Not done",
    relatedPlan: planId,
  }));
}

function normalizeWeeklyPlan(aiWeeklyPlan, fallbackWeeklyPlan) {
  return fallbackWeeklyPlan.map((fallbackDay, index) => {
    const aiDay = aiWeeklyPlan[index] || {};
    const aiTasks = Array.isArray(aiDay.tasks) ? aiDay.tasks : [];
    return {
      dayName: aiDay.dayName || fallbackDay.dayName,
      date: fallbackDay.date,
      tasks: aiTasks.length
        ? aiTasks.map((task) => ({
            subject: task.subject || "Study Session",
            duration: Number(task.duration || 1),
            priority: task.priority || "Medium",
          }))
        : fallbackDay.tasks,
    };
  });
}

function buildLocalCoachReply(user, subjects, message) {
  const firstName = user.fullName.split(" ")[0];
  if (!subjects.length) {
    return `${firstName}, start by adding your subjects and exam dates. Once those are in, I can help you break them into a calmer daily study routine.`;
  }

  const urgentSubject = [...subjects].sort((a, b) => daysUntil(a.examDate) - daysUntil(b.examDate))[0];
  return `${firstName}, a good next step is to focus on ${urgentSubject.subjectName} first because its exam is closer. Aim for one short focused block today, then ask me for help with revision strategy, weak topics, or how to divide your week.`;
}

function buildStudyPlanPrompt(profile, subjects) {
  const subjectBlock = subjects
    .map(
      (subject) =>
        `- ${subject.subjectName} | Exam: ${subject.examDate} | Difficulty: ${subject.difficulty} | Priority: ${subject.priority} | Daily hours: ${subject.dailyHours} | Notes: ${subject.notes || "None"}`
    )
    .join("\n");

  return `Student profile:
Academic level: ${profile.academicLevel}
Preferred language: ${profile.preferredLanguage}
Study goal: ${profile.studyGoal}
Daily available hours: ${profile.dailyAvailableHours}

Subjects:
${subjectBlock}

Please generate:
1. AI Summary
2. Weekly Study Plan
3. Today's Tasks
4. Study Tips
5. Motivation message`;
}

function getWeekDates() {
  const today = startOfDay(new Date());
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return date;
  });
}

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function daysUntil(dateValue) {
  const today = startOfDay(new Date());
  const target = startOfDay(new Date(dateValue));
  return Math.max(0, Math.ceil((target - today) / (1000 * 60 * 60 * 24)));
}

function getDifficultyWeight(level) {
  return { Easy: 1, Medium: 1.4, Hard: 1.8 }[level] || 1;
}

function getPriorityWeight(level) {
  return { Low: 1, Medium: 1.5, High: 2 }[level] || 1;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const STUDY_PLAN_SYSTEM_PROMPT =
  "You are StudySpark, a friendly, calm, practical study coach for students. Create realistic, balanced, and achievable plans without overload. Prioritize closer exams, harder subjects, and important priorities while keeping emotional stress low. Keep output clear, actionable, supportive, and student-focused. Respond in the user's preferred language.";
const STUDY_COACH_SYSTEM_PROMPT =
  "You are StudySpark, a supportive study coach. Be friendly, calm, encouraging, practical, and never childish. Give realistic low-stress next steps. Use warm reassurance when the student feels behind and focus on one doable action at a time.";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const fileContents = fs.readFileSync(filePath, "utf8");
  for (const rawLine of fileContents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex < 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

function validateEnvironment() {
  if (!process.env.RESEND_API_KEY && (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS)) {
    console.warn("No Resend or SMTP email provider is configured. Verification/reset emails will be logged in the server console for local development.");
  }

  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.includes(" ")) {
    console.warn("OPENAI_API_KEY contains whitespace. Check your .env file if AI calls fail.");
  }
}
