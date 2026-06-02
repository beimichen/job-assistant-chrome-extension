import {tagin} from "../third_party/tagin.min.js";

initTagin(document.getElementById('skillsSearch'));
// initTagin(document.getElementById('skillsResume'));
// initTagin(document.getElementById('toolsResume'));

function initTagin(el) {
  tagin(el);
}

export {initTagin}