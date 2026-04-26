const SESSION_STORAGE_KEY = "ai-study-planner-session-token";
const UI_LANGUAGE_STORAGE_KEY = "ai-study-planner-ui-language";
const CALENDAR_BLOCKS_STORAGE_KEY = "studyspark-calendar-blocks";
const MINI_CHAT_PREVIEW_STORAGE_KEY = "studyspark-mini-chat-preview";
const PROFILE_AVATAR_STORAGE_KEY = "studyspark-profile-avatar";
const RECURRING_BLOCKS_STORAGE_KEY = "studyspark-recurring-blocks";
const ACHIEVEMENTS_STORAGE_KEY = "studyspark-achievements";
const API_BASE = window.location.protocol === "file:" ? "http://localhost:3000" : "";
const BRAND_NAME = "StudySpark ✨";
const BRAND_TAGLINE = "Your calm AI study assistant";
const LOGO_SRC = "assets/studyspark-logo.png";

const NAV_ITEMS = [
  { key: "home", icon: "🏠", labelKey: "navHome" },
  { key: "subjects", icon: "📚", labelKey: "navSubjects" },
  { key: "calendar", icon: "🗓️", labelKey: "navCalendar" },
  { key: "ai", icon: "🤖", labelKey: "navAi" },
  { key: "profile", icon: "👤", labelKey: "navProfile" },
];

const AI_QUICK_ACTIONS = [
  "I'm tired today 😴",
  "Make my plan easier 🧘",
  "Reorganize my week 🗓️",
  "Focus on hardest subject 🔥",
  "Give me motivation ✨",
  "Find free study time ⏰",
];

const FOCUS_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;
const FOCUS_PRESETS = [
  { key: "quick", label: "10 / 2", focusSeconds: 10 * 60, breakSeconds: 2 * 60 },
  { key: "classic", label: "25 / 5", focusSeconds: 25 * 60, breakSeconds: 5 * 60 },
  { key: "deep", label: "50 / 10", focusSeconds: 50 * 60, breakSeconds: 10 * 60 },
];
const FOCUS_TYPES = [
  { key: "Exams", icon: "📝", labelKey: "exams" },
  { key: "Assignments", icon: "📌", labelKey: "assignments" },
  { key: "Daily study", icon: "🌱", labelKey: "dailyStudy" },
  { key: "Mixed", icon: "✨", labelKey: "mixed" },
];
const XP_TIERS = [
  { min: 0, max: 99, name: "Starter", badge: "⚪", color: "#cbd5e1" },
  { min: 100, max: 249, name: "Focus Rookie", badge: "🟤", color: "#b45309" },
  { min: 250, max: 499, name: "Study Builder", badge: "⚪", color: "#94a3b8" },
  { min: 500, max: 899, name: "Exam Fighter", badge: "🟡", color: "#ca8a04" },
  { min: 900, max: 1399, name: "Consistency Hero", badge: "🟢", color: "#16a34a" },
  { min: 1400, max: 2199, name: "Deep Focus", badge: "🔵", color: "#2563eb" },
  { min: 2200, max: 3499, name: "Study Master", badge: "🟣", color: "#7c3aed" },
  { min: 3500, max: Infinity, name: "Legend", badge: "⚫", color: "#111827" },
];
const ACHIEVEMENTS = [
  { key: "first_spark", title: "First Spark ✨" },
  { key: "focus_starter", title: "Focus Starter ⏱️" },
  { key: "streak_3", title: "3-Day Streak 🔥" },
  { key: "streak_7", title: "7-Day Streak 🌟" },
  { key: "exam_fighter", title: "Exam Fighter 📝" },
  { key: "deep_focus", title: "Deep Focus 🧠" },
  { key: "study_hero", title: "Study Hero ⭐" },
  { key: "calendar_master", title: "Calendar Master 🗓️" },
  { key: "social_learner", title: "Social Learner 👥" },
  { key: "legend_mode", title: "Legend Mode ⚫" },
];

const appState = {
  route: "login",
  editingSubjectId: null,
  sessionToken: localStorage.getItem(SESSION_STORAGE_KEY) || "",
  previewLanguage: localStorage.getItem(UI_LANGUAGE_STORAGE_KEY) || "English",
  user: null,
  subjects: [],
  plans: [],
  tasks: [],
  calendarBlocks: [],
  selectedCalendarDate: toDateInputValue(new Date()),
  chatHistory: [],
  rewardHistory: [],
  friends: [],
  friendMessages: [],
  recurringBlocks: [],
  miniChatPreview: localStorage.getItem(MINI_CHAT_PREVIEW_STORAGE_KEY) || "",
  profileAvatar: "",
  achievementsUnlocked: [],
  achievementPopup: "",
  latestPlan: null,
  metrics: {
    totalSubjects: 0,
    totalPlans: 0,
    completedTasks: 0,
    apiReady: false,
  },
  config: {
    hasOpenAIKey: false,
    apiReady: false,
    foundationReady: true,
    puterAvailable: false,
  },
  focusMode: "focus",
  focusType: "Exams",
  focusPresetKey: "classic",
  focusSeconds: FOCUS_SECONDS,
  focusRunning: false,
  focusIntervalId: null,
  activeFocusSessionKey: "",
  focusCompletionPrompt: null,
  resetEmail: "",
  devVerificationCode: "",
  devResetCode: "",
  aiPending: false,
  flash: "",
  flashTone: "success",
};

const translations = {
  English: {
    rtl: false,
    htmlLang: "en",
    languageName: "English",
    appTitle: "StudySpark ✨",
    appSubtitle: "Your calm AI study assistant",
    heroText: "A soft study dashboard for plans, focus sessions, calendars, and calmer exam weeks.",
    loginTitle: "Welcome back",
    registerTitle: "Create your account",
    loginText: "Log in to continue your study planning.",
    registerText: "Start building your personalized AI study routine.",
    fullName: "Full Name",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    logIn: "Log In",
    signUp: "Sign Up",
    alreadyHaveAccount: "Already have an account?",
    dontHaveAccount: "Don't have an account?",
    onboardingTitle: "Let's personalize your study plan",
    onboardingText: "We will shape every AI plan around your goals, language, and study time.",
    academicLevel: "Academic Level",
    preferredLanguage: "Preferred Language",
    studyGoal: "Study Goal",
    dailyAvailableHours: "Daily Available Hours",
    continue: "Continue",
    school: "School",
    university: "University",
    exams: "Exams",
    assignments: "Assignments",
    dailyStudy: "Daily study",
    mixed: "Mixed",
    navHome: "Home",
    navSubjects: "Subjects",
    navCalendar: "Calendar",
    navAi: "AI Coach",
    navPlan: "My Plan",
    navFocus: "Focus",
    navProfile: "Profile",
    greeting: "✨ Your calm study space",
    upcomingExams: "📝 Upcoming Exams",
    todaysTasks: "✅ Today's Tasks",
    progress: "📈 Progress",
    addSubject: "📚 Add Subject",
    generatePlan: "🤖 Generate Plan",
    openAi: "🤖 Open AI Coach",
    whyItMatters: "Why this app matters",
    subjectsTitle: "📚 Subjects",
    subjectsText: "Track deadlines, difficulty, energy, and priorities in one cozy place.",
    addSubjectTitle: "📚 Add a Subject",
    editSubjectTitle: "✏️ Edit Subject",
    addSubjectText: "Capture urgency, difficulty, and context so the planner makes better decisions.",
    subjectName: "Subject Name",
    examDate: "Exam Date",
    difficulty: "Difficulty",
    priority: "Priority",
    dailyHours: "Study Hours per Day",
    notes: "Notes",
    saveSubject: "Save Subject",
    easy: "🌿 Easy",
    medium: "⚡ Medium",
    hard: "🔥 Hard",
    low: "Low",
    high: "High",
    aiTitle: "🤖 AI Study Coach",
    aiText: "Chat with the planner like a real assistant. Ask for a better schedule, study tips, or help changing your plan.",
    aiInputPlaceholder: "Type a message to your AI study coach...",
    send: "Send",
    aiTools: "✨ Quick AI actions",
    aiGenerateAction: "🗓️ Generate a new plan",
    aiPlanHint: "The AI can respond in chat and also generate or update your study plan.",
    aiModeOpenAI: "OpenAI live",
    aiModePuter: "Puter live",
    aiModeLocal: "Local fallback",
    planTitle: "🗓️ Your Study Plan",
    summaryTitle: "🤖 AI Summary",
    weeklyTitle: "🗓️ Weekly Plan",
    todayTitle: "✅ Today's Tasks",
    tipsTitle: "🌱 Study Tips",
    motivationTitle: "✨ Motivation",
    noPlanYet: "🗓️ No study plan yet",
    noPlanText: "Add your subjects, then generate a plan that fits your time and energy 🌱",
    noSubjects: "📚 No subjects yet",
    noSubjectsText: "Add your first subject and I'll help you build a smart study plan ✨",
    noTasksToday: "✅ No tasks for today. You're clear for now, or you can generate a calm plan 🧘",
    taskDone: "✅ Done",
    taskPending: "Not done",
    duration: "Duration",
    profileTitle: "👤 Profile",
    editOnboarding: "⚙️ Edit study preferences",
    logout: "Log out",
    language: "Language",
    realProblem: "Real problem: students struggle to organize study time, exam stress, and priorities.",
    targetAudience: "Target users: school and university students who need a calmer planning flow.",
    aiValue: "AI value: personalized plans based on deadlines, difficulty, and available hours.",
    uxValue: "UX value: simple screens, clear actions, and practical guidance.",
    openAiEnabledText: "Real OpenAI planning is enabled. Your API key stays on the server.",
    puterEnabledText: "Puter.js is available for live AI responses in the browser.",
    localFallbackText: "AI fallback mode is active. Core planning still works.",
    accountCreated: "✨ Account created successfully.",
    loggedInSuccess: "✨ Logged in successfully.",
    savedPreferences: "🌱 Your study preferences were saved.",
    subjectSaved: "📚 Subject saved successfully.",
    subjectDeleted: "🗑️ Subject deleted.",
    loggedOut: "You have been logged out.",
    passwordsMismatch: "Passwords do not match.",
    planReady: "Your plan is ready — calm, clear, and realistic ✨",
    openAiPlanReady: "StudySpark built a clear AI plan for you ✨",
    puterPlanReady: "StudySpark built a clear AI plan for you ✨",
    edit: "Edit",
    delete: "Delete",
    you: "You",
    builtOn: "Built on",
    totalSubjects: "📚 Total subjects",
    completedTasks: "✅ Completed tasks",
    savedPlans: "🗓️ Saved plans",
    nextExamText: "is next.",
    addSubjectsDeadlineText: "Add subjects to see deadlines.",
    tasksReadyText: "Your plan has tasks ready for today.",
    generateToStartText: "Generate a plan to start.",
    noNotes: "No notes added yet.",
    aiEmptyTitle: "🤖 Start the conversation",
    aiEmptyText: "Try asking: Help me study for biology in 3 days, make my plan lighter, or reorganize my week ✨",
    aiThinking: "Thinking about the best plan for you 🤖✨",
    aiThinkingAltOne: "Balancing your time, energy, and deadlines 📚",
    aiThinkingAltTwo: "Building a calmer study path 🌱",
    aiMessagesSaved: "🤖 AI conversation saved.",
    clearChat: "Clear chat view",
    studyStreak: "🌱 Study streak",
    xpPoints: "⭐ XP",
    levelName: "🏆 Level",
    completedPercent: "📈 Completed",
    focusTitle: "⏱️ Focus Mode",
    focusText: "Let's focus on one task only. Deep breath. Start small. Keep going 🌱",
    focusChooseType: "Choose what you want to focus on",
    focusChooseTimer: "Choose timer style",
    focusSession: "Focus session",
    breakSession: "Break time 🧘",
    focusComplete: "Focus session complete 🎉",
    start: "Start",
    pause: "Pause",
    reset: "Reset",
    noFocusTask: "You're clear for now. Pick a subject or generate a plan when you're ready ✨",
    quickActions: "Quick actions",
    planMood: "Plan mood",
    focusModeButton: "⏱️ Focus Mode",
    todayFocusTask: "⏱️ Today's focus task",
    weeklyProgress: "📈 Weekly progress",
    subjectsCount: "📚 Subjects count",
    openCalendar: "🗓️ Open Calendar",
    askStudySpark: "🤖 Ask StudySpark",
    calendarTitle: "🗓️ Study Calendar",
    calendarText: "Plan study time around exams, assignments, classes, work, and real life.",
    addCalendarBlock: "Add calendar block",
    blockTitle: "Title",
    blockDate: "Date",
    blockStart: "Start time",
    blockEnd: "End time",
    blockType: "Category",
    blockNotes: "Notes",
    saveBlock: "Save block",
    selectedDay: "Selected day",
    freeDay: "🌿 Free day",
    timeConflict: "⚠️ Time conflict",
    totalStudyTime: "Total study time",
    resetProgress: "Reset local progress",
    resetProgressDone: "Local progress reset.",
    totalTasks: "Total tasks",
    profileSummary: "Spark profile",
    universityClass: "University class 🎓",
    atHome: "At home 🏠",
    work: "Work 💼",
    gym: "Gym 🏋️",
    familyTime: "Family time 👨‍👩‍👧",
    busyBlock: "Busy block 🚫",
    examEvent: "Exam",
    studyTask: "Study task",
    tinyProgress: "Tiny progress is still progress ✨",
    oneSession: "One focused session can change your whole day 🌱",
    futureThanks: "Your future self will thank you 📚💙",
    studyCalm: "Study calm. Win smart. 🧠",
    nextRightStep: "You don't need to do everything today - just the next right step.",
    coins: "🪙 Coins",
    currentTier: "Current tier",
    nextTier: "Next tier",
    xpToNextTier: "XP to next tier",
    tierProgress: "Tier progress",
    focusConfirmTitle: "Did you finish this study activity?",
    focusConfirmYes: "Yes, completed ✅",
    focusConfirmNo: "Not yet ⏳",
    rewardCelebration: "Great job! Rewards earned 🎉",
    streakBonus: "Daily streak bonus unlocked 🌟",
    askStudySparkMini: "Ask StudySpark 🤖",
    miniChatPlaceholder: "Quick question...",
    openFullChat: "Open full chat ✨",
    miniReplyPreview: "Quick reply preview",
    friendsTitle: "Friends 👥",
    friendsPrototypeNote: "Prototype social feature: messages are simple and not real-time.",
    addFriendLabel: "Friend name or email",
    addFriendButton: "Add friend",
    noFriendsYet: "👥 No friends yet — add a study buddy to stay motivated.",
    messageText: "Message text",
    sendMessage: "Send message",
    sentMessages: "Sent messages",
    focusCenterTitle: "Focus Center ⏱️",
    focusStatus: "Current session status",
    focusSessionsTotal: "Total focus sessions",
    xpToday: "XP earned today",
    startFocusSession: "Start Focus Session",
    accountSection: "Account 👤",
    progressSection: "Progress 📊",
    settingsSection: "Settings ⚙️",
    showMore: "Show more",
    friendsSection: "Friends 👥",
    changeProfilePicture: "Change profile picture 📸",
    removeProfilePicture: "Remove picture ❌",
    profilePictureHint: "Your StudySpark profile picture",
    profilePictureRemoved: "Profile picture removed.",
    nextSmallStep: "Let’s take the next small step 🌱",
    focusRunningText: "Focused. Keep going.",
    profilePhotoTooLarge: "Image is too large. Please choose a file under 2MB.",
    profilePhotoInvalid: "Please upload a JPG or PNG image.",
    makeItBetter: "Make it Better ✨",
    makeItBetterLoading: "StudySpark is improving your plan 🤖✨",
    makeItBetterConfirm: "Replace your current plan with an improved version?",
    makeItBetterDone: "Your plan is improved ✨",
    repeatOption: "Repeat",
    repeatNever: "Does not repeat",
    repeatDaily: "Daily",
    repeatWeekly: "Weekly",
    repeatWeekdays: "Selected weekdays",
    repeatEndDate: "Repeat end date",
    selectedWeekdays: "Selected weekdays",
    calendarFullDay: "🚫 This day looks full. StudySpark will suggest another time.",
    noStudyWindow: "⚠️ No free study window found for this task.",
    freeWindows: "Free windows",
    achievementsTitle: "Achievements 🏆",
    unlocked: "Unlocked",
    locked: "Locked",
    achievementUnlocked: "Achievement unlocked",
  },
  Hebrew: {
    rtl: true,
    htmlLang: "he",
    languageName: "עברית",
    appTitle: "מתכנן הלמידה החכם",
    appSubtitle: "לומדים חכם, מתקדמים רגוע",
    heroText: "עוזר לימודי רגוע וחכם לתלמידים וסטודנטים שצריכים סדר בלי עומס מיותר.",
    loginTitle: "ברוך הבא",
    registerTitle: "יצירת חשבון",
    loginText: "התחבר כדי להמשיך לתכנון הלמידה שלך.",
    registerText: "התחל לבנות שגרת לימוד אישית בעזרת AI.",
    fullName: "שם מלא",
    email: "אימייל",
    password: "סיסמה",
    confirmPassword: "אימות סיסמה",
    logIn: "התחברות",
    signUp: "הרשמה",
    alreadyHaveAccount: "כבר יש לך חשבון?",
    dontHaveAccount: "אין לך חשבון?",
    onboardingTitle: "בוא נתאים את תוכנית הלמידה שלך",
    onboardingText: "נבנה כל תוכנית לפי המטרות, השפה והזמן הפנוי שלך.",
    academicLevel: "רמה אקדמית",
    preferredLanguage: "שפה מועדפת",
    studyGoal: "מטרת לימוד",
    dailyAvailableHours: "שעות פנויות ביום",
    continue: "המשך",
    school: "בית ספר",
    university: "אוניברסיטה",
    exams: "מבחנים",
    assignments: "מטלות",
    dailyStudy: "לימוד יומי",
    mixed: "משולב",
    navHome: "בית",
    navSubjects: "מקצועות",
    navAi: "AI",
    navPlan: "התוכנית",
    navProfile: "פרופיל",
    greeting: "מרחב הלמידה שלך",
    upcomingExams: "מבחנים קרובים",
    todaysTasks: "משימות להיום",
    progress: "התקדמות",
    addSubject: "הוסף מקצוע",
    generatePlan: "צור תוכנית",
    openAi: "פתח מאמן AI",
    whyItMatters: "למה האפליקציה חשובה",
    subjectsTitle: "מקצועות",
    subjectsText: "נהל דדליינים, קושי ושעות זמינות במקום אחד.",
    addSubjectTitle: "הוספת מקצוע",
    editSubjectTitle: "עריכת מקצוע",
    addSubjectText: "הוסף דחיפות, רמת קושי והערות כדי שהמתכנן יקבל החלטות טובות יותר.",
    subjectName: "שם המקצוע",
    examDate: "תאריך מבחן",
    difficulty: "רמת קושי",
    priority: "עדיפות",
    dailyHours: "שעות לימוד ביום",
    notes: "הערות",
    saveSubject: "שמור מקצוע",
    easy: "קל",
    medium: "בינוני",
    hard: "קשה",
    low: "נמוכה",
    high: "גבוהה",
    aiTitle: "מאמן הלמידה החכם",
    aiText: "דבר עם המתכנן כמו בצ'אט אמיתי. אפשר לבקש תוכנית חדשה, שינוי עומס, טיפים ללמידה או ארגון מחדש של השבוע.",
    aiInputPlaceholder: "כתוב הודעה למאמן הלמידה...",
    send: "שלח",
    aiTools: "פעולות AI",
    aiGenerateAction: "צור תוכנית חדשה",
    aiPlanHint: "ה-AI יכול לענות בצ'אט וגם ליצור או לעדכן את תוכנית הלימוד שלך.",
    aiModeOpenAI: "OpenAI פעיל",
    aiModePuter: "Puter פעיל",
    aiModeLocal: "מצב מקומי",
    planTitle: "תוכנית הלימוד שלך",
    summaryTitle: "סיכום AI",
    weeklyTitle: "תוכנית שבועית",
    todayTitle: "משימות להיום",
    tipsTitle: "טיפים ללמידה",
    motivationTitle: "מסר מעודד",
    noPlanYet: "עדיין אין תוכנית לימוד",
    noPlanText: "צור תוכנית אחרי הוספת מקצועות כדי לראות לוח לימוד אישי כאן.",
    noSubjects: "עדיין לא נוספו מקצועות",
    noSubjectsText: "התחל מהוספת מקצוע ותאריך מבחן כדי שהמתכנן ידע לתעדף נכון.",
    noTasksToday: "עדיין לא נוצרו משימות להיום.",
    taskDone: "בוצע",
    taskPending: "לא בוצע",
    duration: "משך",
    profileTitle: "פרופיל",
    editOnboarding: "עריכת העדפות לימוד",
    logout: "התנתקות",
    language: "שפה",
    realProblem: "הבעיה האמיתית: תלמידים וסטודנטים מתקשים לארגן זמן לימוד, לחץ מבחנים ועדיפויות.",
    targetAudience: "קהל היעד: תלמידי בית ספר וסטודנטים שצריכים תכנון רגוע וברור יותר.",
    aiValue: "הערך של AI: תוכנית אישית לפי דדליינים, קושי ושעות פנויות.",
    uxValue: "הערך של UX: מסכים פשוטים, פעולות ברורות והכוונה פרקטית.",
    openAiEnabledText: "תכנון OpenAI אמיתי פעיל. מפתח ה-API נשאר בשרת.",
    puterEnabledText: "Puter.js זמין לתשובות AI חיות בדפדפן.",
    localFallbackText: "מצב גיבוי מקומי פעיל. התכנון הבסיסי עדיין עובד.",
    accountCreated: "החשבון נוצר בהצלחה.",
    loggedInSuccess: "התחברת בהצלחה.",
    savedPreferences: "העדפות הלימוד נשמרו.",
    subjectSaved: "המקצוע נשמר בהצלחה.",
    subjectDeleted: "המקצוע נמחק.",
    loggedOut: "התנתקת מהמערכת.",
    passwordsMismatch: "הסיסמאות אינן תואמות.",
    planReady: "תוכנית הלימוד שלך מוכנה.",
    openAiPlanReady: "תוכנית OpenAI שלך מוכנה.",
    puterPlanReady: "תוכנית Puter AI שלך מוכנה.",
    edit: "ערוך",
    delete: "מחק",
    you: "אתה",
    builtOn: "נבנתה בתאריך",
    totalSubjects: "סה״כ מקצועות",
    completedTasks: "משימות שהושלמו",
    savedPlans: "תוכניות שמורות",
    nextExamText: "הבא בתור.",
    addSubjectsDeadlineText: "הוסף מקצועות כדי לראות דדליינים.",
    tasksReadyText: "יש משימות מוכנות להיום.",
    generateToStartText: "צור תוכנית כדי להתחיל.",
    noNotes: "עדיין לא נוספו הערות.",
    aiEmptyTitle: "התחל את השיחה",
    aiEmptyText: "נסה לשאול: תעזור לי ללמוד לביולוגיה בעוד 3 ימים, תקל על התוכנית, או תארגן מחדש את השבוע.",
    aiMessagesSaved: "השיחה עם ה-AI נשמרה.",
    clearChat: "נקה תצוגת צ׳אט",
  },
  Arabic: {
    rtl: true,
    htmlLang: "ar",
    languageName: "العربية",
    appTitle: "مخطط الدراسة الذكي",
    appSubtitle: "تعلّم بذكاء وتقدم بهدوء",
    heroText: "مساعد دراسي هادئ وذكي للطلاب الذين يحتاجون إلى تنظيم دون ضغط إضافي.",
    loginTitle: "مرحبًا بعودتك",
    registerTitle: "إنشاء حساب",
    loginText: "سجّل الدخول لمتابعة التخطيط الدراسي.",
    registerText: "ابدأ ببناء روتين دراسة شخصي بمساعدة الذكاء الاصطناعي.",
    fullName: "الاسم الكامل",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    confirmPassword: "تأكيد كلمة المرور",
    logIn: "تسجيل الدخول",
    signUp: "إنشاء حساب",
    alreadyHaveAccount: "لديك حساب بالفعل؟",
    dontHaveAccount: "ليس لديك حساب؟",
    onboardingTitle: "لنخصص خطة دراستك",
    onboardingText: "سنشكّل كل خطة وفق أهدافك ولغتك ووقتك المتاح.",
    academicLevel: "المستوى الأكاديمي",
    preferredLanguage: "اللغة المفضلة",
    studyGoal: "هدف الدراسة",
    dailyAvailableHours: "الساعات المتاحة يوميًا",
    continue: "متابعة",
    school: "مدرسة",
    university: "جامعة",
    exams: "امتحانات",
    assignments: "واجبات",
    dailyStudy: "دراسة يومية",
    mixed: "مختلط",
    navHome: "الرئيسية",
    navSubjects: "المواد",
    navAi: "AI",
    navPlan: "الخطة",
    navProfile: "الملف",
    greeting: "مساحة دراستك",
    upcomingExams: "الامتحانات القادمة",
    todaysTasks: "مهام اليوم",
    progress: "التقدم",
    addSubject: "إضافة مادة",
    generatePlan: "إنشاء خطة",
    openAi: "افتح مدرب AI",
    whyItMatters: "لماذا هذا التطبيق مهم",
    subjectsTitle: "المواد",
    subjectsText: "تابع المواعيد النهائية والصعوبة والساعات المتاحة في مكان واحد.",
    addSubjectTitle: "إضافة مادة",
    editSubjectTitle: "تعديل المادة",
    addSubjectText: "أضف مستوى الاستعجال والصعوبة والملاحظات ليبني المخطط قرارات أفضل.",
    subjectName: "اسم المادة",
    examDate: "تاريخ الامتحان",
    difficulty: "مستوى الصعوبة",
    priority: "الأولوية",
    dailyHours: "ساعات الدراسة في اليوم",
    notes: "ملاحظات",
    saveSubject: "حفظ المادة",
    easy: "سهل",
    medium: "متوسط",
    hard: "صعب",
    low: "منخفضة",
    high: "مرتفعة",
    aiTitle: "مدرب الدراسة الذكي",
    aiText: "تحدث مع المخطط مثل محادثة حقيقية. اطلب خطة جديدة أو تخفيف الضغط أو نصائح دراسية أو إعادة تنظيم الأسبوع.",
    aiInputPlaceholder: "اكتب رسالة إلى مدرب الدراسة...",
    send: "إرسال",
    aiTools: "إجراءات AI",
    aiGenerateAction: "أنشئ خطة جديدة",
    aiPlanHint: "يمكن للذكاء الاصطناعي الرد في المحادثة وأيضًا إنشاء أو تحديث خطة الدراسة.",
    aiModeOpenAI: "OpenAI مباشر",
    aiModePuter: "Puter مباشر",
    aiModeLocal: "وضع محلي",
    planTitle: "خطة دراستك",
    summaryTitle: "ملخص AI",
    weeklyTitle: "الخطة الأسبوعية",
    todayTitle: "مهام اليوم",
    tipsTitle: "نصائح الدراسة",
    motivationTitle: "رسالة تحفيزية",
    noPlanYet: "لا توجد خطة دراسة بعد",
    noPlanText: "أنشئ خطة بعد إضافة المواد لترى جدولًا دراسيًا شخصيًا هنا.",
    noSubjects: "لم تتم إضافة مواد بعد",
    noSubjectsText: "ابدأ بإضافة مادة وتاريخ امتحان حتى يستطيع المخطط ترتيب الأولويات.",
    noTasksToday: "لم يتم إنشاء مهام لليوم بعد.",
    taskDone: "تم",
    taskPending: "غير منجز",
    duration: "المدة",
    profileTitle: "الملف الشخصي",
    editOnboarding: "تعديل تفضيلات الدراسة",
    logout: "تسجيل الخروج",
    language: "اللغة",
    realProblem: "المشكلة الحقيقية: الطلاب يواجهون صعوبة في تنظيم وقت الدراسة والضغط قبل الامتحانات.",
    targetAudience: "الجمهور المستهدف: طلاب المدارس والجامعات الذين يحتاجون إلى تخطيط أكثر هدوءًا.",
    aiValue: "قيمة AI: خطة شخصية حسب المواعيد النهائية والصعوبة والوقت المتاح.",
    uxValue: "قيمة UX: شاشات بسيطة وإجراءات واضحة وتوجيه عملي.",
    openAiEnabledText: "تخطيط OpenAI الحقيقي مفعل. يبقى مفتاح الـ API في الخادم.",
    puterEnabledText: "Puter.js متاح لردود AI مباشرة من المتصفح.",
    localFallbackText: "وضع احتياطي محلي فعال. التخطيط الأساسي ما زال يعمل.",
    accountCreated: "تم إنشاء الحساب بنجاح.",
    loggedInSuccess: "تم تسجيل الدخول بنجاح.",
    savedPreferences: "تم حفظ تفضيلات الدراسة.",
    subjectSaved: "تم حفظ المادة بنجاح.",
    subjectDeleted: "تم حذف المادة.",
    loggedOut: "تم تسجيل الخروج.",
    passwordsMismatch: "كلمتا المرور غير متطابقتين.",
    planReady: "خطة الدراسة جاهزة.",
    openAiPlanReady: "خطة OpenAI الخاصة بك جاهزة.",
    puterPlanReady: "خطة Puter AI الخاصة بك جاهزة.",
    edit: "تعديل",
    delete: "حذف",
    you: "أنت",
    builtOn: "تم إنشاؤها في",
    totalSubjects: "إجمالي المواد",
    completedTasks: "المهام المكتملة",
    savedPlans: "الخطط المحفوظة",
    nextExamText: "هو التالي.",
    addSubjectsDeadlineText: "أضف المواد لرؤية المواعيد النهائية.",
    tasksReadyText: "لديك مهام جاهزة لليوم.",
    generateToStartText: "أنشئ خطة للبدء.",
    noNotes: "لا توجد ملاحظات بعد.",
    aiEmptyTitle: "ابدأ المحادثة",
    aiEmptyText: "جرّب السؤال: ساعدني على دراسة الأحياء خلال 3 أيام، خفف خطتي، أو أعد تنظيم الأسبوع.",
    aiMessagesSaved: "تم حفظ المحادثة مع AI.",
    clearChat: "مسح عرض المحادثة",
  },
};

