// ==========================================
// ملف طور القصة المتطور (Story Mode - Interactive)
// ==========================================

const GITHUB_STORY_URL = "https://raw.githubusercontent.com/mohnadhhh90-arch/host/refs/heads/main/game/story.json";

let STORY_DATA = [];
let activeStory = null;
let activeDayObj = null;

function getStoryProgress() {
    try {
        const saved = localStorage.getItem('storyProgress');
        return saved ? JSON.parse(saved) : {};
    } catch (e) {
        return {};
    }
}

function saveStoryProgress(progress) {
    try {
        localStorage.setItem('storyProgress', JSON.stringify(progress));
    } catch (e) {
        console.error("خطأ في حفظ تقدم القصة:", e);
    }
}

async function loadStoryFromGitHub() {
    try {
        const response = await fetch(GITHUB_STORY_URL);
        if (!response.ok) throw new Error("تعذر جلب ملف القصة من GitHub");
        
        const data = await response.json();
        STORY_DATA = data.stories || [];
        renderStoriesList();
    } catch (error) {
        console.error("خطأ في جلب القصة:", error);
        const container = document.getElementById('storyContainer');
        if (container) {
            container.innerHTML = `<div class="desk-paper" style="text-align: center; color: #e74c3c;"> تحت الصيانه</div>`;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const btnStory = document.getElementById('btnStoryMode');
    if (btnStory) {
        btnStory.addEventListener('click', () => {
            showStoryView('storyModeSection');
            loadStoryFromGitHub();
        });
    }

    const storySection = document.getElementById('storyModeSection');
    if (storySection) {
        const backBtn = storySection.querySelector('.btn-to-menu');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                document.querySelectorAll('.view-section').forEach(v => v.classList.add('hidden'));
                document.getElementById('mainMenuSection')?.classList.remove('hidden');
            });
        }
    }
});

function showStoryView(viewId) {
    document.querySelectorAll('.view-section').forEach(v => v.classList.add('hidden'));
    document.getElementById(viewId)?.classList.remove('hidden');
}

function renderStoriesList() {
    const container = document.getElementById('storyContainer');
    if (!container) return;

    if (STORY_DATA.length === 0) {
        container.innerHTML = `<div class="desk-paper" style="text-align: center;">لا توجد قضايا متاحة في القصة حالياً.</div>`;
        return;
    }

    let html = '';
    const progress = getStoryProgress();

    STORY_DATA.forEach(story => {
        const storyProg = progress[story.id] || { completedDays: [] };
        const totalDays = story.days.length;
        const finishedCount = storyProg.completedDays.length;
        const percent = Math.round((finishedCount / totalDays) * 100);

        html += `
            <div class="detective-case-file" style="margin-bottom: 20px;">
                <span class="case-tag">${story.id}</span>
                <h3 style="margin: 8px 0; color: #8b4513;">${story.title}</h3>
                <p style="font-size: 0.9rem; color: #555; margin-bottom: 12px;">${story.description}</p>
                <div style="font-size: 0.85rem; margin-bottom: 12px; font-weight: bold;">
                    التقدم: ${percent}% (${finishedCount}/${totalDays} أيام منجزة)
                </div>
                <button class="btn-primary" onclick="window.openStoryDays('${story.id}')" style="background: #2c3e50; color: #fff; width: 100%;">
                    📂 فتح ملف القضية
                </button>
            </div>
        `;
    });

    container.innerHTML = html;
}

window.openStoryDays = function(storyId) {
    activeStory = STORY_DATA.find(s => s.id === storyId);
    if (!activeStory) return;

    const container = document.getElementById('storyContainer');
    const progress = getStoryProgress();
    const storyProg = progress[activeStory.id] || { completedDays: [] };

    let html = `
        <div style="margin-bottom: 15px;">
            <button class="btn-secondary btn-small" onclick="renderStoriesList()">⬅ رجوع لقائمة القضايا</button>
        </div>
        <div class="detective-case-file">
            <h2 style="color: #8b4513; margin-bottom: 5px;">${activeStory.title}</h2>
            <p style="font-size: 0.85rem; color: #666; margin-bottom: 15px;">اختر اليوم لبدء التحقيق التفاعلي:</p>
            <div style="display: flex; flex-direction: column; gap: 10px;">
    `;

    activeStory.days.forEach((dayObj, index) => {
        const isUnlocked = index === 0 || storyProg.completedDays.includes(activeStory.days[index - 1].id);
        const isCompleted = storyProg.completedDays.includes(dayObj.id);

        let statusText = isCompleted ? "✅ مكتمل" : (isUnlocked ? "🔓 متاح للتحقيق" : "🔒 مقفل");
        let btnStyle = isUnlocked ? "background: #fff8e8; cursor: pointer;" : "background: #e0e0e0; opacity: 0.6; cursor: not-allowed;";

        html += `
            <div style="border: 1px solid #d4c5a9; padding: 12px; border-radius: 5px; ${btnStyle}" 
                 ${isUnlocked ? `onclick="window.launchStoryDay('${storyId}', '${dayObj.id}')"` : ''}>
                <div style="display: flex; justify-content: space-between; align-items: center; font-weight: bold;">
                    <span>Day ${dayObj.day}: ${dayObj.title}</span>
                    <span style="font-size: 0.8rem; color: ${isCompleted ? '#27ae60' : (isUnlocked ? '#2980b9' : '#c0392b')}">${statusText}</span>
                </div>
            </div>
        `;
    });

    html += `</div></div>`;
    container.innerHTML = html;
};

