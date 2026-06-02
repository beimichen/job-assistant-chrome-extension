import {
  jobAdsHeaderHandler,
  loadJobAdBody,
  resetHeaderLogo,
  showProgress,
  JobAdIngester,
  jobAdResultPageQueue, jobAdQueueManager
} from "./jobads.js";
import {storage} from "./storage.js";
import {findSourceOfAd, extractAdIDFromURL, getDataOfAds, randDelay, findBatchesOfUncachedUrls} from "./tools.js";
import {tagin} from "../third_party/tagin.min.js";
import {IndeedAdParser} from "./ad_parsers/indeed.js";
import {cityLookup, positionLookup} from "../../main.js";
import {INDEED_PER_PAGE_LIMIT} from "./ad_parsers/settings/settings.js";
import {INDEED_LIMIT, IndeedParser} from "./ad_parsers/indeed_new.js";
import {JORA_LIMIT, JoraParser} from "./ad_parsers/jora.js";
import {CAREERJET_LIMIT, CareerjetParser} from "./ad_parsers/careerjet.js";
import {GLASSDOOR_LIMIT, GlassDoorParser} from "./ad_parsers/glassdoor.js";
import {ZIPRECRUITER_LIMIT, ZipRecruiterParser} from "./ad_parsers/ziprecruiter.js";
import {SIMPLYHIRED_LIMIT, SimplyhiredParser} from "./ad_parsers/simplyhired.js";

export function loadSearchBody() {
  $('.body-container').load('../../templates/components/search.html', function () {
    $('.navbar-home').removeClass('active');
    $('.navbar-account').removeClass('active');
    $('.header-center').find('h5').text('Search');
    let el = document.getElementById('skillsSearch');
    tagin(el);
    resetHeaderLogo();
    $('#locationSearch').autocomplete({
      source: cityLookup['cities'],
      select: function (event, ui) {
        $('.dropdown-menu').val(ui.item.term);
        $(this).data('uiItem', ui.item.value);
      }
    }).bind('blur', function () {
      $(this).val($(this).data('uiItem'));
    });
    $('#positionSearch').autocomplete({
      source: positionLookup[0]
    });
    initSearch();
    let jobDataBody = $(document).find('.job-ads');
    jobDataBody.append('<div class="jobs-none"><p>Searching for jobs...</p></div>');
  });
}

export function initSearch(){
  $('#job-search').on('click', function () { // When search button is clicked on
    // Grabs all the input values
    let position = $('#positionSearch').val();
    let location = $('#locationSearch').val();
    let skills = [];
    let resume = null;
    // Takes the tagin tag's text and pushes it to an Array
    $('.search-skills-input').find('.tagin-wrapper').find('span').each(function () {
      let skill = $(this).text();
      if (skill !== '') {
        skills.push(skill);
      }
    });
    // Handles situation when users don't provide a position or/and location
    if (!position || !location) {
      alert('Please search with position and location.');
      posthog.capture('tried_job_search_no_location');
    } else {
      searchJobAds(location, position, skills, resume).then(function(){
        jobAdsHeaderHandler(false);
      }) // NEW
      // searchForJobs(position, location, skills); // OLD
    }
  });
}

