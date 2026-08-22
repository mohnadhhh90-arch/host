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
            loadCasesFromGitHub();
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

    // تسجيل الدخول والإنشاء
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
                if (currentUserData.totalScore === undefined) currentUserData.totalScore = 0;
                updateRankDisplay();
            } else {
                currentUserData = {
                    username: auth.currentUser?.email?.split('@')[0] || "محقق",
                    solvedCases: [],
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

    // ==========================================================================
    // 📖 نظام طور القصة الإحترافي (Interactive Story Mode - Days & Investigation Board)
    // ==========================================================================
    const STORY_CAMPAIGN = {
        title: "قضية الليلة الغامضة: اختفاء الدكتور راشد",
        days: [
            {
                dayNumber: 1,
                title: "اليوم الأول: مسرح الجريمة والخطوات الأولى",
                brief: "تلقينا بلاغاً باختفاء الدكتور راشد من مكتبه بالجامعة. تم العثور على مكتبه مبعثراً. عليك تفتيش المكان وجمع الأدلة والاستماع للحارس.",
                objectives: [
                    { id: "obj1", text: "فحص مكتب الدكتور راشد واكتشاف الدليل المخفي", done: false },
                    { id: "obj2", text: "استجواب الحارس الشخصي (عم صابر)", done: false }
                ],
                evidences: [
                    { id: "se1", title: "كوب قهوة مسموم", type: "أثر بيولوجي", details: "يحتوي على آثار مادة منوم قوية.", hidden: "مأخوذة من ماركة خاصة لا يشتريها إلا شخص مقرب." },
                    { id: "se2", title: "فاتورة مطعم ممزقة", type: "مستند ورقي", details: "تحمل وقت 11:30 مساءً.", hidden: "تتناقض مع أقوال الحارس الذي قال إنه أغلق الأبواب الساعة 10:00 مساءً." }
                ],
                suspects: [
                    { id: "ss1", name: "عم صابر (الحارس)", role: "حارس المبنى", statement: "أنا أغلقت المبنى الساعة 10 ولم يخل أحد سواي.", alibi: "غرفة الحراسة طوال الليل" }
                ],
                timelineEvents: [
                    { time: "09:00 PM", event: "آخر ظهور للدكتور راشد بمكتبه." },
                    { time: "10:00 PM", event: "إدعاء الحارس إغلاق الأبواب الرئيسية." }
                ]
            },
            {
                dayNumber: 2,
                title: "اليوم الثاني: تحليل المكالمات والمواجهة بالتناقض",
                brief: "بعد فحص الأدلة، ظهرت مكالمة هاتفية صادرة من هاتف الدكتور قبل اختفائه بدقائق، وهناك مشتبه به جديد يدعى (سامح) مساعده الأكاديمي.",
                objectives: [
                    { id: "obj3", text: "فحص سجل المكالمات في هاتف الضحية", done: false },
                    { id: "obj4", text: "مواجهة المساعد (سامح) بالتناقض المرصود", done: false }
                ],
                evidences: [
                    { id: "se3", title: "سجل مكالمات صادر", type: "إلكتروني", details: "مكالمة هاتفية مدتها 4 دقائق مع المساعد سامح الساعة 11:15 PM.", hidden: "تثبت تواجد سامح بالموقع رغم إنكاره السابق." }
                ],
                suspects: [
                    { id: "ss2", name: "سامح (المساعد الأكاديمي)", role: "مساعد الباحث", statement: "كنت في منزلي نائماً ولم أتواصل مع الدكتور تلك الليلة أبداً!", alibi: "المنزل نائماً" }
                ],
                timelineEvents: [
                    { time: "11:15 PM", event: "مكالمة صادرة بين هاتف الدكتور وسامح." }
                ]
            },
            {
                dayNumber: 3,
                title: "اليوم الثالث والأخير: الاستنتاج الشامل وإغلاق الملف",
                brief: "حان الوقت لربط خيوط القضية بالكامل، وتحديد الجاني والدليل القطعي وإصدار أمر القبض.",
                objectives: [
                    { id: "obj5", text: "الوصول للاستنتاج النهائي وتحديد الجاني بدقة", done: false }
                ],
                evidences: [],
                suspects: [],
                timelineEvents: []
            }
        ]
    };

    let activeStoryDay = 0;
    let storyBoardTab = 'file'; // file, evidence, suspects, timeline, deduce

    document.getElementById('btnStoryMode')?.addEventListener('click', () => {
        activeStoryDay = 0;
        storyBoardTab = 'file';
        showView('storyMode');
        renderStoryInvestigationDesk();
    });

    function renderStoryInvestigationDesk() {
        const container = document.getElementById('storyModeSection');
        if (!container) return;

        const currentDayData = STORY_CAMPAIGN.days[activeStoryDay];
        if (!currentDayData) {
            finishStoryCampaignCompletely();
            return;
        }

        container.innerHTML = `
            <div class="desk-paper" style="max-width: 850px; margin: 15px auto; text-align: right; background: #181818; border: 2px solid #333; padding: 20px; border-radius: 8px;">
                <!-- رأس اللوحة -->
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #444; padding-bottom: 12px; margin-bottom: 15px;">
                    <div>
                        <span style="background: #e67e22; color: #fff; padding: 3px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold;">${STORY_CAMPAIGN.title}</span>
                        <h2 style="color: #f1c40f; margin: 5px 0 0 0; font-size: 1.25rem;">📅 ${currentDayData.title}</h2>
                    </div>
                    <button class="btn-primary btn-to-menu" style="background: #7f8c8d; border:none; padding:6px 14px; border-radius:4px; cursor:pointer; color:#fff; font-size:0.8rem;">الرئيسية</button>
                </div>

                <!-- تبويبات لوحة التحقيق التفاعلية -->
                <div style="display: flex; gap: 5px; margin-bottom: 15px; border-bottom: 1px solid #333; padding-bottom: 10px; flex-wrap: wrap;">
                    <button class="story-tab-btn ${storyBoardTab === 'file' ? 'active' : ''}" data-tab="file" style="background:${storyBoardTab === 'file'?'#f1c40f':'#222'}; color:${storyBoardTab === 'file'?'#000':'#fff'}; border:1px solid #444; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:0.85rem;">📁 ملف اليوم</button>
                    <button class="story-tab-btn ${storyBoardTab === 'evidence' ? 'active' : ''}" data-tab="evidence" style="background:${storyBoardTab === 'evidence'?'#f1c40f':'#222'}; color:${storyBoardTab === 'evidence'?'#000':'#fff'}; border:1px solid #444; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:0.85rem;">🔍 الأدلة والمستندات</button>
                    <button class="story-tab-btn ${storyBoardTab === 'suspects' ? 'active' : ''}" data-tab="suspects" style="background:${storyBoardTab === 'suspects'?'#f1c40f':'#222'}; color:${storyBoardTab === 'suspects'?'#000':'#fff'}; border:1px solid #444; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:0.85rem;">👥 المشتبه بهم والشهود</button>
                    <button class="story-tab-btn ${storyBoardTab === 'timeline' ? 'active' : ''}" data-tab="timeline" style="background:${storyBoardTab === 'timeline'?'#f1c40f':'#222'}; color:${storyBoardTab === 'timeline'?'#000':'#fff'}; border:1px solid #444; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:0.85rem;">⏳ خط الزمن</button>
                    ${activeStoryDay === STORY_CAMPAIGN.days.length - 1 ? `<button class="story-tab-btn ${storyBoardTab === 'deduce' ? 'active' : ''}" data-tab="deduce" style="background:${storyBoardTab === 'deduce'?'#27ae60':'#222'}; color:#fff; border:1px solid #444; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:0.85rem; font-weight:bold;">⚖️ الاستنتاج النهائي</button>` : ''}
                </div>

                <!-- المحتوى بناءً على التبويب النشط -->
                <div id="storyTabContent">
                    ${renderStoryTabContent(currentDayData)}
                </div>

                <!-- أزرار التنقل بين الأيام -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px; border-top: 1px solid #333; padding-top: 15px;">
                    <span style="font-size: 0.85rem; color: #aaa;">اليوم رقم ${activeStoryDay + 1} من ${STORY_CAMPAIGN.days.length}</span>
                    <button id="btnProceedNextDay" class="btn-primary" style="background: #27ae60; border:none; padding:8px 20px; border-radius:4px; cursor:pointer; font-weight:bold; color:#fff; font-size:0.9rem;">
                        ${activeStoryDay < STORY_CAMPAIGN.days.length - 1 ? 'الانتقال لليوم التالي ➔' : 'إنهاء التحقيق وإغلاق القضية 🏆'}
                    </button>
                </div>
            </div>
        `;

        // ربط الأحداث
        container.querySelectorAll('.btn-to-menu').forEach(b => b.addEventListener('click', () => showView('mainMenu')));

        container.querySelectorAll('.story-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                playSound('click');
                storyBoardTab = e.target.getAttribute('data-tab');
                renderStoryInvestigationDesk();
            });
        });

        // مهام اليوم
        container.querySelectorAll('.story-obj-chk').forEach(chk => {
            chk.addEventListener('change', (e) => {
                playSound('click');
                const id = e.target.getAttribute('data-id');
                const obj = currentDayData.objectives.find(o => o.id === id);
                if (obj) obj.done = e.target.checked;
            });
        });

        // فحص الأدلة (Inspect Modal)
        container.querySelectorAll('.inspect-evidence-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                playSound('click');
                const eviId = e.target.getAttribute('data-id');
                let foundEvi = null;
                STORY_CAMPAIGN.days.forEach(d => {
                    const match = d.evidences.find(ev => ev.id === eviId);
                    if (match) foundEvi = match;
                });
                if (foundEvi) {
                    showInspectModal(foundEvi);
                }
            });
        });

        // زر ربط الأدلة
        document.getElementById('btnConnectEvidences')?.addEventListener('click', () => {
            playSound('click');
            showEvidenceConnectionModal(currentDayData);
        });

        // زر مواجهة المشتبه به
        container.querySelectorAll('.confront-suspect-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                playSound('click');
                const sId = e.target.getAttribute('data-id');
                showConfrontModal(sId, currentDayData);
            });
        });

        // الانتقال لليوم التالي أو إنهاء القصة
        document.getElementById('btnProceedNextDay')?.addEventListener('click', () => {
            playSound('success');
            const allDone = currentDayData.objectives.every(o => o.done);
            if (!allDone) {
                const proceed = confirm("لم تقم بإنجاز جميع مهام اليوم بالكامل. هل تريد الانتقال على أي حال؟");
                if (!proceed) return;
            }

            if (activeStoryDay < STORY_CAMPAIGN.days.length - 1) {
                activeStoryDay++;
                storyBoardTab = 'file';
                renderStoryInvestigationDesk();
            } else {
                // صفحة الاستنتاج النهائي إذا كنا في اليوم الأخير
                submitFinalStoryDeduction();
            }
        });
    }

    function renderStoryTabContent(dayData) {
        if (storyBoardTab === 'file') {
            return `
                <div>
                    <p style="font-size: 0.95rem; line-height: 1.6; color: #ddd; margin-bottom: 15px;">${dayData.brief}</p>
                    <h4 style="color: #3498db; margin-bottom: 10px; font-size: 0.95rem;">📋 أهداف التحقيق اليومية:</h4>
                    <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px;">
                        ${dayData.objectives.map(o => `
                            <label style="background: #222; padding: 10px; border-radius: 4px; cursor: pointer; border: 1px solid #444; display: flex; align-items: center; gap: 10px;">
                                <input type="checkbox" class="story-obj-chk" data-id="${o.id}" ${o.done ? 'checked' : ''} style="width: 18px; height: 18px;">
                                <span style="${o.done ? 'text-decoration: line-through; color: #888;' : 'color: #fff;'} font-size: 0.9rem;">${o.text}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            `;
        } else if (storyBoardTab === 'evidence') {
            // تجميع أدلة الأيام السابقة والحالية
            let availableEvidences = [];
            for(let i=0; i<=activeStoryDay; i++) {
                availableEvidences.push(...STORY_CAMPAIGN.days[i].evidences);
            }

            return `
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <h4 style="color: #f1c40f; margin: 0; font-size: 0.95rem;">🔍 الأدلة والمستندات المجمعة:</h4>
                        <button id="btnConnectEvidences" style="background: #8e44ad; color: #fff; border: none; padding: 5px 12px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">🔗 ربط دليلين</button>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px;">
                        ${availableEvidences.length > 0 ? availableEvidences.map(ev => `
                            <div style="background: #222; border: 1px solid #444; padding: 12px; border-radius: 6px;">
                                <span style="font-size: 0.7rem; color: #e67e22; font-weight: bold;">(${ev.type})</span>
                                <h5 style="color: #fff; margin: 4px 0; font-size: 0.95rem;">📄 ${ev.title}</h5>
                                <p style="font-size: 0.8rem; color: #aaa; margin: 0 0 10px 0;">${ev.details}</p>
                                <button class="inspect-evidence-btn" data-id="${ev.id}" style="background: #3498db; color: #fff; border: none; padding: 4px 10px; border-radius: 3px; cursor: pointer; font-size: 0.75rem; width: 100%;">فحص الدقيق 🔍</button>
                            </div>
                        `).join('') : '<p style="color: #777; font-size: 0.85rem;">لا توجد أدلة مكتشفة بعد.</p>'}
                    </div>
                </div>
            `;
        } else if (storyBoardTab === 'suspects') {
            let availableSuspects = [];
            for(let i=0; i<=activeStoryDay; i++) {
                availableSuspects.push(...STORY_CAMPAIGN.days[i].suspects);
            }

            return `
                <div>
                    <h4 style="color: #e74c3c; margin-bottom: 12px; font-size: 0.95rem;">👥 المشتبه بهم والأقوال المرصودة:</h4>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        ${availableSuspects.length > 0 ? availableSuspects.map(sus => `
                            <div style="background: #222; border: 1px solid #444; padding: 12px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                                <div>
                                    <h5 style="color: #f1c40f; margin: 0 0 4px 0; font-size: 0.95rem;">${sus.name} <span style="font-size: 0.75rem; color: #888;">(${sus.role})</span></h5>
                                    <p style="font-size: 0.85rem; color: #ddd; margin: 0 0 4px 0;"><strong>الأقوال:</strong> "${sus.statement}"</p>
                                    <p style="font-size: 0.8rem; color: #aaa; margin: 0;"><strong>الأليبي:</strong> ${sus.alibi}</p>
                                </div>
                                <button class="confront-suspect-btn" data-id="${sus.id}" style="background: #e67e22; color: #fff; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">⚡ مواجهة بالدليل</button>
                            </div>
                        `).join('') : '<p style="color: #777; font-size: 0.85rem;">لا يوجد مشتبه بهم تم استجوابهم حتى الآن.</p>'}
                    </div>
                </div>
            `;
        } else if (storyBoardTab === 'timeline') {
            let availableTimeline = [];
            for(let i=0; i<=activeStoryDay; i++) {
                availableTimeline.push(...STORY_CAMPAIGN.days[i].timelineEvents);
            }

            return `
                <div>
                    <h4 style="color: #2ecc71; margin-bottom: 12px; font-size: 0.95rem;">⏳ خط الزمن المتسلسل للأحداث:</h4>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${availableTimeline.length > 0 ? availableTimeline.map(t => `
                            <div style="background: #222; border-right: 3px solid #2ecc71; padding: 10px; border-radius: 4px;">
                                <strong style="color: #f1c40f; font-size: 0.85rem;">${t.time}</strong>
                                <p style="font-size: 0.85rem; color: #ddd; margin: 3px 0 0 0;">${t.event}</p>
                            </div>
                        `).join('') : '<p style="color: #777; font-size: 0.85rem;">لا توجد أحداث زمنية مسجلة بعد.</p>'}
                    </div>
                </div>
            `;
        } else if (storyBoardTab === 'deduce') {
            return `
                <div style="background: #1f1f1f; padding: 15px; border-radius: 6px; border: 1px solid #f1c40f;">
                    <h4 style="color: #f1c40f; margin-bottom: 10px;">⚖️ لوحة الاستنتاج النهائي الشامل</h4>
                    <p style="font-size: 0.85rem; color: #ccc; margin-bottom: 15px;">بناءً على أدلة الأيام الثلاثة، حدد هوية الجاني والدليل القاطع لإغلاق الملف تماماً.</p>
                    
                    <label style="font-size: 0.85rem; font-weight: bold; display: block; margin-bottom: 5px;">اختر الجاني الحقيقي:</label>
                    <select id="finalStorySuspect" style="width: 100%; padding: 8px; background: #111; color: #fff; border: 1px solid #444; border-radius: 4px; margin-bottom: 12px; font-family:inherit;">
                        <option value="">-- اختر الجاني --</option>
                        <option value="ss1">عم صابر (الحارس)</option>
                        <option value="ss2">سامح (المساعد الأكاديمي)</option>
                    </select>

                    <label style="font-size: 0.85rem; font-weight: bold; display: block; margin-bottom: 5px;">الدليل القاطع الرئيسي:</label>
                    <select id="finalStoryEvidence" style="width: 100%; padding: 8px; background: #111; color: #fff; border: 1px solid #444; border-radius: 4px; margin-bottom: 15px; font-family:inherit;">
                        <option value="">-- اختر الدليل --</option>
                        <option value="se1">كوب قهوة مسموم</option>
                        <option value="se2">فاتورة مطعم ممزقة</option>
                        <option value="se3">سجل مكالمات صادر</option>
                    </select>

                    <button id="btnExecuteFinalVerdict" class="btn-primary" style="background: #27ae60; border: none; width: 100%; padding: 10px; border-radius: 4px; font-weight: bold; color: #fff; cursor: pointer;">إصدار الحكم وإغلاق القضية 🏛️</button>
                </div>
            `;
        }
        return '';
    }

    // نافذة فحص الدليل (Inspect Modal)
    function showInspectModal(evi) {
        const modal = document.createElement('div');
        modal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); display:flex; justify-content:center; align-items:center; z-index:99999;";
        modal.innerHTML = `
            <div style="background:#1c1c1c; border:2px solid #3498db; padding:20px; border-radius:8px; max-width:400px; width:90%; color:#fff; text-align:right;">
                <h3 style="color:#3498db; margin-top:0;">🔍 فحص تفصيلي: ${evi.title}</h3>
                <p style="font-size:0.85rem; color:#aaa; margin-bottom:10px;">التصنيف: ${evi.type}</p>
                <p style="font-size:0.9rem; color:#ddd; line-height:1.5; margin-bottom:15px;">${evi.details}</p>
                <div style="background:#262626; padding:10px; border-radius:4px; border-left:3px solid #f1c40f; margin-bottom:15px;">
                    <strong style="color:#f1c40f; font-size:0.8rem;">ملاحظة المحقق المخفية:</strong>
                    <p style="font-size:0.85rem; color:#fff; margin:3px 0 0 0;">${evi.hidden}</p>
                </div>
                <button id="btnCloseInspect" style="background:#e74c3c; border:none; color:#fff; padding:8px 15px; border-radius:4px; cursor:pointer; width:100%; font-weight:bold;">إغلاق الفحص</button>
            </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector('#btnCloseInspect').addEventListener('click', () => {
            playSound('click');
            modal.remove();
        });
    }

    // نافذة ربط الأدلة (Evidence Connection Modal)
    function showEvidenceConnectionModal(currentDayData) {
        let allEvidences = [];
        for(let i=0; i<=activeStoryDay; i++) {
            allEvidences.push(...STORY_CAMPAIGN.days[i].evidences);
        }

        if (allEvidences.length < 2) {
            alert('تحتاج إلى دليلين على الأقل لمحاولة ربطهما معاً!');
            return;
        }

        let optionsHtml = allEvidences.map(e => `<option value="${e.id}">${e.title}</option>`).join('');

        const modal = document.createElement('div');
        modal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); display:flex; justify-content:center; align-items:center; z-index:99999;";
        modal.innerHTML = `
            <div style="background:#1c1c1c; border:2px solid #8e44ad; padding:20px; border-radius:8px; max-width:420px; width:90%; color:#fff; text-align:right;">
                <h3 style="color:#9b59b6; margin-top:0;">🔗 ربط الأدلة الجنائية</h3>
                <p style="font-size:0.85rem; color:#ccc; margin-bottom:15px;">اختر دليلين لكشف التقاطع والتناقض الخفي بينهما:</p>
                
                <label style="font-size:0.8rem; font-weight:bold;">الدليل الأول:</label>
                <select id="connEvi1" style="width:100%; padding:8px; background:#111; color:#fff; border:1px solid #444; border-radius:4px; margin-bottom:10px; font-family:inherit;">${optionsHtml}</select>
                
                <label style="font-size:0.8rem; font-weight:bold;">الدليل الثاني:</label>
                <select id="connEvi2" style="width:100%; padding:8px; background:#111; color:#fff; border:1px solid #444; border-radius:4px; margin-bottom:15px; font-family:inherit;">${optionsHtml}</select>
                
                <div style="display:flex; gap:10px;">
                    <button id="btnTestConnection" style="background:#27ae60; border:none; color:#fff; padding:8px; border-radius:4px; cursor:pointer; flex:1; font-weight:bold;">اختبار الربط ⚡</button>
                    <button id="btnCloseConn" style="background:#e74c3c; border:none; color:#fff; padding:8px 15px; border-radius:4px; cursor:pointer;">إلغاء</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('#btnCloseConn').addEventListener('click', () => modal.remove());
        modal.querySelector('#btnTestConnection').addEventListener('click', () => {
            playSound('click');
            const e1 = modal.querySelector('#connEvi1').value;
            const e2 = modal.querySelector('#connEvi2').value;

            if (e1 === e2) {
                alert('يرجى اختيار دليلين مختلفين للربط!');
                return;
            }

            // مثال على ربط صحيح بين فاتورة المطعم وسجل المكالمات أو الحارس
            if ((e1 === 'se2' && e2 === 'se3') || (e1 === 'se3' && e2 === 'se2')) {
                playSound('success');
                alert('🎉 ربط ممتاز!\n\nاكتشفت أن وقت فاتورة المطعم يتطابق تماماً مع وقت المكالمة الصادرة للمساعد سامح، مما يسقط حجة غيابه تماماً!');
                modal.remove();
            } else {
                playSound('error');
                alert('❌ لا يوجد تناقض أو رابط منطقي مباشر بين هذين الدليلين. استمر في الفحص.');
            }
        });
    }

    // نافذة مواجهة المشتبه به (Confront Modal)
    function showConfrontModal(suspectId, currentDayData) {
        let allEvidences = [];
        for(let i=0; i<=activeStoryDay; i++) {
            allEvidences.push(...STORY_CAMPAIGN.days[i].evidences);
        }

        let allSuspects = [];
        for(let i=0; i<=activeStoryDay; i++) {
            allSuspects.push(...STORY_CAMPAIGN.days[i].suspects);
        }

        const suspect = allSuspects.find(s => s.id === suspectId);
        if (!suspect) return;

        let eviOptions = allEvidences.map(e => `<option value="${e.id}">${e.title}</option>`).join('');

        const modal = document.createElement('div');
        modal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); display:flex; justify-content:center; align-items:center; z-index:99999;";
.innerHTML = `
            <div style="background:#1c1c1c; border:2px solid #e67e22; padding:20px; border-radius:8px; max-width:420px; width:90%; color:#fff; text-align:right;">
                <h3 style="color:#e67e22; margin-top:0;">⚡ استجواب ومواجهة: ${suspect.name}</h3>
                <p style="font-size:0.85rem; color:#ccc; margin-bottom:10px;">أقواله المسجلة: "${suspect.statement}"</p>
                <p style="font-size:0.85rem; color:#f1c40f; margin-bottom:15px;">اختر الدليل القاطع لمواجهته وكشف كذبه:</p>
                
                <select id="confrontEviSelect" style="width:100%; padding:8px; background:#111; color:#fff; border:1px solid #444; border-radius:4px; margin-bottom:15px; font-family:inherit;">
                    <option value="">-- اختر الدليل للمواجهة --</option>
                    ${eviOptions}
                </select>
                
                <div style="display:flex; gap:10px;">
                    <button id="btnExecuteConfront" style="background:#27ae60; border:none; color:#fff; padding:8px; border-radius:4px; cursor:pointer; flex:1; font-weight:bold;">تنفيذ المواجهة 🎯</button>
                    <button id="btnCloseConf" style="background:#7f8c8d; border:none; color:#fff; padding:8px 15px; border-radius:4px; cursor:pointer;">إلغاء</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('#btnCloseConf').addEventListener('click', () => modal.remove());
        modal.querySelector('#btnExecuteConfront').addEventListener('click', () => {
            playSound('click');
            const selectedEv = modal.querySelector('#confrontEviSelect').value;

            // إذا كان سامح ودليله السجل أو الحارس وفاتورة المطعم
            if ((suspectId === 'ss2' && selectedEv === 'se3') || (suspectId === 'ss1' && selectedEv === 'se2')) {
                playSound('success');
                alert(`🎯 مواجهة ناجحة!\n\nارتبك ${suspect.name} واعترف بوجود ثغرة في أقواله بعد أن واجهته بالدليل القاطع!`);
                modal.remove();
            } else {
                playSound('error');
                alert('❌ هذا الدليل لا يُمثل تناقضاً كافياً لدحض أقوال هذا الشخص.');
            }
        });
    }

    // إرسال الحكم النهائي للقصة
    function submitFinalStoryDeduction() {
        storyBoardTab = 'deduce';
        renderStoryInvestigationDesk();

        // ربط حدث إرسال الحكم النهائي بعد إعادة الرسم
        setTimeout(() => {
            document.getElementById('btnExecuteFinalVerdict')?.addEventListener('click', async () => {
                const sSuspect = document.getElementById('finalStorySuspect')?.value;
                const sEvidence = document.getElementById('finalStoryEvidence')?.value;

                if (!sSuspect || !sEvidence) {
                    alert('يرجى تحديد الجاني والدليل القاطع بدقة!');
                    return;
                }

                // الجاني الصحيح هو سامح (ss2) والدليل هو سجل المكالمات (se3)
                if (sSuspect === 'ss2' && sEvidence === 'se3') {
                    playSound('success');
                    await finishStoryCampaignCompletely();
                } else {
                    playSound('error');
                    alert('❌ اتهام خاطئ! الجاني تمكن من الإفلات بسبب خطأ في تحديد الأدلة. راجع التحقيق جيداً.');
                }
            });
        }, 100);
    }

    async function finishStoryCampaignCompletely() {
        playSound('success');
        let bonus = 50;
        if (currentUserData && currentUserId) {
            currentUserData.totalScore = (Number(currentUserData.totalScore) || 0) + bonus;
            try {
                const docRef = doc(db, "users", currentUserId);
                await updateDoc(docRef, { totalScore: currentUserData.totalScore });
            } catch (err) { console.error(err); }
        }
        alert(`🏆 تهانينا الكبرى يا محقق النجوم!\n\nلقد أتممت قصة "اختفاء الدكتور راشد" بجميع أيامها عبر لوحة التحقيق التفاعلية وكشفت الجاني الحقيقي بنجاح.\nتمت إضافة +${bonus} نقطة لرصيدك العام.`);
        showView('mainMenu');
    }

    // ==========================================
    // نظام القضايا الرئيسي العادي 🕵️‍♂️
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

        if (isNewCase) solved.push(caseId);

        let newTotalScore = Number(currentUserData?.totalScore || 0);
        if (isNewCase) newTotalScore += earnedScore;

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

    // ==========================================
    // قائمة المتصدرين (Leaderboard) 🏆
    // ==========================================
    async function renderLeaderboard() {
        const container = document.getElementById('leaderboardList');
        const myScoreEl = document.getElementById('myScoreDisplay');
        const myRankEl = document.getElementById('myRankDisplay');

        if (!container) return;
        container.innerHTML = '<p style="text-align:center; color:#aaa;">جاري البحث في ملفات الإنتربول...</p>';

        try {
            const q = query(collection(db, "users"), orderBy("totalScore", "desc"), limit(50));
            const querySnapshot = await getDocs(q);
            
            container.innerHTML = '';
            let rank = 1;
            let myFoundRank = "خارج القمة";
            let myScore = currentUserData ? (currentUserData.totalScore || 0) : 0;

            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                
                if (docSnap.id === currentUserId) {
                    myFoundRank = `#${rank}`;
                }

                const item = document.createElement('div');
                item.className = 'leaderboard-row';
                item.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 10px; margin-bottom: 8px; background: #222; border: 1px solid #444; border-radius: 5px;";
                
                let medal = `#${rank}`;
                if (rank === 1) medal = '🥇';
                else if (rank === 2) medal = '🥈';
                else if (rank === 3) medal = '🥉';

                item.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-weight: bold; color: #f1c40f; width: 30px; text-align: center;">${medal}</span>
                        <span>${data.username || 'محقق مجهول'}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <span style="font-size: 0.85rem; color: #aaa;">${data.rank || 'مساعد محقق 🕵️‍♂️'}</span>
                        <span style="font-weight: bold; color: #27ae60;">${data.totalScore || 0} نقطة</span>
                    </div>
                `;
                container.appendChild(item);
                rank++;
            });

            if (myScoreEl) myScoreEl.innerText = myScore;
            if (myRankEl) myRankEl.innerText = myFoundRank;

        } catch (error) {
            console.error("خطأ في جلب المتصدرين:", error);
            container.innerHTML = '<p style="text-align:center; color:#e74c3c;">تعذر الاتصال بقاعدة البيانات لجلب المتصدرين.</p>';
        }
    }
});
