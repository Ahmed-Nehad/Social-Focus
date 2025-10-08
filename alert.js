// Helper functions for localStorage get/set with default 0, with error handling for storage access issues
function getLS(name) {
    try {
        let val = localStorage.getItem(name);
        return val !== null ? Number(val) : 0;
    } catch (e) {
        // Handle storage access errors (e.g., Permission denied)
        console.error("localStorage.getItem error:", e);
        // If storage access is denied, return 0 as a safe default
        return 0;
    }
}
function setLS(name, value) {
    try {
        localStorage.setItem(name, value);
    } catch (e) {
        // Handle storage access errors (e.g., Permission denied)
        console.error("localStorage.setItem error:", e);
        // Optionally, you could notify the user or take other action here
    }
}

// Helper for getting/setting JSON arrays in localStorage, with error handling
function getLSArray(name) {
    try {
        let val = localStorage.getItem(name);
        return val ? JSON.parse(val) : [];
    } catch (e) {
        // Handle storage access or JSON parse errors
        console.error("localStorage.getItem/JSON.parse error:", e);
        // If storage access is denied or JSON is invalid, return empty array
        return [];
    }
}
function setLSArray(name, arr) {
    try {
        localStorage.setItem(name, JSON.stringify(arr));
    } catch (e) {
        // Handle storage access errors (e.g., Permission denied)
        console.error("localStorage.setItem error:", e);
        // Optionally, you could notify the user or take other action here
    }
}

// Total usage time in seconds (across all sessions, today)
let totalUsage = getLS('totalUsage');

// Session usage time in seconds (since last break or session start)
let sessionUsage = getLS('sessionUsage');

// Timestamp (ms) when the current break started
let breakStartTimestamp = getLS('breakStartTimestamp');

// Shorts count (number of shorts watched)
let shortsCount = getLS('shortsCount');

// Timestamp (ms) of last reset (e.g., daily reset)
let lastResetTimestamp = getLS('lastResetTimestamp');

// Timestamp (ms) of last checked time for usage tracking
let lastCheckedTimestamp = getLS('lastCheckedTimestamp') || Date.now();
setLS('lastCheckedTimestamp', lastCheckedTimestamp);

// Break time in seconds (how long a break should last)
let breakTime = (60 * 15); // 15 minutes

// Maximum session time in seconds before a break is recommended
let maxSessionTime = (60 * 12); // 12 minutes

// How often (in number of alerts per session) to show session alert
let sessionAlertFrequency = 1;

// Interval (in ms) for checking time and showing alerts
let checkInterval = (1000 * 10); // 10 secs

let lastShortId = null;
let lastUrl = location.href;

// Track which milestones have been alerted for this session
let sessionMilestonesAlerted = getLSArray('sessionMilestonesAlerted');

// Helper to reset milestone alerts (call this on session reset)
function resetSessionMilestonesAlerted() {
    sessionMilestonesAlerted = [];
    setLSArray('sessionMilestonesAlerted', sessionMilestonesAlerted);
}

function resetData() {
    totalUsage = 0;
    sessionUsage = 0;
    breakStartTimestamp = 0;
    shortsCount = 0;
    lastResetTimestamp = Date.now();
    lastCheckedTimestamp = Date.now();

    setLS('totalUsage', totalUsage);
    setLS('sessionUsage', sessionUsage);
    setLS('breakStartTimestamp', breakStartTimestamp);
    setLS('shortsCount', shortsCount);
    setLS('lastResetTimestamp', lastResetTimestamp);
    setLS('lastCheckedTimestamp', lastCheckedTimestamp);

    // Also reset milestone alerts
    resetSessionMilestonesAlerted();
}

function addTime() {
    let prevChecked = getLS('lastCheckedTimestamp') || Date.now();
    let now = Date.now();
    let sessionTime = now - prevChecked;
    if (sessionTime > 0) {
        totalUsage += sessionTime / 1000;
        sessionUsage += sessionTime / 1000;
        // Sync updated values to localStorage
        setLS('totalUsage', totalUsage);
        setLS('sessionUsage', sessionUsage);
    }
    // Always update lastCheckedTimestamp
    lastCheckedTimestamp = now;
    setLS('lastCheckedTimestamp', lastCheckedTimestamp);

    console.log(`sessionUsage: ${sessionUsage/60} minutes, and totalUsage: ${totalUsage/60} minutes`)
}

