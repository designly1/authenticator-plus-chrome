(()=>{var t={422:(t,e,r)=>{var n;
/*
 * [hi-base32]{@link https://github.com/emn178/hi-base32}
 *
 * @version 0.5.0
 * @author Chen, Yi-Cyuan [emn178@gmail.com]
 * @copyright Chen, Yi-Cyuan 2015-2018
 * @license MIT
 */!function(){"use strict";var e="object"==typeof window?window:{};!e.HI_BASE32_NO_NODE_JS&&"object"==typeof process&&process.versions&&process.versions.node&&(e=r.g);var o=!e.HI_BASE32_NO_COMMON_JS&&t.exports,a=r.amdO,c="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567".split(""),i={A:0,B:1,C:2,D:3,E:4,F:5,G:6,H:7,I:8,J:9,K:10,L:11,M:12,N:13,O:14,P:15,Q:16,R:17,S:18,T:19,U:20,V:21,W:22,X:23,Y:24,Z:25,2:26,3:27,4:28,5:29,6:30,7:31},s=[0,0,0,0,0,0,0,0],l=function(t,e){e.length>10&&(e="..."+e.substr(-10));var r=new Error("Decoded data is not valid UTF-8. Maybe try base32.decode.asBytes()? Partial data after reading "+t+" bytes: "+e+" <-");throw r.position=t,r},d=function(t){if(""===t)return[];if(!/^[A-Z2-7=]+$/.test(t))throw new Error("Invalid base32 characters");for(var e,r,n,o,a,c,s,l,d=[],u=0,h=(t=t.replace(/=/g,"")).length,m=0,f=h>>3<<3;m<f;)e=i[t.charAt(m++)],r=i[t.charAt(m++)],n=i[t.charAt(m++)],o=i[t.charAt(m++)],a=i[t.charAt(m++)],c=i[t.charAt(m++)],s=i[t.charAt(m++)],l=i[t.charAt(m++)],d[u++]=255&(e<<3|r>>>2),d[u++]=255&(r<<6|n<<1|o>>>4),d[u++]=255&(o<<4|a>>>1),d[u++]=255&(a<<7|c<<2|s>>>3),d[u++]=255&(s<<5|l);var p=h-f;return 2===p?(e=i[t.charAt(m++)],r=i[t.charAt(m++)],d[u++]=255&(e<<3|r>>>2)):4===p?(e=i[t.charAt(m++)],r=i[t.charAt(m++)],n=i[t.charAt(m++)],o=i[t.charAt(m++)],d[u++]=255&(e<<3|r>>>2),d[u++]=255&(r<<6|n<<1|o>>>4)):5===p?(e=i[t.charAt(m++)],r=i[t.charAt(m++)],n=i[t.charAt(m++)],o=i[t.charAt(m++)],a=i[t.charAt(m++)],d[u++]=255&(e<<3|r>>>2),d[u++]=255&(r<<6|n<<1|o>>>4),d[u++]=255&(o<<4|a>>>1)):7===p&&(e=i[t.charAt(m++)],r=i[t.charAt(m++)],n=i[t.charAt(m++)],o=i[t.charAt(m++)],a=i[t.charAt(m++)],c=i[t.charAt(m++)],s=i[t.charAt(m++)],d[u++]=255&(e<<3|r>>>2),d[u++]=255&(r<<6|n<<1|o>>>4),d[u++]=255&(o<<4|a>>>1),d[u++]=255&(a<<7|c<<2|s>>>3)),d},u=function(t,e){if(!e)return function(t){for(var e,r,n="",o=t.length,a=0,c=0;a<o;)if((e=t[a++])<=127)n+=String.fromCharCode(e);else{e>191&&e<=223?(r=31&e,c=1):e<=239?(r=15&e,c=2):e<=247?(r=7&e,c=3):l(a,n);for(var i=0;i<c;++i)((e=t[a++])<128||e>191)&&l(a,n),r<<=6,r+=63&e;r>=55296&&r<=57343&&l(a,n),r>1114111&&l(a,n),r<=65535?n+=String.fromCharCode(r):(r-=65536,n+=String.fromCharCode(55296+(r>>10)),n+=String.fromCharCode(56320+(1023&r)))}return n}(d(t));if(""===t)return"";if(!/^[A-Z2-7=]+$/.test(t))throw new Error("Invalid base32 characters");var r,n,o,a,c,s,u,h,m="",f=t.indexOf("=");-1===f&&(f=t.length);for(var p=0,y=f>>3<<3;p<y;)r=i[t.charAt(p++)],n=i[t.charAt(p++)],o=i[t.charAt(p++)],a=i[t.charAt(p++)],c=i[t.charAt(p++)],s=i[t.charAt(p++)],u=i[t.charAt(p++)],h=i[t.charAt(p++)],m+=String.fromCharCode(255&(r<<3|n>>>2))+String.fromCharCode(255&(n<<6|o<<1|a>>>4))+String.fromCharCode(255&(a<<4|c>>>1))+String.fromCharCode(255&(c<<7|s<<2|u>>>3))+String.fromCharCode(255&(u<<5|h));var g=f-y;return 2===g?(r=i[t.charAt(p++)],n=i[t.charAt(p++)],m+=String.fromCharCode(255&(r<<3|n>>>2))):4===g?(r=i[t.charAt(p++)],n=i[t.charAt(p++)],o=i[t.charAt(p++)],a=i[t.charAt(p++)],m+=String.fromCharCode(255&(r<<3|n>>>2))+String.fromCharCode(255&(n<<6|o<<1|a>>>4))):5===g?(r=i[t.charAt(p++)],n=i[t.charAt(p++)],o=i[t.charAt(p++)],a=i[t.charAt(p++)],c=i[t.charAt(p++)],m+=String.fromCharCode(255&(r<<3|n>>>2))+String.fromCharCode(255&(n<<6|o<<1|a>>>4))+String.fromCharCode(255&(a<<4|c>>>1))):7===g&&(r=i[t.charAt(p++)],n=i[t.charAt(p++)],o=i[t.charAt(p++)],a=i[t.charAt(p++)],c=i[t.charAt(p++)],s=i[t.charAt(p++)],u=i[t.charAt(p++)],m+=String.fromCharCode(255&(r<<3|n>>>2))+String.fromCharCode(255&(n<<6|o<<1|a>>>4))+String.fromCharCode(255&(a<<4|c>>>1))+String.fromCharCode(255&(c<<7|s<<2|u>>>3))),m},h={encode:function(t,e){var r="string"!=typeof t;return r&&t.constructor===ArrayBuffer&&(t=new Uint8Array(t)),r?function(t){for(var e,r,n,o,a,i="",s=t.length,l=0,d=5*parseInt(s/5);l<d;)e=t[l++],r=t[l++],n=t[l++],o=t[l++],a=t[l++],i+=c[e>>>3]+c[31&(e<<2|r>>>6)]+c[r>>>1&31]+c[31&(r<<4|n>>>4)]+c[31&(n<<1|o>>>7)]+c[o>>>2&31]+c[31&(o<<3|a>>>5)]+c[31&a];var u=s-d;return 1===u?(e=t[l],i+=c[e>>>3]+c[e<<2&31]+"======"):2===u?(e=t[l++],r=t[l],i+=c[e>>>3]+c[31&(e<<2|r>>>6)]+c[r>>>1&31]+c[r<<4&31]+"===="):3===u?(e=t[l++],r=t[l++],n=t[l],i+=c[e>>>3]+c[31&(e<<2|r>>>6)]+c[r>>>1&31]+c[31&(r<<4|n>>>4)]+c[n<<1&31]+"==="):4===u&&(e=t[l++],r=t[l++],n=t[l++],o=t[l],i+=c[e>>>3]+c[31&(e<<2|r>>>6)]+c[r>>>1&31]+c[31&(r<<4|n>>>4)]+c[31&(n<<1|o>>>7)]+c[o>>>2&31]+c[o<<3&31]+"="),i}(t):e?function(t){for(var e,r,n,o,a,i="",s=t.length,l=0,d=5*parseInt(s/5);l<d;)e=t.charCodeAt(l++),r=t.charCodeAt(l++),n=t.charCodeAt(l++),o=t.charCodeAt(l++),a=t.charCodeAt(l++),i+=c[e>>>3]+c[31&(e<<2|r>>>6)]+c[r>>>1&31]+c[31&(r<<4|n>>>4)]+c[31&(n<<1|o>>>7)]+c[o>>>2&31]+c[31&(o<<3|a>>>5)]+c[31&a];var u=s-d;return 1===u?(e=t.charCodeAt(l),i+=c[e>>>3]+c[e<<2&31]+"======"):2===u?(e=t.charCodeAt(l++),r=t.charCodeAt(l),i+=c[e>>>3]+c[31&(e<<2|r>>>6)]+c[r>>>1&31]+c[r<<4&31]+"===="):3===u?(e=t.charCodeAt(l++),r=t.charCodeAt(l++),n=t.charCodeAt(l),i+=c[e>>>3]+c[31&(e<<2|r>>>6)]+c[r>>>1&31]+c[31&(r<<4|n>>>4)]+c[n<<1&31]+"==="):4===u&&(e=t.charCodeAt(l++),r=t.charCodeAt(l++),n=t.charCodeAt(l++),o=t.charCodeAt(l),i+=c[e>>>3]+c[31&(e<<2|r>>>6)]+c[r>>>1&31]+c[31&(r<<4|n>>>4)]+c[31&(n<<1|o>>>7)]+c[o>>>2&31]+c[o<<3&31]+"="),i}(t):function(t){var e,r,n,o,a,i,l,d=!1,u="",h=0,m=0,f=t.length;if(""===t)return u;do{for(s[0]=s[5],s[1]=s[6],s[2]=s[7],l=m;h<f&&l<5;++h)(i=t.charCodeAt(h))<128?s[l++]=i:i<2048?(s[l++]=192|i>>6,s[l++]=128|63&i):i<55296||i>=57344?(s[l++]=224|i>>12,s[l++]=128|i>>6&63,s[l++]=128|63&i):(i=65536+((1023&i)<<10|1023&t.charCodeAt(++h)),s[l++]=240|i>>18,s[l++]=128|i>>12&63,s[l++]=128|i>>6&63,s[l++]=128|63&i);m=l-5,h===f&&++h,h>f&&l<6&&(d=!0),e=s[0],l>4?(r=s[1],n=s[2],o=s[3],a=s[4],u+=c[e>>>3]+c[31&(e<<2|r>>>6)]+c[r>>>1&31]+c[31&(r<<4|n>>>4)]+c[31&(n<<1|o>>>7)]+c[o>>>2&31]+c[31&(o<<3|a>>>5)]+c[31&a]):1===l?u+=c[e>>>3]+c[e<<2&31]+"======":2===l?(r=s[1],u+=c[e>>>3]+c[31&(e<<2|r>>>6)]+c[r>>>1&31]+c[r<<4&31]+"===="):3===l?(r=s[1],n=s[2],u+=c[e>>>3]+c[31&(e<<2|r>>>6)]+c[r>>>1&31]+c[31&(r<<4|n>>>4)]+c[n<<1&31]+"==="):(r=s[1],n=s[2],o=s[3],u+=c[e>>>3]+c[31&(e<<2|r>>>6)]+c[r>>>1&31]+c[31&(r<<4|n>>>4)]+c[31&(n<<1|o>>>7)]+c[o>>>2&31]+c[o<<3&31]+"=")}while(!d);return u}(t)},decode:u};u.asBytes=d,o?t.exports=h:(e.base32=h,a&&(void 0===(n=function(){return h}.call(h,r,h,t))||(t.exports=n)))}()}},e={};function r(n){var o=e[n];if(void 0!==o)return o.exports;var a=e[n]={exports:{}};return t[n](a,a.exports,r),a.exports}r.amdO={},r.n=t=>{var e=t&&t.__esModule?()=>t.default:()=>t;return r.d(e,{a:e}),e},r.d=(t,e)=>{for(var n in e)r.o(e,n)&&!r.o(t,n)&&Object.defineProperty(t,n,{enumerable:!0,get:e[n]})},r.g=function(){if("object"==typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(t){if("object"==typeof window)return window}}(),r.o=(t,e)=>Object.prototype.hasOwnProperty.call(t,e),(()=>{"use strict";function t(t){let r={};t:for(;!i(t);){let o=h(t);switch(o>>>3){case 0:break t;case 1:{let n=e(t);r.secret=l(t,t.limit-t.offset),t.limit=n;break}case 2:{let e=h(t);r.name=d(t,e);break}case 3:{let e=h(t);r.issuer=d(t,e);break}default:n(t,7&o)}}return r}function e(t){let e=h(t),r=t.limit;return t.limit=t.offset+e,r}function n(t,e){switch(e){case 0:for(;128&u(t););break;case 2:c(t,h(t));break;case 5:c(t,4);break;case 1:c(t,8);break;default:throw new Error("Unimplemented type: "+e)}}let o=new Float32Array(1),a=(new Uint8Array(o.buffer),new Float64Array(1));function c(t,e){if(t.offset+e>t.limit)throw new Error("Skip past limit");t.offset+=e}function i(t){return t.offset>=t.limit}function s(t,e){let r=t.offset;if(r+e>t.limit)throw new Error("Read past limit");return t.offset+=e,r}function l(t,e){let r=s(t,e);return t.bytes.subarray(r,r+e)}function d(t,e){let r=s(t,e),n=String.fromCharCode,o=t.bytes,a="�",c="";for(let t=0;t<e;t++){let i,s,l,d,u=o[t+r];128&u?192==(224&u)?t+1>=e?c+=a:(i=o[t+r+1],128!=(192&i)?c+=a:(d=(31&u)<<6|63&i,d<128?c+=a:(c+=n(d),t++))):224==(240&u)?t+2>=e?c+=a:(i=o[t+r+1],s=o[t+r+2],32896!=(49344&(i|s<<8))?c+=a:(d=(15&u)<<12|(63&i)<<6|63&s,d<2048||d>=55296&&d<=57343?c+=a:(c+=n(d),t+=2))):240==(248&u)?t+3>=e?c+=a:(i=o[t+r+1],s=o[t+r+2],l=o[t+r+3],8421504!=(12632256&(i|s<<8|l<<16))?c+=a:(d=(7&u)<<18|(63&i)<<12|(63&s)<<6|63&l,d<65536||d>1114111?c+=a:(d-=65536,c+=n(55296+(d>>10),56320+(1023&d)),t+=3))):c+=a:c+=n(u)}return c}function u(t){return t.bytes[s(t,1)]}function h(t){let e,r=0,n=0;do{e=u(t),r<32&&(n|=(127&e)<<r),r+=7}while(128&e);return n}new Uint8Array(a.buffer);var m=r(422),f=r.n(m);async function p(){return null!==await async function(){return new Promise(((t,e)=>{chrome.storage.local.get(["encryptionPassword"],(e=>{const r=e.encryptionPassword;t(r||null)}))}))}()}async function y(){return new Promise(((t,e)=>{chrome.storage.local.get(["encryptionPassword"],(async r=>{const n=r.encryptionPassword;if(!n){const t="No password found in local storage. Please set your encryption password in options.";return e(new Error(t)),void alert(t)}const o=await crypto.subtle.importKey("raw",(new TextEncoder).encode(n),{name:"PBKDF2"},!1,["deriveKey"]),a=new Uint8Array([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]),c=await crypto.subtle.deriveKey({name:"PBKDF2",salt:a,iterations:1e5,hash:"SHA-256"},o,{name:"AES-GCM",length:256},!0,["encrypt","decrypt"]);t(c)}))}))}async function g(t,e){const r=await y(),n=new Uint8Array(e),o=await crypto.subtle.decrypt({name:"AES-GCM",iv:n},r,t),a=(new TextDecoder).decode(o);try{return JSON.parse(a)}catch(t){return a}}function A(t){const e=atob(t),r=new Uint8Array(e.length);for(let t=0;t<e.length;t++)r[t]=e.charCodeAt(t);return r.buffer}async function w(t,e){if(!t||void 0===e)throw new Error("Invalid key or value");const{encrypted:r,iv:n}=await async function(t){const e=await y(),r=crypto.getRandomValues(new Uint8Array(12)),n="object"==typeof t?JSON.stringify(t):String(t),o=(new TextEncoder).encode(n);return{encrypted:await crypto.subtle.encrypt({name:"AES-GCM",iv:r},e,o),iv:Array.from(r)}}(e);if(!r||!n)throw new Error("Failed to encrypt data");const o=function(t){const e=String.fromCharCode(...new Uint8Array(t));return btoa(e)}(r);return new Promise(((e,r)=>{const a={encrypted:o,iv:n};chrome.storage.sync.set({[t]:a},(()=>{chrome.runtime.lastError?r(new Error(chrome.runtime.lastError.message)):e()}))}))}async function C(){return new Promise(((t,e)=>{chrome.storage.sync.get(null,(async r=>{if(chrome.runtime.lastError)return void e(new Error(chrome.runtime.lastError.message));const n={};for(const[t,e]of Object.entries(r))if(e&&e.encrypted&&e.iv)try{const r=A(e.encrypted),o=await g(r,e.iv);n[t]=o}catch(e){n[t]=null}else n[t]=e;t(n)}))}))}async function v(r){try{const a=function(t){const e=decodeURIComponent(t),r=atob(e),n=new Uint8Array(r.length);for(let t=0;t<r.length;t++)n[t]=r.charCodeAt(t);return n}(r);return(function(r){let o={};t:for(;!i(r);){let a=h(r);switch(a>>>3){case 0:break t;case 1:{let n=e(r);(o.otpParameters||(o.otpParameters=[])).push(t(r)),r.limit=n;break}default:n(r,7&a)}}return o}({bytes:o=a,offset:0,limit:o.length}).otpParameters||[]).map((t=>({secret:f().encode(t.secret).replace(/=+$/,""),name:t.name,issuer:t.issuer})))}catch(t){return[]}var o}function E(t=4){let e="";for(let r=0;r<t;r++)e+="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".charAt(Math.floor(62*Math.random()));return e}function b(t){return t?t.replace(/[^a-z0-9]/gi,""):""}const S=document.getElementById("accounts"),P=document.getElementById("add-camera"),I=document.getElementById("marquee"),L=document.getElementById("no-accounts"),F=document.getElementById("account-added-modal");let k=[],M=!1;const O=new Html5Qrcode("qr-reader");function x(t){const e=document.getElementById("error-modal");document.getElementById("error-message").textContent=t,t?e.classList.add("show"):e.classList.remove("show")}function B(){x("")}function U(){S.classList.add("show")}function $(t){if(!t||"string"!=typeof t)return"Invalid Secret";const e=otplib.authenticator;return e.options={step:30},e.generate(t)}const T=new Map;function _(t){const e=document.getElementById("account-template").content.cloneNode(!0),r=document.createElement("div");return r.appendChild(e),{container:r,nameEl:r.querySelector(".account-item-details-name"),issuerEl:r.querySelector(".account-item-details-issuer"),totpEl:r.querySelector(".account-item-details-totp"),pathEl:r.querySelector(".pie-sector"),copiedEl:r.querySelector(".account-item-is-copied"),currentAngle:360}}function q(){const t=document.getElementById("locked-template").content.cloneNode(!0),e=document.createElement("div");return e.appendChild(t),{container:e}}function R(t){t.animationFrame&&cancelAnimationFrame(t.animationFrame),t.animationFrame=requestAnimationFrame((function e(){const r=function(t,e,r,n,o){const a=Math.PI/180*-90,c=Math.PI/180*(o-90),i=o-0<=180?0:1;return`M50,50 L${50+r*Math.cos(a)},${50+r*Math.sin(a)} A45,45 0 ${i},1 ${50+r*Math.cos(c)},${50+r*Math.sin(c)} Z`}(0,0,45,0,360*(1-Date.now()/1e3%30/30));t.pathEl.setAttribute("d",r),t.animationFrame=requestAnimationFrame(e)}))}async function N(){const t=await C();k=Object.values(t)||[]}async function j(){0===k.length&&await N(),L.classList.toggle("hidden",k.length>0);const t=new Set,e=new Set;for(let r=0;r<k.length;r++){const n=k[r];n?t.add(n.secret):e.add(`locked-account-${r}`)}for(const[r,n]of T)r.startsWith("locked-account-")?e.has(r)||(n.container.remove(),T.delete(r)):t.has(r)||(n.container.remove(),n.animationFrame&&cancelAnimationFrame(n.animationFrame),T.delete(r));for(let t=0;t<k.length;t++){const e=k[t];if(!e){const e=`locked-account-${t}`;if(!T.has(e)){const t=q();T.set(e,t),S.appendChild(t.container)}continue}let r=T.get(e.secret);r||(r=_(),T.set(e.secret,r),S.appendChild(r.container),R(r)),r.nameEl.textContent=e.name,r.issuerEl.textContent=e.issuer;const n=$(e.secret);r.totpEl.textContent=n,r.totpEl.parentElement.parentElement.addEventListener("click",(()=>{navigator.clipboard.writeText(n).then((()=>{r.copiedEl.classList.remove("hidden"),setTimeout((()=>{r.copiedEl.classList.add("hidden")}),500)}),(()=>{x("Failed to copy TOTP code to clipboard")}))})),Date.now()/1e3%30/30*30>25?r.totpEl.classList.add("expiring"):r.totpEl.classList.remove("expiring")}}P.addEventListener("click",(async()=>{if(B(),S.classList.remove("show"),await p()){if(M)return O.stop(),M=!1,P.classList.remove("active"),void U();M=!0,P.classList.add("active"),O.start({facingMode:"user"},{fps:10,qrbox:{width:250,height:250}},(async t=>{const e=await async function(t){try{if(t.startsWith("otpauth://totp/")){const e=new URL(t).searchParams,r=e.get("secret"),n=decodeURIComponent(t.split("otpauth://totp/")[1].split("?")[0]);let o,a=e.get("issuer")||void 0;const c=n.split(":");if(2===c.length){const[t,e]=c;o=e.trim(),a&&t!==a||(a=t.trim())}else o=n.trim();return[{secret:r,name:o,issuer:a}]}if(t.startsWith("otpauth-migration://")){const e=new URL(t).searchParams.get("data");return e?await v(e):[]}return[]}catch(t){return console.error("Error parsing URL:",t),[]}}(t);if(e.length>0){B();const t=await async function(t){const e=[],r=await C();for(const n of t){const t=b(n.issuer)||E(),o=`account_${t}_${b(n.name)}`;if(Object.values(r).find((t=>t.secret===n.secret)))e.push(n);else try{await w(o,n),console.log(`Account ${n.name} (${t}) saved successfully.`)}catch(e){console.error(`Failed to save account ${n.name} (${t}):`,e.message)}}return!(e.length>0)||`The following accounts already exist:\n${e.map((t=>`${t.name} (${t.issuer||"No Issuer"})`)).join("\n")}`}(e);"string"==typeof t&&x(t),async function(){await N(),j()}()}O.stop(),U(),M=!1,P.classList.remove("active"),F.classList.add("show"),setTimeout((()=>{F.classList.remove("show")}),1e3)})).catch((t=>{M=!1,P.classList.remove("active"),"string"==typeof t&&t.includes("Permission")?x("Permission to access camera is required. Please request permission in options."):x("Failed to start camera.")}))}else x("Please set a password in the options page.")})),I.addEventListener("click",(async t=>{t.stopPropagation(),B(),await p()?chrome.tabs.query({active:!0,currentWindow:!0},(t=>{0!==t.length&&(t[0].url.startsWith("chrome://")?x("Cannot capture QR code on chrome:// pages."):chrome.runtime.sendMessage({type:"TRIG_CAPTURE_QR_CODE"},(t=>{if(chrome.runtime.lastError)return console.error(chrome.runtime.lastError),void x("Failed to communicate with background script");window.close()})))})):x("Please set a password in the options page.")})),document.getElementById("close-error").addEventListener("click",(()=>{B()})),document.getElementById("options-btn").addEventListener("click",(()=>{chrome.runtime.openOptionsPage()})),j(),setInterval(j,1e3),B()})()})();
//# sourceMappingURL=popup.bundle.js.map