function getUiLanguage() {
  return appState.user?.preferredLanguage || appState.previewLanguage || "English";
}

function getLanguagePack() {
  return translations[getUiLanguage()] || translations.English;
}

function text(key, fallback = "") {
  const pack = getLanguagePack();
  return pack[key] || translations.English[key] || fallback || key;
}

function isRtl() {
  return Boolean(getLanguagePack().rtl);
}

function localizedLanguageOption(value) {
  return translations[value]?.languageName || value;
}

function localizedStatus(status) {
  return status === "Done" ? text("taskDone") : text("taskPending");
}

function hasPuterAI() {
  return Boolean(window.puter && window.puter.ai && typeof window.puter.ai.chat === "function");
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatDate(dateValue) {
  if (!dateValue) return "—";
  const locale = getLanguagePack().htmlLang;
  return new Date(dateValue).toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" });
}

function toDateInputValue(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function formatHours(value) {
  const num = Number(value || 0);
  return Number.isInteger(num) ? `${num}h` : `${num.toFixed(1)}h`;
}

function formatTimeRange(startMinutes, durationHours) {
  const endMinutes = startMinutes + Math.round(Number(durationHours || 1) * 60);
  return `${formatClock(startMinutes)}-${formatClock(endMinutes)}`;
}

function formatClock(totalMinutes) {
  const minutes = Math.max(0, totalMinutes);
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function parseClock(value) {
  const [hour, minute] = String(value || "00:00").split(":").map(Number);
  return (hour || 0) * 60 + (minute || 0);
}

function formatTimer(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function setPreviewLanguage(language) {
  appState.previewLanguage = language;
  localStorage.setItem(UI_LANGUAGE_STORAGE_KEY, language);
  renderApp();
}

function setFlash(message, tone = "success") {
  appState.flash = message;
  appState.flashTone = tone;
  renderApp();
  window.clearTimeout(setFlash.timeoutId);
  setFlash.timeoutId = window.setTimeout(() => {
    appState.flash = "";
    renderApp();
  }, 2600);
}

function setRoute(route, options = {}) {
  appState.route = route;
  if (options.editingSubjectId !== undefined) {
    appState.editingSubjectId = options.editingSubjectId;
  }
  renderApp();
}

function isOnboarded(user) {
  return Boolean(
    user &&
      user.academicLevel &&
      user.preferredLanguage &&
      user.studyGoal &&
      Number(user.dailyAvailableHours) > 0
  );
}

function clearSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
  window.clearInterval(appState.focusIntervalId);
  appState.sessionToken = "";
  appState.user = null;
  appState.subjects = [];
  appState.plans = [];
  appState.tasks = [];
  appState.calendarBlocks = [];
  appState.chatHistory = [];
  appState.rewardHistory = [];
  appState.friends = [];
  appState.friendMessages = [];
  appState.recurringBlocks = [];
  appState.miniChatPreview = "";
  appState.profileAvatar = "";
  appState.achievementsUnlocked = [];
  appState.achievementPopup = "";
  appState.devVerificationCode = "";
  appState.devResetCode = "";
  appState.latestPlan = null;
  appState.aiPending = false;
  appState.focusRunning = false;
  appState.focusIntervalId = null;
  appState.focusMode = "focus";
  appState.focusType = "Exams";
  appState.focusPresetKey = "classic";
  appState.focusSeconds = FOCUS_SECONDS;
  appState.activeFocusSessionKey = "";
  appState.focusCompletionPrompt = null;
  appState.route = "login";
}

function applySession(payload) {
  appState.sessionToken = payload.token;
  localStorage.setItem(SESSION_STORAGE_KEY, payload.token);
  appState.user = payload.user;
  appState.profileAvatar = loadProfileAvatar(payload.user?.email) || payload.user?.avatarUrl || "";
  appState.calendarBlocks = loadCalendarBlocks(payload.user?.email);
  appState.recurringBlocks = loadRecurringBlocks(payload.user?.email);
  appState.achievementsUnlocked = loadAchievements(payload.user?.email);
  appState.devVerificationCode = payload.devVerificationCode || "";
  if (payload.requiresVerification || payload.user?.emailVerified === false) {
    appState.route = "verify-email";
  }
}

function getCalendarStorageKey(email = appState.user?.email) {
  return `${CALENDAR_BLOCKS_STORAGE_KEY}:${email || "guest"}`;
}

function getProfileAvatarStorageKey(email = appState.user?.email) {
  return `${PROFILE_AVATAR_STORAGE_KEY}:${email || "guest"}`;
}

function getRecurringBlocksStorageKey(email = appState.user?.email) {
  return `${RECURRING_BLOCKS_STORAGE_KEY}:${email || "guest"}`;
}

function getAchievementsStorageKey(email = appState.user?.email) {
  return `${ACHIEVEMENTS_STORAGE_KEY}:${email || "guest"}`;
}

function loadProfileAvatar(email = appState.user?.email) {
  return localStorage.getItem(getProfileAvatarStorageKey(email)) || "";
}

function saveProfileAvatar(dataUrl) {
  appState.profileAvatar = dataUrl || "";
  localStorage.setItem(getProfileAvatarStorageKey(), appState.profileAvatar);
}

function loadRecurringBlocks(email = appState.user?.email) {
  try {
    return JSON.parse(localStorage.getItem(getRecurringBlocksStorageKey(email)) || "[]");
  } catch {
    return [];
  }
}

function saveRecurringBlocks() {
  localStorage.setItem(getRecurringBlocksStorageKey(), JSON.stringify(appState.recurringBlocks || []));
}

function loadAchievements(email = appState.user?.email) {
  try {
    return JSON.parse(localStorage.getItem(getAchievementsStorageKey(email)) || "[]");
  } catch {
    return [];
  }
}

function saveAchievements() {
  localStorage.setItem(getAchievementsStorageKey(), JSON.stringify(appState.achievementsUnlocked || []));
}

function loadCalendarBlocks(email = appState.user?.email) {
  try {
    return JSON.parse(localStorage.getItem(getCalendarStorageKey(email)) || "[]");
  } catch (error) {
    return [];
  }
}

function saveCalendarBlocks() {
  localStorage.setItem(getCalendarStorageKey(), JSON.stringify(appState.calendarBlocks));
}

async function initializeApp() {
  await loadConfig();
  hydrateOAuthRedirectSession();
  if (appState.sessionToken) {
    try {
      await refreshBootstrap();
    } catch (error) {
      if (error.code === "email_not_verified") {
        appState.route = "verify-email";
      } else {
        clearSession();
      }
    }
  }
  renderApp();
}

function hydrateOAuthRedirectSession() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  const authError = params.get("authError");

  if (token) {
    appState.sessionToken = token;
    localStorage.setItem(SESSION_STORAGE_KEY, token);
    setFlash("Signed in with Google.");
  }

  if (authError) {
    setFlash(authError, "warning");
  }

  if (token || authError) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

async function loadConfig() {
  try {
    appState.config = await apiRequest("/api/config");
  } catch (error) {
    appState.config = { hasOpenAIKey: false, apiReady: false, foundationReady: false, puterAvailable: false };
    if (window.location.protocol === "file:") {
      setFlash("Open the app through http://localhost:3000 so login and signup can reach the server.", "warning");
    }
  }
  appState.config.puterAvailable = hasPuterAI();
}

async function refreshBootstrap() {
  const payload = await apiRequest("/api/bootstrap");
  appState.user = payload.user;
  appState.subjects = payload.subjects || [];
  appState.plans = payload.plans || [];
  appState.tasks = payload.tasks || [];
  appState.chatHistory = payload.chatHistory || [];
  appState.rewardHistory = payload.rewardHistory || [];
  appState.friends = payload.friends || [];
  appState.friendMessages = payload.friendMessages || [];
  appState.profileAvatar = loadProfileAvatar(payload.user?.email) || payload.user?.avatarUrl || "";
  appState.recurringBlocks = loadRecurringBlocks(payload.user?.email);
  appState.achievementsUnlocked = loadAchievements(payload.user?.email);
  appState.metrics = payload.metrics || appState.metrics;
  appState.latestPlan = appState.plans[0] || null;
  appState.calendarBlocks = payload.calendarBlocks || loadCalendarBlocks();
  if (appState.user?.emailVerified === false) {
    appState.route = "verify-email";
    return;
  }
  if (!localStorage.getItem(UI_LANGUAGE_STORAGE_KEY) && appState.user?.preferredLanguage) {
    appState.previewLanguage = appState.user.preferredLanguage;
    localStorage.setItem(UI_LANGUAGE_STORAGE_KEY, appState.previewLanguage);
  }

  if (!isOnboarded(appState.user)) {
    appState.route = "onboarding";
  } else if (!["home", "subjects", "add-subject", "calendar", "ai", "my-plan", "focus", "profile"].includes(appState.route)) {
    appState.route = "home";
  }
  maybeUnlockAchievements();
}

function getProgressPercent() {
  if (!appState.tasks.length) return 0;
  const done = appState.tasks.filter((task) => task.status === "Done").length;
  return Math.round((done / appState.tasks.length) * 100);
}

function getNextExam() {
  return [...appState.subjects].sort((a, b) => new Date(a.examDate) - new Date(b.examDate))[0];
}

function getTasksForLatestPlan() {
  if (!appState.latestPlan) return [];
  return appState.tasks.filter((task) => task.relatedPlan === appState.latestPlan.id);
}

function getPendingFocusTask() {
  return appState.tasks.find((task) => task.status !== "Done") || getTasksForLatestPlan()[0] || null;
}

function getFocusPreset() {
  return FOCUS_PRESETS.find((preset) => preset.key === appState.focusPresetKey) || FOCUS_PRESETS[1];
}

function getFocusModeTotalSeconds() {
  const preset = getFocusPreset();
  return appState.focusMode === "break" ? preset.breakSeconds : preset.focusSeconds;
}

function getFocusTypeLabel() {
  const focusType = FOCUS_TYPES.find((type) => type.key === appState.focusType) || FOCUS_TYPES[0];
  return `${focusType.icon} ${text(focusType.labelKey)}`;
}

function getFocusTaskLabel() {
  const focusTask = getPendingFocusTask();
  if (focusTask) return `${focusTask.subject} - ${formatHours(focusTask.duration)}`;
  if (appState.focusType === "Assignments") return "📌 Assignment planning block";
  if (appState.focusType === "Daily study") return "🌱 Daily review block";
  if (appState.focusType === "Mixed") return "✨ Mixed study block";
  return text("noFocusTask");
}

function getGamificationStats() {
  const totalTasks = appState.tasks.length;
  const completedTasks = appState.tasks.filter((task) => task.status === "Done").length;
  const xp = (appState.rewardHistory || []).reduce((sum, reward) => sum + Number(reward.xp || 0), 0);
  const coins = (appState.rewardHistory || []).reduce((sum, reward) => sum + Number(reward.coins || 0), 0);
  const completedPercent = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const currentTier = getTierByXp(xp);
  const nextTier = getNextTier(currentTier);
  const xpInTier = xp - currentTier.min;
  const xpSpan = Number.isFinite(currentTier.max) ? Math.max(1, currentTier.max - currentTier.min + 1) : 1000;
  const tierProgressPercent = Math.max(0, Math.min(100, Math.round((xpInTier / xpSpan) * 100)));
  const xpToNextTier = nextTier ? Math.max(0, nextTier.min - xp) : 0;
  const streak = completedTasks ? Math.max(1, Math.min(7, completedTasks)) : 0;

  return {
    totalTasks,
    completedTasks,
    completedPercent,
    xp,
    coins,
    streak,
    level: `${currentTier.badge} ${currentTier.name}`,
    tier: currentTier,
    nextTier,
    xpToNextTier,
    tierProgressPercent,
  };
}

function getTierByXp(xp) {
  return XP_TIERS.find((tier) => xp >= tier.min && xp <= tier.max) || XP_TIERS[0];
}

function getNextTier(currentTier) {
  const index = XP_TIERS.findIndex((tier) => tier.name === currentTier.name);
  if (index < 0 || index >= XP_TIERS.length - 1) return null;
  return XP_TIERS[index + 1];
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getRewardsForToday() {
  const day = todayKey();
  return (appState.rewardHistory || []).filter((reward) => String(reward.createdDate || "").slice(0, 10) === day);
}

function getFocusStats() {
  const rewards = appState.rewardHistory || [];
  const focusRewards = rewards.filter((reward) => reward.activityType === "focus_session");
  const today = todayKey();
  const xpToday = rewards
    .filter((reward) => String(reward.createdDate || "").slice(0, 10) === today)
    .reduce((sum, reward) => sum + Number(reward.xp || 0), 0);
  const coinsToday = rewards
    .filter((reward) => String(reward.createdDate || "").slice(0, 10) === today)
    .reduce((sum, reward) => sum + Number(reward.coins || 0), 0);
  const focusTask = getPendingFocusTask();
  return {
    sessionsTotal: focusRewards.length,
    xpToday,
    coinsToday,
    currentTask: focusTask ? focusTask.subject : text("freeDay"),
    timerLabel: `${getFocusPreset().label} (${text("focusSession")})`,
    status: appState.focusRunning
      ? `${text("focusSession")} • ${formatTimer(appState.focusSeconds)}`
      : appState.focusMode === "break"
        ? text("breakSession")
        : text("taskPending"),
  };
}

function hasRewardActivity(activityKey) {
  return (appState.rewardHistory || []).some((reward) => reward.activityKey === activityKey);
}

function maybeUnlockAchievements() {
  const unlocked = new Set(appState.achievementsUnlocked || []);
  const game = getGamificationStats();
  const focusSessions = (appState.rewardHistory || []).filter((reward) => reward.activityType === "focus_session").length;
  const completedTasks = appState.tasks.filter((task) => task.status === "Done").length;
  const days = new Set((appState.rewardHistory || []).map((reward) => String(reward.createdDate || "").slice(0, 10)).filter(Boolean));
  const currentTier = game.tier?.name || "";

  const checks = [
    { key: "first_spark", ok: completedTasks >= 1 },
    { key: "focus_starter", ok: focusSessions >= 1 },
    { key: "streak_3", ok: days.size >= 3 },
    { key: "streak_7", ok: days.size >= 7 },
    { key: "exam_fighter", ok: completedTasks >= 10 },
    { key: "deep_focus", ok: focusSessions >= 5 },
    { key: "study_hero", ok: game.xp >= 500 },
    { key: "calendar_master", ok: (appState.calendarBlocks || []).length + (appState.recurringBlocks || []).length >= 5 },
    { key: "social_learner", ok: (appState.friends || []).length >= 1 },
    { key: "legend_mode", ok: currentTier === "Legend" },
  ];

  const newlyUnlocked = checks.filter((item) => item.ok && !unlocked.has(item.key));
  if (!newlyUnlocked.length) return;
  for (const item of newlyUnlocked) {
    unlocked.add(item.key);
  }
  appState.achievementsUnlocked = [...unlocked];
  saveAchievements();
  const firstTitle = ACHIEVEMENTS.find((item) => item.key === newlyUnlocked[0].key)?.title;
  appState.achievementPopup = firstTitle || "";
}

function getMotivationMessage() {
  const messages = [
    "I'll help you take the next small step 🌱",
    "Let's make this plan lighter today 🧘",
    "You're not behind — we'll reorganize smartly ✨",
    "Great work. One focused session counts ✅",
    text("nextRightStep"),
  ];
  const index = (appState.tasks.length + appState.subjects.length + getGamificationStats().completedTasks) % messages.length;
  return messages[index];
}

function getDifficultyLabel(value) {
  return formatDifficulty(value);
}

function formatDifficulty(value) {
  if (value === "Easy") return "Easy 🌱";
  if (value === "Hard") return "Hard 🔥";
  return "Medium ⚡";
}

function formatPriority(value) {
  if (value === "Low") return "Low 🌿";
  if (value === "High") return "High 🔥";
  return "Medium ⚡";
}

function getPlanMood() {
  const tasks = getTasksForLatestPlan();
  const nextExam = getNextExam();
  const daysToNextExam = nextExam ? daysUntilDate(nextExam.examDate) : 99;
  const totalHours = tasks.reduce((sum, task) => sum + Number(task.duration || 0), 0);

  if (tasks.length >= 4 || daysToNextExam <= 3 || totalHours >= 5) return "🔥 Exam mode";
  if (tasks.length >= 2 || totalHours >= 2.5) return "⚡ Balanced plan";
  if ((appState.latestPlan?.aiSummary || "").toLowerCase().includes("calm")) return "🧘 Calm revision";
  return "🌿 Light plan";
}

function getAiThinkingText() {
  const options = [text("aiThinking"), text("aiThinkingAltOne"), text("aiThinkingAltTwo")];
  return options[Math.floor(Date.now() / 1000) % options.length];
}

function daysUntilDate(dateValue) {
  if (!dateValue) return 99;
  const today = new Date();
  const target = new Date(dateValue);
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / 86400000);
}

function getMonthDays(dateValue = appState.selectedCalendarDate) {
  const anchor = new Date(`${dateValue}T12:00:00`);
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];

  for (let i = 0; i < firstDay.getDay(); i += 1) {
    days.push(null);
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(toDateInputValue(new Date(year, month, day)));
  }

  return days;
}

function getCalendarBlocksForDate(dateValue) {
  const direct = appState.calendarBlocks.filter((block) => block.date === dateValue);
  const recurring = expandRecurringBlocksForDate(dateValue);
  return [...direct, ...recurring];
}

function getCalendarDayIndicator(events) {
  if (!events.length) return "🌿";
  const types = new Set(events.map((event) => event.type));
  if (types.has("exam")) return "📝";
  if (types.has("study")) return "📚";
  if (types.has("block")) return "🚫";
  return "🌿";
}

function getRecurringBlockSummary() {
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return (appState.recurringBlocks || []).slice(0, 6).map((block) => {
    const firstDay = dayNames[new Date(`${block.date}T12:00:00`).getDay()] || "";
    const cadence =
      block.repeat === "daily"
        ? "every day"
        : block.repeat === "weekdays"
          ? "selected weekdays"
          : `every ${firstDay}`;
    return `${getCalendarCategoryIcon(block.category)} ${block.title} ${cadence} ${block.startTime}–${block.endTime}`;
  });
}

function getCalendarCategoryIcon(category) {
  const value = String(category || "").toLowerCase();
  if (value.includes("school") || value.includes("university")) return "🎓";
  if (value.includes("work")) return "💼";
  if (value.includes("gym")) return "🏋️";
  if (value.includes("family")) return "👥";
  if (value.includes("free")) return "🌿";
  return "🚫";
}

function expandRecurringBlocksForDate(dateValue) {
  const target = new Date(`${dateValue}T12:00:00`);
  const dayIndex = target.getDay();
  return (appState.recurringBlocks || []).filter((rule) => {
    const start = new Date(`${rule.date}T12:00:00`);
    if (target < start) return false;
    if (rule.repeatEndDate) {
      const end = new Date(`${rule.repeatEndDate}T12:00:00`);
      if (target > end) return false;
    }
    if (rule.repeat === "daily") return true;
    if (rule.repeat === "weekly") return start.getDay() === dayIndex;
    if (rule.repeat === "weekdays") return Array.isArray(rule.repeatWeekdays) && rule.repeatWeekdays.includes(dayIndex);
    return false;
  }).map((rule) => ({
    id: `${rule.id}:${dateValue}`,
    title: rule.title,
    date: dateValue,
    startTime: rule.startTime,
    endTime: rule.endTime,
    category: rule.category,
    notes: rule.notes,
    recurring: true,
  }));
}

function expandRecurringBlocksForDateRange(daysAhead = 14) {
  const items = [];
  const base = new Date();
  for (let i = 0; i < daysAhead; i += 1) {
    const date = new Date(base);
    date.setDate(base.getDate() + i);
    const dateValue = toDateInputValue(date);
    items.push(...expandRecurringBlocksForDate(dateValue));
  }
  return items;
}

function getPlanTasksForDate(dateValue) {
  const planTasks = [];
  if (appState.latestPlan?.weeklyPlan) {
    for (const day of appState.latestPlan.weeklyPlan) {
      if (toDateInputValue(day.date) === dateValue) {
        for (const task of day.tasks || []) {
          planTasks.push({ subject: task.subject, duration: Number(task.duration || 1), priority: task.priority || "Medium" });
        }
      }
    }
  }

  for (const task of appState.tasks) {
    if (toDateInputValue(task.date) === dateValue && !planTasks.some((entry) => entry.subject === task.subject)) {
      planTasks.push({ subject: task.subject, duration: Number(task.duration || 1), priority: "Medium", status: task.status });
    }
  }

  return planTasks;
}

function getBusyWindows(dateValue) {
  return getCalendarBlocksForDate(dateValue)
    .filter((block) => block.startTime && block.endTime && String(block.category || "").toLowerCase() !== "free")
    .map((block) => ({
      start: parseClock(block.startTime),
      end: parseClock(block.endTime),
      title: block.title,
    }));
}

function overlapsWindow(start, end, windowItem) {
  return start < windowItem.end && end > windowItem.start;
}

function assignStudyTime(dateValue, durationHours, usedWindows = []) {
  const busyWindows = [...getBusyWindows(dateValue), ...usedWindows];
  const windows = [
    { start: 8 * 60, end: 12 * 60 },
    { start: 12 * 60, end: 17 * 60 },
    { start: 17 * 60, end: 22 * 60 },
  ];
  const durationMinutes = Math.max(30, Math.round(Number(durationHours || 1) * 60));

  for (const windowItem of windows) {
    for (let start = windowItem.start; start + durationMinutes <= windowItem.end; start += 30) {
      const end = start + durationMinutes;
      if (!busyWindows.some((busy) => overlapsWindow(start, end, busy))) {
        return { start, end, conflict: false };
      }
    }
  }

  const fallbackStart = 18 * 60;
  const fallbackEnd = fallbackStart + durationMinutes;
  return {
    start: fallbackStart,
    end: fallbackEnd,
    conflict: busyWindows.some((busy) => overlapsWindow(fallbackStart, fallbackEnd, busy)),
    noWindowFound: true,
  };
}

function getCalendarEventsForDate(dateValue) {
  const events = [];
  const usedWindows = [];

  for (const subject of appState.subjects) {
    if (subject.examDate === dateValue) {
      events.push({
        type: "exam",
        label: `📝 ${subject.subjectName} ${text("examEvent")}`,
        meta: `${formatDifficulty(subject.difficulty)} • ${formatPriority(subject.priority)}`,
      });
    }
  }

  for (const block of getCalendarBlocksForDate(dateValue)) {
    events.push({
      type: "block",
      id: block.id,
      label: `${block.category || text("busyBlock")} ${block.title}`,
      meta: `${block.startTime || ""}${block.endTime ? `-${block.endTime}` : ""}`,
      notes: block.notes,
    });
  }

  for (const task of getPlanTasksForDate(dateValue)) {
    const assigned = assignStudyTime(dateValue, task.duration, usedWindows);
    usedWindows.push({ start: assigned.start, end: assigned.end });
    events.push({
      type: "study",
      label: `📚 ${task.subject}`,
      meta: `${formatTimeRange(assigned.start, task.duration)} • ${formatHours(task.duration)} • ${formatPriority(task.priority)}`,
      conflict: assigned.conflict,
      noWindowFound: Boolean(assigned.noWindowFound),
    });
  }

  return events;
}

function getFreeWindows(dateValue) {
  const busyWindows = getBusyWindows(dateValue);
  const windows = [
    { label: "Morning", start: 8 * 60, end: 12 * 60 },
    { label: "Afternoon", start: 12 * 60, end: 17 * 60 },
    { label: "Evening", start: 17 * 60, end: 22 * 60 },
  ];
  return windows
    .map((windowItem) => {
      const overlap = busyWindows.some((busy) => overlapsWindow(windowItem.start, windowItem.end, busy));
      return { ...windowItem, free: !overlap };
    })
    .filter((windowItem) => windowItem.free)
    .map((windowItem) => `${windowItem.label} (${formatClock(windowItem.start)}-${formatClock(windowItem.end)})`);
}

function getCalendarStudyHours(dateValue) {
  return getPlanTasksForDate(dateValue).reduce((sum, task) => sum + Number(task.duration || 0), 0);
}

function getAiModeLabel() {
  if (appState.config.apiReady) return text("aiModeOpenAI");
  if (appState.config.puterAvailable) return text("aiModePuter");
  return text("aiModeLocal");
}

function getAiModeDescription() {
  if (appState.config.apiReady) return text("openAiEnabledText");
  if (appState.config.puterAvailable) return text("puterEnabledText");
  return text("localFallbackText");
}

function buildStudyPlanPromptForClient() {
  const subjects = appState.subjects
    .map(
      (subject) =>
        `- ${subject.subjectName} | Exam: ${subject.examDate} | Difficulty: ${subject.difficulty} | Priority: ${subject.priority} | Daily hours: ${subject.dailyHours} | Notes: ${subject.notes || "None"}`
    )
    .join("\n");

  return `Student profile:
Academic level: ${appState.user?.academicLevel}
Preferred language: ${appState.user?.preferredLanguage}
Study goal: ${appState.user?.studyGoal}
Daily available hours: ${appState.user?.dailyAvailableHours}

Subjects:
${subjects}

Return JSON only with this exact shape:
{
  "aiSummary": "string",
  "weeklyPlan": [
    {
      "dayName": "Monday",
      "tasks": [
        { "subject": "Math", "duration": 2, "priority": "High" }
      ]
    }
  ],
  "todayTasks": [
    { "subject": "Math", "duration": 2 }
  ],
  "studyTips": ["tip 1", "tip 2", "tip 3"],
  "motivationMessage": "string"
}`;
}

function buildCoachPromptForClient(message) {
  const subjects = appState.subjects
    .map((subject) => `${subject.subjectName} (${subject.difficulty}, ${subject.priority}, exam ${subject.examDate})`)
    .join(", ");

  return `Student profile:
Name: ${appState.user?.fullName}
Academic level: ${appState.user?.academicLevel || "Unknown"}
Preferred language: ${appState.user?.preferredLanguage || "English"}
Study goal: ${appState.user?.studyGoal || "Mixed"}
Daily available hours: ${appState.user?.dailyAvailableHours || "Unknown"}
Subjects: ${subjects || "No subjects added yet"}

Student message:
${message}

Reply like a supportive academic study coach. Be clear, practical, and motivating without overloading the student.`;
}

function extractAiText(result) {
  if (typeof result === "string") return result.trim();
  if (result && typeof result.message?.content === "string") return result.message.content.trim();
  if (result && typeof result.text === "string") return result.text.trim();
  return String(result || "").trim();
}

function parseJsonFromAiText(textValue) {
  const trimmed = textValue.trim();
  try {
    return JSON.parse(trimmed);
  } catch (error) {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("The AI response could not be parsed into a study plan.");
  }
}

async function puterChat(prompt) {
  if (!hasPuterAI()) throw new Error("Puter.js is not available in this browser session.");
  const result = await window.puter.ai.chat(prompt, { model: "gpt-5-nano" });
  return extractAiText(result);
}

function renderFlash() {
  if (!appState.flash) return "";
  const className = appState.flashTone === "warning" ? "alert" : "message-banner";
  return `<div class="${className}">${escapeHtml(appState.flash)}</div>`;
}

function renderBrandMark(size = "small") {
  return `
    <div class="brand-mark brand-mark--${size}">
      <img src="${LOGO_SRC}" alt="StudySpark logo" />
      <div>
        <strong>${escapeHtml(BRAND_NAME)}</strong>
        <span>${escapeHtml(BRAND_TAGLINE)}</span>
      </div>
    </div>
  `;
}

function renderTopHeader() {
  if (!appState.user || !isOnboarded(appState.user)) return "";
  return `
    <header class="top-header">
      ${renderBrandMark("small")}
      <div class="top-header__actions">
        <button class="icon-btn" data-nav="calendar" aria-label="Open Calendar">🗓️</button>
        <button class="top-avatar" data-nav="profile" aria-label="Open Profile">
          ${
            appState.profileAvatar
              ? `<img src="${escapeHtml(appState.profileAvatar)}" alt="Profile avatar" />`
              : "👤"
          }
        </button>
      </div>
    </header>
  `;
}

function renderLanguagePicker() {
  return `
    <div class="language-switcher">
      ${["English", "Hebrew", "Arabic"]
        .map(
          (language) => `
        <button class="language-switcher__button ${getUiLanguage() === language ? "active" : ""}" data-ui-language="${language}">
          ${escapeHtml(localizedLanguageOption(language))}
        </button>
      `
        )
        .join("")}
    </div>
  `;
}

function renderAuthScreen(type) {
  const register = type === "register";
  return `
    <section class="screen auth-layout">
      ${renderLanguagePicker()}
      <div class="hero-card">
        ${renderBrandMark("large")}
        <h1 class="title">${escapeHtml(BRAND_NAME)}</h1>
        <p class="subtitle muted-light">${escapeHtml(BRAND_TAGLINE)}</p>
        <p class="subtitle muted-light">${escapeHtml(text("heroText"))}</p>
      </div>
      ${renderFlash()}
      <div class="auth-card">
        <div class="auth-card__intro">
          <h2>${escapeHtml(register ? text("registerTitle") : text("loginTitle"))}</h2>
          <p class="subtitle">${escapeHtml(register ? text("registerText") : text("loginText"))}</p>
        </div>
        <form class="field-grid" data-form="${register ? "register" : "login"}">
          ${
            register
              ? `
                <div class="field">
                  <label for="fullName">${escapeHtml(text("fullName"))}</label>
                  <input id="fullName" name="fullName" type="text" required />
                </div>
              `
              : ""
          }
          <div class="field">
            <label for="email">${escapeHtml(text("email"))}</label>
            <input id="email" name="email" type="email" required />
          </div>
          <div class="field">
            <label for="password">${escapeHtml(text("password"))}</label>
            <input id="password" name="password" type="password" required />
          </div>
          ${
            register
              ? `
                <div class="field">
                  <label for="confirmPassword">${escapeHtml(text("confirmPassword"))}</label>
                  <input id="confirmPassword" name="confirmPassword" type="password" required />
                </div>
                <p class="helper">🔐 Use at least 8 characters with one letter and one number.</p>
              `
              : ""
          }
          <button class="btn" type="submit">${escapeHtml(register ? text("signUp") : text("logIn"))}</button>
          <button class="btn btn-secondary" type="button" data-action="google-login">Continue with Google</button>
        </form>
        <p class="helper" style="margin-top:16px;">
          ${
            register
              ? `${escapeHtml(text("alreadyHaveAccount"))} <button class="text-button" data-nav="login">${escapeHtml(text("logIn"))}</button>`
              : `${escapeHtml(text("dontHaveAccount"))} <button class="text-button" data-nav="register">${escapeHtml(text("signUp"))}</button>`
          }
        </p>
        ${
          register
            ? ""
            : `<p class="helper"><button class="text-button" data-nav="forgot-password">Forgot password?</button></p>`
        }
      </div>
    </section>
  `;
}

function renderVerifyEmailScreen() {
  return `
    <section class="screen auth-layout">
      ${renderLanguagePicker()}
      <div class="auth-card">
        ${renderBrandMark("large")}
        <div class="auth-card__intro">
          <h2>📩 Verify your email</h2>
          <p class="subtitle">Enter the 6-digit code we sent to ${escapeHtml(appState.user?.email || "your email")}.</p>
        </div>
        ${renderFlash()}
        <form class="field-grid" data-form="verify-email">
          ${
            appState.devVerificationCode
              ? `<div class="message-banner">Local test code: <strong>${escapeHtml(appState.devVerificationCode)}</strong></div>`
              : ""
          }
          <div class="field">
            <label for="verificationCode">Verification code</label>
            <input id="verificationCode" name="code" type="text" inputmode="numeric" maxlength="6" value="${escapeHtml(appState.devVerificationCode)}" required />
          </div>
          <button class="btn" type="submit">Verify email ✅</button>
          <button class="btn btn-secondary" type="button" data-action="resend-verification">Resend code</button>
        </form>
        <p class="helper">Tip: in local development, codes also appear in the server console if SMTP is not configured.</p>
      </div>
    </section>
  `;
}

function renderForgotPasswordScreen() {
  return `
    <section class="screen auth-layout">
      ${renderLanguagePicker()}
      <div class="auth-card">
        ${renderBrandMark("large")}
        <div class="auth-card__intro">
          <h2>🔑 Forgot password?</h2>
          <p class="subtitle">Enter your email and we’ll send a reset code if the account exists.</p>
        </div>
        ${renderFlash()}
        <form class="field-grid" data-form="forgot-password">
          <div class="field">
            <label for="forgotEmail">${escapeHtml(text("email"))}</label>
            <input id="forgotEmail" name="email" type="email" required />
          </div>
          <button class="btn" type="submit">Send reset code</button>
        </form>
        <p class="helper"><button class="text-button" data-nav="login">Back to login</button></p>
      </div>
    </section>
  `;
}

function renderResetPasswordScreen() {
  return `
    <section class="screen auth-layout">
      ${renderLanguagePicker()}
      <div class="auth-card">
        ${renderBrandMark("large")}
        <div class="auth-card__intro">
          <h2>🛡️ Reset password</h2>
          <p class="subtitle">Use the 6-digit code from your email and choose a stronger password.</p>
        </div>
        ${renderFlash()}
        <form class="field-grid" data-form="reset-password">
          <div class="field">
            <label for="resetEmail">${escapeHtml(text("email"))}</label>
            <input id="resetEmail" name="email" type="email" value="${escapeHtml(appState.resetEmail)}" required />
          </div>
          <div class="field">
            <label for="resetCode">Reset code</label>
            <input id="resetCode" name="code" type="text" inputmode="numeric" maxlength="6" value="${escapeHtml(appState.devResetCode)}" required />
          </div>
          ${
            appState.devResetCode
              ? `<div class="message-banner">Local test reset code: <strong>${escapeHtml(appState.devResetCode)}</strong></div>`
              : ""
          }
          <div class="field">
            <label for="newPassword">New password</label>
            <input id="newPassword" name="password" type="password" required />
          </div>
          <p class="helper">🔐 At least 8 characters with one letter and one number.</p>
          <button class="btn" type="submit">Update password</button>
        </form>
        <p class="helper"><button class="text-button" data-nav="login">Back to login</button></p>
      </div>
    </section>
  `;
}

function renderOnboarding() {
  const user = appState.user || {};
  return `
    <section class="screen">
      ${renderLanguagePicker()}
      <div class="screen-header">
        <div class="screen-header__copy">
          <span class="pill">1 / 1</span>
          <h1 class="title">${escapeHtml(text("onboardingTitle"))}</h1>
          <p class="subtitle">${escapeHtml(text("onboardingText"))}</p>
        </div>
      </div>
      ${renderFlash()}
      <div class="card">
        <form class="field-grid" data-form="onboarding">
          <div class="field">
            <label for="academicLevel">${escapeHtml(text("academicLevel"))}</label>
            <select id="academicLevel" name="academicLevel" required>
              <option value="School" ${user.academicLevel === "School" ? "selected" : ""}>${escapeHtml(text("school"))}</option>
              <option value="University" ${user.academicLevel === "University" ? "selected" : ""}>${escapeHtml(text("university"))}</option>
            </select>
          </div>
          <div class="field">
            <label for="preferredLanguage">${escapeHtml(text("preferredLanguage"))}</label>
            <select id="preferredLanguage" name="preferredLanguage" required>
              <option value="Arabic" ${user.preferredLanguage === "Arabic" ? "selected" : ""}>${escapeHtml(localizedLanguageOption("Arabic"))}</option>
              <option value="English" ${user.preferredLanguage === "English" ? "selected" : ""}>${escapeHtml(localizedLanguageOption("English"))}</option>
              <option value="Hebrew" ${user.preferredLanguage === "Hebrew" ? "selected" : ""}>${escapeHtml(localizedLanguageOption("Hebrew"))}</option>
            </select>
          </div>
          <div class="field">
            <label for="studyGoal">${escapeHtml(text("studyGoal"))}</label>
            <select id="studyGoal" name="studyGoal" required>
              <option value="Exams" ${user.studyGoal === "Exams" ? "selected" : ""}>${escapeHtml(text("exams"))}</option>
              <option value="Assignments" ${user.studyGoal === "Assignments" ? "selected" : ""}>${escapeHtml(text("assignments"))}</option>
              <option value="Daily study" ${user.studyGoal === "Daily study" ? "selected" : ""}>${escapeHtml(text("dailyStudy"))}</option>
              <option value="Mixed" ${user.studyGoal === "Mixed" ? "selected" : ""}>${escapeHtml(text("mixed"))}</option>
            </select>
          </div>
          <div class="field">
            <label for="dailyAvailableHours">${escapeHtml(text("dailyAvailableHours"))}</label>
            <input id="dailyAvailableHours" name="dailyAvailableHours" type="number" min="1" max="12" step="0.5" value="${escapeHtml(user.dailyAvailableHours || "")}" required />
          </div>
          <button class="btn" type="submit">${escapeHtml(text("continue"))}</button>
        </form>
      </div>
    </section>
  `;
}

function renderHome() {
  const nextExam = getNextExam();
  const progress = getProgressPercent();
  const todayTasks = getTasksForLatestPlan();
  const focusTask = getPendingFocusTask();
  const game = getGamificationStats();
  if (appState.reduceCognitiveLoad !== false) {
    return renderCalmHome({ nextExam, progress, todayTasks, focusTask, game });
  }
  return `
    <section class="screen">
      <div class="hero-card">
        <div class="dashboard-avatar">
          ${
            appState.profileAvatar
              ? `<img src="${escapeHtml(appState.profileAvatar)}" alt="Profile avatar" />`
              : "👤"
          }
        </div>
        <div class="hero-card__pill">${escapeHtml(text("greeting"))}</div>
        <h1 class="title">${escapeHtml(BRAND_NAME)}</h1>
        <p class="subtitle muted-light">${escapeHtml(BRAND_TAGLINE)}</p>
        <p class="subtitle muted-light" style="margin-top:16px;">${escapeHtml(text("heroText"))}</p>
        <div class="hero-card__footer">
          <span>${escapeHtml(text("xpPoints"))}: ${game.xp}</span>
          <span>${escapeHtml(text("coins"))}: ${game.coins}</span>
        </div>
      </div>
      ${renderFlash()}
      ${renderAchievementsSummary()}
      <div class="stats-grid">
        <div class="stat-card stat-card--sky">
          <span class="helper">${escapeHtml(text("todayFocusTask"))}</span>
          <strong>${escapeHtml(focusTask ? focusTask.subject : "Free")}</strong>
          <p class="subtitle">${escapeHtml(focusTask ? `${formatHours(focusTask.duration)} • ${localizedStatus(focusTask.status)}` : text("freeDay"))}</p>
        </div>
        <div class="stat-card stat-card--pink">
          <span class="helper">${escapeHtml(text("upcomingExams"))}</span>
          <strong>${escapeHtml(nextExam ? formatDate(nextExam.examDate) : "0")}</strong>
          <p class="subtitle">${escapeHtml(nextExam ? `${nextExam.subjectName} ${text("nextExamText")}` : text("addSubjectsDeadlineText"))}</p>
        </div>
        <div class="stat-card stat-card--mint">
          <span class="helper">${escapeHtml(text("studyStreak"))}</span>
          <strong>${game.streak}</strong>
          <p class="subtitle">${escapeHtml(getMotivationMessage())}</p>
        </div>
        <div class="stat-card stat-card--lavender">
          <span class="helper">${escapeHtml(text("xpPoints"))} / ${escapeHtml(text("levelName"))}</span>
          <strong>${game.xp}</strong>
          <p class="subtitle">${escapeHtml(game.level)} • ${escapeHtml(text("coins"))}: ${game.coins}</p>
        </div>
        <div class="stat-card stat-card--sky">
          <span class="helper">${escapeHtml(text("weeklyProgress"))}</span>
          <strong>${progress}%</strong>
          <div class="progress-bar" style="margin-top:10px;"><span style="width:${progress}%;"></span></div>
        </div>
        <div class="stat-card stat-card--mint">
          <span class="helper">${escapeHtml(text("subjectsCount"))}</span>
          <strong>${appState.subjects.length}</strong>
          <p class="subtitle">${escapeHtml(todayTasks.length ? text("tasksReadyText") : text("generateToStartText"))}</p>
        </div>
      </div>
      <div class="quick-action-grid">
        <button class="btn-secondary" data-nav="add-subject">${escapeHtml(text("addSubject"))}</button>
        <button class="btn-secondary" data-action="generate-plan-inline">${escapeHtml(text("generatePlan"))}</button>
        <button class="btn-secondary" data-action="make-plan-better">${escapeHtml(text("makeItBetter"))}</button>
        <button class="btn" data-nav="ai">${escapeHtml(text("openAi"))}</button>
        <button class="btn-secondary" data-nav="focus">${escapeHtml(text("focusModeButton"))}</button>
        <button class="btn-secondary" data-nav="calendar">${escapeHtml(text("openCalendar"))}</button>
      </div>
      <div class="card">
        <div class="section-title">
          <h3>${escapeHtml(text("askStudySpark"))}</h3>
          <span class="pill">${escapeHtml(getAiModeLabel())}</span>
        </div>
        <div class="stack" style="margin-top:14px;">
          <p class="subtitle">${escapeHtml(text("realProblem"))}</p>
          <p class="subtitle">${escapeHtml(text("targetAudience"))}</p>
          <p class="subtitle">${escapeHtml(text("aiValue"))}</p>
          <p class="subtitle">${escapeHtml(text("uxValue"))}</p>
        </div>
      </div>
      <div class="card mini-chat-widget">
        <div class="section-title">
          <h3>${escapeHtml(text("askStudySparkMini"))}</h3>
          <button class="icon-btn" data-nav="ai">${escapeHtml(text("openFullChat"))}</button>
        </div>
        <form class="ai-chat__form" data-form="home-mini-chat">
          <textarea name="message" placeholder="${escapeHtml(text("miniChatPlaceholder"))}" ${appState.aiPending ? "disabled" : ""} required></textarea>
          <div class="surface-actions surface-actions--two">
            <span class="microcopy">${escapeHtml(text("miniReplyPreview"))}</span>
            <button class="btn" type="submit" ${appState.aiPending ? "disabled" : ""}>${escapeHtml(text("send"))}</button>
          </div>
        </form>
        <p class="subtitle mini-chat-preview">${escapeHtml(appState.miniChatPreview || text("aiEmptyText"))}</p>
      </div>
      <div class="card">
        <div class="section-title">
          <h3>${escapeHtml(text("aiTitle"))}</h3>
          <span class="pill ${appState.config.apiReady ? "pill--success" : appState.config.puterAvailable ? "pill--warning" : "pill--muted"}">${escapeHtml(getAiModeLabel())}</span>
        </div>
        <p class="subtitle" style="margin-top:10px;">${escapeHtml(getAiModeDescription())}</p>
      </div>
    </section>
  `;
}

function renderCalmHome({ nextExam, progress, focusTask, game }) {
  return `
    <section class="screen">
      <div class="screen-header screen-header--quiet">
        <div class="screen-header__copy">
          <span class="pill">${escapeHtml(text("greeting"))}</span>
          <h1 class="title">${escapeHtml(BRAND_NAME)}</h1>
          <p class="subtitle">${escapeHtml(BRAND_TAGLINE)}</p>
        </div>
        <button class="top-avatar top-avatar--home" data-nav="profile" aria-label="Open Profile">
          ${
            appState.profileAvatar
              ? `<img src="${escapeHtml(appState.profileAvatar)}" alt="Profile avatar" />`
              : "👤"
          }
        </button>
      </div>
      ${renderFlash()}
      <article class="card focus-summary-card">
        <div class="section-title">
          <h3>${escapeHtml(text("todayFocusTask"))}</h3>
          <span class="pill">${escapeHtml(focusTask ? localizedStatus(focusTask.status) : text("freeDay"))}</span>
        </div>
        <strong class="summary-primary">${escapeHtml(focusTask ? focusTask.subject : text("freeDay"))}</strong>
        <p class="subtitle">${escapeHtml(focusTask ? `${formatHours(focusTask.duration)} · ${text("nextSmallStep", "Let’s take the next small step 🌱")}` : text("noTasksToday"))}</p>
        <button class="btn" data-nav="focus">${escapeHtml(text("focusModeButton"))}</button>
      </article>
      <div class="calm-grid">
        <article class="card quiet-card">
          <span class="helper">${escapeHtml(text("weeklyProgress"))}</span>
          <div class="summary-row">
            <strong>${progress}%</strong>
            <span>${escapeHtml(game.tier.badge)} ${escapeHtml(game.level)}</span>
          </div>
          <div class="progress-bar"><span style="width:${progress}%;"></span></div>
          <div class="compact-reward-strip">
            <span>${escapeHtml(text("xpPoints"))}: ${game.xp}</span>
            <span>${escapeHtml(text("coins"))}: ${game.coins}</span>
            <span>${escapeHtml(text("studyStreak"))}: ${game.streak}</span>
          </div>
        </article>
        <article class="card quiet-card">
          <span class="helper">${escapeHtml(text("upcomingExams"))}</span>
          <strong class="summary-primary">${escapeHtml(nextExam ? nextExam.subjectName : text("noSubjects"))}</strong>
          <p class="subtitle">${escapeHtml(nextExam ? formatDate(nextExam.examDate) : text("addSubjectsDeadlineText"))}</p>
        </article>
      </div>
      <article class="card">
        <div class="section-title"><h3>${escapeHtml(text("quickActions"))}</h3></div>
        <div class="quick-action-grid quick-action-grid--calm">
          <button class="btn-secondary" data-nav="add-subject">${escapeHtml(text("addSubject"))}</button>
          <button class="btn-secondary" data-action="generate-plan-inline">${escapeHtml(text("generatePlan"))}</button>
          <button class="btn-secondary" data-nav="my-plan">${escapeHtml(text("navPlan"))}</button>
          <button class="btn-secondary" data-nav="calendar">${escapeHtml(text("openCalendar"))}</button>
          <button class="btn-secondary" data-nav="focus">${escapeHtml(text("focusModeButton"))}</button>
          <button class="btn" data-nav="ai">${escapeHtml(text("openAi"))}</button>
        </div>
      </article>
      <article class="card mini-chat-widget mini-chat-widget--compact">
        <div class="section-title">
          <h3>${escapeHtml(text("askStudySparkMini"))}</h3>
          <button class="icon-btn" data-nav="ai">${escapeHtml(text("openFullChat"))}</button>
        </div>
        <form class="ai-chat__form" data-form="home-mini-chat">
          <textarea name="message" placeholder="${escapeHtml(text("miniChatPlaceholder"))}" ${appState.aiPending ? "disabled" : ""} required></textarea>
          <div class="surface-actions surface-actions--two">
            <span class="microcopy">${escapeHtml(text("miniReplyPreview"))}</span>
            <button class="btn" type="submit" ${appState.aiPending ? "disabled" : ""}>${escapeHtml(text("send"))}</button>
          </div>
        </form>
        <p class="subtitle mini-chat-preview">${escapeHtml(appState.miniChatPreview || text("aiEmptyText"))}</p>
      </article>
    </section>
  `;
}

function renderTierCard(game) {
  return `
    <div class="card tier-card">
      <div class="section-title">
        <h3>${escapeHtml(text("currentTier"))}: ${escapeHtml(`${game.tier.badge} ${game.tier.name}`)}</h3>
        <span class="pill" style="border-color:${escapeHtml(game.tier.color)};">${escapeHtml(text("levelName"))}</span>
      </div>
      <p class="microcopy">${escapeHtml(text("tierProgress"))}: ${game.tierProgressPercent}%</p>
      <div class="progress-bar" style="margin-top:10px;"><span style="width:${game.tierProgressPercent}%; background:${escapeHtml(game.tier.color)};"></span></div>
      <p class="subtitle" style="margin-top:10px;">
        ${
          game.nextTier
            ? `${escapeHtml(text("nextTier"))}: ${escapeHtml(`${game.nextTier.badge} ${game.nextTier.name}`)} • ${game.xpToNextTier} ${escapeHtml(text("xpToNextTier"))}`
            : `${escapeHtml(text("nextTier"))}: ${escapeHtml("🏁 Max tier reached")}`
        }
      </p>
    </div>
  `;
}

function renderAchievementsSummary() {
  const unlocked = new Set(appState.achievementsUnlocked || []);
  const unlockedCount = ACHIEVEMENTS.filter((item) => unlocked.has(item.key)).length;
  return `
    <div class="card">
      <div class="section-title">
        <h3>${escapeHtml(text("achievementsTitle"))}</h3>
        <span class="pill">${unlockedCount}/${ACHIEVEMENTS.length}</span>
      </div>
      <p class="subtitle">${escapeHtml(text("achievementUnlocked"))}: ${unlockedCount}</p>
    </div>
  `;
}

function renderAchievementsCard() {
  const unlocked = new Set(appState.achievementsUnlocked || []);
  return `
    <div class="card">
      <div class="section-title">
        <h3>${escapeHtml(text("achievementsTitle"))}</h3>
        <span class="pill">${(appState.achievementsUnlocked || []).length}/${ACHIEVEMENTS.length}</span>
      </div>
      <div class="stack" style="margin-top:10px;">
        ${ACHIEVEMENTS.map((item) => `<div class="achievement-card ${unlocked.has(item.key) ? "achievement-card--on" : ""}"><strong>${escapeHtml(item.title)}</strong><span class="microcopy">${escapeHtml(unlocked.has(item.key) ? text("unlocked") : text("locked"))}</span></div>`).join("")}
      </div>
    </div>
  `;
}

function renderSubjects() {
  return `
    <section class="screen">
      <div class="screen-header">
        <div class="screen-header__copy">
          <h1 class="title">${escapeHtml(text("subjectsTitle"))}</h1>
          <p class="subtitle">${escapeHtml(text("subjectsText"))}</p>
        </div>
        <button class="icon-btn" data-nav="add-subject">＋</button>
      </div>
      ${renderFlash()}
      ${
        appState.subjects.length
          ? `
          <div class="stack">
            ${appState.subjects
              .map(
                (subject) => `
                <article class="subject-card">
                  <div class="subject-card__top">
                    <div>
                      <h3>${escapeHtml(subject.subjectName)}</h3>
                      <p class="subtitle">${escapeHtml(text("examDate"))}: ${escapeHtml(formatDate(subject.examDate))}</p>
                    </div>
                    <div class="profile-meta">
                      <button class="icon-btn" data-edit-subject="${subject.id}">${escapeHtml(text("edit"))}</button>
                      <button class="icon-btn danger" data-delete-subject="${subject.id}">${escapeHtml(text("delete"))}</button>
                    </div>
                  </div>
                  <div class="subject-meta" style="margin-top:14px;">
                    <span class="pill">${escapeHtml(getDifficultyLabel(subject.difficulty))}</span>
                    <span class="pill pill--warning">${escapeHtml(formatPriority(subject.priority))}</span>
                    <span class="pill pill--muted">${escapeHtml(formatHours(subject.dailyHours))}</span>
                  </div>
                  <p class="subtitle" style="margin-top:14px;">${escapeHtml(subject.notes || text("noNotes"))}</p>
                </article>
              `
              )
              .join("")}
          </div>
        `
          : `
          <div class="empty-state">
            <h3 style="margin-top:0;">${escapeHtml(text("noSubjects"))}</h3>
            <p class="subtitle">${escapeHtml(text("noSubjectsText"))}</p>
          </div>
        `
      }
      <button class="btn" data-nav="add-subject">${escapeHtml(text("addSubject"))}</button>
    </section>
  `;
}

function renderAddSubject() {
  const editing = appState.editingSubjectId ? appState.subjects.find((subject) => subject.id === appState.editingSubjectId) : null;
  return `
    <section class="screen">
      <div class="screen-header">
        <div class="screen-header__copy">
          <h1 class="title">${escapeHtml(editing ? text("editSubjectTitle") : text("addSubjectTitle"))}</h1>
          <p class="subtitle">${escapeHtml(text("addSubjectText"))}</p>
        </div>
      </div>
      ${renderFlash()}
      <div class="card">
        <form class="field-grid" data-form="subject">
          <div class="field">
            <label for="subjectName">${escapeHtml(text("subjectName"))}</label>
            <input id="subjectName" name="subjectName" type="text" required value="${escapeHtml(editing?.subjectName || "")}" />
          </div>
          <div class="field">
            <label for="examDate">${escapeHtml(text("examDate"))}</label>
            <input id="examDate" name="examDate" type="date" required value="${escapeHtml(editing?.examDate || "")}" />
          </div>
          <div class="field">
            <label for="difficulty">${escapeHtml(text("difficulty"))}</label>
            <select id="difficulty" name="difficulty" required>
              <option value="Easy" ${editing?.difficulty === "Easy" ? "selected" : ""}>${escapeHtml(formatDifficulty("Easy"))}</option>
              <option value="Medium" ${editing?.difficulty === "Medium" ? "selected" : ""}>${escapeHtml(formatDifficulty("Medium"))}</option>
              <option value="Hard" ${editing?.difficulty === "Hard" ? "selected" : ""}>${escapeHtml(formatDifficulty("Hard"))}</option>
            </select>
          </div>
          <div class="field">
            <label for="priority">${escapeHtml(text("priority"))}</label>
            <select id="priority" name="priority" required>
              <option value="Low" ${editing?.priority === "Low" ? "selected" : ""}>${escapeHtml(formatPriority("Low"))}</option>
              <option value="Medium" ${editing?.priority === "Medium" ? "selected" : ""}>${escapeHtml(formatPriority("Medium"))}</option>
              <option value="High" ${editing?.priority === "High" ? "selected" : ""}>${escapeHtml(formatPriority("High"))}</option>
            </select>
          </div>
          <div class="field">
            <label for="dailyHours">${escapeHtml(text("dailyHours"))}</label>
            <input id="dailyHours" name="dailyHours" type="number" min="0.5" max="8" step="0.5" required value="${escapeHtml(editing?.dailyHours || "")}" />
          </div>
          <div class="field">
            <label for="notes">${escapeHtml(text("notes"))}</label>
            <textarea id="notes" name="notes">${escapeHtml(editing?.notes || "")}</textarea>
          </div>
          <button class="btn" type="submit">${escapeHtml(text("saveSubject"))}</button>
        </form>
      </div>
    </section>
  `;
}

function renderAiMessage(message) {
  const content = String(message.message || "");
  const isLongAssistantMessage = message.role === "assistant" && content.length > 520;
  const preview = isLongAssistantMessage ? `${content.slice(0, 520).trim()}...` : content;
  return `
    <article class="chat-bubble chat-bubble--${message.role === "assistant" ? "assistant" : "user"} ${message.pending ? "chat-bubble--pending" : ""}">
      <strong>${escapeHtml(message.role === "assistant" ? text("aiTitle") : text("you"))}</strong>
      ${
        isLongAssistantMessage
          ? `<p>${escapeHtml(preview)}</p><details class="calm-details chat-more"><summary>${escapeHtml(text("showMore", "Show more"))}</summary><p>${escapeHtml(content)}</p></details>`
          : `<p>${escapeHtml(content)}</p>`
      }
    </article>
  `;
}

function renderAiScreen() {
  const messages = appState.chatHistory.slice(-20);
  return `
    <section class="screen">
      <div class="screen-header">
        <div class="screen-header__copy">
          <h1 class="title">${escapeHtml(text("aiTitle"))}</h1>
          <p class="subtitle">${escapeHtml(text("aiText"))}</p>
        </div>
        <span class="pill ${appState.config.apiReady ? "pill--success" : appState.config.puterAvailable ? "pill--warning" : "pill--muted"}">${escapeHtml(getAiModeLabel())}</span>
      </div>
      ${renderFlash()}
      <details class="card calm-details calm-details--card ai-tools-panel">
        <summary>${escapeHtml(text("aiTools"))}</summary>
        <div class="section-title">
          <button class="icon-btn" data-action="generate-plan-inline">${escapeHtml(text("aiGenerateAction"))}</button>
        </div>
        <p class="microcopy" style="margin-top:10px;">${escapeHtml(getAiModeDescription())}</p>
        <div class="quick-actions quick-actions--scroll" style="margin-top:14px;">
          ${AI_QUICK_ACTIONS.map(
            (action) => `<button class="quick-chip" data-ai-preset="${escapeHtml(action)}" ${appState.aiPending ? "disabled" : ""}>${escapeHtml(action)}</button>`
          ).join("")}
        </div>
      </details>
      <div class="ai-chat card">
        <div class="ai-chat__messages">
          ${
            messages.length
              ? messages.map(renderAiMessage).join("")
              : `
                <div class="empty-state">
                  <h3 style="margin-top:0;">${escapeHtml(text("aiEmptyTitle"))}</h3>
                  <p class="subtitle">${escapeHtml(text("aiEmptyText"))}</p>
                </div>
              `
          }
        </div>
        <form class="ai-chat__form" data-form="chat">
          <textarea name="message" placeholder="${escapeHtml(text("aiInputPlaceholder"))}" ${appState.aiPending ? "disabled" : ""} required></textarea>
          <div class="surface-actions surface-actions--two">
            <button class="btn-secondary" type="button" data-action="clear-chat" ${appState.aiPending ? "disabled" : ""}>${escapeHtml(text("clearChat"))}</button>
            <button class="btn" type="submit" ${appState.aiPending ? "disabled" : ""}>${escapeHtml(text("send"))}</button>
          </div>
        </form>
      </div>
    </section>
  `;
}

function renderTaskCard(task) {
  const done = task.status === "Done";
  return `
    <label class="task-card ${done ? "task-card--done" : ""}">
      <div class="task-card__check">
        <input type="checkbox" data-task-id="${task.id}" ${done ? "checked" : ""} />
      </div>
      <div class="task-card__content">
        <div class="task-card__header">
          <strong>${escapeHtml(task.subject)}</strong>
          <span class="task-card__status ${done ? "task-card__status--done" : "task-card__status--pending"}">${escapeHtml(localizedStatus(task.status))}</span>
        </div>
        <div class="task-card__meta">
          <span class="pill pill--muted">${escapeHtml(text("duration"))}: ${escapeHtml(formatHours(task.duration))}</span>
          <span class="pill ${done ? "pill--success" : "pill--warning"}">${escapeHtml(done ? text("taskDone") : text("taskPending"))}</span>
        </div>
      </div>
    </label>
  `;
}

function renderMyPlan() {
  const tasks = getTasksForLatestPlan();
  if (!appState.latestPlan) {
    return `
      <section class="screen">
        <div class="screen-header">
          <div class="screen-header__copy">
            <h1 class="title">${escapeHtml(text("planTitle"))}</h1>
            <p class="subtitle">${escapeHtml(text("noPlanText"))}</p>
          </div>
        </div>
        <div class="empty-state">
          <h3 style="margin-top:0;">${escapeHtml(text("noPlanYet"))}</h3>
          <p class="subtitle">${escapeHtml(text("noPlanText"))}</p>
        </div>
        <button class="btn" data-nav="ai">${escapeHtml(text("openAi"))}</button>
      </section>
    `;
  }

  if (appState.reduceCognitiveLoad !== false) {
    return renderCalmMyPlan(tasks);
  }

  return `
    <section class="screen">
      <div class="screen-header">
        <div class="screen-header__copy">
          <h1 class="title">${escapeHtml(text("planTitle"))}</h1>
          <p class="subtitle">${escapeHtml(text("builtOn"))} ${escapeHtml(formatDate(appState.latestPlan.createdDate))}</p>
        </div>
        <div class="profile-meta">
          <span class="pill pill--success">${escapeHtml(text("planMood"))}: ${escapeHtml(getPlanMood())}</span>
          <span class="pill ${appState.latestPlan.promptLog?.openAIModel ? "pill--success" : "pill--muted"}">${escapeHtml(appState.latestPlan.promptLog?.openAIModel || appState.latestPlan.promptLog?.model || text("aiModeLocal"))}</span>
        </div>
      </div>
      ${renderFlash()}
      <article class="plan-card">
        <div class="section-title"><h3>${escapeHtml(text("summaryTitle"))}</h3></div>
        <p class="subtitle" style="margin-top:12px;">${escapeHtml(appState.latestPlan.aiSummary)}</p>
      </article>
      <article class="plan-card">
        <div class="section-title"><h3>${escapeHtml(text("weeklyTitle"))}</h3></div>
        <div class="week-grid" style="margin-top:14px;">
          ${appState.latestPlan.weeklyPlan
            .map(
              (day) => `
                <div class="day-card">
                  <strong>${escapeHtml(day.dayName)}</strong>
                  <p class="microcopy">${escapeHtml(formatDate(day.date))}</p>
                  <ul>
                    ${(day.tasks || []).map((task) => `<li>${escapeHtml(task.subject)} - ${escapeHtml(formatHours(task.duration))} ${task.priority ? `• ${escapeHtml(formatPriority(task.priority))}` : ""}</li>`).join("")}
                  </ul>
                </div>
              `
            )
            .join("")}
        </div>
      </article>
      <article class="plan-card">
        <div class="section-title"><h3>${escapeHtml(text("todayTitle"))}</h3></div>
        <div class="list" style="margin-top:14px;">
          ${tasks.length ? tasks.map(renderTaskCard).join("") : `<div class="empty-state"><p class="subtitle">${escapeHtml(text("noTasksToday"))}</p></div>`}
        </div>
        <button class="btn-secondary" style="margin-top:14px;" data-nav="focus">${escapeHtml(text("focusModeButton"))}</button>
        <button class="btn" style="margin-top:10px;" data-action="make-plan-better">${escapeHtml(text("makeItBetter"))}</button>
      </article>
      <article class="plan-card">
        <div class="section-title"><h3>${escapeHtml(text("tipsTitle"))}</h3></div>
        <ul class="tips-list">${(appState.latestPlan.studyTips || []).map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}</ul>
      </article>
      <article class="plan-card">
        <div class="section-title"><h3>${escapeHtml(text("motivationTitle"))}</h3></div>
        <p class="subtitle" style="margin-top:12px;">${escapeHtml(appState.latestPlan.motivationMessage)}</p>
      </article>
    </section>
  `;
}

function renderCalmMyPlan(tasks) {
  return `
    <section class="screen">
      <div class="screen-header screen-header--quiet">
        <div class="screen-header__copy">
          <h1 class="title">${escapeHtml(text("planTitle"))}</h1>
          <p class="subtitle">${escapeHtml(text("builtOn"))} ${escapeHtml(formatDate(appState.latestPlan.createdDate))}</p>
        </div>
        <span class="pill pill--success">${escapeHtml(getPlanMood())}</span>
      </div>
      ${renderFlash()}
      <article class="plan-card plan-card--calm">
        <div class="section-title">
          <h3>${escapeHtml(text("summaryTitle"))}</h3>
          <span class="pill ${appState.latestPlan.promptLog?.openAIModel ? "pill--success" : "pill--muted"}">${escapeHtml(appState.latestPlan.promptLog?.openAIModel || appState.latestPlan.promptLog?.model || text("aiModeLocal"))}</span>
        </div>
        <p class="subtitle">${escapeHtml(appState.latestPlan.aiSummary)}</p>
        <details class="calm-details">
          <summary>${escapeHtml(text("tipsTitle"))}</summary>
          <ul class="tips-list">${(appState.latestPlan.studyTips || []).map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}</ul>
          <p class="subtitle">${escapeHtml(appState.latestPlan.motivationMessage || "")}</p>
        </details>
      </article>
      <article class="plan-card plan-card--calm">
        <div class="section-title">
          <h3>${escapeHtml(text("todayTitle"))}</h3>
          <button class="icon-btn" data-nav="focus">${escapeHtml(text("focusModeButton"))}</button>
        </div>
        <div class="list list--compact">
          ${tasks.length ? tasks.map(renderTaskCard).join("") : `<div class="empty-state"><p class="subtitle">${escapeHtml(text("noTasksToday"))}</p></div>`}
        </div>
      </article>
      <article class="plan-card plan-card--calm">
        <div class="section-title">
          <h3>${escapeHtml(text("weeklyTitle"))}</h3>
          <button class="btn" data-action="make-plan-better">${escapeHtml(text("makeItBetter"))}</button>
        </div>
        <div class="week-grid week-grid--calm">
          ${appState.latestPlan.weeklyPlan
            .map(
              (day) => `
                <div class="day-card day-card--calm">
                  <strong>${escapeHtml(day.dayName)}</strong>
                  <p class="microcopy">${escapeHtml(formatDate(day.date))}</p>
                  <ul>
                    ${(day.tasks || []).map((task) => `<li>${escapeHtml(task.subject)} · ${escapeHtml(formatHours(task.duration))}</li>`).join("")}
                  </ul>
                </div>
              `
            )
            .join("")}
        </div>
      </article>
    </section>
  `;
}

function renderProfileRow(label, value) {
  return `
    <div class="profile-row">
      <span class="helper">${escapeHtml(label)}</span>
      <strong>${escapeHtml(value ?? "-")}</strong>
    </div>
  `;
}

function renderFocusMode() {
  const isBreak = appState.focusMode === "break";
  const progressBase = getFocusModeTotalSeconds();
  const progressPercent = Math.round(((progressBase - appState.focusSeconds) / progressBase) * 100);
  const game = getGamificationStats();

  return `
    <section class="screen">
      <div class="screen-header">
        <div class="screen-header__copy">
          <h1 class="title">${escapeHtml(text("focusTitle"))}</h1>
          <p class="subtitle">${escapeHtml(isBreak ? text("breakSession") : text("focusText"))}</p>
        </div>
        <span class="pill pill--success">${escapeHtml(isBreak ? text("breakSession") : text("focusSession"))}</span>
      </div>
      ${renderFlash()}
      ${renderTierCard(game)}
      <div class="focus-options card">
        <div>
          <p class="microcopy">${escapeHtml(text("focusChooseType"))}</p>
          <div class="quick-actions" style="margin-top:10px;">
            ${FOCUS_TYPES.map(
              (type) => `
                <button class="quick-chip ${appState.focusType === type.key ? "active" : ""}" data-focus-type="${escapeHtml(type.key)}" ${appState.focusRunning ? "disabled" : ""}>
                  ${escapeHtml(`${type.icon} ${text(type.labelKey)}`)}
                </button>
              `
            ).join("")}
          </div>
        </div>
        <div>
          <p class="microcopy">${escapeHtml(text("focusChooseTimer"))}</p>
          <div class="quick-actions" style="margin-top:10px;">
            ${FOCUS_PRESETS.map(
              (preset) => `
                <button class="quick-chip ${appState.focusPresetKey === preset.key ? "active" : ""}" data-focus-preset="${escapeHtml(preset.key)}" ${appState.focusRunning ? "disabled" : ""}>
                  ⏱️ ${escapeHtml(preset.label)}
                </button>
              `
            ).join("")}
          </div>
        </div>
      </div>
      <div class="focus-card">
        <div class="focus-icon">${escapeHtml(isBreak ? "🧘" : "⏱️")}</div>
        <p class="microcopy focus-type-label">${escapeHtml(getFocusTypeLabel())}</p>
        <p class="microcopy focus-task-label">${escapeHtml(getFocusTaskLabel())}</p>
        <strong class="focus-timer" data-focus-timer>${escapeHtml(formatTimer(appState.focusSeconds))}</strong>
        <div class="progress-bar"><span data-focus-progress style="width:${Math.max(0, Math.min(100, progressPercent))}%;"></span></div>
        <p class="subtitle" data-focus-message>${escapeHtml(appState.focusSeconds === 0 ? text("focusComplete") : getMotivationMessage())}</p>
      </div>
      <div class="surface-actions surface-actions--three">
        <button class="btn" data-action="focus-start">${escapeHtml(text("start"))}</button>
        <button class="btn-secondary" data-action="focus-pause">${escapeHtml(text("pause"))}</button>
        <button class="btn-secondary" data-action="focus-reset">${escapeHtml(text("reset"))}</button>
      </div>
      ${
        appState.focusCompletionPrompt
          ? `
          <div class="confirm-modal">
            <div class="confirm-modal__panel">
              <h3>${escapeHtml(text("focusConfirmTitle"))}</h3>
              <p class="subtitle">${escapeHtml(getFocusTaskLabel())}</p>
              <p class="microcopy">${escapeHtml(text("xpPoints"))} +${appState.focusCompletionPrompt.xp} • ${escapeHtml(text("coins"))} +${appState.focusCompletionPrompt.coins}</p>
              <div class="surface-actions surface-actions--two">
                <button class="btn" data-action="focus-complete-yes">${escapeHtml(text("focusConfirmYes"))}</button>
                <button class="btn-secondary" data-action="focus-complete-no">${escapeHtml(text("focusConfirmNo"))}</button>
              </div>
            </div>
          </div>
        `
          : ""
      }
    </section>
  `;
}

function renderCalendar() {
  const monthDays = getMonthDays();
  const selectedEvents = getCalendarEventsForDate(appState.selectedCalendarDate);
  const selectedStudyHours = getCalendarStudyHours(appState.selectedCalendarDate);
  const freeWindows = getFreeWindows(appState.selectedCalendarDate);
  const hasNoWindowTask = selectedEvents.some((event) => event.type === "study" && event.noWindowFound);
  const selectedMonth = new Date(`${appState.selectedCalendarDate}T12:00:00`).toLocaleDateString(getLanguagePack().htmlLang, {
    month: "long",
    year: "numeric",
  });
  const blockTypes = ["School", "University", "Work", "Home", "Gym", "Family", "Busy", "Free"];

  if (appState.reduceCognitiveLoad !== false) {
    return renderCalmCalendar({ monthDays, selectedEvents, selectedStudyHours, freeWindows, hasNoWindowTask, selectedMonth, blockTypes });
  }

  return `
    <section class="screen">
      <div class="screen-header">
        <div class="screen-header__copy">
          <h1 class="title">${escapeHtml(text("calendarTitle"))}</h1>
          <p class="subtitle">${escapeHtml(text("calendarText"))}</p>
        </div>
        <button class="btn-secondary" data-action="make-plan-better">${escapeHtml(text("makeItBetter"))}</button>
      </div>
      ${renderFlash()}
      <div class="calendar-shell card">
        <div class="section-title">
          <h3>${escapeHtml(selectedMonth)}</h3>
          <span class="pill">${escapeHtml(text("totalStudyTime"))}: ${escapeHtml(formatHours(selectedStudyHours))}</span>
        </div>
        <div class="calendar-weekdays">
          ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => `<span>${escapeHtml(day)}</span>`).join("")}
        </div>
        <div class="calendar-grid">
          ${monthDays
            .map((dateValue) => {
              if (!dateValue) return `<div class="calendar-day calendar-day--empty"></div>`;
              const events = getCalendarEventsForDate(dateValue);
              const isToday = dateValue === toDateInputValue(new Date());
              const isSelected = dateValue === appState.selectedCalendarDate;
              return `
                <button class="calendar-day ${isToday ? "calendar-day--today" : ""} ${isSelected ? "calendar-day--selected" : ""}" data-calendar-date="${dateValue}">
                  <strong>${new Date(`${dateValue}T12:00:00`).getDate()}</strong>
                  <span>${events.length ? escapeHtml(events.slice(0, 2).map((event) => event.type === "exam" ? "📝" : event.type === "block" ? "🚫" : "📚").join(" ")) : "🌿"}</span>
                </button>
              `;
            })
            .join("")}
        </div>
      </div>
      <div class="card">
        <div class="section-title">
          <h3>${escapeHtml(text("selectedDay"))}: ${escapeHtml(formatDate(appState.selectedCalendarDate))}</h3>
          <span class="pill">${escapeHtml(selectedEvents.length ? `${selectedEvents.length} items` : text("freeDay"))}</span>
        </div>
        <div class="calendar-event-list" style="margin-top:14px;">
          ${
            selectedEvents.length
              ? selectedEvents
                  .map(
                    (event) => `
                      <div class="calendar-event calendar-event--${event.type}">
                        <strong>${escapeHtml(event.label)}</strong>
                        <span>${escapeHtml(event.meta || "")}</span>
                        ${event.conflict ? `<em>${escapeHtml(text("timeConflict"))}</em>` : ""}
                        ${event.noWindowFound ? `<em>${escapeHtml(text("noStudyWindow"))}</em>` : ""}
                        ${event.notes ? `<p class="microcopy">${escapeHtml(event.notes)}</p>` : ""}
                      </div>
                    `
                  )
                  .join("")
              : `<div class="empty-state"><h3>${escapeHtml(text("freeDay"))}</h3><p class="subtitle">${escapeHtml(text("nextRightStep"))}</p></div>`
          }
        </div>
        <div class="card" style="margin-top:12px;">
          <div class="section-title">
            <h3>${escapeHtml(text("freeWindows"))}</h3>
            <span class="pill">${escapeHtml(freeWindows.length ? `${freeWindows.length}` : "0")}</span>
          </div>
          ${
            freeWindows.length
              ? freeWindows.map((windowText) => `<p class="subtitle">${escapeHtml(windowText)}</p>`).join("")
              : `<p class="subtitle">${escapeHtml(text("calendarFullDay"))}</p>`
          }
          ${hasNoWindowTask ? `<p class="microcopy">${escapeHtml(text("noStudyWindow"))}</p>` : ""}
        </div>
      </div>
      <div class="card">
        <div class="section-title"><h3>${escapeHtml(text("addCalendarBlock"))}</h3></div>
        <form class="field-grid" data-form="calendar-block" style="margin-top:14px;">
          <div class="field">
            <label for="blockTitle">${escapeHtml(text("blockTitle"))}</label>
            <input id="blockTitle" name="title" required />
          </div>
          <div class="field">
            <label for="blockDate">${escapeHtml(text("blockDate"))}</label>
            <input id="blockDate" name="date" type="date" required value="${escapeHtml(appState.selectedCalendarDate)}" />
          </div>
          <div class="surface-actions surface-actions--two">
            <div class="field">
              <label for="blockStart">${escapeHtml(text("blockStart"))}</label>
              <input id="blockStart" name="startTime" type="time" required />
            </div>
            <div class="field">
              <label for="blockEnd">${escapeHtml(text("blockEnd"))}</label>
              <input id="blockEnd" name="endTime" type="time" required />
            </div>
          </div>
          <div class="field">
            <label for="blockCategory">${escapeHtml(text("blockType"))}</label>
            <select id="blockCategory" name="category">
              ${blockTypes.map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join("")}
            </select>
          </div>
          <div class="field">
            <label for="blockRepeat">${escapeHtml(text("repeatOption"))}</label>
            <select id="blockRepeat" name="repeat">
              <option value="none">${escapeHtml(text("repeatNever"))}</option>
              <option value="daily">${escapeHtml(text("repeatDaily"))}</option>
              <option value="weekly">${escapeHtml(text("repeatWeekly"))}</option>
              <option value="weekdays">${escapeHtml(text("repeatWeekdays"))}</option>
            </select>
          </div>
          <div class="field">
            <label for="repeatEndDate">${escapeHtml(text("repeatEndDate"))}</label>
            <input id="repeatEndDate" name="repeatEndDate" type="date" />
          </div>
          <div class="field">
            <label>${escapeHtml(text("selectedWeekdays"))}</label>
            <div class="quick-actions">
              ${["0", "1", "2", "3", "4", "5", "6"].map((day) => `<label class="quick-chip"><input type="checkbox" name="repeatWeekdays" value="${day}" />${escapeHtml(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][Number(day)])}</label>`).join("")}
            </div>
          </div>
          <div class="field">
            <label for="blockNotes">${escapeHtml(text("blockNotes"))}</label>
            <textarea id="blockNotes" name="notes"></textarea>
          </div>
          <button class="btn" type="submit">${escapeHtml(text("saveBlock"))}</button>
        </form>
      </div>
    </section>
  `;
}

function renderCalmCalendar({ monthDays, selectedEvents, selectedStudyHours, freeWindows, hasNoWindowTask, selectedMonth, blockTypes }) {
  const recurringSummary = getRecurringBlockSummary();
  return `
    <section class="screen">
      <div class="screen-header screen-header--quiet">
        <div class="screen-header__copy">
          <h1 class="title">${escapeHtml(text("calendarTitle"))}</h1>
          <p class="subtitle">${escapeHtml(text("calendarText"))}</p>
        </div>
      </div>
      ${renderFlash()}
      <div class="calendar-shell card">
        <div class="section-title">
          <h3>${escapeHtml(selectedMonth)}</h3>
          <span class="pill">${escapeHtml(text("totalStudyTime"))}: ${escapeHtml(formatHours(selectedStudyHours))}</span>
        </div>
        <div class="calendar-weekdays">
          ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => `<span>${escapeHtml(day)}</span>`).join("")}
        </div>
        <div class="calendar-grid">
          ${monthDays
            .map((dateValue) => {
              if (!dateValue) return `<div class="calendar-day calendar-day--empty"></div>`;
              const events = getCalendarEventsForDate(dateValue);
              const isToday = dateValue === toDateInputValue(new Date());
              const isSelected = dateValue === appState.selectedCalendarDate;
              return `
                <button class="calendar-day ${isToday ? "calendar-day--today" : ""} ${isSelected ? "calendar-day--selected" : ""}" data-calendar-date="${dateValue}">
                  <strong>${new Date(`${dateValue}T12:00:00`).getDate()}</strong>
                  <span>${escapeHtml(getCalendarDayIndicator(events))}</span>
                </button>
              `;
            })
            .join("")}
        </div>
      </div>
      <article class="card">
        <div class="section-title">
          <h3>${escapeHtml(text("selectedDay"))}: ${escapeHtml(formatDate(appState.selectedCalendarDate))}</h3>
          <span class="pill">${escapeHtml(selectedEvents.length ? `${selectedEvents.length} items` : text("freeDay"))}</span>
        </div>
        <div class="calendar-event-list">
          ${
            selectedEvents.length
              ? selectedEvents
                  .map(
                    (event) => `
                      <div class="calendar-event calendar-event--${event.type}">
                        <strong>${escapeHtml(event.label)}</strong>
                        <span>${escapeHtml(event.meta || "")}</span>
                        ${event.conflict ? `<em>${escapeHtml(text("timeConflict"))}</em>` : ""}
                        ${event.noWindowFound ? `<em>${escapeHtml(text("noStudyWindow"))}</em>` : ""}
                        ${event.notes ? `<p class="microcopy">${escapeHtml(event.notes)}</p>` : ""}
                      </div>
                    `
                  )
                  .join("")
              : `<div class="empty-state"><h3>${escapeHtml(text("freeDay"))}</h3><p class="subtitle">${escapeHtml(text("nextRightStep"))}</p></div>`
          }
        </div>
        <details class="calm-details">
          <summary>${escapeHtml(text("freeWindows"))}</summary>
          ${
            freeWindows.length
              ? freeWindows.map((windowText) => `<p class="subtitle">${escapeHtml(windowText)}</p>`).join("")
              : `<p class="subtitle">${escapeHtml(text("calendarFullDay"))}</p>`
          }
          ${hasNoWindowTask ? `<p class="microcopy">${escapeHtml(text("noStudyWindow"))}</p>` : ""}
        </details>
        ${
          hasNoWindowTask
            ? `<button class="btn-secondary" style="margin-top:12px;" data-action="make-plan-better">${escapeHtml(text("makeItBetter"))}</button>`
            : ""
        }
      </article>
      ${
        recurringSummary.length
          ? `<details class="card calm-details calm-details--card"><summary>${escapeHtml(text("recurringBlocksTitle", "Recurring blocks"))}</summary>${recurringSummary.map((item) => `<p class="subtitle">${escapeHtml(item)}</p>`).join("")}</details>`
          : ""
      }
      <details class="card calm-details calm-details--card">
        <summary>${escapeHtml(text("addCalendarBlock"))}</summary>
        <form class="field-grid" data-form="calendar-block" style="margin-top:14px;">
          <div class="field">
            <label for="blockTitle">${escapeHtml(text("blockTitle"))}</label>
            <input id="blockTitle" name="title" required />
          </div>
          <div class="field">
            <label for="blockDate">${escapeHtml(text("blockDate"))}</label>
            <input id="blockDate" name="date" type="date" required value="${escapeHtml(appState.selectedCalendarDate)}" />
          </div>
          <div class="surface-actions surface-actions--two">
            <div class="field">
              <label for="blockStart">${escapeHtml(text("blockStart"))}</label>
              <input id="blockStart" name="startTime" type="time" required />
            </div>
            <div class="field">
              <label for="blockEnd">${escapeHtml(text("blockEnd"))}</label>
              <input id="blockEnd" name="endTime" type="time" required />
            </div>
          </div>
          <div class="field">
            <label for="blockCategory">${escapeHtml(text("blockType"))}</label>
            <select id="blockCategory" name="category">
              ${blockTypes.map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join("")}
            </select>
          </div>
          <div class="field">
            <label for="blockNotes">${escapeHtml(text("blockNotes"))}</label>
            <textarea id="blockNotes" name="notes"></textarea>
          </div>
          <button class="btn" type="submit">${escapeHtml(text("saveBlock"))}</button>
        </form>
      </details>
    </section>
  `;
}

function renderProfile() {
  const game = getGamificationStats();
  const focus = getFocusStats();
  if (appState.reduceCognitiveLoad !== false) {
    return renderCalmProfile(game, focus);
  }
  return `
    <section class="screen">
      <div class="hero-card">
        ${renderBrandMark("small")}
        <div class="hero-card__pill">${escapeHtml(text("profileSummary"))}</div>
        <div class="profile-avatar-wrap">
          ${
            appState.profileAvatar
              ? `<img class="profile-avatar" src="${escapeHtml(appState.profileAvatar)}" alt="Profile avatar" />`
              : `<div class="profile-avatar profile-avatar--fallback">👤</div>`
          }
        </div>
        <h1 class="title">${escapeHtml(appState.user?.fullName || "")}</h1>
        <p class="subtitle muted-light">${escapeHtml(appState.user?.email || "")}</p>
        <div class="hero-card__footer">
          <span>${escapeHtml(text("studyStreak"))}: ${game.streak}</span>
          <span>${escapeHtml(text("coins"))}: ${game.coins}</span>
        </div>
      </div>
      ${renderFlash()}
      ${renderTierCard(game)}
      <div class="card">
        <div class="section-title"><h3>${escapeHtml(text("accountSection"))}</h3></div>
        <div class="field" style="margin-top:10px;">
          <label>${escapeHtml(text("changeProfilePicture"))}</label>
          <input type="file" accept="image/png,image/jpeg,image/webp" data-avatar-upload />
        </div>
        ${renderLanguagePicker()}
      </div>
      <div class="card profile-list">
        <div class="section-title"><h3>${escapeHtml(text("progressSection"))}</h3></div>
        ${renderProfileRow(text("academicLevel"), appState.user?.academicLevel)}
        ${renderProfileRow(text("preferredLanguage"), localizedLanguageOption(appState.user?.preferredLanguage || "English"))}
        ${renderProfileRow(text("studyGoal"), appState.user?.studyGoal)}
        ${renderProfileRow(text("dailyAvailableHours"), appState.user?.dailyAvailableHours)}
        ${renderProfileRow(text("totalSubjects"), appState.metrics.totalSubjects)}
        ${renderProfileRow(text("completedTasks"), appState.metrics.completedTasks)}
        ${renderProfileRow(text("totalTasks"), game.totalTasks)}
        ${renderProfileRow(text("savedPlans"), appState.metrics.totalPlans)}
        ${renderProfileRow(text("xpPoints"), game.xp)}
        ${renderProfileRow(text("coins"), game.coins)}
        ${renderProfileRow(text("completedPercent"), `${game.completedPercent}%`)}
        ${renderProfileRow(text("levelName"), game.level)}
      </div>
      <div class="card">
        <div class="section-title">
          <h3>${escapeHtml(text("focusCenterTitle"))}</h3>
          <span class="pill" data-focus-center-status>${escapeHtml(text("focusStatus"))}: ${escapeHtml(focus.status)}</span>
        </div>
        <div class="profile-list" style="margin-top:10px;">
          ${renderProfileRow(text("todayFocusTask"), focus.currentTask)}
          ${renderProfileRow(text("focusChooseTimer"), focus.timerLabel)}
          ${renderProfileRow(text("xpToday"), focus.xpToday)}
          ${renderProfileRow(text("coins"), focus.coinsToday)}
          ${renderProfileRow(text("focusSessionsTotal"), focus.sessionsTotal)}
        </div>
        <div class="surface-actions surface-actions--three" style="margin-top:12px;">
          <button class="btn" data-action="focus-start">${escapeHtml(text("startFocusSession"))}</button>
          <button class="btn-secondary" data-action="focus-pause">${escapeHtml(text("pause"))}</button>
          <button class="btn-secondary" data-action="focus-reset">${escapeHtml(text("reset"))}</button>
        </div>
      </div>
      <div class="card">
        <div class="section-title">
          <h3>${escapeHtml(text("friendsSection"))}</h3>
          <span class="pill pill--muted">Prototype</span>
        </div>
        <p class="microcopy" style="margin-top:8px;">${escapeHtml(text("friendsPrototypeNote"))}</p>
        <form class="field-grid" data-form="add-friend" style="margin-top:12px;">
          <div class="field">
            <label>${escapeHtml(text("addFriendLabel"))}</label>
            <input name="friendValue" required />
          </div>
          <button class="btn" type="submit">${escapeHtml(text("addFriendButton"))}</button>
        </form>
        <div class="stack" style="margin-top:14px;">
          ${
            appState.friends.length
              ? appState.friends
                  .map((friend) => {
                    const messages = appState.friendMessages.filter((entry) => entry.friendId === friend.id);
                    return `
                      <div class="friend-card">
                        <strong>${escapeHtml(friend.friendValue)}</strong>
                        <form class="field-grid" data-form="friend-message" style="margin-top:10px;">
                          <input type="hidden" name="friendId" value="${escapeHtml(friend.id)}" />
                          <div class="field">
                            <label>${escapeHtml(text("messageText"))}</label>
                            <textarea name="messageText" required></textarea>
                          </div>
                          <button class="btn-secondary" type="submit">${escapeHtml(text("sendMessage"))}</button>
                        </form>
                        <div class="friend-message-list">
                          <p class="microcopy">${escapeHtml(text("sentMessages"))}</p>
                          ${
                            messages.length
                              ? messages
                                  .slice(-5)
                                  .map((message) => `<p class="subtitle">• ${escapeHtml(message.messageText)} <span class="microcopy">(${escapeHtml(formatDate(message.createdDate))})</span></p>`)
                                  .join("")
                              : `<p class="subtitle">${escapeHtml(text("noTasksToday"))}</p>`
                          }
                        </div>
                      </div>
                    `;
                  })
                  .join("")
              : `<div class="empty-state"><p class="subtitle">${escapeHtml(text("noFriendsYet"))}</p></div>`
          }
        </div>
      </div>
      ${renderAchievementsCard()}
      <button class="btn-secondary" data-nav="onboarding">${escapeHtml(text("editOnboarding"))}</button>
      <button class="btn-secondary" data-action="reset-progress">${escapeHtml(text("resetProgress"))}</button>
      <button class="btn danger" data-action="logout">${escapeHtml(text("logout"))}</button>
    </section>
  `;
}

function renderCalmProfile(game, focus) {
  const unlocked = new Set(appState.achievementsUnlocked || []);
  const unlockedCount = ACHIEVEMENTS.filter((item) => unlocked.has(item.key)).length;
  return `
    <section class="screen">
      <div class="screen-header screen-header--quiet">
        <div class="screen-header__copy">
          <h1 class="title">${escapeHtml(text("profileTitle"))}</h1>
          <p class="subtitle">${escapeHtml(appState.user?.fullName || "")} · ${escapeHtml(appState.user?.email || "")}</p>
        </div>
      </div>
      ${renderFlash()}

      <article class="card profile-section">
        <div class="section-title"><h3>${escapeHtml(text("accountSection"))}</h3></div>
        <div class="profile-avatar-wrap profile-avatar-wrap--small avatar-preview">
          ${
            appState.profileAvatar
              ? `<img class="profile-avatar" src="${escapeHtml(appState.profileAvatar)}" alt="Profile avatar" />`
              : `<div class="profile-avatar profile-avatar--fallback">👤</div>`
          }
          <span>${escapeHtml(text("profilePictureHint", "Your StudySpark profile picture"))}</span>
        </div>
        <div class="profile-list">
          ${renderProfileRow(text("academicLevel"), appState.user?.academicLevel)}
          ${renderProfileRow(text("preferredLanguage"), localizedLanguageOption(appState.user?.preferredLanguage || "English"))}
          ${renderProfileRow(text("studyGoal"), appState.user?.studyGoal)}
          ${renderProfileRow(text("dailyAvailableHours"), appState.user?.dailyAvailableHours)}
        </div>
      </article>

      <article class="card profile-section">
        <div class="section-title"><h3>${escapeHtml(text("progressSection"))}</h3></div>
        <div class="profile-list">
          ${renderProfileRow(text("totalSubjects"), appState.metrics.totalSubjects)}
          ${renderProfileRow(text("completedTasks"), `${appState.metrics.completedTasks}/${game.totalTasks}`)}
          ${renderProfileRow(text("completedPercent"), `${game.completedPercent}%`)}
          ${renderProfileRow(text("savedPlans"), appState.metrics.totalPlans)}
        </div>
      </article>

      <article class="card profile-section">
        <div class="section-title">
          <h3>${escapeHtml(text("focusCenterTitle"))}</h3>
          <span class="pill">${escapeHtml(focus.status)}</span>
        </div>
        <div class="profile-list">
          ${renderProfileRow(text("todayFocusTask"), focus.currentTask)}
          ${renderProfileRow(text("focusChooseTimer"), focus.timerLabel)}
          ${renderProfileRow(text("focusSessionsTotal"), focus.sessionsTotal)}
        </div>
        <button class="btn-secondary" data-nav="focus">${escapeHtml(text("focusModeButton"))}</button>
      </article>

      <details class="card calm-details calm-details--card">
        <summary>${escapeHtml(text("achievementsTitle"))} <span class="pill">${unlockedCount}/${ACHIEVEMENTS.length}</span></summary>
        ${renderTierCard(game)}
        <div class="profile-list">
          ${renderProfileRow(text("xpPoints"), game.xp)}
          ${renderProfileRow(text("coins"), game.coins)}
          ${renderProfileRow(text("studyStreak"), game.streak)}
          ${renderProfileRow(text("levelName"), game.level)}
        </div>
        <div class="stack" style="margin-top:10px;">
          ${ACHIEVEMENTS.map((item) => `<div class="achievement-card ${unlocked.has(item.key) ? "achievement-card--on" : ""}"><strong>${escapeHtml(item.title)}</strong><span class="microcopy">${escapeHtml(unlocked.has(item.key) ? text("unlocked") : text("locked"))}</span></div>`).join("")}
        </div>
      </details>

      <details class="card calm-details calm-details--card">
        <summary>${escapeHtml(text("friendsSection"))}</summary>
        <p class="microcopy">${escapeHtml(text("friendsPrototypeNote"))}</p>
        <form class="field-grid" data-form="add-friend" style="margin-top:12px;">
          <div class="field">
            <label>${escapeHtml(text("addFriendLabel"))}</label>
            <input name="friendValue" required />
          </div>
          <button class="btn" type="submit">${escapeHtml(text("addFriendButton"))}</button>
        </form>
        <div class="stack" style="margin-top:14px;">
          ${
            appState.friends.length
              ? appState.friends
                  .map((friend) => {
                    const messages = appState.friendMessages.filter((entry) => entry.friendId === friend.id);
                    return `
                      <div class="friend-card">
                        <strong>${escapeHtml(friend.friendValue)}</strong>
                        <form class="field-grid" data-form="friend-message" style="margin-top:10px;">
                          <input type="hidden" name="friendId" value="${escapeHtml(friend.id)}" />
                          <div class="field">
                            <label>${escapeHtml(text("messageText"))}</label>
                            <textarea name="messageText" required></textarea>
                          </div>
                          <button class="btn-secondary" type="submit">${escapeHtml(text("sendMessage"))}</button>
                        </form>
                        <details class="calm-details">
                          <summary>${escapeHtml(text("sentMessages"))}</summary>
                          ${
                            messages.length
                              ? messages
                                  .slice(-5)
                                  .map((message) => `<p class="subtitle">• ${escapeHtml(message.messageText)} <span class="microcopy">(${escapeHtml(formatDate(message.createdDate))})</span></p>`)
                                  .join("")
                              : `<p class="subtitle">${escapeHtml(text("noTasksToday"))}</p>`
                          }
                        </details>
                      </div>
                    `;
                  })
                  .join("")
              : `<div class="empty-state"><p class="subtitle">${escapeHtml(text("noFriendsYet"))}</p></div>`
          }
        </div>
      </details>

      <details class="card calm-details calm-details--card">
        <summary>${escapeHtml(text("settingsSection", "Settings ⚙️"))}</summary>
        <div class="avatar-actions">
          <input id="profileAvatarInput" class="sr-only" type="file" accept="image/png,image/jpeg,image/webp" data-avatar-upload />
          <label class="btn-secondary avatar-upload-button" for="profileAvatarInput" tabindex="0">${escapeHtml(text("changeProfilePicture"))}</label>
          <button class="btn-secondary" type="button" data-action="remove-avatar">${escapeHtml(text("removeProfilePicture", "Remove picture ❌"))}</button>
        </div>
        ${renderLanguagePicker()}
        <div class="surface-actions surface-actions--two" style="margin-top:12px;">
          <button class="btn-secondary" data-nav="onboarding">${escapeHtml(text("editOnboarding"))}</button>
          <button class="btn-secondary" data-action="reset-progress">${escapeHtml(text("resetProgress"))}</button>
        </div>
        <button class="btn danger" data-action="logout">${escapeHtml(text("logout"))}</button>
      </details>
    </section>
  `;
}

function renderNav() {
  if (!appState.user || !isOnboarded(appState.user)) return "";
  return `
    <nav class="nav" aria-label="Bottom navigation">
      ${NAV_ITEMS.map(
        (item) => `
          <button data-nav="${item.key}" class="${appState.route === item.key ? "active" : ""}">
            <span class="icon">${item.icon}</span>
            <span>${escapeHtml(text(item.labelKey))}</span>
          </button>
        `
      ).join("")}
    </nav>
  `;
}

function renderScreen() {
  if (appState.route === "forgot-password") {
    return renderForgotPasswordScreen();
  }

  if (appState.route === "reset-password") {
    return renderResetPasswordScreen();
  }

  if (appState.route === "verify-email" && appState.user) {
    return renderVerifyEmailScreen();
  }

  if (!appState.user) {
    return appState.route === "register" ? renderAuthScreen("register") : renderAuthScreen("login");
  }
  if (appState.user.emailVerified === false) {
    return renderVerifyEmailScreen();
  }
  if (!isOnboarded(appState.user) || appState.route === "onboarding") {
    return renderOnboarding();
  }

  switch (appState.route) {
    case "subjects":
      return renderSubjects();
    case "add-subject":
      return renderAddSubject();
    case "calendar":
      return renderCalendar();
    case "ai":
      return renderAiScreen();
    case "my-plan":
      return renderMyPlan();
    case "focus":
      return renderFocusMode();
    case "profile":
      return renderProfile();
    case "home":
    default:
      return renderHome();
  }
}

function renderApp() {
  const app = document.getElementById("app");
  const lang = getLanguagePack();
  document.documentElement.lang = lang.htmlLang;
  document.documentElement.dir = lang.rtl ? "rtl" : "ltr";
  app.className = `app ${lang.rtl ? "app--rtl" : "app--ltr"}`;
  app.innerHTML = `${renderTopHeader()}${renderScreen()}${renderNav()}${renderAchievementPopup()}`;
  bindEvents();
  syncDynamicUi();
}

function renderAchievementPopup() {
  if (!appState.achievementPopup) return "";
  return `
    <div class="confirm-modal" data-action="close-achievement-popup">
      <div class="confirm-modal__panel">
        <h3>${escapeHtml(text("achievementUnlocked"))} 🏆</h3>
        <p class="subtitle">${escapeHtml(appState.achievementPopup)}</p>
        <button class="btn" data-action="close-achievement-popup">${escapeHtml(text("continue"))}</button>
      </div>
    </div>
  `;
}

function syncDynamicUi() {
  const messages = document.querySelector(".ai-chat__messages");
  if (messages) {
    messages.scrollTop = messages.scrollHeight;
  }
}

function bindEvents() {
  document.querySelectorAll("[data-nav]").forEach((element) => {
    element.addEventListener("click", () => setRoute(element.getAttribute("data-nav")));
  });

  document.querySelectorAll("[data-form]").forEach((form) => {
    form.addEventListener("submit", handleFormSubmit);
  });

  document.querySelectorAll("[data-edit-subject]").forEach((button) => {
    button.addEventListener("click", () => setRoute("add-subject", { editingSubjectId: button.getAttribute("data-edit-subject") }));
  });

  document.querySelectorAll("[data-delete-subject]").forEach((button) => {
    button.addEventListener("click", async () => deleteSubject(button.getAttribute("data-delete-subject")));
  });

  document.querySelectorAll("[data-task-id]").forEach((checkbox) => {
    checkbox.addEventListener("change", async () => toggleTask(checkbox.getAttribute("data-task-id"), checkbox.checked ? "Done" : "Not done"));
  });

  document.querySelectorAll("[data-ui-language]").forEach((button) => {
    button.addEventListener("click", () => setPreviewLanguage(button.getAttribute("data-ui-language")));
  });

  document.querySelectorAll("[data-action='logout']").forEach((button) => {
    button.addEventListener("click", logout);
  });

  document.querySelectorAll("[data-action='google-login']").forEach((button) => {
    button.addEventListener("click", () => {
      window.location.href = `${API_BASE}/api/auth/google`;
    });
  });

  document.querySelectorAll("[data-action='resend-verification']").forEach((button) => {
    button.addEventListener("click", resendVerificationCode);
  });

  document.querySelectorAll("[data-action='generate-plan-inline']").forEach((button) => {
    button.addEventListener("click", generatePlan);
  });
  document.querySelectorAll("[data-action='make-plan-better']").forEach((button) => {
    button.addEventListener("click", improvePlan);
  });

  document.querySelectorAll("[data-action='clear-chat']").forEach((button) => {
    button.addEventListener("click", () => {
      appState.chatHistory = [];
      renderApp();
    });
  });

  document.querySelectorAll("[data-calendar-date]").forEach((button) => {
    button.addEventListener("click", () => {
      appState.selectedCalendarDate = button.getAttribute("data-calendar-date");
      renderApp();
    });
  });

  document.querySelectorAll("[data-action='reset-progress']").forEach((button) => {
    button.addEventListener("click", resetLocalProgress);
  });

  document.querySelectorAll("[data-ai-preset]").forEach((button) => {
    button.addEventListener("click", async () => sendCoachMessage(button.getAttribute("data-ai-preset")));
  });

  document.querySelectorAll("[data-action='focus-start']").forEach((button) => {
    button.addEventListener("click", startFocusTimer);
  });

  document.querySelectorAll("[data-action='focus-pause']").forEach((button) => {
    button.addEventListener("click", pauseFocusTimer);
  });

  document.querySelectorAll("[data-action='focus-reset']").forEach((button) => {
    button.addEventListener("click", resetFocusTimer);
  });

  document.querySelectorAll("[data-focus-type]").forEach((button) => {
    button.addEventListener("click", () => setFocusType(button.getAttribute("data-focus-type")));
  });

  document.querySelectorAll("[data-focus-preset]").forEach((button) => {
    button.addEventListener("click", () => setFocusPreset(button.getAttribute("data-focus-preset")));
  });
  document.querySelectorAll("[data-avatar-upload]").forEach((input) => {
    input.addEventListener("change", handleAvatarUpload);
  });
  document.querySelectorAll("[data-action='remove-avatar']").forEach((button) => {
    button.addEventListener("click", removeProfileAvatar);
  });
  document.querySelectorAll(".avatar-upload-button").forEach((label) => {
    label.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        document.getElementById(label.getAttribute("for"))?.click();
      }
    });
  });
  document.querySelectorAll("[data-action='close-achievement-popup']").forEach((button) => {
    button.addEventListener("click", () => {
      appState.achievementPopup = "";
      renderApp();
    });
  });

  document.querySelectorAll("[data-action='focus-complete-yes']").forEach((button) => {
    button.addEventListener("click", () => resolveFocusCompletion(true));
  });
  document.querySelectorAll("[data-action='focus-complete-no']").forEach((button) => {
    button.addEventListener("click", () => resolveFocusCompletion(false));
  });
}