export async function searchJobAds(city, position, skills, resume) { // NEW
  posthog.capture('ran_job_search', {position: position, location: city, skills: skills});
  localStorage.clear();
  loadJobAdBody('Search for jobs...');
  window.loadingStatus = true;

  let cancelled = false;

  $('.header-center').prepend('<button class="stop-search-btn">Stop</button>');

  $('.stop-search-btn').on('click', function(){
    $(this).remove();
    $('#circle').addClass('hide');
    window.loadingStatus = false;
    cancelled = true;
    // throw {reason:'cancelled'};
  });

  setTimeout(function() {
    alert("Please don't close the JobAssistant chrome app while searching for jobs. Allow 5-20 seconds for jobs to start appearing. Thanks!");
  },20);

  let limit = Math.max(INDEED_LIMIT,JORA_LIMIT,CAREERJET_LIMIT,GLASSDOOR_LIMIT,ZIPRECRUITER_LIMIT, SIMPLYHIRED_LIMIT);

  let indeed = new IndeedParser(city, position, skills, resume);
  let ziprecruiter = new ZipRecruiterParser(city, position, skills, resume);
  let jora = new JoraParser(city, position, skills, resume);
  let careerjet = new CareerjetParser(city, position, skills, resume);
  let simplyhired = new SimplyhiredParser(city, position, skills, resume);
  let glassdoor = new GlassDoorParser(city, position, skills, resume);

  for (let i=0;i<=limit;i++) {
    if (cancelled) {
      break;
    }
    let pageNumber = i + 1;
    if (pageNumber > GLASSDOOR_LIMIT) {
      glassdoor = null;
    }
    if (pageNumber > INDEED_LIMIT) {
      indeed = null;
    }
    if (pageNumber > ZIPRECRUITER_LIMIT) {
      ziprecruiter = null;
    }
    if (pageNumber > JORA_LIMIT) {
      jora = null;
    }
    if (pageNumber > CAREERJET_LIMIT) {
      careerjet = null;
    }
    if (pageNumber > SIMPLYHIRED_LIMIT) {
      simplyhired = null;
    }
    // let jobAdQueue = {};
    let jobAds = await jobAdResultPageQueue([indeed, ziprecruiter, jora, careerjet, simplyhired, glassdoor],
      pageNumber);
    let largestNumberOfAds = Math.max(jobAds['indeed'].length, jobAds['jora'].length,jobAds['ziprecruiter'].length,
      jobAds['simplyhired'].length, jobAds['careerjet'].length, jobAds['glassdoor'].length);
    console.log('LARGEST NUMBER OF ADS:');
    console.log(largestNumberOfAds);
    if (jobAds['indeed'].length <= largestNumberOfAds) {
      // let overflow = [];
      let difference = largestNumberOfAds - jobAds['indeed'].length;
      if (difference > 0) {
        for (let k=0; k < difference; k++) {
          // overflow.push(null);
          jobAds['indeed'].push(null);
        }
      }
      // jobAdQueue['indeed'] = jobAds['indeed'].concat(overflow);
    }
    if (jobAds['jora'].length <= largestNumberOfAds) {
      // let overflow = [];
      let difference = largestNumberOfAds - jobAds['jora'].length;
      if (difference > 0) {
        for (let k = 0; k < difference; k++) {
          // overflow.push(null);
          jobAds['jora'].push(null);
        }
      }
      // jobAdQueue['jora'] = jobAds['jora'].concat(overflow);
    }
    if (jobAds['ziprecruiter'].length <= largestNumberOfAds) {
      // let overflow = [];
      let difference = largestNumberOfAds - jobAds['ziprecruiter'].length;
      if (difference > 0) {
        for (let k = 0; k < difference; k++) {
          // overflow.push(null);
          jobAds['ziprecruiter'].push(null);
        }
      }
      // jobAdQueue['ziprecruiter'] = jobAds['ziprecruiter'].concat(overflow);
    }
    if (jobAds['simplyhired'].length <= largestNumberOfAds) {
      // let overflow = [];
      let difference = largestNumberOfAds - jobAds['simplyhired'].length;
      if (difference > 0) {
        for (let k = 0; k < difference; k++) {
          // overflow.push(null);
          jobAds['simplyhired'].push(null);
        }
      }
      // jobAdQueue['simplyhired'] = jobAds['simplyhired'].concat(overflow);
    }
    if (jobAds['careerjet'].length <= largestNumberOfAds) {
      // let overflow = [];
      let difference = largestNumberOfAds - jobAds['careerjet'].length;
      if (difference > 0) {
        for (let k=0; k< difference; k++) {
          // overflow.push(null);
          jobAds['careerjet'].push(null);
        }
      }
      // jobAdQueue['careerjet'] = jobAds['careerjet'].concat(overflow);
    }
    if (jobAds['glassdoor'].length <= largestNumberOfAds) {
      // let overflow = [];
      let difference = largestNumberOfAds - jobAds['glassdoor'].length;
      if (difference > 0) {
        for (let k = 0; k < difference; k++) {
          // overflow.push(null);
          jobAds['glassdoor'].push(null);
        }
      }
      // jobAdQueue['glassdoor'] = jobAds['glassdoor'].concat(overflow);
    }
    // console.log('JOB ADS:');
    // console.log(jobAds);
    for (let j=0;j<largestNumberOfAds;j++) {
      let min;
      let max;
      if (j === 0 && i === 0) {
        min = 1;
        max = 3;
      } else {
        min = 2;
        max = 8;
      }
      let randNum = Math.random() * (max - min + 1) + min;
      let indeedAds = jobAds['indeed'][j];
      let joraAds = jobAds['jora'][j];
      let simplyhiredAds = jobAds['simplyhired'][j];
      let ziprecruiterAds = jobAds['ziprecruiter'][j];
      let careerjetAds = jobAds['careerjet'][j];
      let glassdoorAds = jobAds['glassdoor'][j];
      await randDelay(randNum);
      if (cancelled) {
        break;
      }
      let parsedAds = await jobAdQueueManager([indeedAds,joraAds,simplyhiredAds,ziprecruiterAds,careerjetAds,glassdoorAds]);
      if (parsedAds) {
        if (window.currentPage === 'job ads') {
          loadJobAdBody('loading'); // message passed in > 'loading'
          jobAdsHeaderHandler(true);
        }
      }
    }
  }
  loadingStatus = false;
}