function timeCheck() {
    // 1. Check for break enforcement as before
    if (sessionUsage > maxSessionTime) {
        if (breakStartTimestamp == 0) {
            breakStartTimestamp = Date.now();
            setLS('breakStartTimestamp', breakStartTimestamp);
            showOverlay(`⏰😱 إنت عدّيت الحد الأقصى للجلسة: ${Math.round(sessionUsage/60)} دقيقة، وإجمالي الاستخدام: ${Math.round(totalUsage/60)} دقيقة! 🚫🛑<br><br>يلا خدلك بريك على الأقل ${Math.round(breakTime/60)} دقيقة. 💤☕️ دماغك (وعينك 👀) محتاجين راحة!<br><br>ارجع تاني وانت فايق وكمل الفرجة على الهري ده 🤪🎬`);
        } else if (Date.now() - breakStartTimestamp > breakTime * 1000) {
            breakStartTimestamp = 0;
            sessionUsage = 0;
            setLS('breakStartTimestamp', breakStartTimestamp);
            setLS('sessionUsage', sessionUsage);
            // Reset milestone alerts for new session
            resetSessionMilestonesAlerted();
        } else {
            // Show a funny overlay indicating break time and block YouTube
            showOverlay(
                `😴⏳ <b>وقت البريك!</b> ⏳😴<br><br>
                اليوتيوب <span style="color: #ff0000; font-weight: bold;">مقفول</span> دلوقتي عشان مصلحتك!<br>
                <span style="font-size: 2em;">🚫📺</span><br>
                <i>حتى الخوارزمية محتاجة تنام أحياناً...</i><br><br>
                <span style="font-size: 0.9em; color: #aaa;">(هنرجعلك اليوتيوب بعد البريك، وعد!)</span>`
            );
        }
        return; // Don't show milestone alerts during enforced break
    }

    // 2. Check for milestone alerts
    // sessionAlertFrequency = N means N alerts per session, so N+1 milestones (including 0 and max)
    // But we want alerts at 1/N, 2/N, ..., N/N (not at 0)
    let milestones = [];
    for (let i = 1; i <= sessionAlertFrequency; i++) {
        milestones.push(i * maxSessionTime / (sessionAlertFrequency + 1));
    }
    // Example: maxSessionTime=720, sessionAlertFrequency=3 => milestones at 720/4, 720/2, 720*3/4

    // Find which milestone(s) have just been crossed and not alerted yet
    for (let idx = 0; idx < milestones.length; idx++) {
        let milestone = milestones[idx];
        let milestoneKey = `milestone_${idx + 1}`;
        if (
            sessionUsage >= milestone &&
            !sessionMilestonesAlerted.includes(milestoneKey)
        ) {
            // Mark as alerted
            sessionMilestonesAlerted.push(milestoneKey);
            setLSArray('sessionMilestonesAlerted', sessionMilestonesAlerted);

            // Show alert for this milestone
            let percent = Math.round(((idx + 1) / (sessionAlertFrequency + 1)) * 100);
            // For milestone overlays, make the buttons just close the overlay
            showOverlay(
                `⏰ <b>وصلت لمحطة جديدة!</b> <br><br>
                استخدمت <b>${Math.round(sessionUsage / 60)} دقيقة</b> من الجلسة.<br>
                (${percent}% من الحد الأقصى للجلسة)<br><br>
                خد بالك من نفسك وخد بريك كل شوية!`,
                // Both buttons just close the overlay
                () => {},
                closeCurrentPage 
            );
            // Only show one milestone alert per check
            break;
        }
    }
}

/**
 * @param {string} message - The large text to display in the overlay.
 * @param {function} onContinue - Function to call when "Continue" is clicked.
 * @param {function} onCancel - Function to call when "Cancel" is clicked.
 */