function setFocusType(focusType) {
  if (appState.focusRunning) return;
  appState.focusType = focusType || "Exams";
  renderApp();
}

function setFocusPreset(presetKey) {
  if (appState.focusRunning) return;
  appState.focusPresetKey = presetKey || "classic";
  appState.focusMode = "focus";
  appState.focusSeconds = getFocusPreset().focusSeconds;
  renderApp();
}

function startFocusTimer() {
  if (appState.focusRunning || appState.focusIntervalId) return;
  if (appState.focusMode === "focus" && !appState.activeFocusSessionKey) {
    appState.activeFocusSessionKey = `focus:${todayKey()}:${appState.focusPresetKey}:${Date.now()}`;
  }
  appState.focusRunning = true;
  appState.focusIntervalId = window.setInterval(() => {
    appState.focusSeconds = Math.max(0, appState.focusSeconds - 1);
    if (appState.focusSeconds === 0) {
      const completedMode = appState.focusMode;
      stopFocusTimer();
      if (completedMode === "focus") {
        const reward = getFocusRewardForPreset();
        appState.focusCompletionPrompt = {
          activityKey: appState.activeFocusSessionKey || `focus:${todayKey()}:${Date.now()}`,
          xp: reward.xp,
          coins: reward.coins,
          pendingTaskId: getPendingFocusTask()?.id || "",
        };
      } else {
        appState.focusMode = "focus";
        appState.focusSeconds = getFocusModeTotalSeconds();
        setFlash(text("focusComplete"));
      }
      appState.activeFocusSessionKey = "";
      renderApp();
    } else {
      updateFocusTimerUi();
    }
  }, 1000);
  updateFocusTimerUi();
}