export function searchForJobs(position, location, skills) {  // NOTE: OLD

  localStorage.clear(); // every search clears the memory
  let total;
  let resume = null; // TODO: add resume support
  // At this moment, we currently only support Indeed job search.
  // We do this by using search query
  // JobAdIngestor takes in the search inputs and initiates multiple sources
  // of search concurrently and returns parsed data from our backend API.
  // Eg. Search from Indeed, Linkedin, Simplyhired concurrently etc.
  let jobAd = new JobAdIngester(null, position, resume, location, skills, cityLookup['resolver']);
  let searchSites = jobAd.getSearchJobSites(); // Returns supported search sites depending on the location input
  if (searchSites['indeed']) {
    // Loads job ad html content including the the message which is passed in as an argument
    loadJobAdBody('Search for jobs...');
    // Indeed ads are parsed using our backend API - this provides in-depth analysis using NLP to see if the user's
    // skills among other data match the job ad text.
    let indeedAdInstance = new IndeedAdParser(null, searchSites['indeed'], position, location, skills);
    async function loadAds() {
      // Loads in the results concurrently, 5 at a time.
      let resultPageUrls = await getResultPages(indeedAdInstance);
      if (resultPageUrls !== 'ERROR') {
        for (let i = 0; i < resultPageUrls.length; i++) {
          let resultPageData = await getResultPageData(indeedAdInstance, await resultPageUrls[i], i);
          if (resultPageData !== 'ERROR') {
            let summaries = resultPageData.summaries;
            let requirements = resultPageData.requirements;
            let batchSize;
            if (i === 0) {
              batchSize = 5;
            } else {
              batchSize = 10;
            }
            // Cached urls means urls that already have data - they exist in our aws s3 bucket or local memory
            // In the event the a url is cached, it will fetch from the local memory or the s3 bucket depending
            // on where the data exists.
            // Batches are results from search queries - the size of each batch is 5 or 10
            let uncachedUrlsBatches = await findBatchesOfUncachedUrls(resultPageData['urls'], await resultPageData['filenames'], jobAd, batchSize);
            total = resultPageUrls.length * INDEED_PER_PAGE_LIMIT // total is the actual number of ads from search pages
            for (let j = 0; j < uncachedUrlsBatches.length; j++) {
              let min;
              let max;
              if (j === 0 && i === 0) {
                min = 1;
                max = 3;
              } else if (i === 0 && j !== 0) {
                min = 2;
                max = 6;
              } else {
                min = 3;
                max = 9;
              }
              let randNum = Math.random() * (max - min + 1) + min;
              if (uncachedUrlsBatches[j].length) {
                let uncachedUrls = uncachedUrlsBatches[j];
                let metadata = await getMetaDataOfAds(jobAd, uncachedUrls, summaries, requirements, randNum);
                for (let k = 0; k < metadata['html'].length; k++) {
                  // metadata['html'] is a list of html elements
                  let html = metadata['html'][k];
                  let filename = metadata['filenames'][k];
                  let url = metadata['urls'][k];
                  let source = metadata['source'][k];
                  let summary
                  // Not all ads have summaries
                  if (typeof metadata['summaries'][k] === 'undefined') {
                    summary = null;
                  } else {
                    summary = metadata['summaries'][k];
                  }
                  let requirements = metadata['requirements'][k];
                  // ParseAd parses the html of the ad and matches the user to its text using our backend API
                  let data = await parseAd(source, html, url, position, resume, summary, requirements, skills, filename, jobAd, indeedAdInstance);
                  if (await data) {
                    loadJobAdBody('loading'); // message passed in > 'loading'
                  }
                  if (i === resultPageUrls.length - 1 && k === metadata['html'].length - 1) {
                    jobAdsHeaderHandler(false); // loading state is false or true - passed into this fn
                  } else {
                    jobAdsHeaderHandler(true); // loading state is false or true - passed into this fn
                  }
                }
                showProgress();
                if (i === resultPageUrls.length - 1 && j === uncachedUrlsBatches[j].length - 1) { // TODO: fix progress - stuck at 90 percent
                  // The last iteration of the result page urls
                  // false means it's finished loading
                  jobAdsHeaderHandler(false);
                } else {
                  // true means it's still loading
                  jobAdsHeaderHandler(true);
                }
              } else {
                showProgress();
                if (i === resultPageUrls.length - 1) {
                  // The last iteration of the result page urls
                  // false means it's finished loading
                  jobAdsHeaderHandler(false);
                } else {
                  // true means it's still loading
                  jobAdsHeaderHandler(true, total);
                }
              }
            }
          } else {
            // When there is an error parsing the data from the result page url
            jobAdsHeaderHandler(false);
          }
        }
      } else {
        // When there is an error for the result page url being processed
        jobAdsHeaderHandler(false);
      }
    }
    // Initiates the async fn
    loadAds().then(function () {
      // Finished loading
      jobAdsHeaderHandler(false);
    })
  }
}