function showOverlay(message, onContinue = closeCurrentPage, onCancel = closeCurrentPage) {
    // Use a unique ID and class for the overlay to avoid selector collisions and false positives
    const OVERLAY_ID = 'timealert-js-overlay-unique-2024';
    const OVERLAY_CLASS = 'timealert-js-overlay-root-2024';

    // Check if an overlay already exists (by our unique ID)
    if (document.getElementById(OVERLAY_ID)) {
        // Overlay already present, ignore this call
        return;
    }

    console.log('showOverlay');
    // Store previous mute states for all audio/video elements
    const audios = Array.from(document.querySelectorAll('audio'));
    const videos = Array.from(document.querySelectorAll('video'));
    const prevAudioMuted = audios.map(a => a.muted);
    const prevVideoMuted = videos.map(v => v.muted);
    const prevVideoPaused = videos.map(v => v.paused);

    // Mute all audio elements
    audios.forEach(a => { a.muted = true; });
    // Mute and pause all video elements
    videos.forEach(v => {
        v.muted = true;
        if (!v.paused) v.pause();
    });

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.className = OVERLAY_CLASS;
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'linear-gradient(135deg, #232526 0%, #414345 100%)';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '9999';
    overlay.style.userSelect = 'none';

    // Block pointer/touch/keyboard events, but allow events on the buttons
    function blockEvent(e) {
        // Allow events to propagate if the event target is a button inside our overlay
        if (
            e.target === continueBtn ||
            e.target === cancelBtn ||
            (e.target.closest && (e.target.closest('.timealert-js-overlay-continue-btn-2024') || e.target.closest('.timealert-js-overlay-cancel-btn-2024')))
        ) {
            // Allow the event to go through
            return;
        }
        e.stopPropagation();
        e.preventDefault();
        return false;
    }

    // Create message
    const messageElem = document.createElement('div');
    messageElem.className = 'timealert-js-overlay-message-2024';
    messageElem.innerHTML = message;
    messageElem.style.color = 'white';
    messageElem.style.fontSize = '1.5rem';
    messageElem.style.fontWeight = 'bold';
    messageElem.style.textAlign = 'center';
    messageElem.style.marginBottom = '2rem';
    overlay.appendChild(messageElem);

    // Create buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'timealert-js-overlay-buttons-2024';
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.gap = '2rem';

    // Continue button
    const continueBtn = document.createElement('button');
    continueBtn.className = 'timealert-js-overlay-continue-btn-2024';
    continueBtn.textContent = 'Continue';
    continueBtn.style.fontSize = '1.5rem';
    continueBtn.style.padding = '0';
    continueBtn.style.margin = '0 1rem';
    continueBtn.style.border = 'none';
    continueBtn.style.borderRadius = '0';
    continueBtn.style.background = 'none';
    continueBtn.style.color = '#4cafef';
    continueBtn.style.cursor = 'pointer';
    continueBtn.style.textDecoration = 'underline';
    continueBtn.style.transition = 'box-shadow 0.15s';
    continueBtn.style.boxShadow = 'none';
    continueBtn.addEventListener('click', function() {
        cleanup();
        if (typeof onContinue === 'function') onContinue();
    });

    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'timealert-js-overlay-cancel-btn-2024';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.fontSize = '1.5rem';
    cancelBtn.style.padding = '0';
    cancelBtn.style.margin = '0 1rem';
    cancelBtn.style.border = 'none';
    cancelBtn.style.borderRadius = '0';
    cancelBtn.style.background = 'none';
    cancelBtn.style.color = '#f44336';
    cancelBtn.style.cursor = 'pointer';
    cancelBtn.style.textDecoration = 'underline';
    cancelBtn.style.transition = 'box-shadow 0.15s';
    cancelBtn.style.boxShadow = 'none';
    cancelBtn.addEventListener('click', function() {
        cleanup();
        if (typeof onCancel === 'function') onCancel();
    });

    // Append buttons
    buttonsContainer.appendChild(continueBtn);
    buttonsContainer.appendChild(cancelBtn);
    overlay.appendChild(buttonsContainer);

    // List of events to block
    const blockedEvents = [
        'click', 'mousedown', 'mouseup', 'mousemove', 'touchstart', 'touchend', 'touchmove',
        'keydown', 'keyup', 'keypress', 'wheel', 'scroll', 'pointerdown', 'pointerup', 'pointermove'
    ];
    blockedEvents.forEach(eventName => {
        overlay.addEventListener(eventName, blockEvent, true);
    });

    // Prevent tab navigation out of overlay
    overlay.setAttribute('tabindex', '0');
    overlay.focus();

    // Add overlay to body
    document.body.appendChild(overlay);

    // Trap focus inside overlay
    overlay.focus();
    document.activeElement.blur();
    setTimeout(() => overlay.focus(), 0);

    // Prevent scrolling on body
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Cleanup function to remove the overlay
    function cleanup() {
        // Remove overlay and event listeners
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        blockedEvents.forEach(eventName => {
            overlay.removeEventListener(eventName, blockEvent, true);
        });
        // Restore body scroll
        document.body.style.overflow = prevOverflow;
        // Restore audio mute states
        audios.forEach((a, i) => { a.muted = prevAudioMuted[i]; });
        // Restore video mute and paused states
        videos.forEach((v, i) => {
            v.muted = prevVideoMuted[i];
            if (!prevVideoPaused[i] && v.paused) v.play();
        });
        console.log('cleaned up')
    }
}

// Improved closeCurrentPage to avoid sandboxed about:blank script errors
function closeCurrentPage() {
    console.log('closing the current page')
    window.location.href = 'about:blank';
}

function intervalCheck() {
    addTime();
    timeCheck();
    const now = new Date();
    if (now.getHours() === 3 && (!lastResetTimestamp || new Date(lastResetTimestamp).getDate() !== now.getDate())) {
        resetData();
    }
}

setInterval(intervalCheck, checkInterval);
intervalCheck();