function pauseFocusTimer() {
  stopFocusTimer();
  updateFocusTimerUi();
}

function stopFocusTimer() {
  appState.focusRunning = false;
  if (appState.focusIntervalId) {
    window.clearInterval(appState.focusIntervalId);
    appState.focusIntervalId = null;
  }
}

function resetFocusTimer() {
  stopFocusTimer();
  appState.focusCompletionPrompt = null;
  appState.activeFocusSessionKey = "";
  appState.focusSeconds = getFocusModeTotalSeconds();
  renderApp();
}

function updateFocusTimerUi() {
  const timer = document.querySelector("[data-focus-timer]");
  const progress = document.querySelector("[data-focus-progress]");
  const message = document.querySelector("[data-focus-message]");
  const centerStatus = document.querySelector("[data-focus-center-status]");
  const startButtons = document.querySelectorAll("[data-action='focus-start']");
  const pauseButtons = document.querySelectorAll("[data-action='focus-pause']");
  const totalSeconds = getFocusModeTotalSeconds();
  const progressPercent = Math.round(((totalSeconds - appState.focusSeconds) / totalSeconds) * 100);

  if (timer) timer.textContent = formatTimer(appState.focusSeconds);
  if (progress) progress.style.width = `${Math.max(0, Math.min(100, progressPercent))}%`;
  if (message) message.textContent = appState.focusRunning ? text("focusRunningText", "Focused. Keep going.") : getMotivationMessage();
  if (centerStatus) centerStatus.textContent = `${text("focusStatus")}: ${getFocusStats().status}`;
  startButtons.forEach((button) => {
    button.disabled = appState.focusRunning;
  });
  pauseButtons.forEach((button) => {
    button.disabled = !appState.focusRunning;
  });
}

