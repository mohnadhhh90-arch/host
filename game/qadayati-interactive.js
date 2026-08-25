/* =========================================================
   قضيتي - Interactive Investigation System
   يعمل فوق النظام القديم ولا يستبدله
   ========================================================= */

(() => {
    "use strict";

    let currentCase = null;
    let state = null;

    const STORAGE_PREFIX = "qadayati_case_state_";

    function getStorageKey() {
        return STORAGE_PREFIX + currentCase.id;
    }

    function loadState() {
        try {
            const saved = JSON.parse(
                localStorage.getItem(getStorageKey()) || "{}"
            );

            return {
                evidence: Array.isArray(saved.evidence)
                    ? saved.evidence
                    : [],

                flags:
                    saved.flags && typeof saved.flags === "object"
                        ? saved.flags
                        : {},

                interviewed: Array.isArray(saved.interviewed)
                    ? saved.interviewed
                    : [],

                asked: Array.isArray(saved.asked)
                    ? saved.asked
                    : [],

                decisions: Array.isArray(saved.decisions)
                    ? saved.decisions
                    : [],

                events: Array.isArray(saved.events)
                    ? saved.events
                    : [],

                time: saved.time || "",
                stage: Number(saved.stage || 0)
            };
        } catch {
            return {
                evidence: [],
                flags: {},
                interviewed: [],
                asked: [],
                decisions: [],
                events: [],
                time: "",
                stage: 0
            };
        }
    }

    function saveState() {
        if (!currentCase || !state) return;

        localStorage.setItem(
            getStorageKey(),
            JSON.stringify(state)
        );
    }

    function hasEvidence(id) {
        return state.evidence.includes(id);
    }

    function hasFlag(id) {
        return !!state.flags[id];
    }

    function conditionPassed(condition = {}) {

        if (Array.isArray(condition.evidence)) {
            if (!condition.evidence.every(hasEvidence)) {
                return false;
            }
        }

        if (Array.isArray(condition.anyEvidence)) {
            if (!condition.anyEvidence.some(hasEvidence)) {
                return false;
            }
        }

        if (Array.isArray(condition.flags)) {
            if (!condition.flags.every(hasFlag)) {
                return false;
            }
        }

        if (Array.isArray(condition.notEvidence)) {
            if (condition.notEvidence.some(hasEvidence)) {
                return false;
            }
        }

        if (Array.isArray(condition.notFlags)) {
            if (condition.notFlags.some(hasFlag)) {
                return false;
            }
        }

        if (
            condition.stage !== undefined &&
            state.stage < Number(condition.stage)
        ) {
            return false;
        }

        if (
            condition.interviewed &&
            !state.interviewed.includes(condition.interviewed)
        ) {
            return false;
        }

        if (
            condition.asked &&
            !state.asked.includes(condition.asked)
        ) {
            return false;
        }

        if (
            condition.decision &&
            !state.decisions.includes(condition.decision)
        ) {
            return false;
        }

        return true;
    }

    function escapeHTML(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    /* =====================================================
       ROOT
       ===================================================== */

    function getRoot() {
        let root = document.getElementById(
            "qadayatiInteractiveRoot"
        );

        if (!root) {
            const board =
                document.getElementById("caseBoardSection");

            if (!board) return null;

            root = document.createElement("div");

            root.id = "qadayatiInteractiveRoot";

            root.className =
                "qad-interactive-root";

            const tabs =
                board.querySelector(".board-tabs");

            if (tabs) {
                tabs.before(root);
            } else {
                board.prepend(root);
            }
        }

        return root;
    }

    /* =====================================================
       TOAST
       ===================================================== */

    function toast(title, text, type = "") {

        let box =
            document.getElementById("qadToast");

        if (!box) {
            box = document.createElement("div");
            box.id = "qadToast";

            document.body.appendChild(box);
        }

        box.className =
            "qad-toast show " + type;

        box.innerHTML = `
            <strong>${escapeHTML(title)}</strong>
            <span>${escapeHTML(text)}</span>
        `;

        clearTimeout(window.__qadToastTimer);

        window.__qadToastTimer =
            setTimeout(() => {
                box.classList.remove("show");
            }, 3000);
    }

    /* =====================================================
       CUTSCENE
       ===================================================== */

    function showCutscene(scene) {

        if (!scene) return;

        const modal =
            document.createElement("div");

        modal.className =
            "qad-cutscene-modal";

        modal.innerHTML = `
            <div class="qad-cutscene-card">

                <button
                    class="qad-close"
                    type="button">
                    ×
                </button>

                ${
                    scene.image
                        ? `
                        <img
                            src="${escapeHTML(scene.image)}"
                            alt=""
                            class="qad-cutscene-image"
                        >
                        `
                        : ""
                }

                <span class="qad-kicker">
                    🎬 مشهد تحقيقي
                </span>

                <h3>
                    ${escapeHTML(
                        scene.title || "حدث مهم"
                    )}
                </h3>

                <p>
                    ${escapeHTML(
                        scene.text ||
                        scene.description ||
                        ""
                    )}
                </p>

                <button
                    class="btn-detective btn-primary qad-close-btn"
                    type="button">
                    متابعة التحقيق
                </button>

            </div>
        `;

        document.body.appendChild(modal);

        const close = () => modal.remove();

        modal
            .querySelector(".qad-close")
            ?.addEventListener("click", close);

        modal
            .querySelector(".qad-close-btn")
            ?.addEventListener("click", close);
    }

    /* =====================================================
       EVENTS
       ===================================================== */

    function triggerEvents(trigger, payload = {}) {

        if (!Array.isArray(currentCase?.events)) {
            return;
        }

        currentCase.events.forEach(event => {

            if (
                event.trigger &&
                event.trigger !== trigger
            ) {
                return;
            }

            if (
                event.whenEvidence &&
                event.whenEvidence !== payload.evidenceId
            ) {
                return;
            }

            if (
                event.whenCharacter &&
                event.whenCharacter !== payload.characterId
            ) {
                return;
            }

            if (
                event.whenChoice &&
                event.whenChoice !== payload.choiceId
            ) {
                return;
            }

            if (!conditionPassed(event.condition)) {
                return;
            }

            const eventId =
                event.id ||
                event.title ||
                event.message;

            if (state.events.includes(eventId)) {
                return;
            }

            state.events.push(eventId);

            if (event.setFlag) {
                state.flags[event.setFlag] = true;
            }

            if (Array.isArray(event.setFlags)) {
                event.setFlags.forEach(flag => {
                    state.flags[flag] = true;
                });
            }

            if (event.setStage !== undefined) {
                state.stage =
                    Number(event.setStage);
            }

            saveState();

            toast(
                event.title || "حدث جديد",
                event.message || "",
                "event"
            );

            if (event.cutsceneId) {

                const scene =
                    currentCase.cutscenes?.find(
                        s => s.id === event.cutsceneId
                    );

                if (scene) {
                    showCutscene(scene);
                }
            }

            render();
        });
    }

    /* =====================================================
       EVIDENCE
       ===================================================== */

    function inspectEvidence(id) {

        if (!id || !currentCase) return;

        const evidence =
            currentCase.evidences?.find(
                e => e.id === id
            );

        if (!evidence) return;

        const firstTime =
            !hasEvidence(id);

        if (firstTime) {

            state.evidence.push(id);

            saveState();

            toast(
                "🔎 دليل جديد",
                evidence.title,
                "success"
            );

            triggerEvents(
                "evidence",
                {
                    evidenceId: id
                }
            );

            currentCase.cutscenes
                ?.filter(scene =>
                    scene.trigger === "evidence" &&
                    scene.evidenceId === id
                )
                .forEach(scene => {

                    if (
                        conditionPassed(
                            scene.condition
                        )
                    ) {
                        showCutscene(scene);
                    }
                });
        }

        refreshEvidenceCards();

        refreshEvidenceSelect();
    }

    function refreshEvidenceCards() {

        const grid =
            document.getElementById(
                "evidenceGrid"
            );

        if (!grid || !currentCase) return;

        const cards =
            [...grid.children];

        currentCase.evidences
            ?.forEach((evidence, index) => {

                const card = cards[index];

                if (!card) return;

                card.dataset.qadEvidenceId =
                    evidence.id;

                let button =
                    card.querySelector(
                        ".qad-inspect"
                    );

                if (!button) {

                    button =
                        document.createElement(
                            "button"
                        );

                    button.type = "button";

                    button.className =
                        "btn-detective btn-secondary qad-inspect";

                    card.appendChild(button);
                }

                button.dataset.evidenceId =
                    evidence.id;

                button.textContent =
                    hasEvidence(evidence.id)
                        ? "✅ تم فحص الدليل"
                        : "🔎 فحص الدليل";
            });
    }

    function refreshEvidenceSelect() {

        const select =
            document.getElementById(
                "selectEvidence"
            );

        if (!select || !currentCase) return;

        const oldValue =
            select.value;

        select.innerHTML = `
            <option value="">
                -- اختر الدليل القاطع --
            </option>

            ${
                currentCase.evidences
                    ?.map(e => `
                        <option value="${escapeHTML(e.id)}">
                            ${escapeHTML(e.title)}
                        </option>
                    `)
                    .join("") || ""
            }
        `;

        select.value = oldValue;
    }

    /* =====================================================
       CRIME SCENE
       ===================================================== */

    function renderCrimeScene() {

        const scene =
            currentCase?.crimeScene;

        const spots =
            currentCase?.interactiveEvidence;

        if (!scene && !spots?.length) {
            return "";
        }

        return `
            <section class="qad-panel">

                <div class="qad-panel-header">
                    <div>
                        <span class="qad-kicker">
                            📍 مسرح الجريمة
                        </span>

                        <h3>
                            ${escapeHTML(
                                scene?.title ||
                                "افحص المكان"
                            )}
                        </h3>
                    </div>

                    <span class="qad-badge">
                        تفاعلي
                    </span>
                </div>

                ${
                    scene?.description
                        ? `
                        <p class="qad-muted">
                            ${escapeHTML(
                                scene.description
                            )}
                        </p>
                        `
                        : ""
                }

                ${
                    scene?.image
                        ? `
                        <div class="qad-scene">

                            <img
                                src="${escapeHTML(
                                    scene.image
                                )}"
                                alt="مسرح الجريمة"
                            >

                            ${
                                spots
                                    ?.map(spot => `
                                        <button
                                            type="button"
                                            class="qad-hotspot ${
                                                hasEvidence(
                                                    spot.evidenceId
                                                )
                                                    ? "found"
                                                    : ""
                                            }"
                                            style="
                                                left:${Number(spot.x) || 0}%;
                                                top:${Number(spot.y) || 0}%;
                                            "
                                            data-evidence-id="${escapeHTML(
                                                spot.evidenceId
                                            )}"
                                        >
                                            ${
                                                hasEvidence(
                                                    spot.evidenceId
                                                )
                                                    ? "✓"
                                                    : "+"
                                            }
                                        </button>
                                    `)
                                    .join("") || ""
                            }

                        </div>
                        `
                        : ""
                }

                ${
                    spots?.length
                        ? `
                        <div class="qad-hotspot-list">

                            ${spots
                                .map(spot => `
                                    <button
                                        type="button"
                                        class="qad-hotspot-item"
                                        data-evidence-id="${escapeHTML(
                                            spot.evidenceId
                                        )}"
                                    >
                                        <strong>
                                            ${escapeHTML(
                                                spot.title
                                            )}
                                        </strong>

                                        <span>
                                            ${escapeHTML(
                                                spot.description ||
                                                "اضغط للفحص"
                                            )}
                                        </span>
                                    </button>
                                `)
                                .join("")}

                        </div>
                        `
                        : ""
                }

            </section>
        `;
    }

    /* =====================================================
       INTERVIEWS
       ===================================================== */

    function renderInterviews() {

        if (
            !Array.isArray(
                currentCase?.dialogues
            ) ||
            !currentCase.dialogues.length
        ) {
            return "";
        }

        const dialogues =
            currentCase.dialogues.filter(
                d => conditionPassed(
                    d.condition
                )
            );

        return `
            <section class="qad-panel">

                <div class="qad-panel-header">
                    <div>
                        <span class="qad-kicker">
                            🗣️ المقابلات
                        </span>

                        <h3>
                            استجواب المشتبه بهم
                        </h3>
                    </div>
                </div>

                <div class="qad-interviews">

                    ${
                        dialogues.length
                            ? dialogues
                                .map(dialogue => {

                                    const char =
                                        currentCase.characters
                                            ?.find(
                                                c =>
                                                    c.id ===
                                                    dialogue.characterId
                                            );

                                    return `
                                        <button
                                            type="button"
                                            class="qad-interview"
                                            data-dialogue-id="${escapeHTML(
                                                dialogue.id
                                            )}"
                                        >
                                            <span class="qad-person">
                                                👤
                                            </span>

                                            <span>
                                                <strong>
                                                    ${escapeHTML(
                                                        char?.name ||
                                                        dialogue.characterName ||
                                                        "مشتبه به"
                                                    )}
                                                </strong>

                                                <small>
                                                    ${escapeHTML(
                                                        char?.role ||
                                                        "مقابلة"
                                                    )}
                                                </small>
                                            </span>

                                            <span>
                                                ←
                                            </span>
                                        </button>
                                    `;
                                })
                                .join("")
                            : `
                                <p class="qad-muted">
                                    لا توجد أسئلة متاحة الآن.
                                    اجمع المزيد من الأدلة.
                                </p>
                            `
                    }

                </div>
            </section>
        `;
    }

    /* =====================================================
       RENDER
       ===================================================== */

    function render() {

        const root = getRoot();

        if (!root || !currentCase) return;

        const hasFeatures =
            currentCase.crimeScene ||
            currentCase.interactiveEvidence ||
            currentCase.dialogues ||
            currentCase.events ||
            currentCase.cutscenes;

        if (!hasFeatures) {
            root.innerHTML = "";
            return;
        }

        root.innerHTML = `
            ${renderCrimeScene()}
            ${renderInterviews()}

            ${
                currentCase.events?.length
                    ? `
                    <section class="qad-panel">

                        <span class="qad-kicker">
                            ⚡ الأحداث
                        </span>

                        <h3>
                            تطورات التحقيق
                        </h3>

                        <div class="qad-event-log">

                            ${
                                state.events.length
                                    ? state.events
                                        .map(id => `
                                            <div>
                                                ⚡
                                                ${escapeHTML(
                                                    id
                                                )}
                                            </div>
                                        `)
                                        .join("")
                                    : `
                                        <span class="qad-muted">
                                            لم تظهر أحداث مفاجئة بعد.
                                        </span>
                                    `
                            }

                        </div>
                    </section>
                    `
                    : ""
            }
        `;

        refreshEvidenceCards();
    }

    /* =====================================================
       DIALOGUE
       ===================================================== */

    function openDialogue(id) {

        const dialogue =
            currentCase?.dialogues?.find(
                d => d.id === id
            );

        if (
            !dialogue ||
            !conditionPassed(dialogue.condition)
        ) {
            toast(
                "المعلومة غير متاحة",
                "اجمع الأدلة المطلوبة أولًا.",
                "warning"
            );

            return;
        }

        const character =
            currentCase.characters?.find(
                c =>
                    c.id ===
                    dialogue.characterId
            );

        state.interviewed =
            Array.from(
                new Set([
                    ...state.interviewed,
                    dialogue.characterId
                ])
            );

        saveState();

        const modal =
            document.createElement("div");

        modal.className =
            "qad-dialogue-modal";

        modal.innerHTML = `
            <div class="qad-dialogue-card">

                <button
                    class="qad-close"
                    type="button">
                    ×
                </button>

                <div class="qad-dialogue-person">

                    <div class="qad-person large">
                        👤
                    </div>

                    <div>
                        <span class="qad-kicker">
                            مقابلة رسمية
                        </span>

                        <h3>
                            ${escapeHTML(
                                character?.name ||
                                dialogue.characterName ||
                                "المشتبه به"
                            )}
                        </h3>

                        <small>
                            ${escapeHTML(
                                character?.role || ""
                            )}
                        </small>
                    </div>

                </div>

                <div class="qad-dialogue-text">
                    ${escapeHTML(
                        dialogue.intro ||
                        character?.statement ||
                        ""
                    )}
                </div>

                <div class="qad-choices">

                    ${
                        dialogue.choices
                            ?.filter(
                                choice =>
                                    conditionPassed(
                                        choice.condition
                                    )
                            )
                            .map(choice => `
                                <button
                                    type="button"
                                    class="qad-choice"
                                    data-choice-id="${escapeHTML(
                                        choice.id
                                    )}"
                                >
                                    ${escapeHTML(
                                        choice.text
                                    )}
                                </button>
                            `)
                            .join("") || ""
                    }

                </div>

                <div
                    class="qad-response"
                    hidden>
                </div>

            </div>
        `;

        document.body.appendChild(modal);

        const close =
            () => modal.remove();

        modal
            .querySelector(".qad-close")
            ?.addEventListener(
                "click",
                close
            );

        modal
            .querySelectorAll(".qad-choice")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const choice =
                            dialogue.choices?.find(
                                c =>
                                    c.id ===
                                    button.dataset.choiceId
                            );

                        if (!choice) return;

                        state.asked.push(
                            choice.id
                        );

                        if (choice.setFlag) {
                            state.flags[
                                choice.setFlag
                            ] = true;
                        }

                        if (
                            choice.setStage !==
                            undefined
                        ) {
                            state.stage =
                                Number(
                                    choice.setStage
                                );
                        }

                        if (choice.decision) {
                            state.decisions.push(
                                choice.decision
                            );
                        }

                        saveState();

                        const response =
                            modal.querySelector(
                                ".qad-response"
                            );

                        response.hidden = false;

                        response.innerHTML = `
                            <strong>
                                ${escapeHTML(
                                    character?.name ||
                                    "المشتبه به"
                                )}:
                            </strong>

                            <p>
                                ${escapeHTML(
                                    choice.response ||
                                    "لا توجد إجابة إضافية."
                                )}
                            </p>

                            ${
                                choice.reaction
                                    ? `
                                    <span>
                                        ${escapeHTML(
                                            choice.reaction
                                        )}
                                    </span>
                                    `
                                    : ""
                            }
                        `;

                        modal
                            .querySelector(
                                ".qad-choices"
                            )
                            .hidden = true;

                        triggerEvents(
                            "choice",
                            {
                                choiceId:
                                    choice.id,

                                characterId:
                                    dialogue.characterId
                            }
                        );

                        if (choice.eventId) {

                            const event =
                                currentCase.events
                                    ?.find(
                                        e =>
                                            e.id ===
                                            choice.eventId
                                    );

                            if (event) {
                                triggerEvents(
                                    event.trigger ||
                                    "choice",
                                    {
                                        choiceId:
                                            choice.id,

                                        characterId:
                                            dialogue.characterId
                                    }
                                );
                            }
                        }

                        if (choice.cutsceneId) {

                            const scene =
                                currentCase.cutscenes
                                    ?.find(
                                        s =>
                                            s.id ===
                                            choice.cutsceneId
                                    );

                            if (scene) {
                                showCutscene(
                                    scene
                                );
                            }
                        }

                        render();
                    }
                );
            });
    }

    /* =====================================================
       NOTEBOOK DRAG - PC ONLY
       ===================================================== */

    function enableNotebookDrag() {

        const modal =
            document.getElementById(
                "notebookModal"
            );

        const card =
            modal?.querySelector(
                ".modal-content"
            );

        if (!card) return;

        let dragging = false;
        let startX = 0;
        let currentX = 0;

        card.addEventListener(
            "pointerdown",
            event => {

                if (
                    window.innerWidth <= 900
                ) {
                    return;
                }

                if (
                    event.target.closest(
                        "textarea,button,input"
                    )
                ) {
                    return;
                }

                dragging = true;

                startX =
                    event.clientX -
                    currentX;

                card.setPointerCapture?.(
                    event.pointerId
                );

                card.classList.add(
                    "qad-dragging"
                );
            }
        );

        card.addEventListener(
            "pointermove",
            event => {

                if (!dragging) return;

                let x =
                    event.clientX -
                    startX;

                x = Math.max(
                    -80,
                    Math.min(80, x)
                );

                currentX = x;

                card.style.transform =
                    `translateX(${x}px)`;
            }
        );

        const stop = event => {

            if (!dragging) return;

            dragging = false;

            card.releasePointerCapture?.(
                event.pointerId
            );

            card.classList.remove(
                "qad-dragging"
            );
        };

        card.addEventListener(
            "pointerup",
            stop
        );

        card.addEventListener(
            "pointercancel",
            stop
        );

        window.addEventListener(
            "resize",
            () => {

                if (window.innerWidth <= 900) {
                    currentX = 0;
                    card.style.transform =
                        "";
                }

            }
        );
    }

    /* =====================================================
       EVENTS
       ===================================================== */

    document.addEventListener(
        "click",
        event => {

            const evidence =
                event.target.closest(
                    ".qad-inspect"
                );

            if (evidence) {

                inspectEvidence(
                    evidence.dataset.evidenceId
                );

                return;
            }

            const hotspot =
                event.target.closest(
                    ".qad-hotspot, .qad-hotspot-item"
                );

            if (hotspot) {

                inspectEvidence(
                    hotspot.dataset.evidenceId
                );

                return;
            }

            const interview =
                event.target.closest(
                    ".qad-interview"
                );

            if (interview) {

                openDialogue(
                    interview.dataset.dialogueId
                );
            }
        }
    );

    /* =====================================================
       CASE LOADED
       ===================================================== */

    window.addEventListener(
        "qadayati:case-loaded",
        event => {

            currentCase =
                event.detail?.caseData;

            if (!currentCase) return;

            state = loadState();

            render();

            triggerEvents(
                "caseStart"
            );

            setTimeout(() => {
                refreshEvidenceCards();
                refreshEvidenceSelect();
            }, 100);
        }
    );

    document.addEventListener(
        "DOMContentLoaded",
        () => {
            enableNotebookDrag();
        }
    );

})();