export function getResultPages(instance) {
  return new Promise(
    resolve => instance.extractIndeedPaginatedSearchResults().then(function (response) {
      if (response === 'ERROR' || response === 'TRIGGERED' || response === 'TIMEOUT') {
        $('.header-right').find('#circle').removeClass('show').addClass('hide');
        $('#filter-results').addClass('hide');
        resolve('ERROR');
        // loadJobAdBody('Searching for jobs...');
        alert('Please try again later. JobAssistant is experiencing problems searching for the ads right now.');
      } else if (response) {
        resolve(response);
      }
    })
  )
}

export function getResultPageData(instance, searchPageResultUrl, iteration) {
  return new Promise(
    resolve => instance.extractAdUrlsFromResultPage(searchPageResultUrl).then(function (response) {
      let metadata = {
        urls: [],
        filenames: [],
        summaries: [],
        requirements: []
      }
      if (response !== 'ERROR' && response !== 'TRIGGERED' && response !== 'TIMEOUT') {
        let min;
        let max;
        for (let j = 0; j < response.length; j++) {
          let url = response[j][0];
          let source = findSourceOfAd(url);
          let filename = extractAdIDFromURL(url, source) + '.json';
          metadata.urls.push(url)
          metadata.filenames.push(filename);
          metadata.summaries.push(response[j][1]['summaries']);
          metadata.requirements.push(response[j][1]['requirements']);
        }
        if (iteration === 0) {
          min = 1;
          max = 3;
        } else {
          min = 2;
          max = 5;
        }
        let randNum = Math.random() * (max - min + 1) + min;
        randDelay(randNum).then(function () {
          resolve(metadata);
        });
      } else {
        alert('Please try again later. JobAssistant is experiencing problems searching for the ads right now.');
        resolve('ERROR');
      }
    })
  );
}

export function getMetaDataOfAds(jobAd, uncachedUrls, summaries, requirements, randNum) {
  return new Promise(
    resolve => getDataOfAds(uncachedUrls).then(function (response) {
      if (response) {
        randDelay(randNum).then(function () {
          let metadata = {
            html: [],
            urls: [],
            source: [],
            filenames: [],
            summaries: [],
            requirements: []
          }
          for (let k = 0; k < response.length; k++) {
            if (response[k] !== '' && response[k] !== null && typeof response[k] !== 'undefined') {
              metadata['html'].push(response[k]);
              metadata['urls'].push(uncachedUrls[k]);
              let source = findSourceOfAd(uncachedUrls[k]);
              metadata['source'].push(source);
              metadata['filenames'].push(extractAdIDFromURL(uncachedUrls[k], source) + '.json');
              metadata['summaries'].push(summaries[k]);
              metadata['requirements'].push(requirements[k]);
            }
            resolve(metadata);
          }
        });
      } else {
        console.log('ERROR resolving metadata');
      }
    })
  )
}

export async function parseAd(source, html, url, position, resume, summary, requirements, skills, filename, jobAd, instance) {
  return new Promise(
    resolve => jobAd.parseAdData(source, html, url, position, resume, summary, requirements, skills, filename, instance)
      .then(function (data) {
        let publicData = data['public'];
        let privateData = data['private'];
        // Backend returns a ad data and stores it locally
        storage.jobAds.storeAdLocally(publicData['hash_id'], filename, publicData);
        // Backend returns a cover letter template and stores it locally
        // data includes match score
        storage.coverletter.storeCoverLetterLocally(publicData['hash_id'], filename, privateData);
        resolve(data);
      })
  )
}
