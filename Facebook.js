const notAllowedPathes = ["/reel/"];

const isInAllowedPathes = path => !notAllowedPathes.some(p => path.includes(p));

const applyFilter = () => {
    if(!isInAllowedPathes(window.location.href) ){
        window.location = "https://ahmed-nehad.netlify.app";
        // window.location = "https://www.facebook.com/profile.php";
        if(typeof Interval === 'number') clearInterval(Interval);
    }
}

let Interval = undefined;
applyFilter()
Interval = setInterval(applyFilter, 200);
