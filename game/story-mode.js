/* ============================================================
   QADAYATI — STORY MODE V3
   نظام القصة مستقل بالكامل
   ============================================================ */

(() => {
    "use strict";

    const STORY_URL =
        "https://raw.githubusercontent.com/mohnadhhh90-arch/host/refs/heads/main/game/story.json";

    const PROGRESS_KEY = "storyProgress";

    let stories = [];
    let currentStory = null;
    let currentDay = null;

    /* ============================================================
       HELPERS
       ============================================================ */

    const $ = selector =>
        document.querySelector(selector);

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /*
       توحيد الإجابة:
       - مسافات
       - أقواس
       - علامات اقتباس
       - اختلاف الحروف
    */
    function normalizeAnswer(value) {
        return String(value ?? "")
            .trim()
            .toLowerCase()
            .replace(/[()[\]{}]/g, "")
            .replace(/["'`]/g, "")
            .replace(/\s+/g, " ");
    }

    function getProgress() {
        try {
            const saved =
                localStorage.getItem(PROGRESS_KEY);

            return saved
                ? JSON.parse(saved)
                : {};
        } catch (error) {
            console.error(
                "getProgress error:",
                error
            );

            return {};
        }
    }

    function saveProgress(data) {
        try {
            localStorage.setItem(
                PROGRESS_KEY,
                JSON.stringify(data)
            );
        } catch (error) {
            console.error(
                "saveProgress error:",
                error
            );
        }
    }

    function createStoryProgress() {
        return {
            completedDays: [],
            failedAttempts: 0,
            lastDay: 0,
            notes: []
        };
    }

    function getStoryProgress(storyId) {
        const progress = getProgress();

        if (!progress[storyId]) {
            progress[storyId] =
                createStoryProgress();

            saveProgress(progress);
        }

        return progress[storyId];
    }

    function getRoot() {

        let root =
            document.getElementById(
                "storyModeContainer"
            );

        if (!root) {

            const section =
                document.getElementById(
                    "storyModeSection"
                );

            if (!section) {
                console.error(
                    "❌ storyModeSection غير موجود"
                );

                return null;
            }

            root =
                document.createElement("div");

            root.id =
                "storyModeContainer";

            root.className =
                "qad-story-v3";

            section.appendChild(root);
        }

        return root;
    }

    /* ============================================================
       CSS
       ============================================================ */

    function injectStyles() {

        if (
            document.getElementById(
                "qad-story-v3-style"
            )
        ) {
            return;
        }

        const style =
            document.createElement("style");

        style.id =
            "qad-story-v3-style";

        style.textContent = `

        .qad-story-v3 {
            direction: rtl;
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            box-sizing: border-box;
            color: #eee;
        }

        .qad-story-v3 * {
            box-sizing: border-box;
        }

        .story-v3-header {
            position: relative;
            overflow: hidden;
            padding: 35px;
            margin-bottom: 22px;
            border-radius: 18px;
            background:
                linear-gradient(
                    135deg,
                    rgba(22,25,31,.98),
                    rgba(43,31,25,.96)
                );
            border: 1px solid rgba(212,174,96,.35);
            box-shadow:
                0 18px 45px rgba(0,0,0,.3);
        }

        .story-v3-kicker {
            display: inline-block;
            font-size: .72rem;
            letter-spacing: 2px;
            color: #d8b76a;
            font-weight: 800;
            margin-bottom: 8px;
        }

        .story-v3-header h2,
        .story-v3-operation-header h2,
        .story-v3-day-header h2,
        .story-v3-briefing h2,
        .story-v3-result h2 {
            margin: 0 0 10px;
            color: #f4e8c1;
        }

        .story-v3-header p,
        .story-v3-operation-header p {
            color: #bbb;
            line-height: 1.8;
            margin: 0;
        }

        .story-v3-operation {
            padding: 24px;
            margin-bottom: 18px;
            border-radius: 16px;
            background: #191b20;
            border: 1px solid rgba(255,255,255,.08);
        }

        .story-v3-operation-top,
        .story-v3-operation-bottom,
        .story-v3-toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
        }

        .story-v3-operation-top {
            color: #aaa;
            font-size: .85rem;
            margin-bottom: 15px;
        }

        .story-v3-badge {
            background: #713737;
            color: #fff;
            padding: 5px 10px;
            border-radius: 7px;
            font-size: .72rem;
        }

        .story-v3-operation h3 {
            color: #f4e8c1;
            margin: 0 0 8px;
        }

        .story-v3-operation p {
            color: #aaa;
            line-height: 1.8;
            margin: 0 0 18px;
        }

        .story-v3-progress {
            height: 8px;
            background: #303238;
            border-radius: 99px;
            overflow: hidden;
            margin-bottom: 15px;
        }

        .story-v3-progress-fill {
            height: 100%;
            background:
                linear-gradient(
                    90deg,
                    #8b4513,
                    #d8b76a
                );
            border-radius: inherit;
            transition: width .5s ease;
        }

        .story-v3-btn {
            border: 0;
            border-radius: 10px;
            padding: 11px 18px;
            cursor: pointer;
            background: #29313b;
            color: #fff;
            font-weight: 700;
            transition: .18s ease;
        }

        .story-v3-btn:hover {
            transform: translateY(-2px);
            background: #354252;
        }

        .story-v3-btn.primary {
            background: #8b4513;
        }

        .story-v3-btn.primary:hover {
            background: #a95819;
        }

        .story-v3-link-btn {
            border: 0;
            background: transparent;
            color: #d8b76a;
            cursor: pointer;
            font-weight: 700;
            padding: 5px;
        }

        .story-v3-toolbar {
            margin-bottom: 18px;
            color: #999;
        }

        .story-v3-operation-header {
            padding: 25px;
            margin-bottom: 20px;
            border-radius: 16px;
            background: #17191e;
            border: 1px solid rgba(255,255,255,.08);
        }

        .story-v3-days {
            display: grid;
            grid-template-columns:
                repeat(2, minmax(0, 1fr));
            gap: 10px;
        }

        .story-v3-day {
            display: grid;
            grid-template-columns: 48px 1fr auto;
            align-items: center;
            gap: 12px;
            text-align: right;
            width: 100%;
            min-height: 78px;
            padding: 12px;
            border-radius: 13px;
            border: 1px solid rgba(255,255,255,.08);
            background: #191b20;
            color: #eee;
            cursor: pointer;
        }

        .story-v3-day.unlocked:hover {
            transform: translateX(-3px);
            border-color: #d8b76a;
        }

        .story-v3-day.locked {
            opacity: .42;
            cursor: not-allowed;
        }

        .story-v3-day.completed {
            border-color: rgba(39,174,96,.45);
        }

        .story-v3-day-number {
            display: grid;
            place-items: center;
            width: 44px;
            height: 44px;
            border-radius: 12px;
            background: #292d34;
            color: #d8b76a;
            font-weight: 900;
        }

        .story-v3-day-content {
            display: flex;
            flex-direction: column;
            gap: 5px;
            min-width: 0;
        }

        .story-v3-day-content strong {
            color: #f4e8c1;
        }

        .story-v3-day-content span {
            color: #aaa;
            font-size: .82rem;
            line-height: 1.5;
        }

        .story-v3-day-status {
            font-size: .72rem;
            color: #aaa;
            white-space: nowrap;
        }

        .story-v3-briefing,
        .story-v3-day-file,
        .story-v3-result {
            padding: 30px;
            border-radius: 18px;
            background: #191b20;
            border: 1px solid rgba(216,183,106,.22);
            box-shadow:
                0 18px 45px rgba(0,0,0,.25);
        }

        .story-v3-file-stamp {
            display: inline-block;
            padding: 5px 10px;
            border: 1px solid #713737;
            color: #d98b8b;
            border-radius: 5px;
            font-size: .72rem;
            margin-bottom: 15px;
        }

        .story-v3-briefing-icon {
            font-size: 3rem;
            margin-bottom: 12px;
        }

        .story-v3-briefing-paper {
            margin: 20px 0;
            padding: 22px;
            border-radius: 12px;
            background: #f4efe3;
            color: #29221d;
            line-height: 2;
            font-size: 1rem;
        }

        .story-v3-day-header {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            align-items: flex-start;
            padding-bottom: 20px;
            margin-bottom: 20px;
            border-bottom: 1px solid rgba(255,255,255,.08);
        }

        .story-v3-day-counter {
            min-width: 70px;
            text-align: center;
            padding: 10px;
            border-radius: 10px;
            background: #713737;
            color: #fff;
            font-weight: 900;
        }

        .story-v3-section,
        .story-v3-panel {
            margin-bottom: 18px;
            padding: 20px;
            border-radius: 14px;
            background: #202329;
            border: 1px solid rgba(255,255,255,.06);
        }

        .story-v3-panel h3,
        .story-v3-section h3 {
            margin: 0 0 14px;
            color: #d8b76a;
        }

        .story-v3-overview p {
            color: #ccc;
            line-height: 1.9;
            margin: 0;
        }

        .story-v3-grid {
            display: grid;
            grid-template-columns:
                repeat(2, minmax(0, 1fr));
            gap: 18px;
        }

        .story-v3-cards {
            display: grid;
            gap: 10px;
        }

        .story-v3-card {
            padding: 15px;
            border-radius: 11px;
            background: #17191d;
            border: 1px solid rgba(255,255,255,.06);
        }

        .story-v3-card strong {
            display: block;
            color: #f4e8c1;
            margin-bottom: 5px;
        }

        .story-v3-card span {
            color: #d8b76a;
            font-size: .78rem;
        }

        .story-v3-card p {
            color: #aaa;
            line-height: 1.7;
            margin: 8px 0 0;
            font-size: .86rem;
        }

        .story-v3-card.evidence {
            border-right: 3px solid #8b4513;
        }

        .story-v3-timeline {
            display: grid;
            gap: 10px;
        }

        .story-v3-timeline-item {
            display: grid;
            grid-template-columns: 90px 1fr;
            gap: 15px;
            padding: 12px;
            border-radius: 10px;
            background: #17191d;
        }

        .story-v3-timeline-item strong {
            color: #d8b76a;
        }

        .story-v3-timeline-item span {
            color: #bbb;
            line-height: 1.6;
        }

        .story-v3-challenge {
            padding: 24px;
            border-radius: 15px;
            background:
                linear-gradient(
                    135deg,
                    #28211b,
                    #1b1d22
                );
            border: 1px solid rgba(216,183,106,.3);
        }

        .story-v3-challenge-title {
            color: #d8b76a;
            font-weight: 900;
            margin-bottom: 10px;
            font-size: 1.15rem;
        }

        .story-v3-challenge p {
            color: #ddd;
            line-height: 1.8;
        }

        .story-v3-challenge input {
            width: 100%;
            padding: 13px;
            border-radius: 9px;
            border: 1px solid #4a4d53;
            background: #111317;
            color: #fff;
            outline: none;
            margin: 8px 0 12px;
            font-size: 1rem;
            direction: ltr;
            text-align: center;
        }

        .story-v3-challenge input:focus {
            border-color: #d8b76a;
        }

        .story-v3-hint {
            padding: 12px;
            margin-bottom: 14px;
            border-radius: 9px;
            background: rgba(216,183,106,.08);
            color: #c6b98e;
            font-size: .82rem;
            line-height: 1.7;
        }

        .story-v3-feedback {
            margin-top: 12px;
            min-height: 24px;
            line-height: 1.7;
            text-align: center;
            font-weight: 700;
        }

        .story-v3-feedback.error {
            color: #e58b8b;
        }

        .story-v3-feedback.success {
            color: #6edb9a;
        }

        .story-v3-loading,
        .story-v3-error {
            text-align: center;
            padding: 70px 20px;
            border-radius: 18px;
            background: #191b20;
        }

        .story-v3-loading div {
            font-size: 3rem;
            animation: storyPulse 1.4s infinite;
        }

        .story-v3-loading h3,
        .story-v3-error h3 {
            color: #f4e8c1;
        }

        .story-v3-loading p,
        .story-v3-error p {
            color: #999;
        }

        .story-v3-result {
            text-align: center;
        }

        .story-v3-result-icon {
            font-size: 4rem;
            margin-bottom: 12px;
        }

        .story-v3-result > p {
            color: #bbb;
            line-height: 1.8;
        }

        .story-v3-effect {
            text-align: right;
            padding: 18px;
            margin: 20px 0;
            border-radius: 12px;
            background: rgba(216,183,106,.08);
            border: 1px solid rgba(216,183,106,.2);
        }

        .story-v3-effect strong {
            color: #d8b76a;
        }

        .story-v3-effect p {
            color: #ccc;
            line-height: 1.8;
        }

        .story-v3-result.final {
            border-color: rgba(216,183,106,.55);
        }

        @keyframes storyPulse {
            50% {
                transform: scale(1.12);
                opacity: .7;
            }
        }

        @media (max-width: 800px) {

            .qad-story-v3 {
                padding: 12px;
            }

            .story-v3-header,
            .story-v3-briefing,
            .story-v3-day-file,
            .story-v3-result {
                padding: 20px;
            }

            .story-v3-days,
            .story-v3-grid {
                grid-template-columns: 1fr;
            }

            .story-v3-day {
                grid-template-columns: 42px 1fr;
            }

            .story-v3-day-status {
                display: none;
            }

            .story-v3-day-header {
                flex-direction: column;
            }

            .story-v3-day-counter {
                width: 100%;
            }

            .story-v3-timeline-item {
                grid-template-columns: 1fr;
                gap: 5px;
            }

            .story-v3-operation-bottom {
                flex-direction: column;
                align-items: stretch;
            }

            .story-v3-btn {
                width: 100%;
            }
        }

        `;

        document.head.appendChild(style);
    }

    /* ============================================================
       LOAD STORIES
       ============================================================ */

    async function loadStories() {

        injectStyles();

        const root = getRoot();

        if (!root) return;

        root.innerHTML = `
            <div class="story-v3-loading">
                <div>🕵️</div>

                <h3>
                    جاري فتح أرشيف التحقيق...
                </h3>

                <p>
                    تتم مزامنة ملفات القصة.
                </p>
            </div>
        `;

        try {

            const response =
                await fetch(
                    STORY_URL +
                    "?v=" +
                    Date.now(),
                    {
                        cache: "no-store"
                    }
                );

            if (!response.ok) {
                throw new Error(
                    "HTTP " +
                    response.status
                );
            }

            const data =
                await response.json();

            if (Array.isArray(data)) {
                stories = data;
            } else {
                stories =
                    Array.isArray(data.stories)
                        ? data.stories
                        : [];
            }

            console.log(
                "✅ Story Mode loaded:",
                stories
            );

            renderStories();

        } catch (error) {

            console.error(
                "❌ Story Mode Error:",
                error
            );

            root.innerHTML = `
                <div class="story-v3-error">

                    <h3>
                        ⚠️ تعذر فتح أرشيف التحقيق
                    </h3>

                    <p>
                        تأكد من اتصال الإنترنت ثم حاول مرة أخرى.
                    </p>

                    <button
                        type="button"
                        class="story-v3-btn primary"
                        onclick="window.qadLoadStoryV3()"
                    >
                        🔄 إعادة المحاولة
                    </button>

                </div>
            `;
        }
    }

    /* ============================================================
       STORY LIST
       ============================================================ */

    function renderStories() {

        const root = getRoot();

        if (!root) return;

        if (!stories.length) {

            root.innerHTML = `
                <div class="story-v3-error">
                    <h3>
                        لا توجد عمليات في الأرشيف حاليًا.
                    </h3>
                </div>
            `;

            return;
        }

        root.innerHTML = `

            <header class="story-v3-header">

                <span class="story-v3-kicker">
                    CONFIDENTIAL / STORY ARCHIVE
                </span>

                <h2>
                    🕵️ أرشيف التحقيقات
                </h2>

                <p>
                    سلسلة تحقيقات مترابطة.
                    كل يوم يكشف جزءًا جديدًا من الحقيقة.
                </p>

            </header>

            <div>

                ${stories.map(story => {

                    const progress =
                        getStoryProgress(
                            story.id
                        );

                    const completed =
                        Array.isArray(
                            progress.completedDays
                        )
                            ? progress.completedDays.length
                            : 0;

                    const total =
                        Array.isArray(
                            story.days
                        )
                            ? story.days.length
                            : 0;

                    const percent =
                        total
                            ? Math.round(
                                completed /
                                total *
                                100
                            )
                            : 0;

                    return `

                        <article
                            class="story-v3-operation"
                        >

                            <div
                                class="story-v3-operation-top"
                            >

                                <span
                                    class="story-v3-badge"
                                >
                                    عملية أمنية كبرى
                                </span>

                                <span>
                                    ${completed}/${total}
                                </span>

                            </div>

                            <h3>
                                ${escapeHTML(
                                    story.title
                                )}
                            </h3>

                            <p>
                                ${escapeHTML(
                                    story.description
                                )}
                            </p>

                            <div
                                class="story-v3-progress"
                            >
                                <div
                                    class="story-v3-progress-fill"
                                    style="width:${percent}%"
                                ></div>
                            </div>

                            <div
                                class="story-v3-operation-bottom"
                            >

                                <strong>
                                    ${percent}% مكتمل
                                </strong>

                                <button
                                    type="button"
                                    class="story-v3-btn"
                                    data-action="open-story"
                                    data-story-id="${escapeHTML(
                                        story.id
                                    )}"
                                >
                                    📂 فتح الملف
                                </button>

                            </div>

                        </article>
                    `;

                }).join("")}

            </div>
        `;
    }

    /* ============================================================
       DAYS
       ============================================================ */

    function openStory(storyId) {

        currentStory =
            stories.find(
                story =>
                    String(story.id) ===
                    String(storyId)
            );

        if (!currentStory) {
            console.error(
                "Story not found:",
                storyId
            );

            return;
        }

        const root = getRoot();

        if (!root) return;

        const progress =
            getStoryProgress(
                currentStory.id
            );

        const days =
            Array.isArray(
                currentStory.days
            )
                ? currentStory.days
                : [];

        root.innerHTML = `

            <div class="story-v3-toolbar">

                <button
                    type="button"
                    class="story-v3-link-btn"
                    data-action="back-archive"
                >
                    ← الأرشيف
                </button>

                <span>
                    ${progress.completedDays.length}
                    /
                    ${days.length}
                </span>

            </div>

            <section
                class="story-v3-operation-header"
            >

                <span class="story-v3-kicker">
                    OPERATION FILE
                </span>

                <h2>
                    ${escapeHTML(
                        currentStory.title
                    )}
                </h2>

                <p>
                    اختر اليوم المتاح للتحقيق.
                    الأيام التالية تُفتح بالتتابع.
                </p>

            </section>

            <div class="story-v3-days">

                ${days.map(
                    (day, index) => {

                        const unlocked =
                            index === 0 ||
                            progress.completedDays
                                .includes(
                                    days[
                                        index - 1
                                    ].id
                                );

                        const completed =
                            progress.completedDays
                                .includes(
                                    day.id
                                );

                        return `

                            <button
                                type="button"
                                class="
                                    story-v3-day
                                    ${
                                        completed
                                            ? "completed"
                                            : unlocked
                                                ? "unlocked"
                                                : "locked"
                                    }
                                "
                                ${
                                    unlocked
                                        ? `
                                            data-action="open-day"
                                            data-day-id="${escapeHTML(
                                                day.id
                                            )}"
                                          `
                                        : ""
                                }
                            >

                                <span
                                    class="story-v3-day-number"
                                >
                                    ${
                                        completed
                                            ? "✓"
                                            : escapeHTML(
                                                day.day
                                            )
                                    }
                                </span>

                                <span
                                    class="story-v3-day-content"
                                >

                                    <strong>
                                        اليوم
                                        ${escapeHTML(
                                            day.day
                                        )}
                                    </strong>

                                    <span>
                                        ${escapeHTML(
                                            day.title
                                        )}
                                    </span>

                                </span>

                                <span
                                    class="story-v3-day-status"
                                >
                                    ${
                                        completed
                                            ? "مكتمل"
                                            : unlocked
                                                ? "ابدأ"
                                                : "مقفل"
                                    }
                                </span>

                            </button>
                        `;
                    }
                ).join("")}

            </div>
        `;
    }

    window.qadOpenStoryV3 =
        openStory;

    /* ============================================================
       BRIEFING
       ============================================================ */

    function showBriefing(storyId, dayId) {

        currentStory =
            stories.find(
                story =>
                    String(story.id) ===
                    String(storyId)
            );

        if (!currentStory) return;

        currentDay =
            currentStory.days.find(
                day =>
                    String(day.id) ===
                    String(dayId)
            );

        if (!currentDay) return;

        const root = getRoot();

        if (!root) return;

        root.innerHTML = `

            <div class="story-v3-toolbar">

                <button
                    type="button"
                    class="story-v3-link-btn"
                    data-action="back-days"
                >
                    ← الأيام
                </button>

            </div>

            <article
                class="story-v3-briefing"
            >

                <div
                    class="story-v3-file-stamp"
                >
                    DAY ${escapeHTML(
                        currentDay.day
                    )}
                </div>

                <div
                    class="story-v3-briefing-icon"
                >
                    📩
                </div>

                <span class="story-v3-kicker">
                    CONFIDENTIAL BRIEFING
                </span>

                <h2>
                    ${escapeHTML(
                        currentDay.title
                    )}
                </h2>

                <div
                    class="story-v3-briefing-paper"
                >
                    ${escapeHTML(
                        currentDay.briefing
                    )}
                </div>

                <button
                    type="button"
                    class="
                        story-v3-btn
                        primary
                    "
                    data-action="start-day"
                >
                    🔎 فتح ملف التحقيق
                </button>

            </article>
        `;
    }

    window.qadShowBriefingV3 =
        showBriefing;

    /* ============================================================
       START DAY
       ============================================================ */

    function startDay() {

        if (!currentStory || !currentDay) {
            console.error(
                "❌ currentStory/currentDay غير موجود"
            );

            return;
        }

        const root = getRoot();

        if (!root) return;

        const characters =
            Array.isArray(
                currentDay.characters
            )
                ? currentDay.characters
                : [];

        const evidences =
            Array.isArray(
                currentDay.evidences
            )
                ? currentDay.evidences
                : [];

        const timeline =
            Array.isArray(
                currentDay.timeline
            )
                ? currentDay.timeline
                : [];

        const challenge =
            currentDay.challenge;

        root.innerHTML = `

            <div class="story-v3-toolbar">

                <button
                    type="button"
                    class="story-v3-link-btn"
                    data-action="back-days"
                >
                    ← خريطة الأيام
                </button>

                <span>
                    اليوم ${escapeHTML(
                        currentDay.day
                    )}
                    /
                    ${currentStory.days.length}
                </span>

            </div>

            <article
                class="story-v3-day-file"
            >

                <header
                    class="story-v3-day-header"
                >

                    <div>

                        <span
                            class="story-v3-kicker"
                        >
                            INVESTIGATION FILE
                        </span>

                        <h2>
                            ${escapeHTML(
                                currentDay.title
                            )}
                        </h2>

                    </div>

                    <div
                        class="story-v3-day-counter"
                    >
                        DAY ${escapeHTML(
                            currentDay.day
                        )}
                    </div>

                </header>

                <section
                    class="
                        story-v3-section
                        story-v3-overview
                    "
                >

                    <h3>
                        📋 ملخص المهمة
                    </h3>

                    <p>
                        ${escapeHTML(
                            currentDay.overview
                        )}
                    </p>

                </section>

                <section
                    class="story-v3-grid"
                >

                    <div
                        class="story-v3-panel"
                    >

                        <h3>
                            👥 الشخصيات
                        </h3>

                        <div
                            class="story-v3-cards"
                        >

                            ${
                                characters.length
                                    ? characters.map(
                                        character => `
                                            <div
                                                class="
                                                    story-v3-card
                                                "
                                            >

                                                <strong>
                                                    👤
                                                    ${escapeHTML(
                                                        character.name
                                                    )}
                                                </strong>

                                                <span>
                                                    ${escapeHTML(
                                                        character.role
                                                    )}
                                                </span>

                                                <p>
                                                    ${escapeHTML(
                                                        character.bio
                                                    )}
                                                </p>

                                            </div>
                                        `
                                    ).join("")
                                    : `
                                        <div class="story-v3-card">
                                            لا توجد شخصيات مسجلة.
                                        </div>
                                    `
                            }

                        </div>

                    </div>

                    <div
                        class="story-v3-panel"
                    >

                        <h3>
                            🔎 الأدلة
                        </h3>

                        <div
                            class="story-v3-cards"
                        >

                            ${
                                evidences.length
                                    ? evidences.map(
                                        evidence => `
                                            <div
                                                class="
                                                    story-v3-card
                                                    evidence
                                                "
                                            >

                                                <strong>
                                                    📂
                                                    ${escapeHTML(
                                                        evidence.title
                                                    )}
                                                </strong>

                                                <p>
                                                    ${escapeHTML(
                                                        evidence.desc
                                                    )}
                                                </p>

                                            </div>
                                        `
                                    ).join("")
                                    : `
                                        <div class="story-v3-card">
                                            لا توجد أدلة مسجلة.
                                        </div>
                                    `
                            }

                        </div>

                    </div>

                </section>

                <section
                    class="story-v3-panel"
                >

                    <h3>
                        🕐 التسلسل الزمني
                    </h3>

                    <div
                        class="story-v3-timeline"
                    >

                        ${
                            timeline.length
                                ? timeline.map(
                                    item => `
                                        <div
                                            class="
                                                story-v3-timeline-item
                                            "
                                        >

                                            <strong>
                                                ${escapeHTML(
                                                    item.time
                                                )}
                                            </strong>

                                            <span>
                                                ${escapeHTML(
                                                    item.event
                                                )}
                                            </span>

                                        </div>
                                    `
                                ).join("")
                                : `
                                    <div class="story-v3-timeline-item">
                                        <span>
                                            لا يوجد تسلسل زمني.
                                        </span>
                                    </div>
                                `
                        }

                    </div>

                </section>

                ${
                    challenge
                        ? `

                            <section
                                class="
                                    story-v3-challenge
                                "
                            >

                                <div
                                    class="
                                        story-v3-challenge-title
                                    "
                                >
                                    🧩 اختبار المحقق
                                </div>

                                <p>
                                    ${escapeHTML(
                                        challenge.prompt
                                    )}
                                </p>

                                <input
                                    id="storyV3Answer"
                                    type="text"
                                    autocomplete="off"
                                    placeholder="اكتب إجابتك..."
                                >

                                <div
                                    class="
                                        story-v3-hint
                                    "
                                >
                                    💡 تلميح:
                                    ${
                                        escapeHTML(
                                            challenge.hint ||
                                            "راجع الأدلة بعناية."
                                        )
                                    }
                                </div>

                                <button
                                    type="button"
                                    id="storyV3Submit"
                                    class="
                                        story-v3-btn
                                        primary
                                    "
                                    data-action="submit-answer"
                                >
                                    📝 تقديم الإجابة
                                </button>

                                <div
                                    id="storyV3Feedback"
                                    class="story-v3-feedback"
                                ></div>

                            </section>

                        `
                        : `

                            <button
                                type="button"
                                class="
                                    story-v3-btn
                                    primary
                                "
                                data-action="complete-day"
                            >
                                ✅ إنهاء اليوم
                            </button>

                        `
                }

            </article>
        `;

        /*
           مهم:
           هنا بنربط Enter بطريقة آمنة.
           الزر نفسه مربوط عن طريق event delegation
           أسفل الملف.
        */

        const input =
            document.getElementById(
                "storyV3Answer"
            );

        if (input) {

            input.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key === "Enter"
                    ) {
                        event.preventDefault();

                        checkAnswer();
                    }

                }
            );
        }
    }

    window.qadStartDayV3 =
        startDay;

    /* ============================================================
       CHECK ANSWER
       ============================================================ */

    function checkAnswer() {

        console.log(
            "📝 Checking story answer..."
        );

        if (
            !currentStory ||
            !currentDay
        ) {
            console.error(
                "❌ لا توجد قضية/يوم حالي."
            );

            return;
        }

        if (
            !currentDay.challenge
        ) {
            console.error(
                "❌ هذا اليوم لا يحتوي على challenge."
            );

            return;
        }

        const input =
            document.getElementById(
                "storyV3Answer"
            );

        const feedback =
            document.getElementById(
                "storyV3Feedback"
            );

        if (!input || !feedback) {

            console.error(
                "❌ input أو feedback غير موجود"
            );

            return;
        }

        const userAnswer =
            normalizeAnswer(
                input.value
            );

        /*
           ندعم أكثر من اسم محتمل للإجابة
           بدون كسر story.json القديم.
        */

        const challenge =
            currentDay.challenge;

        const expectedRaw =
            challenge.expectedAnswer ??
            challenge.answer ??
            challenge.correctAnswer ??
            "";

        const expectedAnswer =
            normalizeAnswer(
                expectedRaw
            );

        console.log(
            "User:",
            userAnswer
        );

        console.log(
            "Expected:",
            expectedAnswer
        );

        if (!userAnswer) {

            feedback.className =
                "story-v3-feedback error";

            feedback.textContent =
                "⚠️ اكتب إجابتك أولًا.";

            return;
        }

        if (!expectedAnswer) {

            feedback.className =
                "story-v3-feedback error";

            feedback.textContent =
                "⚠️ لم يتم تحديد الإجابة الصحيحة في ملف القصة.";

            console.error(
                "❌ challenge has no expectedAnswer/answer/correctAnswer:",
                challenge
            );

            return;
        }

        if (
            userAnswer ===
            expectedAnswer
        ) {

            feedback.className =
                "story-v3-feedback success";

            feedback.textContent =
                "✅ إجابة صحيحة!";

            /*
               تأخير بسيط حتى يشاهد اللاعب النتيجة
            */

            setTimeout(
                () => {
                    completeDay();
                },
                350
            );

            return;
        }

        /*
           محاولة ثانية:
           لو كانت الإجابة عبارة عن IP
           أو نص يحتوي على الإجابة.
        */

        const userCompact =
            userAnswer.replace(
                /\s/g,
                ""
            );

        const expectedCompact =
            expectedAnswer.replace(
                /\s/g,
                ""
            );

        if (
            userCompact ===
            expectedCompact
        ) {

            feedback.className =
                "story-v3-feedback success";

            feedback.textContent =
                "✅ إجابة صحيحة!";

            setTimeout(
                () => {
                    completeDay();
                },
                350
            );

            return;
        }

        /*
           إجابة خاطئة
        */

        const progress =
            getProgress();

        if (
            !progress[
                currentStory.id
            ]
        ) {
            progress[
                currentStory.id
            ] =
                createStoryProgress();
        }

        progress[
            currentStory.id
        ].failedAttempts =
            Number(
                progress[
                    currentStory.id
                ].failedAttempts || 0
            ) + 1;

        saveProgress(progress);

        feedback.className =
            "story-v3-feedback error";

        feedback.innerHTML =
            "❌ الإجابة غير صحيحة.<br>" +
            "راجع الأدلة وحاول مرة أخرى.";

        console.log(
            "❌ Wrong answer"
        );
    }

    window.qadCheckAnswerV3 =
        checkAnswer;

    /* ============================================================
       COMPLETE DAY
       ============================================================ */

    function completeDay() {

        if (
            !currentStory ||
            !currentDay
        ) {
            return;
        }

        const progress =
            getProgress();

        if (
            !progress[
                currentStory.id
            ]
        ) {
            progress[
                currentStory.id
            ] =
                createStoryProgress();
        }

        const state =
            progress[
                currentStory.id
            ];

        if (
            !Array.isArray(
                state.completedDays
            )
        ) {
            state.completedDays = [];
        }

        if (
            !state.completedDays.includes(
                currentDay.id
            )
        ) {

            state.completedDays.push(
                currentDay.id
            );
        }

        state.lastDay =
            Math.max(
                Number(
                    state.lastDay || 0
                ),
                Number(
                    currentDay.day || 0
                )
            );

        saveProgress(progress);

        console.log(
            "✅ Day completed:",
            currentDay.id
        );

        showCompletion();
    }

    window.qadCompleteDayV3 =
        completeDay;

    /* ============================================================
       COMPLETION
       ============================================================ */

    function showCompletion() {

        const root =
            getRoot();

        if (!root) return;

        const finalDay =
            Number(
                currentDay.day
            ) ===
            Number(
                currentStory.days.length
            );

        root.innerHTML = `

            <article
                class="
                    story-v3-result
                    ${finalDay ? "final" : ""}
                "
            >

                <div
                    class="story-v3-result-icon"
                >
                    ${
                        finalDay
                            ? "🏆"
                            : "✅"
                    }
                </div>

                <span
                    class="story-v3-kicker"
                >
                    INVESTIGATION UPDATE
                </span>

                <h2>
                    ${
                        finalDay
                            ? "العملية اكتملت"
                            : `اليوم ${escapeHTML(
                                currentDay.day
                            )} تم اجتيازه`
                    }
                </h2>

                <p>
                    ${
                        finalDay
                            ? "أغلقت ملف العملية بالكامل."
                            : "تم حفظ تقدمك وفتح اليوم التالي."
                    }
                </p>

                ${
                    currentDay.storyEffect
                        ? `
                            <div
                                class="
                                    story-v3-effect
                                "
                            >

                                <strong>
                                    🧵 تطور القضية
                                </strong>

                                <p>
                                    ${escapeHTML(
                                        currentDay.storyEffect
                                    )}
                                </p>

                            </div>
                        `
                        : ""
                }

                ${
                    currentDay.finalReveal
                        ? `
                            <div
                                class="
                                    story-v3-effect
                                "
                            >

                                <strong>
                                    🎬 الكشف النهائي
                                </strong>

                                <p>
                                    ${escapeHTML(
                                        currentDay.finalReveal
                                    )}
                                </p>

                            </div>
                        `
                        : ""
                }

                <button
                    type="button"
                    class="
                        story-v3-btn
                        primary
                    "
                    data-action="back-days"
                >
                    📅 العودة إلى الأيام
                </button>

            </article>
        `;
    }

    /* ============================================================
       EVENT DELEGATION
       ============================================================ */

    function setupStoryEvents() {

        const root =
            getRoot();

        if (!root) return;

        /*
           أهم جزء في الإصلاح:
           أي زر داخل Story Mode يتم التعامل معه
           من مكان واحد.
        */

        root.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "[data-action]"
                    );

                if (!button) return;

                const action =
                    button.dataset.action;

                console.log(
                    "Story action:",
                    action
                );

                /* فتح قصة */

                if (
                    action ===
                    "open-story"
                ) {

                    openStory(
                        button.dataset.storyId
                    );

                    return;
                }

                /* فتح يوم */

                if (
                    action ===
                    "open-day"
                ) {

                    showBriefing(
                        currentStory.id,
                        button.dataset.dayId
                    );

                    return;
                }

                /* بداية اليوم */

                if (
                    action ===
                    "start-day"
                ) {

                    startDay();

                    return;
                }

                /* تقديم الإجابة */

                if (
                    action ===
                    "submit-answer"
                ) {

                    event.preventDefault();

                    checkAnswer();

                    return;
                }

                /* إنهاء يوم بدون سؤال */

                if (
                    action ===
                    "complete-day"
                ) {

                    completeDay();

                    return;
                }

                /* العودة للأيام */

                if (
                    action ===
                    "back-days"
                ) {

                    if (
                        currentStory
                    ) {
                        openStory(
                            currentStory.id
                        );
                    }

                    return;
                }

                /* العودة للأرشيف */

                if (
                    action ===
                    "back-archive"
                ) {

                    renderStories();

                    return;
                }
            }
        );
    }

    /* ============================================================
       PUBLIC LOAD
       ============================================================ */

    window.qadLoadStoryV3 =
        loadStories;

    window.qadRenderStoriesV3 =
        renderStories;

    /* ============================================================
       DOM READY
       ============================================================ */

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            injectStyles();

            const root =
                getRoot();

            if (root) {
                setupStoryEvents();
            }

            const button =
                document.getElementById(
                    "btnStoryMode"
                );

            if (button) {

                button.addEventListener(
                    "click",
                    () => {

                        document
                            .querySelectorAll(
                                ".view-section"
                            )
                            .forEach(
                                section => {
                                    section.classList
                                        .add(
                                            "hidden"
                                        );
                                }
                            );

                        document
                            .getElementById(
                                "storyModeSection"
                            )
                            ?.classList
                            .remove(
                                "hidden"
                            );

                        loadStories();
                    }
                );
            }

            const section =
                document.getElementById(
                    "storyModeSection"
                );

            const backButton =
                section?.querySelector(
                    ".btn-to-menu"
                );

            if (backButton) {

                backButton.addEventListener(
                    "click",
                    () => {

                        document
                            .querySelectorAll(
                                ".view-section"
                            )
                            .forEach(
                                section => {
                                    section.classList
                                        .add(
                                            "hidden"
                                        );
                                }
                            );

                        document
                            .getElementById(
                                "mainMenuSection"
                            )
                            ?.classList
                            .remove(
                                "hidden"
                            );
                    }
                );
            }

        }
    );

})();