// تشغيل يوم القصة داخل شاشة اللعبة الأصلية (Board) بنفس الأسلوب تماماً!
window.launchStoryDay = function(storyId, dayId) {
    activeStory = STORY_DATA.find(s => s.id === storyId);
    if (!activeStory) return;
    activeDayObj = activeStory.days.find(d => d.id === dayId);
    if (!activeDayObj) return;

    // الانتقال لشاشة الـ Board الخاصة باللعبة الأصلية
    showStoryView('caseBoardSection');

    // تعبئة البيانات في واجهة الـ Board
    document.getElementById('boardCaseId').innerText = `Day ${activeDayObj.day}`;
    document.getElementById('boardCaseTitle').innerText = activeDayObj.title;
    document.getElementById('caseOverviewText').innerText = activeDayObj.overview;

    // تعبئة الشخصيات
    const charGrid = document.getElementById('charactersGrid');
    charGrid.innerHTML = activeDayObj.characters.map(c => `
        <div class="desk-paper" style="margin:0;">
            <h4>${c.name}</h4>
            <p style="font-size:0.8rem; color:#666;">${c.role}</p>
            <p style="font-size:0.85rem; margin-top:5px;">${c.bio}</p>
        </div>
    `).join('');

    // تعبئة الأدلة
    const evGrid = document.getElementById('evidenceGrid');
    evGrid.innerHTML = activeDayObj.evidences.map(e => `
        <div class="desk-paper" style="margin:0;">
            <h4>🔍 ${e.title}</h4>
            <p style="font-size:0.85rem; margin-top:5px;">${e.desc}</p>
        </div>
    `).join('');

    // تعبئة التسلسل الزمني
    const timeline = document.getElementById('timelineContainer');
    timeline.innerHTML = activeDayObj.timeline.map(t => `
        <div style="border-right: 3px solid #8b4513; padding-right: 10px; margin-bottom: 10px;">
            <strong style="color: #8b4513;">${t.time}</strong>
            <p style="font-size: 0.9rem; margin-top: 2px;">${t.event}</p>
        </div>
    `).join('');

    // تعبئة سؤال الاستنتاج (Puzzle)
    const puzzleContainer = document.getElementById('deductionPuzzlesContainer');
    if (activeDayObj.puzzle) {
        let p = activeDayObj.puzzle;
        puzzleContainer.innerHTML = `
            <div class="desk-paper">
                <h4>⚖️ سؤال الاستنتاج الحاسم:</h4>
                <p style="font-size:0.95rem; margin: 10px 0; font-weight:bold;">${p.question}</p>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${p.options.map((opt, idx) => `
                        <label style="background: #fff; padding: 10px; border-radius: 4px; border: 1px solid #ccc; cursor: pointer; display: flex; align-items: center; gap: 10px;">
                            <input type="radio" name="storyPuzzleOpt" value="${idx}">
                            <span>${opt}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // زر العودة من الـ Board لأيام القصة
    const backBtn = document.querySelector('.btn-to-cases');
    if (backBtn) {
        // نعدل مؤقتاً وظيفة زر العودة ليرجع لأيام القصة بدل قائمة القضايا العادية
        backBtn.onclick = () => {
            showStoryView('storyModeSection');
            window.openStoryDays(storyId);
        };
    }

    // زر إصدار القرار والتحقق من صحة الإجابة
    const submitBtn = document.getElementById('btnSubmitDeduction');
    if (submitBtn) {
        submitBtn.onclick = () => {
            const selectedOpt = document.querySelector('input[name="storyPuzzleOpt"]:checked');
            if (!selectedOpt) {
                alert("الرجاء اختيار الإجابة الصحيحة أولاً قبل إصدار القرار!");
                return;
            }

            const chosenIndex = parseInt(selectedOpt.value);
            if (chosenIndex === activeDayObj.puzzle.correctIndex) {
                // حفظ الإنجاز
                const progress = getStoryProgress();
                if (!progress[storyId]) progress[storyId] = { completedDays: [] };
                if (!progress[storyId].completedDays.includes(dayId)) {
                    progress[storyId].completedDays.push(dayId);
                    saveStoryProgress(progress);
                }

                alert("🎉 إجابة صحيحة وصائبة يا محقق! تم إنجاز مهام هذا اليوم بنجاح.");
                showStoryView('storyModeSection');
                window.openStoryDays(storyId);
            } else {
                alert("❌ استنتاج خاطئ! راجع الأدلة والتسلسل الزمني جيداً وحاول مرة أخرى.");
            }
        };
    }
}