async function handleFormSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formType = form.getAttribute("data-form");
  const data = Object.fromEntries(new FormData(form).entries());
  const formData = new FormData(form);

  try {
    if (formType === "register") {
      if (data.password !== data.confirmPassword) {
        setFlash(text("passwordsMismatch"), "warning");
        return;
      }
      const payload = await apiRequest("/api/auth/register", { method: "POST", body: data });
      applySession(payload);
      if (payload.requiresVerification) {
        setFlash(payload.message || "We sent a verification code to your email.");
      } else {
        appState.route = "onboarding";
        await refreshBootstrap();
        setFlash(text("accountCreated"));
      }
      renderApp();
      return;
    }

    if (formType === "login") {
      const payload = await apiRequest("/api/auth/login", { method: "POST", body: data });
      applySession(payload);
      if (payload.requiresVerification) {
        setFlash(payload.message || "Please verify your email first.", "warning");
      } else {
        await refreshBootstrap();
        setFlash(text("loggedInSuccess"));
      }
      renderApp();
      return;
    }

    if (formType === "verify-email") {
      const payload = await apiRequest("/api/auth/verify-email", { method: "POST", body: data });
      appState.user = payload.user;
      appState.devVerificationCode = "";
      await refreshBootstrap();
      setFlash(payload.message || "Email verified successfully.");
      renderApp();
      return;
    }

    if (formType === "forgot-password") {
      const payload = await apiRequest("/api/auth/forgot-password", { method: "POST", body: data });
      appState.resetEmail = data.email || "";
      appState.devResetCode = payload.devResetCode || "";
      appState.route = "reset-password";
      setFlash(payload.message || "If this email exists, a reset code was sent.");
      renderApp();
      return;
    }

    if (formType === "reset-password") {
      const payload = await apiRequest("/api/auth/reset-password", { method: "POST", body: data });
      clearSession();
      appState.route = "login";
      appState.devResetCode = "";
      setFlash(payload.message || "Password updated. Please log in again.");
      renderApp();
      return;
    }

    if (formType === "onboarding") {
      await apiRequest("/api/onboarding", { method: "PUT", body: data });
      appState.previewLanguage = data.preferredLanguage || appState.previewLanguage;
      localStorage.setItem(UI_LANGUAGE_STORAGE_KEY, appState.previewLanguage);
      await refreshBootstrap();
      setFlash(text("savedPreferences"));
      setRoute("home");
      return;
    }

    if (formType === "subject") {
      if (appState.editingSubjectId) {
        await apiRequest(`/api/subjects/${appState.editingSubjectId}`, { method: "PUT", body: data });
      } else {
        await apiRequest("/api/subjects", { method: "POST", body: data });
      }
      appState.editingSubjectId = null;
      await refreshBootstrap();
      setFlash(text("subjectSaved"));
      setRoute("subjects");
      return;
    }

    if (formType === "calendar-block") {
      const payload = {
        ...data,
        date: data.date || appState.selectedCalendarDate,
        category: data.category || text("busyBlock"),
      };
      await apiRequest("/api/calendar-blocks", {
        method: "POST",
        body: payload,
      });
      const repeatWeekdays = formData.getAll("repeatWeekdays").map((value) => Number(value));
      if ((data.repeat || "none") !== "none") {
        appState.recurringBlocks.push({
          id: `rec_${Date.now()}`,
          title: String(data.title || "").trim(),
          category: String(data.category || "Busy").trim(),
          date: payload.date,
          startTime: String(data.startTime || "").trim(),
          endTime: String(data.endTime || "").trim(),
          notes: String(data.notes || "").trim(),
          repeat: data.repeat || "none",
          repeatEndDate: String(data.repeatEndDate || "").trim(),
          repeatWeekdays,
        });
        saveRecurringBlocks();
      }
      await refreshBootstrap();
      appState.selectedCalendarDate = data.date || appState.selectedCalendarDate;
      setFlash(text("savedPreferences"));
      renderApp();
      return;
    }

    if (formType === "chat") {
      const message = String(data.message || "").trim();
      if (!message) return;
      form.reset();
      await sendCoachMessage(message);
      return;
    }

    if (formType === "home-mini-chat") {
      const message = String(data.message || "").trim();
      if (!message) return;
      form.reset();
      await sendMiniChatMessage(message);
      return;
    }

    if (formType === "add-friend") {
      await apiRequest("/api/friends", { method: "POST", body: { friendValue: data.friendValue } });
      await refreshBootstrap();
      setFlash(text("subjectSaved"));
      renderApp();
      return;
    }

    if (formType === "friend-message") {
      await apiRequest(`/api/friends/${data.friendId}/messages`, { method: "POST", body: { messageText: data.messageText } });
      await refreshBootstrap();
      setFlash(text("aiMessagesSaved"));
      renderApp();
      return;
    }
  } catch (error) {
    setFlash(error.message, "warning");
  }
}

