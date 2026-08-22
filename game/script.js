
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// إعدادات Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDLOklvLUPBa8IqM3-4xaswdMMqqAdqzXY",
    authDomain: "mohnad2-bfb02.firebaseapp.com",
    projectId: "mohnad2-bfb02",
    storageBucket: "mohnad2-bfb02.firebasestorage.app",
    messagingSenderId: "846017797996",
    appId: "1:846017797996:web:518f9eaa546004cd631d49",
    measurementId: "G-QKG96L42XB"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUserId = null;
let currentUserData = null;

function usernameToEmail(username) {
    return `${username.toLowerCase().trim()}@qadayati.game`;
}

document.addEventListener('DOMContentLoaded', () => {
    let audioCtx = null;

    const secretNoticeModal = document.getElementById('secretNoticeModal');
    const btnCloseSecretNotice = document.getElementById('btnCloseSecretNotice');
    
    if (secretNoticeModal) secretNoticeModal.classList.remove('hidden');

    btnCloseSecretNotice?.addEventListener('click', () => {
        playSound('click');
        secretNoticeModal?.classList.add('hidden');
    });

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUserId = user.uid;
            await loadUserData(currentUserId);
            showView('mainMenu');
        } else {
            currentUserId = null;
            currentUserData = null;
            showView('auth');
        }
    });

    function playSound(type) {
        try {
            if (!document.getElementById('settingSoundToggle')?.checked) return;
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') audioCtx.resume();

            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            if (type === 'click') {
                osc.frequency.value = 400;
                gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.05);
            } else if (type === 'success') {
                osc.frequency.setValueAtTime(300, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.3);
                gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.3);
            } else if (type === 'error') {
                osc.frequency.setValueAtTime(200, audioCtx.currentTime);
                osc.frequency.setValueAtTime(100, audioCtx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.3);
            }
        } catch (e) { console.log("Audio play error:", e); }
    }

    const views = {
        auth: document.getElementById('authSection'),
        mainMenu: document.getElementById('mainMenuSection'),
        casesList: document.getElementById('casesListSection'),
        caseBoard: document.getElementById('caseBoardSection'),
        howToPlay: document.getElementById('howToPlaySection'),
        settings: document.getElementById('settingsSection'),
        about: document.getElementById('aboutSection'),
        leaderboard: document.getElementById('leaderboardSection'),
        storyMode: document.getElementById('storyModeSection')
    };

    function showView(viewKey) {
        playSound('click');
        Object.values(views).forEach(v => { if (v) v.classList.add('hidden'); });
        if (views[viewKey]) views[viewKey].classList.remove('hidden');
    }

    document.getElementById('btnLogin')?.addEventListener('click', async (e) => {
        const btn = e.target;
        const username = document.getElementById('authUsername')?.value.trim();
        const password = document.getElementById('authPassword')?.value.trim();
        const errorDiv = document.getElementById('authError');

        if (!username || !password) {
            if (errorDiv) errorDiv.innerText = "يرجى كتابة اسم المستخدم وكلمة السر";
            return;
        }

        btn.disabled = true;
        btn.innerText = "جاري الدخول...";

        try {
            const email = usernameToEmail(username);
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            currentUserId = userCredential.user.uid;
            await loadUserData(currentUserId);
            showView('mainMenu');
        } catch (err) {
            if (errorDiv) errorDiv.innerText = "اسم المستخدم أو كلمة السر غير صحيحة!";
            btn.disabled = false;
            btn.innerText = "دخول";
        }
    });

    document.getElementById('btnRegister')?.addEventListener('click', async (e) => {
        const btn = e.target;
        const username = document.getElementById('authUsername')?.value.trim();
        const password = document.getElementById('authPassword')?.value.trim();
        const errorDiv = document.getElementById('authError');

        if (username.length < 3 || password.length < 6) {
            if (errorDiv) errorDiv.innerText = "اسم المستخدم 3 حروف على الأقل، وكلمة السر 6 أرقام/حروف";
            return;
        }

        btn.disabled = true;
        btn.innerText = "جاري الإنشاء...";

        try {
            const email = usernameToEmail(username);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            currentUserId = userCredential.user.uid;

            currentUserData = {
                username: username,
                solvedCases: [],
                completedStoryDays: [],
                rank: "مساعد محقق 🕵️‍♂️",
                totalScore: 0
            };

            await setDoc(doc(db, "users", currentUserId), currentUserData);
            alert('تم إنشاء حسابك بنجاح! مرحباً بك يا محقق.');
            updateRankDisplay();
            showView('mainMenu');
        } catch (err) {
            if (errorDiv) {
                if (err.code === 'auth/email-already-in-use') errorDiv.innerText = "اسم المستخدم هذا مستخدم بالفعل!";
                else errorDiv.innerText = "حدث خطأ أثناء إنشاء الحساب!";
            }
            btn.disabled = false;
            btn.innerText = "إنشاء حساب";
        }
    });

    document.getElementById('btnLogout')?.addEventListener('click', async () => {
        try {
            await signOut(auth);
            currentUserId = null;
            currentUserData = null;
            showView('auth');
        } catch (error) { console.error("خطأ أثناء تسجيل الخروج:", error); }
    });

    async function loadUserData(uid) {
        try {
            const docRef = doc(db, "users", uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                currentUserData = docSnap.data();
                if (!currentUserData.solvedCases) currentUserData.solvedCases = [];
                if (!currentUserData.completedStoryDays) currentUserData.completedStoryDays = [];
                if (currentUserData.totalScore === undefined) currentUserData.totalScore = 0;
                updateRankDisplay();
            } else {
                currentUserData = {
                    username: auth.currentUser?.email?.split('@')[0] || "محقق",
                    solvedCases: [],
                    completedStoryDays: [],
                    rank: "مساعد محقق 🕵️‍♂️",
                    totalScore: 0
                };
                await setDoc(docRef, currentUserData);
            }
        } catch (e) { console.error("خطأ في تحميل بيانات المستخدم:", e); }
    }

    document.getElementById('btnStartGame')?.addEventListener('click', () => { renderCasesList(); showView('casesList'); });
    document.getElementById('btnHowToPlay')?.addEventListener('click', () => showView('howToPlay'));
    document.getElementById('btnSettings')?.addEventListener('click', () => showView('settings'));
    document.getElementById('btnAbout')?.addEventListener('click', () => showView('about'));
    
    document.getElementById('btnLeaderboard')?.addEventListener('click', async () => {
        if (currentUserId) await loadUserData(currentUserId);
        showView('leaderboard');
        await renderLeaderboard();
    });

    document.querySelectorAll('.btn-to-menu').forEach(btn => btn.addEventListener('click', () => showView('mainMenu')));
    document.querySelectorAll('.btn-to-cases').forEach(btn => btn.addEventListener('click', () => showView('casesList')));


    // ==========================================
    // طور القصة (نظام الأيام والمراحل المقفولة)
    // ==========================================
    let storyData = {};

    async function loadStoryDataExternal() {
        try {
            const response = await fetch('story.json');
            storyData = await response.json();
        } catch (error) {
            console.error("تعذر تحميل ملف القصة الخارجي story.json:", error);
        }
    }

    // جلب الأيام المكتملة للمستخدم الحالي
    function getCompletedStoryDays() {
        if (currentUserData && currentUserData.completedStoryDays) return currentUserData.completedStoryDays;
        return JSON.parse(localStorage.getItem('detective_completed_story_days') || '[]');
    }

    // حفظ اليوم المكتمل وتحديث قاعدة البيانات
    async function markDayAsCompleted(dayNumber, pointsToAdd) {
        let completedDays = getCompletedStoryDays();
        if (!completedDays.includes(dayNumber)) {
            completedDays.push(dayNumber);
        }

        let newTotalScore = (Number(currentUserData?.totalScore) || 0) + pointsToAdd;

        if (!currentUserData) currentUserData = {};
        currentUserData.completedStoryDays = completedDays;
        currentUserData.totalScore = newTotalScore;

        const activeUser = auth.currentUser;
        if (activeUser) {
            try {
                const docRef = doc(db, "users", activeUser.uid);
                await updateDoc(docRef, {
                    completedStoryDays: completedDays,
                    totalScore: newTotalScore
                });
            } catch (err) {
                console.error("خطأ في حفظ أيام القصة في فايربيز:", err);
            }
        } else {
            localStorage.setItem('detective_completed_story_days', JSON.stringify(completedDays));
        }
    }

    document.getElementById('btnStoryMode')?.addEventListener('click', async () => {
        showView('storyMode');
        await loadStoryDataExternal();
        renderStoryDaysMenu();
    });

    // رسم قائمة الأيام (اليوم الأول مفتوح، وبقية الأيام تشترط انهاء ما قبلها)
    function renderStoryDaysMenu() {
        const dialogueBox = document.getElementById('storyDialogueBox');
        const choicesContainer = document.getElementById('storyChoicesContainer');

        if (!dialogueBox || !choicesContainer) return;

        dialogueBox.innerText = "📁 ملفات التحقيق الميداني (اختر اليوم لبدء التحقيق):";
        choicesContainer.innerHTML = "";

        const completedDays = getCompletedStoryDays();

        // قائمة الأيام المتاحة في القصة
        const daysList = [
            { id: 1, title: "اليوم الأول: بداية الغموض", startNode: "day1_start", points: 15 },
            { id: 2, title: "اليوم الثاني: خيوط متشابكة", startNode: "day2_start", points: 20 }
        ];

        daysList.forEach((day, index) => {
            const isUnlocked = (index === 0) || completedDays.includes(daysList[index - 1].id);
            const isCompleted = completedDays.includes(day.id);

            const btn = document.createElement('button');
            btn.className = 'btn-primary';
            btn.style.cssText = `
                background: ${isUnlocked ? (isCompleted ? '#27ae60' : '#2c3e50') : '#1e1e1e'};
                border: 1px solid ${isUnlocked ? '#f1c40f' : '#444'};
                padding: 12px; text-align: right; cursor: ${isUnlocked ? 'pointer' : 'not-allowed'};
                border-radius: 5px; color: ${isUnlocked ? '#fff' : '#666'}; font-family: inherit;
                transition: 0.2s; width: 100%; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;
            `;

            let statusText = "";
            if (isCompleted) statusText = " ✅ (مكتمل)";
            else if (!isUnlocked) statusText = " 🔒 (مغلق - أنهِ اليوم السابق أولاً)";
            else statusText = " 🔍 (ابدأ التحقيق)";

            btn.innerHTML = `<span>${day.title}</span><span style="font-size:0.8rem;">${statusText}</span>`;

            if (isUnlocked) {
                btn.onmouseover = () => btn.style.background = "#34495e";
                btn.onmouseleave = () => btn.style.background = isCompleted ? '#27ae60' : '#2c3e50';

                btn.addEventListener('click', () => {
                    playSound('click');
                    startStoryNode(day.startNode, day.id, day.points);
                });
            } else {
                btn.addEventListener('click', () => {
                    playSound('error');
                    alert(`⚠️ عذراً يا محقق!\nيجب عليك إنهاء (${daysList[index - 1].title}) أولاً لفتح هذا اليوم.`);
                });
            }

            choicesContainer.appendChild(btn);
        });

        // زر العودة للقائمة الرئيسية من صفحة اختيار الأيام
        const backBtn = document.createElement('button');
        backBtn.className = 'btn-primary';
        backBtn.style.cssText = "background: #c0392b; border: none; padding: 10px; width: 100%; margin-top: 10px; border-radius: 5px; cursor: pointer; color: #fff; font-family: inherit;";
        backBtn.innerText = "⬅️ العودة للقائمة الرئيسية";
        backBtn.addEventListener('click', () => showView('mainMenu'));
        choicesContainer.appendChild(backBtn);
    }

    let typeWriterInterval = null;

    function startStoryNode(nodeKey, dayId, dayPoints) {
        const node = storyData[nodeKey];
        const dialogueBox = document.getElementById('storyDialogueBox');
        const choicesContainer = document.getElementById('storyChoicesContainer');

        if (!node || !dialogueBox || !choicesContainer) return;

        if (typeWriterInterval) clearTimeout(typeWriterInterval);
        dialogueBox.innerText = "";
        choicesContainer.innerHTML = "";

        let charIndex = 0;
        function typeWriter() {
            if (charIndex < node.text.length) {
                dialogueBox.innerText += node.text.charAt(charIndex);
                charIndex++;
                typeWriterInterval = setTimeout(typeWriter, 25);
            } else {
                renderStoryChoices(node.choices, dayId, dayPoints, choicesContainer);
            }
        }
        typeWriter();
    }

    function renderStoryChoices(choices, dayId, dayPoints, container) {
        choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = 'btn-primary';
            btn.style.cssText = "background: #2c3e50; border: 1px solid #f1c40f; padding: 12px; text-align: right; cursor: pointer; border-radius: 5px; color: #fff; font-family: inherit; transition: 0.2s; width: 100%; margin-bottom: 8px;";
            btn.innerText = choice.text;
            
            btn.onmouseover = () => btn.style.background = "#34495e";
            btn.onmouseleave = () => btn.style.background = "#2c3e50";

            btn.addEventListener('click', async () => {
                playSound('click');
                if (choice.action) {
                    await handleStoryDayEnding(dayId, dayPoints);
                } else if (choice.next) {
                    startStoryNode(choice.next, dayId, dayPoints);
                }
            });

            container.appendChild(btn);
        });
    }

    async function handleStoryDayEnding(dayId, pointsToAdd) {
        playSound('success');
        await markDayAsCompleted(dayId, pointsToAdd);

        alert(`🎉 مبروك! لقد أنهيت مهام اليوم بنجاح.\n\nتمت إضافة ${pointsToAdd} نقطة لتقييمك الإجمالي وتم فتح الأيام التالية.`);
        renderStoryDaysMenu();
    }


    // ==========================================
    // إدارة القضايا من GitHub
    // ==========================================
    const GITHUB_CASES_URL = "https://raw.githubusercontent.com/mohnadhhh90-arch/game/main/cases.json";
    let CASES_DATA = [];
    let currentCase = null;
    let score = 1000;
    let mistakes = 0;
    let hintsLeft = 3;
    let eliminatedSuspects = new Set();
    let isCooldown = false;

    function getSolvedCases() {
        if (currentUserData && currentUserData.solvedCases) return currentUserData.solvedCases;
        return JSON.parse(localStorage.getItem('detective_solved_cases') || '[]');
    }

    async function saveSolvedCase(caseId, noHintsUsed, earnedScore) {
        let solved = getSolvedCases();
        let isNewCase = !solved.includes(caseId);

        if (isNewCase) {
            solved.push(caseId);
        }

        let newTotalScore = Number(currentUserData?.totalScore || 0);
        if (isNewCase) {
            newTotalScore += earnedScore;
        }

        let rank = "مساعد محقق 🕵️‍♂️";
        if (solved.length >= 5) rank = "خبير أدلة جنائية 🏅";
        else if (solved.length >= 3) rank = "رئيس مباحث 🎖️";
        else if (solved.length >= 1) rank = "محقق موهوب 🔍";

        if (!currentUserData) currentUserData = {};
        currentUserData.solvedCases = solved;
        currentUserData.totalScore = newTotalScore;
        currentUserData.rank = rank;

        const activeUser = auth.currentUser;
        if (activeUser) {
            try {
                const docRef = doc(db, "users", activeUser.uid);
                await setDoc(docRef, {
                    username: currentUserData.username || activeUser.email.split('@')[0],
                    solvedCases: solved,
                    rank: rank,
                    totalScore: newTotalScore
                }, { merge: true });
            } catch (err) { console.error("❌ خطأ من فايربيز أثناء الحفظ:", err); }
        } else {
            localStorage.setItem('detective_solved_cases', JSON.stringify(solved));
        }

        if (noHintsUsed) {
            localStorage.setItem(`badge_strict_${caseId}`, 'true');
        }
        updateRankDisplay();
    }

    function updateRankDisplay() {
        const solvedCount = getSolvedCases().length;
        let rank = "مساعد محقق 🕵️‍♂️";
        if (solvedCount >= 5) rank = "خبير أدلة جنائية 🏅";
        else if (solvedCount >= 3) rank = "رئيس مباحث 🎖️";
        else if (solvedCount >= 1) rank = "محقق موهوب 🔍";

        if (currentUserData) currentUserData.rank = rank;
        const rankEl = document.getElementById('userRankDisplay');
        if (rankEl) rankEl.innerText = rank;
    }

    async function loadCasesFromGitHub() {
        try {
            const response = await fetch(GITHUB_CASES_URL, { cache: 'no-cache' });
            if (!response.ok) throw new Error("تعذر جلب القضايا");
            CASES_DATA = await response.json();
            updateRankDisplay();
            renderCasesList();
        } catch (error) { console.error("خطأ في التحميل:", error); }
    }

    function renderCasesList() {
        const container = document.getElementById('casesContainer');
        if (!container) return;
        container.innerHTML = '';

        const solvedCases = getSolvedCases();

        CASES_DATA.forEach((c, index) => {
            const isSolved = solvedCases.includes(c.id);
            const isUnlocked = index === 0 || solvedCases.includes(CASES_DATA[index - 1].id);
            const strictBadge = localStorage.getItem(`badge_strict_${c.id}`) ? ' 🏆 (بدون تلميح)' : '';

            const card = document.createElement('div');
            card.className = `desk-paper ${!isUnlocked ? 'locked' : ''}`;
            
            if (isUnlocked) {
                card.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                        <span class="case-tag">${c.id}</span>
                        <span style="font-size:0.8rem; color:#f1c40f;">${c.difficulty}${strictBadge}</span>
                    </div>
                    <h3>${c.title}</h3>
                    <p style="font-size:0.85rem; color:#aaa; margin:8px 0;">${c.description.substring(0, 90)}...</p>
                    <button class="btn-primary btn-open-case" data-id="${c.id}">
                        ${isSolved ? '✅ مراجعة الملف' : '🔍 فتح التحقيق'}
                    </button>
                `;
            } else {
                card.innerHTML = `
                    <div style="text-align: center; padding: 10px 0;">
                        <span class="lock-icon">🔒</span>
                        <h3>قضية مغلقة</h3>
                        <p style="font-size: 0.8rem; color: #888;">يجب إغلاق القضية رقم (${CASES_DATA[index - 1]?.id || ''}) أولاً.</p>
                    </div>
                `;
            }
            container.appendChild(card);
        });

        document.querySelectorAll('.btn-open-case').forEach(btn => {
            btn.addEventListener('click', (e) => { loadCase(e.target.getAttribute('data-id')); });
        });
    }

    function loadCase(caseId) {
        currentCase = CASES_DATA.find(c => c.id === caseId);
        if (!currentCase) return;

        score = 1000;
        mistakes = 0;
        hintsLeft = 3;
        eliminatedSuspects.clear();
        isCooldown = false;

        document.getElementById('boardCaseId').innerText = currentCase.id;
        document.getElementById('boardCaseTitle').innerText = currentCase.title;
        document.getElementById('caseOverviewText').innerText = currentCase.description;
        document.getElementById('scoreDisplay').innerText = score;
        document.getElementById('mistakesDisplay').innerText = mistakes;
        document.getElementById('hintsLeftDisplay').innerText = hintsLeft;
        
        const submitBtn = document.getElementById('btnSubmitDeduction');
        if (submitBtn) submitBtn.disabled = false;
        document.getElementById('cooldownTimerDisplay')?.classList.add('hidden');

        renderCharacters();
        renderEvidences();
        renderTimeline();
        setupDeductionForm();

        showView('caseBoard');
    }

    function renderCharacters() {
        const grid = document.getElementById('charactersGrid');
        if (!grid || !currentCase) return;
        grid.innerHTML = '';

        currentCase.characters.forEach(char => {
            const isEliminated = eliminatedSuspects.has(char.id);
            const card = document.createElement('div');
            card.className = `desk-paper ${isEliminated ? 'eliminated' : ''}`;
            card.innerHTML = `
                <h4>${char.name}</h4>
                <p style="color:var(--accent-color); font-size:0.8rem; margin-bottom:5px;">${char.role}</p>
                <p><strong>الأقوال:</strong> "${char.statement}"</p>
                <p><strong>الدافع:</strong> ${char.motive}</p>
                <button class="btn-eliminate" data-char="${char.id}">
                    ${isEliminated ? '🔄 إلغاء الاستبعاد' : '❌ استبعاد المشتبه به'}
                </button>
            `;
            grid.appendChild(card);
        });

        document.querySelectorAll('.btn-eliminate').forEach(btn => {
            btn.addEventListener('click', (e) => { toggleEliminate(e.target.getAttribute('data-char')); });
        });
    }

    function toggleEliminate(charId) {
        playSound('click');
        if (eliminatedSuspects.has(charId)) eliminatedSuspects.delete(charId);
        else eliminatedSuspects.add(charId);
        renderCharacters();
    }

    function renderEvidences() {
        const grid = document.getElementById('evidenceGrid');
        if (!grid || !currentCase) return;
        grid.innerHTML = '';

        currentCase.evidences.forEach(evi => {
            const card = document.createElement('div');
            card.className = 'desk-paper';
            card.innerHTML = `
                <h4>${evi.title} <span style="font-size:0.75rem; color:#e67e22;">(${evi.type})</span></h4>
                <p style="margin-top:5px; font-size:0.9rem;">${evi.description}</p>
            `;
            grid.appendChild(card);
        });
    }

    function renderTimeline() {
        const container = document.getElementById('timelineContainer');
        if (!container || !currentCase) return;
        container.innerHTML = '';

        currentCase.timeline.forEach(t => {
            const item = document.createElement('div');
            item.className = 'desk-paper';
            item.innerHTML = `<strong>${t.time}:</strong> ${t.event}`;
            container.appendChild(item);
        });
    }

    function setupDeductionForm() {
        const container = document.getElementById('deductionPuzzlesContainer');
        if (!container || !currentCase) return;

        let suspectOptions = `<option value="">-- اختر المشتبه به الرئيسي --</option>`;
        currentCase.characters.forEach(c => suspectOptions += `<option value="${c.id}">${c.name}</option>`);

        let evidenceOptions = `<option value="">-- اختر الدليل القاطع --</option>`;
        currentCase.evidences.forEach(e => evidenceOptions += `<option value="${e.id}">${e.title}</option>`);

        container.innerHTML = `
            <div class="desk-paper">
                <h4 style="margin-bottom:10px;">⚖️ قرار الاتهام والتحليل</h4>
                <label style="font-size:0.85rem; font-weight:bold;">1. الجاني الرئيسي:</label>
                <select id="selectSuspect" style="width:100%; padding:8px; margin:5px 0 12px 0; background:#111; color:#fff; border:1px solid #444; border-radius:5px;">${suspectOptions}</select>
                <label style="font-size:0.85rem; font-weight:bold;">2. الدليل الإداني القاطع:</label>
                <select id="selectEvidence" style="width:100%; padding:8px; margin:5px 0 12px 0; background:#111; color:#fff; border:1px solid #444; border-radius:5px;">${evidenceOptions}</select>
                <label style="font-size:0.85rem; font-weight:bold;">3. الثغرة في أقوال المتهم:</label>
                <input type="text" id="alibiInput" placeholder="أدخل الكلمة/التناقض الأساسي..." style="width:100%; padding:8px; margin-top:5px; background:#111; color:#fff; border:1px solid #444; border-radius:5px; font-family:inherit;">
            </div>
        `;
    }

    document.querySelectorAll('.board-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            playSound('click');
            document.querySelectorAll('.board-tabs .tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.board-content .tab-pane').forEach(p => p.classList.remove('active'));

            e.target.classList.add('active');
            const targetTab = document.getElementById(e.target.getAttribute('data-tab'));
            if (targetTab) targetTab.classList.add('active');
        });
    });

    document.getElementById('btnUseHint')?.addEventListener('click', () => {
        if (!currentCase) return;
        if (hintsLeft > 0 && currentCase.hints && currentCase.hints.length > 0) {
            playSound('click');
            const hintText = currentCase.hints[hintsLeft - 1] || currentCase.hints[0];
            hintsLeft--;
            document.getElementById('hintsLeftDisplay').innerText = hintsLeft;
            alert(`💡 تلميح المحقق:\n\n${hintText}`);
        } else {
            alert('لا توجد تلميحات إضافية لهذه القضية.');
        }
    });

    function startCooldownPenalty() {
        isCooldown = true;
        const submitBtn = document.getElementById('btnSubmitDeduction');
        const cooldownBanner = document.getElementById('cooldownTimerDisplay');
        const timerSecs = document.getElementById('cooldownSeconds');
        
        if (submitBtn) submitBtn.disabled = true;
        if (cooldownBanner) cooldownBanner.classList.remove('hidden');

        let timeLeft = 15;
        if (timerSecs) timerSecs.innerText = timeLeft;

        const interval = setInterval(() => {
            timeLeft--;
            if (timerSecs) timerSecs.innerText = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(interval);
                isCooldown = false;
                if (submitBtn) submitBtn.disabled = false;
                if (cooldownBanner) cooldownBanner.classList.add('hidden');
            }
        }, 1000);
    }

    function showWinModal(message) {
        let existingModal = document.getElementById('customWinModal');
        if (existingModal) existingModal.remove();

        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'customWinModal';
        modalOverlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); display: flex; justify-content: center;
            align-items: center; z-index: 99999; font-family: inherit;
        `;

        modalOverlay.innerHTML = `
            <div style="background: #1a1a1a; border: 2px solid #f1c40f; padding: 25px; border-radius: 10px; max-width: 450px; width: 90%; text-align: center; color: #fff; box-shadow: 0 0 20px rgba(241,196,15, 0.4);">
                <h3 style="color: #f1c40f; margin-bottom: 15px; font-size: 1.4rem;">🎉 تهانينا يا محقق!</h3>
                <p style="margin-bottom: 20px; line-height: 1.6; white-space: pre-line; font-size: 0.95rem; color: #ddd;">${message}</p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button id="btnSaveAndExit" class="btn-primary" style="background: #27ae60; border: none; padding: 10px 20px; cursor: pointer; border-radius: 5px; font-weight: bold; color: #fff;">💾 حفظ ومتابعة</button>
                </div>
            </div>
        `;

        document.body.appendChild(modalOverlay);

        document.getElementById('btnSaveAndExit').addEventListener('click', () => {
            playSound('click');
            modalOverlay.remove();
            showView('casesList');
            renderCasesList();
        });
    }

    document.getElementById('btnSubmitDeduction')?.addEventListener('click', async () => {
        if (!currentCase || isCooldown) return;

        const selectedSuspect = document.getElementById('selectSuspect')?.value;
        const selectedEvidence = document.getElementById('selectEvidence')?.value;
        const alibiText = document.getElementById('alibiInput')?.value.trim();

        if (!selectedSuspect || !selectedEvidence || !alibiText) {
            alert('يرجى ملء جميع خانات الاتهام والدليل والثغرة!');
            return;
        }

        const sol = currentCase.solution;
        const isSuspectCorrect = selectedSuspect === sol.correctSuspectId;
        const isEvidenceCorrect = selectedEvidence === sol.keyEvidenceId;

        if (isSuspectCorrect && isEvidenceCorrect) {
            playSound('success');
            const noHintsUsed = (hintsLeft === 3);
            const earnedPoints = 10;
            
            await saveSolvedCase(currentCase.id, noHintsUsed, earnedPoints);
            
            let winMsg = `إدانة صحيحة وقاطعة!\n\n${sol.explanation}\n\n(+${earnedPoints} نقطة أضيفت لرصيدك!)`;
            if (noHintsUsed) winMsg += `\n\n🏆 حصلت على وسام "المحقق الصارم"!`;
            
            showWinModal(winMsg);
        } else {
            playSound('error');
            mistakes++;
            score = Math.max(0, score - 200);
            document.getElementById('scoreDisplay').innerText = score;
            document.getElementById('mistakesDisplay').innerText = mistakes;
            
            if (currentUserId && currentUserData) {
                currentUserData.totalScore = Math.max(0, (Number(currentUserData.totalScore) || 0) - 1);
                try {
                    const docRef = doc(db, "users", currentUserId);
                    await updateDoc(docRef, { totalScore: currentUserData.totalScore });
                } catch (e) { console.error("خطأ في تحديث الخصم:", e); }
            }

            alert('❌ اتهام غير صحيح! راجع الأدلة جيداً.\n(تم خصم نقطة من تقييمك الإجمالي)');
            startCooldownPenalty();
        }
    });

    async function renderLeaderboard() {
        const container = document.getElementById('leaderboardList');
        const myScoreEl = document.getElementById('myScoreDisplay');
        const myRankEl = document.getElementById('myRankDisplay');

        if (!container) return;
        container.innerHTML = '<p style="text-align:center;">جاري البحث في ملفات الإنتربول...</p>';

        try {
            const q = query(collection(db, "users"), orderBy("totalScore", "desc"), limit(50));
            const querySnapshot = await getDocs(q);
            
            container.innerHTML = '';
            let rank = 1;

            let myScore = currentUserData ? (currentUserData.totalScore || 0) : 0;
            let myFoundRank = "خارج القمة";

            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                
                if (docSnap.id === currentUserId) {
                    myFoundRank = `#${rank}`;
                }

                const item = document.createElement('div');
                item.className = 'leaderboard-row';
                
                let medal = `#${rank}`;
                if(rank === 1) medal = '🥇';
                if(rank === 2) medal = '🥈';
                if(rank === 3) medal = '🥉';

                item.innerHTML = `
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span style="font-weight:bold; min-width:30px;">${medal}</span>
                        <span>${data.username || "محقق مجهول"}</span>
                    </div>
                    <span style="color:var(--accent-color); font-weight:bold;">${data.totalScore || 0} نقطة</span>
                `;
                container.appendChild(item);
                rank++;
            });

            if (myScoreEl) myScoreEl.innerText = myScore;
            if (myRankEl) myRankEl.innerText = myFoundRank;

        } catch (e) {
            console.error("خطأ في جلب لوحة الشرف:", e);
            container.innerHTML = '<p style="text-align:center; color:#e74c3c;">تعذر الاتصال بقاعدة البيانات لإحضار لوحة الشرف.</p>';
        }
    }

    // جلب القضايا عند تشغيل النظام
    loadCasesFromGitHub();
});
