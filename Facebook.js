// social_filter.js
// Combined content filter for Facebook and YouTube

(function() {
    // --- Site Detection ---
    const hostname = window.location.hostname;
    if (hostname.includes('facebook.com')) {
        runFacebookFilter();
    } else if (hostname.includes('youtube.com')) {
        runYouTubeFilter();
    }

    // --- Facebook Logic ---
    function runFacebookFilter() {
        // List of allowed Facebook path substrings
        const allowedPaths = [
            'profile',
            'groups/',
            'stories/',
            '/photo',
            '/posts/',
            '/videos/',
            '/messages/t/',
            '/share/'
        ];
        // List of forbidden Facebook path substrings
        const forbiddenPaths = [
            '/watch',
            '/reels',
            '/reel'
        ];
        /**
         * Checks if the given path is allowed (contains any allowed substring and no forbidden substring).
         * @param {string} path
         * @returns {boolean}
         */
        function isAllowedPath(path) {
            return allowedPaths.some(p => path.includes(p)) && !forbiddenPaths.some(p => path.includes(p));
        }
        /**
         * Determines if the user is logged in by checking for login-related elements.
         * @returns {boolean}
         */
        function isUserLoggedIn() {
            const hasLoginForm = !!document.querySelector('form[action*="login"]');
            const hasLoginInputs = !!document.querySelector('input[name="email"]') && !!document.querySelector('input[name="pass"]');
            const hasLoginButton = !!document.querySelector('button[name="login"]');
            const hasCreateAccountButton = !!document.querySelector('div[data-testid="open-registration-form-button"]');
            // If any login elements are present, user is not logged in
            return !(hasLoginForm || hasLoginInputs || hasLoginButton || hasCreateAccountButton);
        }
        /**
         * Main logic to filter and redirect Facebook navigation.
         */
        function applyFacebookFilter() {
            const url = window.location.href.split('?')[0];
            // Redirect if on a forbidden path
            if (forbiddenPaths.some(p => url.includes(p))) {
                const tempTextArea = document.createElement("textarea");
                tempTextArea.value = document.URL;
                document.body.appendChild(tempTextArea);
                tempTextArea.select();
                try {
                  document.execCommand('copy');
                  window.location = 'https://en1.savefrom.net/9-how-to-download-facebook-video-6CY.html';
                //   console.log('Text copied to clipboard successfully!');
                } catch (err) {
                    navigator.clipboard.writeText(document.URL).finally(() => {
                        window.location = 'https://en1.savefrom.net/9-how-to-download-facebook-video-6CY.html';
                    });
                //   console.error('Failed to copy text: ', err);
                } finally {
                  document.body.removeChild(tempTextArea);
                  return;
                }
            }
            // Prevent infinite redirect loop if already on profile page
            if (url.includes('profile.php')) {
                return;
            }
            // Skip redirect if not logged in
            if (!isUserLoggedIn()) {
                console.log('User not logged in, skipping redirect');
                return;
            }
            // If not on a user profile and not in allowed paths, redirect to profile
            const isUserProfile = /facebook\.com\/[^\/]+\/?$/.test(url);
            if (!isUserProfile && !isAllowedPath(url)) {
                window.location = 'https://www.facebook.com/profile.php';
            }
        }
        function setupFacebookFilter() {
            setTimeout(applyFacebookFilter, 1000);
            setInterval(applyFacebookFilter, 2000);
        }
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            setupFacebookFilter();
        } else {
            document.addEventListener('DOMContentLoaded', setupFacebookFilter);
        }
    }

    // --- YouTube Logic ---
    function runYouTubeFilter() {
        // List of allowed YouTube path substrings
        const allowedPaths = [
            'search',
            'playlist',
            '/@',
            '/c/',
            'watch',
            // 'history',
            '/embed/',
            '/feed/subscriptions',
            '/feed/library'
        ];
        function isAllowedPath(path) {
            return allowedPaths.some(p => path.includes(p));
        }
        function getVideowallEndscreen() {
            return Array.from(document.querySelectorAll('.videowall-endscreen, #secondary > *'));
        }
        function getForYouSections() {
            return Array.from(document.querySelectorAll('ytd-reel-shelf-renderer:has(span[id="title"]), #dismissible:has(span[id="title"]), ytd-watch-next-secondary-results-renderer'));
        }
        function simulateKeypadPress(num) {
            if (num < 0 || num > 9 || !Number.isInteger(num)) {
                console.error('Invalid keypad number: must be an integer between 0-9');
                return;
            }
            const numpadKeyCodes = {
                0: 96, 1: 97, 2: 98, 3: 99, 4: 100, 5: 101, 6: 102, 7: 103, 8: 104, 9: 105
            };
            const keyEvent = new KeyboardEvent('keydown', {
                key: String(num),
                code: `Numpad${num}`,
                keyCode: numpadKeyCodes[num],
                which: numpadKeyCodes[num],
                location: KeyboardEvent.DOM_KEY_LOCATION_NUMPAD,
                bubbles: true,
                cancelable: true
            });
            document.dispatchEvent(keyEvent);
            const keyUpEvent = new KeyboardEvent('keyup', {
                key: String(num),
                code: `Numpad${num}`,
                keyCode: numpadKeyCodes[num],
                which: numpadKeyCodes[num],
                location: KeyboardEvent.DOM_KEY_LOCATION_NUMPAD,
                bubbles: true,
                cancelable: true
            });
            document.dispatchEvent(keyUpEvent);
        }
        function addTriggerButtonToPage(num = 1) {
            if (num < 0 || num > 9 || !Number.isInteger(num)) {
                console.error('Invalid keypad number: must be an integer between 0-9');
                return;
            }
            if (document.getElementById(`skipBtnMy${num}`)) {
                return document.getElementById(`skipBtnMy${num}`);
            }
            const button = document.createElement('button');
            button.style.position = 'fixed';
            button.style.bottom = '20px';
            button.style.right = '20px';
            button.style.zIndex = '9999';
            button.id = `skipBtnMy${num}`;
            button.addEventListener('click', () => simulateKeypadPress(num));
            document.body.appendChild(button);
            return button;
        }
        function applyYouTubeFilter() {
            if (!isAllowedPath(window.location.href)) {
                window.location = 'https://www.youtube.com/results?search_query=';
                if (typeof ytInterval === 'number') clearInterval(ytInterval);
            } else if (document.URL.includes('watch')) {
                getVideowallEndscreen().forEach(wall => wall.remove());
                if (document.querySelector('.ytp-ad-player-overlay-layout') && !document.getElementById('skipBtnMy7')) {
                    if (document.readyState === 'loading') {
                        document.addEventListener('DOMContentLoaded', () => {
                            const myButton = addTriggerButtonToPage(7);
                            setTimeout(() => {
                                myButton.click();
                                setTimeout(() => myButton.remove(), 2000);
                            }, 500);
                        });
                    } else {
                        const myButton = addTriggerButtonToPage(7);
                        setTimeout(() => {
                            myButton.click();
                            setTimeout(() => myButton.remove(), 2000);
                        }, 500);
                    }
                }
            } else if (document.URL.includes('search')) {
                getForYouSections().forEach(section => section.remove());
            } else if (document.URL.includes('library')) {
                Array.from(document.querySelectorAll('#contents')).forEach(d => d.remove());
                Array.from(document.querySelectorAll('.tab-content')).forEach(d => d.remove());
            }
        }
        let ytInterval;
        applyYouTubeFilter();
        ytInterval = setInterval(applyYouTubeFilter, 200);
    }
})(); 
