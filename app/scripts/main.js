import {createCityLookup} from "./modules/native/lookup/cityLookup.js";
import {createPositionLookup} from "./modules/native/lookup/positionsLookup.js";
import {createLanguageLookup} from "./modules/native/lookup/languageLookup.js";
import {createDegreeLookup} from "./modules/native/lookup/degreeLookup.js";
import {initSearch} from "./modules/native/search.js";
import {saveSessionID, saveUserID} from "./modules/native/sessionID.js";
import {loadNavBar} from "./modules/native/navbar.js";
// import {extractData} from "./modules/native/tools.js";

// Look up tables for dropdown menus
// - Autocompletes what users type using these lists
let cityLookup;
let positionLookup;
let languageLookup;
let degreeLookup;

window.loadingStatus = false;
window.currentPage = 'search';

String.prototype.replaceAll = function(search, replacement) {
  var target = this;
  return target.replace(new RegExp(search, 'g'), replacement);
};

String.prototype.splice = function (idx, rem, str) {
  return this.slice(0, idx) + str + this.slice(idx + Math.abs(rem));
};

String.prototype.toProperCase = function () {
  return this.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

$.fn.extend({
  toggleText: function (a, b) {
    return this.text(this.text() == b ? a : b);
  }
});

document.addEventListener('DOMContentLoaded', createCityLookup().then(function (res) {
  cityLookup = res;
  positionLookup = createPositionLookup();
  languageLookup = createLanguageLookup();
  degreeLookup = createDegreeLookup();
  posthog.init('YOUR_POSTHOG_KEY', {api_host: 'https://app.posthog.com'});
  init();
}));

function init() {
  saveSessionID(); // Creates a unique ID the first time the user uses this app
  saveUserID();
  window.loadingStatus = false
  window.currentPage = 'search';
  $('.body-container').load('../../templates/components/search.html', function () { // Loads search in home page's body
    $("#positionSearch").on('keyup', function () { // Handles position search
      /*** Handles positions that aren't in our supported list ***/
      let input = $(this)[0].value;
      if (input.length >= 4) {
        let button = `<button type="button" class="dropdown-item custom-dropdown-item">
                          <span class="text-primary">${input}</span>
                      </button>`
        setTimeout(function () {
          $("#positionSearch").next().prepend(button);
          $("#positionSearch").next().addClass('show');
          $('.custom-dropdown-item').on('click', function () {
            $("#positionSearch").next().removeClass('show');
          })
        }, 10); // Waits for positions dropdown to appear and appends the custom position to it
      }
    });

    /*** COMMENTARY:
     * Job ads are collected and parsed in a manner which provides value for users.
     * Job ad boards and aggregators cannot afford specificity in job search because the opportunity cost
     * of a quick and snappy experience is too important to them.
     * We take a different approach - we utilize NLP to better match users to jobs by leveraging the job ad text and
     * data such as skills and position titles.
     ***/
    initSearch();
  });
  $('.header-container').load('../../templates/components/header.html'); // Loads the header content in home page
  loadNavBar(); // Provides interactivity to the navbar items (Job ads, Search, and Account)
}

export {
  cityLookup,
  positionLookup,
  languageLookup,
  degreeLookup
}