async function deleteSubject(subjectId) {
  try {
    await apiRequest(`/api/subjects/${subjectId}`, { method: "DELETE" });
    await refreshBootstrap();
    setFlash(text("subjectDeleted"));
  } catch (error) {
    setFlash(error.message, "warning");
  }
}

async function generatePlan() {
  try {
    let response;
    if (appState.config.apiReady) {
      response = await apiRequest("/api/plan/generate", { method: "POST", body: {} });
    } else if (hasPuterAI()) {
      const aiText = await puterChat(buildStudyPlanPromptForClient());
      const parsed = parseJsonFromAiText(aiText);
      response = await apiRequest("/api/plan/save", {
        method: "POST",
        body: {
          ...parsed,
          source: "puter",
          model: "gpt-5-nano",
          planTitle: "Personalized AI Study Plan",
        },
      });
      response.source = "puter";
    } else {
      response = await apiRequest("/api/plan/generate", { method: "POST", body: {} });
    }

    await refreshBootstrap();
    const successMessage =
      response.source === "openai"
        ? text("openAiPlanReady")
        : response.source === "puter"
          ? text("puterPlanReady")
          : text("planReady", "Your plan is ready — calm, clear, and realistic ✨");
    setFlash(successMessage, response.warning ? "warning" : "success");
    setRoute("my-plan");
  } catch (error) {
    setFlash(error.message, "warning");
  }
}

