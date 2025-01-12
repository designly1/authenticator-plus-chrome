(()=>{"use strict";let e,t=0;function s(e){const t=document.querySelector(".password-feedback"),s=document.querySelector("#password-score"),r=e.score;s.value=r,t.classList.forEach((e=>{e.startsWith("score-")&&t.classList.remove(e)})),t.classList.add(`score-${r}`),document.querySelector("#strength-text").textContent=["Weak","Fair","Good","Strong","Very Strong"][r],document.querySelector(".strength-bar-fill").style.width=r/4*100+"%";const n=document.querySelector(".strength-icon");r>=3?(n.innerHTML='\n            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>\n            <polyline points="22 4 12 14.01 9 11.01"></polyline>\n        ',n.setAttribute("stroke","#16a34a")):(n.innerHTML='\n            <circle cx="12" cy="12" r="10"></circle>\n            <line x1="15" y1="9" x2="9" y2="15"></line>\n            <line x1="9" y1="9" x2="15" y2="15"></line>\n        ',n.setAttribute("stroke","#dc2626")),document.querySelector(".crack-time-text").innerHTML=`Your password would take <strong>${e.crack_times_display.online_throttling_100_per_hour}</strong> to crack.`;const o=document.querySelector(".suggestions"),c=e.feedback.suggestions||[],a=e.feedback.warning;if(a||c.length>0){let e="<strong>Suggestions:</strong><ul>";a&&(e+=`<li>${a}</li>`),c.forEach((t=>{e+=`<li>${t}</li>`})),e+="</ul>",o.innerHTML=e,o.classList.add("has-suggestions")}else o.classList.remove("has-suggestions")}function r(e){const t=document.querySelector(".password-feedback");e?t.classList.add("loading"):t.classList.remove("loading")}function n(n){clearTimeout(e),n?e=setTimeout((async()=>{const e=++t;r(!0);try{const r=await fetch("https://wsr-pw-strength-worker.wsrapp.workers.dev",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:n})});if(e!==t)return;if(!r.ok)throw new Error("Failed to check password strength");s(await r.json())}catch(e){console.error("Error checking password strength:",e),s({score:0,crack_times_display:{offline_fast_hashing_1e10_per_second:"Error"},feedback:{suggestions:["Try again"],warning:"Failed to check password strength"}})}finally{e===t&&r(!1)}}),500):s({score:0,crack_times_display:{offline_fast_hashing_1e10_per_second:"instantly"},feedback:{suggestions:["Enter a password"],warning:null}})}document.addEventListener("DOMContentLoaded",(()=>{const e=document.querySelector("#password");e&&(e.addEventListener("input",(e=>{n(e.target.value)})),n(""))}))})();
//# sourceMappingURL=password-meter.bundle.js.map