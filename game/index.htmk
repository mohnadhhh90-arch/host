// ==========================================
// ملف طور القصة المكتبي - دعم الـ 30 يوماً وتتبع الهكر
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
        if (!response.ok) throw new Error("تعذر جلب ملف القصة من جيت هاب");
        
        const data = await response.json();
        STORY_DATA = data.stories || [];
        renderStoriesList();
    } catch (error) {
        console.error("خطأ في جلب القصة:", error);
        const container = document.getElementById('storyContainer');
        if (container) {
            container.innerHTML = `
                <div class="detective-desk-file" style="text-align: center; color: #c0392b;">
                    <h3>قريبا </h3>
                    <p style="font-size: 0.9rem; color: #555; margin-top: 10px;">القصه في صيانه حاليا تقدر تلعب طور القضايا العاديه</p>
                </div>
            `;
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

// عرض قائمة القضايا
function renderStoriesList() {
    const container = document.getElementById('storyContainer');
    if (!container) return;

    if (STORY_DATA.length === 0) {
        container.innerHTML = `<div class="detective-desk-file" style="text-align: center;">جاري مزامنة الـ 30 يوماً من الأرشيف...</div>`;
        return;
    }

    let html = `
        <div style="text-align: center; margin-bottom: 20px;">
            <h3 style="color: #f4e8c1; font-size: 1.3rem;">🚨 أرشيف مطاردة الشبح (30 يوماً)</h3>
            <p style="color: #bbb; font-size: 0.85rem;">كل يوم رسالة جديدة، فخ جديد، وخطوة أقرب للإيقاع بالهكر.</p>
        </div>
    `;

    const progress = getStoryProgress();

    STORY_DATA.forEach(story => {
        const storyProg = progress[story.id] || { completedDays: [] };
        const totalDays = story.days.length;
        const finishedCount = storyProg.completedDays.length;
        const percent = Math.round((finishedCount / totalDays) * 100);

        html += `
            <div class="detective-desk-file">
                <span class="case-tag" style="background: #c0392b; color: #fff; padding: 2px 8px; border-radius: 3px; font-size: 0.75rem;">عملية أمنية كبرى</span>
                <h3 style="margin: 10px 0 5px 0; color: #2c221e;">${story.title}</h3>
                <p style="font-size: 0.9rem; color: #555; margin-bottom: 12px; line-height: 1.5;">${story.description}</p>
                <div style="font-size: 0.85rem; margin-bottom: 15px; font-weight: bold; color: #8b4513;">
                    📊 نسبة إنجاز المطاردة: ${percent}% (${finishedCount}/${totalDays} يوماً مكتملة)
                </div>
                <button class="btn-detective" onclick="window.openStoryDays('${story.id}')" style="width: 100%; background: #2c3e50; color: #fff;">
                    📂 فتح ملف الـ 30 يوماً على المكتب
                </button>
            </div>
        `;
    });

    container.innerHTML = html;
};

// عرض الأيام (متوافقة لـ 30 يوماً بشكل منظم وقابل للتمرير)
window.openStoryDays = function(storyId) {
    activeStory = STORY_DATA.find(s => s.id === storyId);
    if (!activeStory) return;

    const container = document.getElementById('storyContainer');
    const progress = getStoryProgress();
    const storyProg = progress[activeStory.id] || { completedDays: [] };

    let html = `
        <div style="margin-bottom: 15px;">
            <button class="btn-detective" onclick="renderStoriesList()" style="font-size: 0.8rem; padding: 6px 12px;">⬅ رجوع للأرشيف</button>
        </div>
        <div class="detective-desk-file">
            <h2 style="color: #2c221e; margin-bottom: 5px;">${activeStory.title}</h2>
            <p style="font-size: 0.85rem; color: #666; margin-bottom: 15px;">سجل أيام المطاردة (من اليوم 1 إلى اليوم 30):</p>
            <div style="display: flex; flex-direction: column; gap: 8px; max-height: 400px; overflow-y: auto; padding-right: 5px;">
    `;

    activeStory.days.forEach((dayObj, index) => {
        const isUnlocked = index === 0 || storyProg.completedDays.includes(activeStory.days[index - 1].id);
        const isCompleted = storyProg.completedDays.includes(dayObj.id);

        let statusText = isCompleted ? "✅ تم تجاوز اليوم" : (isUnlocked ? "🔓 متاح للتحقيق" : "🔒 مقفل");
        let itemBg = isUnlocked ? "#fff" : "#f4f1ea";
        let cursorStyle = isUnlocked ? "cursor: pointer;" : "opacity: 0.5; cursor: not-allowed;";

        let dayBadge = dayObj.day === 30 ? "👑 اليوم الـ 30 (المواجهة الكبرى)" : `Day ${dayObj.day}`;

        html += `
            <div style="border: 1px solid #d4c5a9; background: ${itemBg}; padding: 10px 12px; border-radius: 5px; ${cursorStyle}" 
                 ${isUnlocked ? `onclick="window.showStoryBriefing('${storyId}', '${dayObj.id}')"` : ''}>
                <div style="display: flex; justify-content: space-between; align-items: center; font-weight: bold;">
                    <span style="color: #2c221e; font-size: 0.9rem;">${dayBadge}: ${dayObj.title}</span>
                    <span style="font-size: 0.75rem; color: ${isCompleted ? '#27ae60' : (isUnlocked ? '#2980b9' : '#c0392b')}">${statusText}</span>
                </div>
            </div>
        `;
    });

    html += `</div></div>`;
    container.innerHTML = html;
};

// شاشة إحاطة المحقق قبل دخول اللوحة
window.showStoryBriefing = function(storyId, dayId) {
    activeStory = STORY_DATA.find(s => s.id === storyId);
    if (!activeStory) return;
    activeDayObj = activeStory.days.find(d => d.id === dayId);
    if (!activeDayObj) return;

    const container = document.getElementById('storyContainer');
    container.innerHTML = `
        <div style="margin-bottom: 15px;">
            <button class="btn-detective" onclick="window.openStoryDays('${storyId}')" style="font-size: 0.8rem; padding: 6px 12px;">⬅ رجوع للأيام</button>
        </div>
        <div class="detective-desk-file" style="text-align: center; padding: 25px 20px;">
            <span style="font-size: 2.2rem;">📩</span>
            <h2 style="color: #8b4513; margin: 12px 0;">رسالة اليوم ${activeDayObj.day}: ${activeDayObj.title}</h2>
            <p style="font-size: 1rem; color: #333; line-height: 1.7; margin-bottom: 20px; background: #fffdf9; padding: 15px; border-radius: 5px; border: 1px dashed #d4c5a9; text-align: right;">
                ${activeDayObj.briefing}
            </p>
            <button class="btn-primary" onclick="window.launchInteractiveBoard('${storyId}', '${dayId}')" style="background: #2c3e50; color: #fff; padding: 12px 30px; font-size: 1rem; width: 100%;">
                🔍 فحص الأدلة على مكتب التحقيق
            </button>
        </div>
    `;
};

// تشغيل لوحة التحقيق التفاعلية الفخمة
window.launchInteractiveBoard = function(storyId, dayId) {
    showStoryView('caseBoardSection');

    document.getElementById('boardCaseId').innerText = `Day ${activeDayObj.day}`;
    document.getElementById('boardCaseTitle').innerText = activeDayObj.title;
    document.getElementById('caseOverviewText').innerText = activeDayObj.overview;

    const charGrid = document.getElementById('charactersGrid');
    charGrid.innerHTML = activeDayObj.characters.map(c => `
        <div class="desk-paper" style="margin:0; padding: 12px;">
            <h4 style="color: #8b4513; margin-bottom: 4px;">👤 ${c.name}</h4>
            <p style="font-size:0.8rem; color:#666; font-weight:bold;">${c.role}</p>
            <p style="font-size:0.85rem; margin-top:6px; line-height: 1.4;">${c.bio}</p>
        </div>
    `).join('');

    const evGrid = document.getElementById('evidenceGrid');
    evGrid.innerHTML = activeDayObj.evidences.map(e => `
        <div class="desk-paper" style="margin:0; padding: 12px;">
            <h4 style="color: #2c3e50; margin-bottom: 4px;">📂 ${e.title}</h4>
            <p style="font-size:0.85rem; margin-top:6px; line-height: 1.4;">${e.desc}</p>
        </div>
    `).join('');

    const timeline = document.getElementById('timelineContainer');
    timeline.innerHTML = activeDayObj.timeline.map(t => `
        <div style="margin-bottom: 8px;">
            <strong style="color: #e2c08d; font-size: 0.9rem;">⏰ ${t.time}</strong>
            <p style="font-size: 0.9rem; margin-top: 2px; color: #f4e8c1;">${t.event}</p>
        </div>
    `).join('');

    const puzzleContainer = document.getElementById('deductionPuzzlesContainer');
    if (activeDayObj.challenge) {
        let ch = activeDayObj.challenge;
        puzzleContainer.innerHTML = `
            <div class="desk-paper" style="padding: 15px;">
                <h4 style="color: #c0392b; margin-bottom: 8px;">⚖️ تحدي الاستنتاج الأمني:</h4>
                <p style="font-size:0.95rem; margin: 10px 0; font-weight:bold; color: #2c221e;">${ch.prompt}</p>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <input type="text" id="storyAnswerInput" placeholder="اكتب الإجابة أو الاستنتاج هنا..." style="padding: 10px; border: 1px solid #d4c5a9; border-radius: 4px; font-size: 0.9rem; width: 100%; font-family: inherit;">
                    <span style="font-size: 0.75rem; color: #777;">💡 تلميح: ${ch.hint}</span>
                </div>
            </div>
        `;
    }

    const backBtn = document.querySelector('.btn-to-cases');
    if (backBtn) {
        backBtn.onclick = () => {
            showStoryView('storyModeSection');
            window.openStoryDays(storyId);
        };
    }

    const submitBtn = document.getElementById('btnSubmitDeduction');
    if (submitBtn) {
        submitBtn.onclick = () => {
            const answerInput = document.getElementById('storyAnswerInput');
            if (!answerInput) return;

            const userAnswer = answerInput.value.trim();
            if (!userAnswer) {
                alert("اكتب الإجابة في حقل الإدخال لتجاوز التحدي الأمني!");
                return;
            }

            const expected = activeDayObj.challenge.expectedAnswer.trim();
            if (userAnswer.toLowerCase() === expected.toLowerCase()) {
                const progress = getStoryProgress();
                if (!progress[storyId]) progress[storyId] = { completedDays: [] };
                if (!progress[storyId].completedDays.includes(dayId)) {
                    progress[storyId].completedDays.push(dayId);
                    saveStoryProgress(progress);
                }

                if (activeDayObj.day === 30) {
                    alert("🏆 مبروك يا بطل! تم القبض على الشبح وإغلاق الـ 30 يوماً بنجاح باهر وأعدت الأمان للشبكة!");
                } else {
                    alert(`🎉 تم تجاوز اليوم ${activeDayObj.day} بنجاح وتفادي فخ الهكر! استعد لرسالة الغد.`);
                }
                showStoryView('storyModeSection');
                window.openStoryDays(storyId);
            } else {
                alert("❌ الإجابة غير دقيقة أو خاطئة! راجع الأدلة ورسائل التحدي جيداً وحاول مرة أخرى.");
            }
        };
    }
};