async function toggleTask(taskId, status) {
  try {
    const before = appState.tasks.find((task) => task.id === taskId);
    await apiRequest(`/api/tasks/${taskId}`, { method: "PATCH", body: { status } });
    if (before && before.status !== "Done" && status === "Done") {
      await awardReward({
        activityKey: `task_done:${taskId}`,
        activityType: "task_complete",
        xp: 10,
        coins: 5,
      });
    }
    await refreshBootstrap();
  } catch (error) {
    setFlash(error.message, "warning");
  }
}

async function resetLocalProgress() {
  try {
    const completedTasks = appState.tasks.filter((task) => task.status === "Done");
    for (const task of completedTasks) {
      await apiRequest(`/api/tasks/${task.id}`, { method: "PATCH", body: { status: "Not done" } });
    }
    appState.chatHistory = [];
    await refreshBootstrap();
    setFlash(text("resetProgressDone"));
  } catch (error) {
    setFlash(error.message, "warning");
  }
}

async function sendCoachMessage(message) {
  appState.aiPending = true;
  appState.chatHistory = [
    ...appState.chatHistory,
    {
      id: `temp_user_${Date.now()}`,
      role: "user",
      message,
      createdDate: new Date().toISOString(),
    },
    {
      id: `temp_assistant_${Date.now() + 1}`,
      role: "assistant",
      message: getAiThinkingText(),
      createdDate: new Date().toISOString(),
      pending: true,
    },
  ];
  renderApp();

  try {
    let response;
    if (appState.config.apiReady) {
      response = await apiRequest("/api/chat", { method: "POST", body: { message } });
    } else if (hasPuterAI()) {
      const aiReply = await puterChat(buildCoachPromptForClient(message));
      response = await apiRequest("/api/chat/save", {
        method: "POST",
        body: {
          userMessage: message,
          assistantMessage: aiReply,
          source: "puter",
          model: "gpt-5-nano",
        },
      });
    } else {
      response = await apiRequest("/api/chat", { method: "POST", body: { message } });
    }

    appState.chatHistory = response.messages || [];
    appState.aiPending = false;
    setFlash(text("aiMessagesSaved"));
    renderApp();
  } catch (error) {
    appState.aiPending = false;
    appState.chatHistory = appState.chatHistory.filter((entry) => !entry.pending);
    setFlash(error.message, "warning");
  }
}

