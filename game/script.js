import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// إعدادات Firebase الخاص بك
const firebaseConfig = {
    apiKey: "AIzaSyDLOklvLUPBa8IqM3-4xaswdMMqqAdqzXY",
    authDomain: "mohnad2-bfb02.firebaseapp.com",
    projectId: "mohnad2-bfb02",
    storageBucket: "mohnad2-bfb02.firebasestorage.app",
    messagingSenderId: "846017797996",
    appId: "1:846017797996:web:518f9eaa546004cd631d49",
    measurementId: "G-QKG96L42XB"
};

// تهيئة خدمات Firebase
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
    
    if (secretNoticeModal) {
        secretNoticeModal.classList.remove('hidden');
    }

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
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

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
        } catch (e) {
            console.log("Audio play error:", e);
        }
    }

    const views = {
        auth: document.getElementById('authSection'),
        mainMenu: document.getElementById('mainMenuSection'),
        casesList: document.getElementById('casesListSection'),
        caseBoard: document.getElementById('caseBoardSection'),
        howToPlay: document.getElementById('howToPlaySection'),
        settings: document.getElementById('settingsSection'),
        about: document.getElementById('aboutSection'),
        leaderboard: document.getElementById('leaderboardSection')
    };

    function showView(viewKey) {
        playSound('click');
        Object.values(views).forEach(v => {
            if (v) v.classList.add('hidden');
        });
        if (views[viewKey]) {
            views[viewKey].classList.remove('hidden');
        }
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
                rank: "مساعد محقق 🕵️‍♂️",
                totalScore: 0
            };

            await setDoc(doc(db, "users", currentUserId), currentUserData);
            alert('تم إنشاء حسابك بنجاح! مرحباً بك يا محقق.');
            updateRankDisplay();
            showView('mainMenu');
        } catch (err) {
            if (errorDiv) {
                if (err.code === 'auth/email-already-in-use') {
                    errorDiv.innerText = "اسم المستخدم هذا مستخدم بالفعل!";
                } else {
                    errorDiv.innerText = "حدث خطأ أثناء إنشاء الحساب!";
                }
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
        } catch (error) {
            console.error("خطأ أثناء تسجيل الخروج:", error);
        }
    });

    async function loadUserData(uid) {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            currentUserData = docSnap.data();
            updateRankDisplay();
        }
    }

    async function saveProgressOnline() {
        if (currentUserId && currentUserData) {
            const docRef = doc(db, "users", currentUserId);
            await updateDoc(docRef, {
                solvedCases: currentUserData.solvedCases || [],
                rank: currentUserData.rank || "مساعد محقق 🕵️‍♂️",
                totalScore: Number(currentUserData.totalScore) || 0
            });
        }
    }

    // --- زر استعادة النقاط الآمن في الإعدادات ---
    document.getElementById('btnRestoreScore')?.addEventListener('click', async () => {
        if (!currentUserId || !currentUserData) {
            alert("يرجى تسجيل الدخول أولاً!");
            return;
        }

        playSound('click');
        const solvedList = currentUserData.solvedCases || [];
        // حساب النقاط: كل قضية بـ 10 نقاط (أو على الأقل 10 نقاط لو عنده قضايا محلولة)
        let restoredScore = solvedList.length * 10;
        
        // لو مفيش قضايا مسجلة في السيرفر بس فيه في الـ LocalStorage، ندمجهم للأمان
        const localSolved = JSON.parse(localStorage.getItem('detective_solved_cases') || '[]');
        localSolved.forEach(cId => {
            if (!solvedList.includes(cId)) {
                solvedList.push(cId);
            }
        });
        
        restoredScore = Math.max(restoredScore, solvedList.length * 10, 10); // ضمان استعادة النقاط الصحيحة

        currentUserData.solvedCases = solvedList;
        currentUserData.totalScore = restoredScore;

        try {
            await saveProgressOnline();
            updateRankDisplay();
            alert(`✅ تم استعادة وتحديث نقاطك بنجاح!\nرصيدك الحالي الآن: ${restoredScore} نقطة.`);
        } catch (e) {
            console.error(e);
            alert("حدث خطأ أثناء الاتصال بالخادم لاستعادة النقاط.");
        }
    });

    document.getElementById('btnStartGame')?.addEventListener('click', () => { renderCasesList(); showView('casesList'); });
    document.getElementById('btnHowToPlay')?.addEventListener('click', () => showView('howToPlay'));
    document.getElementById('btnSettings')?.addEventListener('click', () => showView('settings'));
    document.getElementById('btnAbout')?.addEventListener('click', () => showView('about'));
    
    document.getElementById('btnLeaderboard')?.addEventListener('click', async () => {
        showView('leaderboard');
        await renderLeaderboard();
    });

    document.querySelectorAll('.btn-to-menu').forEach(btn => btn.addEventListener('click', () => showView('mainMenu')));
    document.querySelectorAll('.btn-to-cases').forEach(btn => btn.addEventListener('click', () => showView('casesList')));

    const GITHUB_CASES_URL = "https://raw.githubusercontent.com/mohnadhhh90-arch/game/main/cases.json";
    let CASES_DATA = [];
    let currentCase = null;
    let score = 1000;
    let mistakes = 0;
    let hintsLeft = 3;
    let eliminatedSuspects = new Set();
    let isCooldown = false;

    function getSolvedCases() {
        if (currentUserData) {
            return currentUserData.solvedCases || [];
        }
        return JSON.parse(localStorage.getItem('detective_solved_cases') || '[]');
    }

    async function saveSolvedCase(caseId, noHintsUsed) {
        const solved = getSolvedCases();
        if (!solved.includes(caseId)) {
            solved.push(caseId);
        }

        if (currentUserData) {
            currentUserData.solvedCases = solved;
            await saveProgressOnline();
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
        } catch (error) {
            console.error("خطأ في التحميل:", error);
        }
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
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                loadCase(id);
            });
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
            btn.addEventListener('click', (e) => {
                const charId = e.target.getAttribute('data-char');
                toggleEliminate(charId);
            });
        });
    }

    function toggleEliminate(charId) {
        playSound('click');
        if (eliminatedSuspects.has(charId)) {
            eliminatedSuspects.delete(charId);
        } else {
            eliminatedSuspects.add(charId);
        }
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
            await saveSolvedCase(currentCase.id, noHintsUsed);
            
            if (currentUserId && currentUserData) {
                currentUserData.totalScore = (Number(currentUserData.totalScore) || 0) + 10;
                await saveProgressOnline();
            }
            
            let winMsg = `🎉 إدانة صحيحة وقاطعة!\n\n${sol.explanation}\n\n(+10 نقاط لتقييمك الإجمالي!)`;
            if (noHintsUsed) winMsg += `\n\n🏆 حصلت على وسام "المحقق الصارم"!`;
            
            alert(winMsg);
            showView('casesList');
            renderCasesList();
        } else {
            playSound('error');
            mistakes++;
            score = Math.max(0, score - 200);
            document.getElementById('scoreDisplay').innerText = score;
            document.getElementById('mistakesDisplay').innerText = mistakes;
            
            if (currentUserId && currentUserData) {
                currentUserData.totalScore = Math.max(0, (Number(currentUserData.totalScore) || 0) - 1);
                await saveProgressOnline();
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
            let myFoundRank = null;
            let myScore = 0;

            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                
                if (docSnap.id === currentUserId) {
                    myScore = data.totalScore || 0;
                    myFoundRank = `#${rank}`;
                }

                const item = document.createElement('div');
                item.className = 'leaderboard-row';
                
                let medal = `#${rank}`;
                if(rank === 1) medal = '🥇';
                if(rank === 2) medal = '🥈';
                if(rank === 3) medal = '🥉';

                item.innerHTML = `
                    <div class="lb-rank">${medal}</div>
                    <div class="lb-name">${data.username} <span style="font-size: 0.7rem; color: #888; display:block;">${data.rank}</span></div>
                    <div class="lb-score">${data.totalScore || 0} نقطة</div>
                `;
                container.appendChild(item);
                rank++;
            });

            if (myScoreEl) myScoreEl.innerText = myScore;
            if (myRankEl) myRankEl.innerText = myFoundRank || "خارج القمة";

        } catch (error) {
            console.error("خطأ في تحميل الترتيب:", error);
            container.innerHTML = '<p style="text-align:center; color:red;">تعذر الاتصال بالخادم لجلب الترتيب.</p>';
        }
    }

    const notebookModal = document.getElementById('notebookModal');
    const notebookBtn = document.getElementById('notebookToggleBtn');
    const notebookText = document.getElementById('notebookTextArea');

    if (notebookText) {
        notebookText.value = localStorage.getItem('detective_notebook') || '';
        notebookText.addEventListener('input', () => {
            localStorage.setItem('detective_notebook', notebookText.value);
        });
    }

    notebookBtn?.addEventListener('click', () => { playSound('click'); notebookModal?.classList.remove('hidden'); });

    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            playSound('click');
            notebookModal?.classList.add('hidden');
        });
    });

    document.getElementById('btnResetProgress')?.addEventListener('click', () => {
        if (confirm('هل أنت متاكد من مسح جميع التقدم؟')) {
            localStorage.clear();
            location.reload();
        }
    });

    loadCasesFromGitHub();
});
