/* ============================================================
   QADAYATI — STORY MODE V2
   مستقل بالكامل عن نظام القضايا العادية
   لا يستخدم caseBoardSection
   لا يعتمد على qadayati-interactive.js
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

    const escapeHTML = value =>
        String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    const normalizeAnswer = value =>
        String(value ?? "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, " ");

    function getProgress() {
        try {
            const saved =
                localStorage.getItem(PROGRESS_KEY);

            return saved
                ? JSON.parse(saved)
                : {};
        } catch {
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
                "Story progress error:",
                error
            );
        }
    }

    function getStoryProgress(storyId) {
        const progress = getProgress();

        if (!progress[storyId]) {
            progress[storyId] = {
                completedDays: [],
                failedAttempts: 0,
                lastDay: 0,
                notes: []
            };

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
                    "storyModeSection غير موجود"
                );

                return null;
            }

            root =
                document.createElement("div");

            root.id =
                "storyModeContainer";

            root.className =
                "qad-story-v2";

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
                "qad-story-v2-style"
            )
        ) return;

        const style =
            document.createElement("style");

        style.id =
            "qad-story-v2-style";

        style.textContent = `

        .qad-story-v2 {
            direction: rtl;
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            box-sizing: border-box;
            color: #eee;
        }

        .qad-story-v2 * {
            box-sizing: border-box;
        }

        .story-v2-header {
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

        .story-v2-header::after {
            content: "";
            position: absolute;
            width: 260px;
            height: 260px;
            left: -100px;
            top: -120px;
            border-radius: 50%;
            border: 1px solid rgba(212,174,96,.18);
        }

        .story-v2-kicker {
            display: inline-block;
            font-size: .72rem;
            letter-spacing: 2px;
            color: #d8b76a;
            font-weight: 800;
            margin-bottom: 8px;
        }

        .story-v2-header h2,
        .story-v2-operation-header h2,
        .story-v2-day-header h2,
        .story-v2-briefing h2,
        .story-v2-result h2 {
            margin: 0 0 10px;
            color: #f4e8c1;
        }

        .story-v2-header p,
        .story-v2-operation-header p {
            color: #bbb;
            line-height: 1.8;
            margin: 0;
        }

        .story-v2-operation {
            padding: 24px;
            margin-bottom: 18px;
            border-radius: 16px;
            background: #191b20;
            border: 1px solid rgba(255,255,255,.08);
            transition:
                transform .2s ease,
                border-color .2s ease,
                box-shadow .2s ease;
        }

        .story-v2-operation:hover {
            transform: translateY(-3px);
            border-color: rgba(216,183,106,.4);
            box-shadow: 0 15px 35px rgba(0,0,0,.25);
        }

        .story-v2-operation-top,
        .story-v2-operation-bottom,
        .story-v2-toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
        }

        .story-v2-operation-top {
            color: #aaa;
            font-size: .85rem;
            margin-bottom: 15px;
        }

        .story-v2-badge {
            background: #713737;
            color: #fff;
            padding: 5px 10px;
            border-radius: 7px;
            font-size: .72rem;
        }

        .story-v2-operation h3 {
            color: #f4e8c1;
            margin: 0 0 8px;
        }

        .story-v2-operation p {
            color: #aaa;
            line-height: 1.8;
            margin: 0 0 18px;
        }

        .story-v2-progress {
            height: 8px;
            background: #303238;
            border-radius: 99px;
            overflow: hidden;
            margin-bottom: 15px;
        }

        .story-v2-progress-fill {
            height: 100%;
            background: linear-gradient(
                90deg,
                #8b4513,
                #d8b76a
            );
            border-radius: inherit;
            transition: width .5s ease;
        }

        .story-v2-btn {
            border: 0;
            border-radius: 10px;
            padding: 11px 18px;
            cursor: pointer;
            background: #29313b;
            color: #fff;
            font-weight: 700;
            transition:
                transform .18s ease,
                background .18s ease;
        }

        .story-v2-btn:hover {
            transform: translateY(-2px);
            background: #354252;
        }

        .story-v2-btn.primary {
            background: #8b4513;
        }

        .story-v2-btn.primary:hover {
            background: #a95819;
        }

        .story-v2-link-btn {
            border: 0;
            background: transparent;
            color: #d8b76a;
            cursor: pointer;
            font-weight: 700;
            padding: 5px;
        }

        .story-v2-toolbar {
            margin-bottom: 18px;
            color: #999;
        }

        .story-v2-operation-header {
            padding: 25px;
            margin-bottom: 20px;
            border-radius: 16px;
            background: #17191e;
            border: 1px solid rgba(255,255,255,.08);
        }

        .story-v2-days {
            display: grid;
            grid-template-columns:
                repeat(2, minmax(0, 1fr));
            gap: 10px;
        }

        .story-v2-day {
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
            transition: .2s ease;
        }

        .story-v2-day.unlocked:hover {
            transform: translateX(-3px);
            border-color: #d8b76a;
        }

        .story-v2-day.locked {
            opacity: .42;
            cursor: not-allowed;
        }

        .story-v2-day.completed {
            border-color: rgba(39,174,96,.45);
        }

        .story-v2-day-number {
            display: grid;
            place-items: center;
            width: 44px;
            height: 44px;
            border-radius: 12px;
            background: #292d34;
            color: #d8b76a;
            font-weight: 900;
        }

        .story-v2-day-content {
            display: flex;
            flex-direction: column;
            gap: 5px;
            min-width: 0;
        }

        .story-v2-day-content strong {
            color: #f4e8c1;
        }

        .story-v2-day-content span {
            color: #aaa;
            font-size: .82rem;
            line-height: 1.5;
        }

        .story-v2-day-status {
            font-size: .72rem;
            color: #aaa;
            white-space: nowrap;
        }

        .story-v2-briefing,
        .story-v2-day-file,
        .story-v2-result {
            padding: 30px;
            border-radius: 18px;
            background: #191b20;
            border: 1px solid rgba(216,183,106,.22);
            box-shadow: 0 18px 45px rgba(0,0,0,.25);
        }

        .story-v2-file-stamp {
            display: inline-block;
            padding: 5px 10px;
            border: 1px solid #713737;
            color: #d98b8b;
            border-radius: 5px;
            font-size: .72rem;
            margin-bottom: 15px;
        }

        .story-v2-briefing-icon {
            font-size: 3rem;
            margin-bottom: 12px;
        }

        .story-v2-briefing-paper {
            margin: 20px 0;
            padding: 22px;
            border-radius: 12px;
            background: #f4efe3;
            color: #29221d;
            line-height: 2;
            font-size: 1rem;
            text-align: right;
        }

        .story-v2-day-header {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            align-items: flex-start;
            padding-bottom: 20px;
            margin-bottom: 20px;
            border-bottom: 1px solid rgba(255,255,255,.08);
        }

        .story-v2-day-counter {
            min-width: 70px;
            text-align: center;
            padding: 10px;
            border-radius: 10px;
            background: #713737;
            color: #fff;
            font-weight: 900;
        }

        .story-v2-section,
        .story-v2-panel {
            margin-bottom: 18px;
            padding: 20px;
            border-radius: 14px;
            background: #202329;
            border: 1px solid rgba(255,255,255,.06);
        }

        .story-v2-panel h3,
        .story-v2-section h3 {
            margin: 0 0 14px;
            color: #d8b76a;
        }

        .story-v2-overview p {
            color: #ccc;
            line-height: 1.9;
            margin: 0;
        }

        .story-v2-grid {
            display: grid;
            grid-template-columns:
                repeat(2, minmax(0, 1fr));
            gap: 18px;
        }

        .story-v2-cards {
            display: grid;
            gap: 10px;
        }

        .story-v2-card {
            padding: 15px;
            border-radius: 11px;
            background: #17191d;
            border: 1px solid rgba(255,255,255,.06);
        }

        .story-v2-card strong {
            display: block;
            color: #f4e8c1;
            margin-bottom: 5px;
        }

        .story-v2-card span {
            color: #d8b76a;
            font-size: .78rem;
        }

        .story-v2-card p {
            color: #aaa;
            line-height: 1.7;
            margin: 8px 0 0;
            font-size: .86rem;
        }

        .story-v2-card.evidence {
            border-right: 3px solid #8b4513;
        }

        .story-v2-timeline {
            display: grid;
            gap: 10px;
        }

        .story-v2-timeline-item {
            display: grid;
            grid-template-columns: 90px 1fr;
            gap: 15px;
            padding: 12px;
            border-radius: 10px;
            background: #17191d;
        }

        .story-v2-timeline-item strong {
            color: #d8b76a;
        }

        .story-v2-timeline-item span {
            color: #bbb;
            line-height: 1.6;
        }

        .story-v2-challenge {
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

        .story-v2-challenge-title {
            color: #d8b76a;
            font-weight: 900;
            margin-bottom: 10px;
        }

        .story-v2-challenge p {
            color: #ddd;
            line-height: 1.8;
        }

        .story-v2-challenge input {
            width: 100%;
            padding: 13px;
            border-radius: 9px;
            border: 1px solid #4a4d53;
            background: #111317;
            color: #fff;
            outline: none;
            margin: 8px 0 12px;
        }

        .story-v2-challenge input:focus {
            border-color: #d8b76a;
        }

        .story-v2-hint {
            padding: 12px;
            margin-bottom: 14px;
            border-radius: 9px;
            background: rgba(216,183,106,.08);
            color: #c6b98e;
            font-size: .82rem;
            line-height: 1.7;
        }

        .story-v2-feedback {
            margin-top: 12px;
            min-height: 20px;
            line-height: 1.7;
        }

        .story-v2-feedback.error {
            color: #e58b8b;
        }

        .story-v2-loading,
        .story-v2-error {
            text-align: center;
            padding: 70px 20px;
            border-radius: 18px;
            background: #191b20;
        }

        .story-v2-loading div {
            font-size: 3rem;
            animation: storyPulse 1.4s infinite;
        }

        .story-v2-loading h3,
        .story-v2-error h3 {
            color: #f4e8c1;
        }

        .story-v2-loading p,
        .story-v2-error p {
            color: #999;
        }

        .story-v2-result {
            text-align: center;
        }

        .story-v2-result-icon {
            font-size: 4rem;
            margin-bottom: 12px;
        }

        .story-v2-result > p {
            color: #bbb;
            line-height: 1.8;
        }

        .story-v2-effect {
            text-align: right;
            padding: 18px;
            margin: 20px 0;
            border-radius: 12px;
            background: rgba(216,183,106,.08);
            border: 1px solid rgba(216,183,106,.2);
        }

        .story-v2-effect strong {
            color: #d8b76a;
        }

        .story-v2-effect p {
            color: #ccc;
            line-height: 1.8;
        }

        .story-v2-result.final {
            border-color: rgba(216,183,106,.55);
        }

        @keyframes storyPulse {
            50% {
                transform: scale(1.12);
                opacity: .7;
            }
        }

        @media (max-width: 800px) {
            .qad-story-v2 {
                padding: 12px;
            }

            .story-v2-header,
            .story-v2-briefing,
            .story-v2-day-file,
            .story-v2-result {
                padding: 20px;
            }

            .story-v2-days,
            .story-v2-grid {
                grid-template-columns: 1fr;
            }

            .story-v2-day {
                grid-template-columns: 42px 1fr;
            }

            .story-v2-day-status {
                display: none;
            }

            .story-v2-day-header {
                flex-direction: column;
            }

            .story-v2-day-counter {
                width: 100%;
            }

            .story-v2-timeline-item {
                grid-template-columns: 1fr;
                gap: 5px;
            }

            .story-v2-operation-bottom {
                flex-direction: column;
                align-items: stretch;
            }

            .story-v2-btn {
                width: 100%;
            }
        }

        `;

        document.head.appendChild(style);
    }

    /* ============================================================
       LOADING
       ============================================================ */

    async function loadStories() {

        injectStyles();

        const root = getRoot();

        if (!root) return;

        root.innerHTML = `
            <div class="story-v2-loading">
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
                    Date.now()
                );

            if (!response.ok) {
                throw new Error(
                    "story.json unavailable"
                );
            }

            const data =
                await response.json();

            stories =
                Array.isArray(data)
                    ? data
                    : data.stories || [];

            renderStories();

        } catch (error) {

            console.error(
                "Story Mode:",
                error
            );

            root.innerHTML = `
                <div class="story-v2-error">
                    <h3>
                        ⚠️ تعذر فتح أرشيف التحقيق
                    </h3>

                    <p>
                        تأكد من اتصال الإنترنت ثم حاول مرة أخرى.
                    </p>

                    <button
                        class="story-v2-btn primary"
                        onclick="window.qadLoadStoryV2()"
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
                <div class="story-v2-error">
                    لا توجد عمليات في الأرشيف حاليًا.
                </div>
            `;

            return;
        }

        root.innerHTML = `

            <header class="story-v2-header">

                <span class="story-v2-kicker">
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
                        progress.completedDays.length;

                    const total =
                        story.days.length;

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
                            class="story-v2-operation"
                        >

                            <div
                                class="story-v2-operation-top"
                            >

                                <span
                                    class="story-v2-badge"
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
                                class="story-v2-progress"
                            >
                                <div
                                    class="story-v2-progress-fill"
                                    style="
                                        width:${percent}%
                                    "
                                ></div>
                            </div>

                            <div
                                class="story-v2-operation-bottom"
                            >

                                <strong>
                                    ${percent}% مكتمل
                                </strong>

                                <button
                                    class="story-v2-btn"
                                    onclick="
                                        window.qadOpenStoryV2(
                                            '${escapeHTML(story.id)}'
                                        )
                                    "
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

    window.qadOpenStoryV2 =
        function(storyId) {

            currentStory =
                stories.find(
                    story =>
                        story.id === storyId
                );

            if (!currentStory) return;

            const root = getRoot();

            const progress =
                getStoryProgress(
                    currentStory.id
                );

            root.innerHTML = `

                <div class="story-v2-toolbar">

                    <button
                        class="story-v2-link-btn"
                        onclick="
                            window.qadRenderStoriesV2()
                        "
                    >
                        ← الأرشيف
                    </button>

                    <span>
                        ${progress.completedDays.length}
                        /
                        ${currentStory.days.length}
                    </span>

                </div>

                <section
                    class="story-v2-operation-header"
                >

                    <span class="story-v2-kicker">
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

                <div class="story-v2-days">

                    ${currentStory.days.map(
                        (day, index) => {

                            const unlocked =
                                index === 0 ||
                                progress.completedDays
                                    .includes(
                                        currentStory
                                            .days[
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
                                    class="
                                        story-v2-day
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
                                                onclick="
                                                    window.qadShowBriefingV2(
                                                        '${escapeHTML(currentStory.id)}',
                                                        '${escapeHTML(day.id)}'
                                                    )
                                                "
                                            `
                                            : ""
                                    }
                                >

                                    <span
                                        class="
                                            story-v2-day-number
                                        "
                                    >
                                        ${
                                            completed
                                                ? "✓"
                                                : day.day
                                        }
                                    </span>

                                    <span
                                        class="
                                            story-v2-day-content
                                        "
                                    >

                                        <strong>
                                            اليوم ${day.day}
                                        </strong>

                                        <span>
                                            ${escapeHTML(
                                                day.title
                                            )}
                                        </span>

                                    </span>

                                    <span
                                        class="
                                            story-v2-day-status
                                        "
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
        };

    /* ============================================================
       BRIEFING
       ============================================================ */

    window.qadShowBriefingV2 =
        function(storyId, dayId) {

            currentStory =
                stories.find(
                    story =>
                        story.id === storyId
                );

            if (!currentStory) return;

            currentDay =
                currentStory.days.find(
                    day =>
                        day.id === dayId
                );

            if (!currentDay) return;

            const root = getRoot();

            root.innerHTML = `

                <div class="story-v2-toolbar">

                    <button
                        class="story-v2-link-btn"
                        onclick="
                            window.qadOpenStoryV2(
                                '${escapeHTML(storyId)}'
                            )
                        "
                    >
                        ← الأيام
                    </button>

                </div>

                <article
                    class="story-v2-briefing"
                >

                    <div
                        class="story-v2-file-stamp"
                    >
                        DAY ${currentDay.day}
                    </div>

                    <div
                        class="story-v2-briefing-icon"
                    >
                        📩
                    </div>

                    <span class="story-v2-kicker">
                        CONFIDENTIAL BRIEFING
                    </span>

                    <h2>
                        ${escapeHTML(
                            currentDay.title
                        )}
                    </h2>

                    <div
                        class="story-v2-briefing-paper"
                    >
                        ${escapeHTML(
                            currentDay.briefing
                        )}
                    </div>

                    <button
                        class="
                            story-v2-btn
                            primary
                        "
                        onclick="
                            window.qadStartDayV2()
                        "
                    >
                        🔎 فتح ملف التحقيق
                    </button>

                </article>
            `;
        };

    /* ============================================================
       DAY
       ============================================================ */

    window.qadStartDayV2 =
        function() {

            if (!currentDay) return;

            const root = getRoot();

            root.innerHTML = `

                <div
                    class="story-v2-toolbar"
                >

                    <button
                        class="story-v2-link-btn"
                        onclick="
                            window.qadOpenStoryV2(
                                '${escapeHTML(
                                    currentStory.id
                                )}'
                            )
                        "
                    >
                        ← خريطة الأيام
                    </button>

                    <span>
                        اليوم ${currentDay.day}
                        /
                        ${currentStory.days.length}
                    </span>

                </div>

                <article
                    class="story-v2-day-file"
                >

                    <header
                        class="story-v2-day-header"
                    >

                        <div>

                            <span
                                class="story-v2-kicker"
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
                            class="
                                story-v2-day-counter
                            "
                        >
                            DAY ${currentDay.day}
                        </div>

                    </header>

                    <section
                        class="
                            story-v2-section
                            story-v2-overview
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
                        class="story-v2-grid"
                    >

                        <div
                            class="story-v2-panel"
                        >

                            <h3>
                                👥 الشخصيات
                            </h3>

                            <div
                                class="story-v2-cards"
                            >

                                ${
                                    (
                                        currentDay
                                            .characters ||
                                        []
                                    ).map(
                                        character => `
                                            <div
                                                class="
                                                    story-v2-card
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
                                }

                            </div>

                        </div>

                        <div
                            class="story-v2-panel"
                        >

                            <h3>
                                🔎 الأدلة
                            </h3>

                            <div
                                class="story-v2-cards"
                            >

                                ${
                                    (
                                        currentDay
                                            .evidences ||
                                        []
                                    ).map(
                                        evidence => `
                                            <div
                                                class="
                                                    story-v2-card
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
                                }

                            </div>

                        </div>

                    </section>

                    <section
                        class="story-v2-panel"
                    >

                        <h3>
                            🕐 التسلسل الزمني
                        </h3>

                        <div
                            class="story-v2-timeline"
                        >

                            ${
                                (
                                    currentDay
                                        .timeline ||
                                    []
                                ).map(
                                    item => `
                                        <div
                                            class="
                                                story-v2-timeline-item
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
                            }

                        </div>

                    </section>

                    ${
                        currentDay.challenge
                            ? `
                                <section
                                    class="
                                        story-v2-challenge
                                    "
                                >

                                    <div
                                        class="
                                            story-v2-challenge-title
                                        "
                                    >
                                        🧩 اختبار المحقق
                                    </div>

                                    <p>
                                        ${escapeHTML(
                                            currentDay
                                                .challenge
                                                .prompt
                                        )}
                                    </p>

                                    <input
                                        id="storyV2Answer"
                                        type="text"
                                        autocomplete="off"
                                        placeholder="
                                            اكتب إجابتك...
                                        "
                                    >

                                    <div
                                        class="
                                            story-v2-hint
                                        "
                                    >
                                        💡 تلميح:
                                        ${
                                            escapeHTML(
                                                currentDay
                                                    .challenge
                                                    .hint ||
                                                "راجع الأدلة بعناية."
                                            )
                                        }
                                    </div>

                                    <button
                                        id="storyV2Submit"
                                        class="
                                            story-v2-btn
                                            primary
                                        "
                                    >
                                        📝 تقديم الإجابة
                                    </button>

                                    <div
                                        id="
                                            storyV2Feedback
                                        "
                                        class="
                                            story-v2-feedback
                                        "
                                    ></div>

                                </section>
                            `
                            : `
                                <button
                                    class="
                                        story-v2-btn
                                        primary
                                    "
                                    onclick="
                                        window.qadCompleteDayV2()
                                    "
                                >
                                    ✅ إنهاء اليوم
                                </button>
                            `
                    }

                </article>
            `;

            const submit =
                document.getElementById(
                    "storyV2Submit"
                );

            const input =
                document.getElementById(
                    "storyV2Answer"
                );

            submit?.addEventListener(
                "click",
                checkAnswer
            );

            input?.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key === "Enter"
                    ) {
                        checkAnswer();
                    }

                }
            );
        };

    /* ============================================================
       ANSWER
       ============================================================ */

    function checkAnswer() {

        if (
            !currentDay ||
            !currentDay.challenge
        ) return;

        const input =
            document.getElementById(
                "storyV2Answer"
            );

        const feedback =
            document.getElementById(
                "storyV2Feedback"
            );

        if (!input || !feedback)
            return;

        const answer =
            normalizeAnswer(
                input.value
            );

        const expected =
            normalizeAnswer(
                currentDay
                    .challenge
                    .expectedAnswer
            );

        if (!answer) {

            feedback.className =
                "story-v2-feedback error";

            feedback.textContent =
                "اكتب إجابتك أولًا.";

            return;
        }

        if (
            answer === expected
        ) {

            window.qadCompleteDayV2();

            return;
        }

        const progress =
            getProgress();

        progress[currentStory.id] ||=
            {
                completedDays: [],
                failedAttempts: 0,
                lastDay: 0,
                notes: []
            };

        progress[
            currentStory.id
        ].failedAttempts++;

        saveProgress(progress);

        feedback.className =
            "story-v2-feedback error";

        feedback.innerHTML =
            "❌ الإجابة غير صحيحة.<br>راجع الأدلة وحاول مرة أخرى.";
    }

    /* ============================================================
       COMPLETE
       ============================================================ */

    window.qadCompleteDayV2 =
        function() {

            if (
                !currentStory ||
                !currentDay
            ) return;

            const progress =
                getProgress();

            progress[currentStory.id] ||=
                {
                    completedDays: [],
                    failedAttempts: 0,
                    lastDay: 0,
                    notes: []
                };

            const state =
                progress[
                    currentStory.id
                ];

            if (
                !state.completedDays
                    .includes(
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

            showCompletion();
        };

    /* ============================================================
       COMPLETION SCREEN
       ============================================================ */

    function showCompletion() {

        const root =
            getRoot();

        const finalDay =
            Number(currentDay.day) ===
            Number(
                currentStory.days.length
            );

        root.innerHTML = `

            <article
                class="
                    story-v2-result
                    ${finalDay ? "final" : ""}
                "
            >

                <div
                    class="
                        story-v2-result-icon
                    "
                >
                    ${finalDay ? "🏆" : "✅"}
                </div>

                <span
                    class="story-v2-kicker"
                >
                    INVESTIGATION UPDATE
                </span>

                <h2>
                    ${
                        finalDay
                            ? "العملية اكتملت"
                            : `اليوم ${currentDay.day} تم اجتيازه`
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
                                class="story-v2-effect"
                            >

                                <strong>
                                    🧵 تطور القضية
                                </strong>

                                <p>
                                    ${escapeHTML(
                                        currentDay
                                            .storyEffect
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
                                    story-v2-effect
                                    final-reveal
                                "
                            >

                                <strong>
                                    🎬 الكشف النهائي
                                </strong>

                                <p>
                                    ${escapeHTML(
                                        currentDay
                                            .finalReveal
                                    )}
                                </p>

                            </div>
                        `
                        : ""
                }

                <button
                    class="
                        story-v2-btn
                        primary
                    "
                    onclick="
                        window.qadOpenStoryV2(
                            '${escapeHTML(
                                currentStory.id
                            )}'
                        )
                    "
                >
                    📅 العودة إلى الأيام
                </button>

            </article>
        `;
    }

    /* ============================================================
       PUBLIC
       ============================================================ */

    window.qadRenderStoriesV2 =
        renderStories;

    window.qadLoadStoryV2 =
        loadStories;

    /* ============================================================
       START
       ============================================================ */

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            injectStyles();

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
                                section =>
                                    section.classList
                                        .add(
                                            "hidden"
                                        )
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
                                section =>
                                    section.classList
                                        .add(
                                            "hidden"
                                        )
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