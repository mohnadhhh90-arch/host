// رابط ملف الـ JSON المباشر من GitHub (قم بتغييره للرابط الخاص بك)
const GITHUB_CASES_URL = "https://raw.githubusercontent.com/mohnadhhh90-arch/game/refs/heads/main/cases.json";

let CASES_DATA = [];

// دالة جلب البيانات من GitHub عند بداية التشغيل
async function loadCasesFromGitHub() {
    try {
        const response = await fetch(GITHUB_CASES_URL);
        if (!response.ok) throw new Error("تعذر جلب القضايا من GitHub");
        
        CASES_DATA = await response.json();
        console.log("تم تحميل القضايا بنجاح من GitHub:", CASES_DATA);
        
        // إعادة رسم قائمة القضايا بعد التحميل
        if (typeof renderCasesList === "function") {
            renderCasesList();
        }
    } catch (error) {
        console.error("خطأ في التحميل:", error);
        alert("حدث خطأ أثناء جلب ملفات القضايا من الخادم.");
    }
}

// تشغيل الجلب فور تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    loadCasesFromGitHub();
});