async function sendMiniChatMessage(message) {
  appState.aiPending = true;
  renderApp();
  try {
    let response;
    if (appState.config.apiReady) {
      response = await apiRequest("/api/chat", { method: "POST", body: { message } });
    } else if (hasPuterAI()) {
      const aiReply = await puterChat(buildCoachPromptForClient(message));
      response = { reply: aiReply, messages: [] };
    } else {
      response = await apiRequest("/api/chat", { method: "POST", body: { message } });
    }
    const preview = String(response.reply || response.messages?.slice(-1)[0]?.message || "").trim();
    appState.miniChatPreview = preview || text("aiEmptyText");
    localStorage.setItem(MINI_CHAT_PREVIEW_STORAGE_KEY, appState.miniChatPreview);
    appState.aiPending = false;
    setFlash(text("rewardCelebration"));
    renderApp();
  } catch (error) {
    appState.aiPending = false;
    setFlash(error.message, "warning");
    renderApp();
  }
}

async function improvePlan() {
  if (!appState.latestPlan) {
    setFlash(text("noPlanText"), "warning");
    renderApp();
    return;
  }
  appState.aiPending = true;
  setFlash(text("makeItBetterLoading"));
  renderApp();
  try {
    const preview = await apiRequest("/api/plan/improve", {
      method: "POST",
      body: {
        currentPlan: appState.latestPlan,
        profile: appState.user,
        subjects: appState.subjects,
        tasks: appState.tasks,
        calendarBlocks: [...appState.calendarBlocks, ...expandRecurringBlocksForDateRange(14)],
        currentPlanId: appState.latestPlan.id,
        metrics: appState.metrics,
        rewardSummary: {
          xp: getGamificationStats().xp,
          coins: getGamificationStats().coins,
        },
      },
    });

    const previewSummary = String(preview?.plan?.aiSummary || "").slice(0, 180);
    const confirmed = window.confirm(`${text("makeItBetterConfirm")}\n\n${previewSummary}`);
    if (!confirmed) {
      appState.aiPending = false;
      setFlash(text("nextRightStep"), "warning");
      renderApp();
      return;
    }

    await apiRequest("/api/plan/save", {
      method: "POST",
      body: {
        ...preview.plan,
        todayTasks: preview.tasks || preview.plan?.todayTasks || [],
        source: preview.source || "improve",
        model: preview.plan?.promptLog?.openAIModel || preview.plan?.promptLog?.model || null,
      },
    });
    await refreshBootstrap();
    appState.aiPending = false;
    setFlash(text("makeItBetterDone"));
    setRoute("my-plan");
  } catch (error) {
    appState.aiPending = false;
    setFlash(error.message, "warning");
    renderApp();
  }
}

function handleAvatarUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    setFlash(text("profilePhotoInvalid"), "warning");
    renderApp();
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    setFlash(text("profilePhotoTooLarge"), "warning");
    renderApp();
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    saveProfileAvatar(String(reader.result || ""));
    setFlash(text("savedPreferences"));
    renderApp();
  };
  reader.onerror = () => {
    setFlash(text("profilePhotoInvalid"), "warning");
    renderApp();
  };
  reader.readAsDataURL(file);
}

function removeProfileAvatar() {
  saveProfileAvatar("");
  setFlash(text("profilePictureRemoved", "Profile picture removed."));
  renderApp();
}

function getFocusRewardForPreset() {
  const preset = getFocusPreset();
  if (preset.focusSeconds >= 25 * 60) {
    return { xp: 25, coins: 10 };
  }
  return { xp: 10, coins: 5 };
}

async function resolveFocusCompletion(completed) {
  const prompt = appState.focusCompletionPrompt;
  appState.focusCompletionPrompt = null;
  if (!completed || !prompt) {
    setFlash(text("nextRightStep"), "warning");
    renderApp();
    return;
  }
  try {
    if (prompt.pendingTaskId) {
      await apiRequest(`/api/tasks/${prompt.pendingTaskId}`, { method: "PATCH", body: { status: "Done" } });
    }
    await awardReward({
      activityKey: prompt.activityKey,
      activityType: "focus_session",
      xp: prompt.xp,
      coins: prompt.coins,
    });
    await maybeAwardDailyStreakBonus();
    appState.focusMode = "break";
    appState.focusSeconds = getFocusModeTotalSeconds();
    await refreshBootstrap();
    setFlash(`${text("rewardCelebration")} +${prompt.xp} XP / +${prompt.coins} ${text("coins")}`);
  } catch (error) {
    setFlash(error.message, "warning");
  }
  renderApp();
}

async function maybeAwardDailyStreakBonus() {
  const bonusKey = `daily_streak:${todayKey()}`;
  if (hasRewardActivity(bonusKey)) return;
  if (!getRewardsForToday().length) return;
  await awardReward({
    activityKey: bonusKey,
    activityType: "daily_streak",
    xp: 15,
    coins: 10,
  });
  setFlash(text("streakBonus"));
}

async function awardReward({ activityKey, activityType, xp, coins }) {
  if (!activityKey || hasRewardActivity(activityKey)) {
    return false;
  }
  const payload = await apiRequest("/api/rewards", {
    method: "POST",
    body: { activityKey, activityType, xp, coins },
  });
  if (payload.rewardAdded) {
    appState.rewardHistory.push({
      id: `local_reward_${Date.now()}`,
      activityKey,
      activityType,
      xp,
      coins,
      createdDate: new Date().toISOString(),
    });
    return true;
  }
  return false;
}

async function resendVerificationCode() {
  try {
    const payload = await apiRequest("/api/auth/resend-verification", { method: "POST", body: {} });
    appState.devVerificationCode = payload.devVerificationCode || "";
    setFlash(payload.message || "A new verification code was sent.");
  } catch (error) {
    setFlash(error.message, "warning");
  }
  renderApp();
}

async function logout() {
  try {
    await apiRequest("/api/auth/logout", { method: "POST", body: {} });
  } catch (error) {
    // Ignore logout errors and clear locally.
  }
  clearSession();
  setFlash(text("loggedOut"));
}

async function apiRequest(url, options = {}) {
  const requestOptions = {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(appState.sessionToken ? { "x-session-token": appState.sessionToken } : {}),
      ...(options.headers || {}),
    },
  };

  if (options.body !== undefined) {
    requestOptions.body = JSON.stringify(options.body);
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${url}`, requestOptions);
  } catch (error) {
    if (window.location.protocol === "file:") {
      throw new Error("Cannot reach the app server. Run `node server.js` and open http://localhost:3000 instead of opening index.html directly.");
    }
    throw new Error("Cannot reach the app server. Make sure `node server.js` is running, then refresh the page.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "Request failed.");
    error.code = data.error || "request_failed";
    error.payload = data;
    throw error;
  }
  return data;
}

initializeApp();
