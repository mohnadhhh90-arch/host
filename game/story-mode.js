// ==========================================
// ملف طور القصة المنفصل والمعزول (Story Mode)
// ==========================================

const GITHUB_STORY_URL = "https://raw.githubusercontent.com/mohnadhhh90-arch/game/refs/heads/main/story.json";

let STORY_DATA = [];
let activeStory = null;
let activeDay = null;

// نظام الحفظ المستقل تماماً باسم storyProgress لتجنب تداخل بيانات اللعبة
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

// جلب بيانات القصة من GitHub Raw
async function loadStoryFromGitHub() {
    try {
        const response = await fetch(GITHUB_STORY_URL);
        if (!response.ok) throw new Error("تعذر جلب ملف القصة من GitHub");
        
        const data = await response.json();
        STORY_DATA = data.stories || [];
        console.log("تم تحميل طور القصة بنجاح:", STORY_DATA);
        renderStoriesList();
    } catch (error) {
        console.error("خطأ في جلب القصة:", error);
        const container = document.getElementById('storyContainer');
        if (container) {
            container.innerHTML = `<div class="desk-paper" style="text-align: center; color: #e74c3c;">⚠️ القصه تحت الصيانه.</div>`;
        }
    }
}

// ربط زر القصة في القائمة الرئيسية
document.addEventListener('DOMContentLoaded', () => {
    const btnStory = document.getElementById('btnStoryMode');
    if (btnStory) {
        btnStory.addEventListener('click', () => {
            showStoryView('storyModeSection');
            loadStoryFromGitHub();
        });
    }

    // زر العودة للقائمة الرئيسية من داخل شاشة القصة
    const storySection = document.getElementById('storyModeSection');
    if (storySection) {
        const backBtn = storySection.querySelector('.btn-to-menu');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                // العودة للقائمة الرئيسية في سكربت اللعبة الأصلي بأمان
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

// عرض قائمة القصص/القضايا المتاحة
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
        const storyProg = progress[story.id] || { completedDays: [], currentDayIndex: 0 };
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

// فتح تفاصيل الأيام الخاصة بالقضية
window.openStoryDays = function(storyId) {
    activeStory = STORY_DATA.find(s => s.id === storyId);
    if (!activeStory) return;

    const container = document.getElementById('storyContainer');
    const progress = getStoryProgress();
    const storyProg = progress[activeStory.id] || { completedDays: [], currentDayIndex: 0 };

    let html = `
        <div style="margin-bottom: 15px;">
            <button class="btn-secondary btn-small" onclick="renderStoriesList()">⬅ رجوع لقائمة القضايا</button>
        </div>
        <div class="detective-case-file">
            <h2 style="color: #8b4513; margin-bottom: 5px;">${activeStory.title}</h2>
            <p style="font-size: 0.85rem; color: #666; margin-bottom: 15px;">اختر اليوم لبدء التحقيق:</p>
            <div style="display: flex; flex-direction: column; gap: 10px;">
    `;

    activeStory.days.forEach((dayObj, index) => {
        // اليوم الأول مفتوح دائماً، والباقي يُفتح بناءً على إنجاز اليوم السابق
        const isUnlocked = index === 0 || storyProg.completedDays.includes(activeStory.days[index - 1].id);
        const isCompleted = storyProg.completedDays.includes(dayObj.id);

        let statusText = isCompleted ? "✅ مكتمل" : (isUnlocked ? "🔓 متاح للتحقيق" : "🔒 مقفل");
        let btnStyle = isUnlocked ? "background: #fff8e8; cursor: pointer;" : "background: #e0e0e0; opacity: 0.6; cursor: not-allowed;";

        html += `
            <div style="border: 1px solid #d4c5a9; padding: 12px; border-radius: 5px; ${btnStyle}" 
                 ${isUnlocked ? `onclick="window.openStoryDay('${storyId}', '${dayObj.id}')"` : ''}>
                <div style="display: flex; justify-content: space-between; align-items: center; font-weight: bold;">
                    <span>Day ${dayObj.day}: ${dayObj.title}</span>
                    <span style="font-size: 0.8rem; color: ${isCompleted ? '#27ae60' : (isUnlocked ? '#2980b9' : '#c0392b')}">${statusText}</span>
                </div>
                <p style="font-size: 0.8rem; color: #666; margin-top: 5px;">${dayObj.description}</p>
            </div>
        `;
    });

    html += `</div></div>`;
    container.innerHTML = html;
};

// بدء تفاعل يوم معين داخل القصة
window.openStoryDay = function(storyId, dayId) {
    activeStory = STORY_DATA.find(s => s.id === storyId);
    if (!activeStory) return;
    activeDay = activeStory.days.find(d => d.id === dayId);
    if (!activeDay) return;

    const container = document.getElementById('storyContainer');

    container.innerHTML = `
        <div style="margin-bottom: 15px;">
            <button class="btn-secondary btn-small" onclick="window.openStoryDays('${storyId}')">⬅ رجوع للأيام</button>
        </div>
        <div class="detective-case-file">
            <span class="case-tag">Day ${activeDay.day}</span>
            <h2 style="color: #8b4513; margin: 10px 0;">${activeDay.title}</h2>
            <p style="font-size: 0.95rem; line-height: 1.6; margin-bottom: 20px;">${activeDay.description}</p>
            
            <div style="background: #fff; padding: 15px; border-radius: 5px; border: 1px solid #d4c5a9; margin-bottom: 15px;">
                <h4 style="color: #333; margin-bottom: 10px;">🔍 أدلة وملاحظات اليوم:</h4>
                <ul style="padding-right: 20px; font-size: 0.9rem; line-height: 1.5;">
                    ${activeDay.events && activeDay.events.length > 0 
                        ? activeDay.events.map(ev => `<li>${ev}</li>`).join('') 
                        : '<li>لا توجد أحداث إضافية اليوم. قم بمراجعة الأدلة.</li>'}
                </ul>
            </div>

            <button class="btn-primary" onclick="window.completeDay('${storyId}', '${dayId}')" style="background: #27ae60; color: #fff; width: 100%;">
                ✅ إنهاء مهام اليوم والانتقال لليوم التالي
            </button>
        </div>
    `;
};

// تسجيل إنجاز اليوم وحفظه في storyProgress بشكل معزول تماماً
window.completeDay = function(storyId, dayId) {
    const progress = getStoryProgress();
    if (!progress[storyId]) {
        progress[storyId] = { completedDays: [] };
    }

    if (!progress[storyId].completedDays.includes(dayId)) {
        progress[storyId].completedDays.push(dayId);
        saveStoryProgress(progress);
    }

    alert("🎉 ممتاز يا محقق! تم إنجاز مهام اليوم بنجاح وفتح اليوم التالي.");
    window.openStoryDays(storyId);
};
