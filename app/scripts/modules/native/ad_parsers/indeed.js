import {createHashId} from "../../third_party/hash.js";
import {findBaseUrl, extractData} from "../tools.js";
import {createCoverLetter} from "../coverletter.js";
import {
  INDEED_REQUEST_LIMIT,
  INDEED_PAGES_LIMIT,
  INDEED_PER_PAGE_LIMIT,
  INDEED
} from "./settings/settings.js";

class IndeedAdParser {
  constructor(adText, url, searchTerm, location, skills) {
    this.adText = adText;
    this.url = url;
    this.skills = skills;
    this.searchTerm = searchTerm; // TODO: US has comma between country and state while AU version doesn't
    this.location = location;
    this.request_limit = INDEED_REQUEST_LIMIT; // TODO: turn into API - user limitations (premium)
    this.pages_limit = INDEED_PAGES_LIMIT; // TODO: turns into API - user limitations (premium)
    this.request_counter = 0;
    if (url) {
      this.baseUrl = findBaseUrl(url);
    } else {
      this.baseUrl = '';
    }
  }

  compileSearchUrl() {
    let baseUrl = this.baseUrl + '/jobs?';
    let position = 'q=' + this.searchTerm.trim().replaceAll(' ', '+');
    let location = '&l=' + this.location.replaceAll(' ', '+');
    let age = '&fromage=' + '14'; // 14 days old
    let limit = '&limit=' + INDEED_PER_PAGE_LIMIT.toString();
    let radius = '&radius=' + '50'; // 50km
    return baseUrl + position + location + age + limit + radius
  }

  findAdsPaginationLimit(baseSearchUrl) {
    let testLimit = '&start=1000'
    let url = baseSearchUrl + testLimit
    let instance = this;
    return new Promise((resolve, reject) => {
      $.when(extractData(url)).done(function (response) {
        if (response === 'TIMEOUT' || response === 'ERROR' || response === 'TRIGGERED') {
          resolve('ERROR');
        } else if (response !== '' && response !== null && typeof response !== 'undefined') {
          let liElements = $(response).find(INDEED.multi_job_page.pagination).children();
          let lastLiIndex = $(liElements).length - 1;
          let lastLiItemText = $(liElements).children().eq(lastLiIndex).text();
          if (Number(lastLiItemText) > instance.pages_limit) {
            resolve(instance.pages_limit);
          } else if (Number(lastLiItemText) < instance.pages_limit) {
            resolve(Number(lastLiItemText))
          } else if (isNaN(Number(lastLiItemText))) {
            resolve(instance.pages_limit)
          } else {
            resolve(instance.pages_limit)
          }
        }
      })
    })
  }

  extractAdUrlsFromResultPage(url) {
    let instance = this;
    return new Promise((resolve, reject) => {
      let urls = [];
      let hrefs = [];
      let allSummaries = []
      let allRequirements = [];
      $.when(extractData(url)).done(
        function (response) {
          if (response) {
            if (response === 'TIMEOUT' || response === 'ERROR' || response === 'TRIGGERED') {
              resolve('ERROR')
            } else {
              $(response).find(INDEED.multi_job_page.job_ad_hrefs).each(function () {
                let href = $(this).attr('href');
                let summaryList = [];
                let requirements = [];
                $(this).closest(INDEED.multi_job_page.job_ad_summary.parent).find(INDEED.multi_job_page.job_ad_summary.child).find('li').each(function () {
                  if (typeof $(this).text() !== 'undefined') {
                    summaryList.push($(this).text());
                  }
                });
                $(this).closest(INDEED.multi_job_page.job_ad_requirements.parent).find(INDEED.multi_job_page.job_ad_requirements.child).each(function () {
                  requirements.push($(this).text());
                });
                if (href.includes(instance.baseUrl)) {
                  href = href.replace(instance.baseUrl, '');
                  // href sometimes has the baseurl - delete baseurl for consistency
                }
                allSummaries.push(summaryList);
                if (requirements !== []) {
                  allRequirements.push(requirements);
                } else {
                  allRequirements.push(null);
                }
                hrefs.push(href);
              })
              for (let i = 0; i < hrefs.length; i++) {
                // builds the full url of every job found on the page
                urls.push([instance.baseUrl + hrefs[i], {
                  summaries: allSummaries[i],
                  requirements: allRequirements[i]
                }]);
              }
              resolve(urls)
            }
          }
        }
      );
    })
  }

  parseIndeedAd(html, url, position, resume, summary, requirements, skills, filename) {
    // TEST: https://au.indeed.com/viewjob?jk=56b1899b9ae16c1b&fccid=630ea73968ed2530&vjs=3&tk=1f58np4af3ecu000&from=serp&vjs=3
    return new Promise((resolve, reject) => {
      let timePosted = conditionallyExtractDatePosted(html);
      let jobAdData = {
        user_id: null, // pass in the user model here
        source: url, // Universal - unique identifier used for searching s3 for body text
        source_logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRfcgTlZ6hSGT-uIZ01Qwztc1qc6pWGVWKlTg&usqp=CAU',
        hash_id: '', // Universal
        job_title: conditionallyExtractPositionTitle(html), // Universal
        summary: summary, // Universal summary = [li element, li element]
        requirements: requirements, // Universal
        company: conditionallyExtractCompanyName(html), // Universal
        location: conditionallyExtractLocation(html), // Universal
        company_logo: conditionallyExtractCompanyLogo(html), // Universal
        salary: conditionallyExtractSalary(html), // Universal
        time_posted: timePosted, // Universal
        calculated_date_of_time_posted: calculateTimePosted(timePosted), //Universal
        employment_type: conditionallyExtractEmploymentType(html), // Universal
        description: conditionallyExtractJobDesc(html), // Universal
        apply_btn_url: null, // Universal
        external_apply_url: conditionallyExtractExternalApplyUrl(html), // Universal
        extracted_skills: [], // Universal
        sponsered: null, //  Universal
        matched_skills: [], // Personal - decouple from ad model
        match_score: null, // Personal - decouple from ad model
        visited: false, // Personal - decouple from ad model
        apply_clicked: false, // Personal - decouple from ad model
        read: false, // Personal - decouple from ad model
        recommended: false, // Personal - decouple from ad model
        favourite: false, // Personal - decouple from ad model
        cover_letter: '', // Personal - decouple from ad model
        cover_letter_html: '',
        hiring_manager: '',
        filename: filename
      }
      jobAdData['hash_id'] = createHashId(jobAdData['description']);
      let apply_btn_html = conditionalyExtractInternalApplyUrl(html);
      if (apply_btn_html) {
        let hlAndCoElementURL = $(html).find(INDEED.single_job_page.indeed_apply_btn.attributes.co).find('a').attr('href');
        // console.log('hlAndCoElement');
        // console.log(hlAndCoElement);
        if (!hlAndCoElementURL) {
          hlAndCoElementURL = $(html).find('a.gnav-AccountMenuLinks-link').attr('href');
        }
        let iframeSrcContainingIAUID = $(html).find(INDEED.single_job_page.indeed_apply_btn.attributes.iaUid).attr('src');
        let iaUid = null;
        if (iframeSrcContainingIAUID) {
          iaUid = iframeSrcContainingIAUID.split('iaUid%22:%22')[1].split('%22,%22parentURL')[0];
        }
        jobAdData.apply_btn_url = parseIndeedApplyBtn(apply_btn_html, hlAndCoElementURL, url, iaUid);
      }
      // let jobAdHTML = $.parseHTML(jobAdData['description']);
      // let jobAdText = $(jobAdHTML).text();
      $.when(createCoverLetter(jobAdData['job_title'], jobAdData, resume, skills)).done(
        function (response) {
          let coverLetterData = response;
          console.log('Cover letter data:');
          console.log(coverLetterData);
          jobAdData.cover_letter = coverLetterData['coverletter_text'];
          jobAdData.cover_letter_html = coverLetterData['coverletter_html_full_styling'];
          jobAdData.extracted_skills = coverLetterData['skills_extracted_from_ad']
          jobAdData.matched_skills = coverLetterData['matched_skills'];
          jobAdData.match_score = coverLetterData['match_score'];
          jobAdData.topics_of_interest_extracted_from_ad = coverLetterData['topics_of_interest_extracted_from_ad'];
          jobAdData.raw_job_title = coverLetterData['raw_job_title'];
          jobAdData.reconciled_job_title = coverLetterData['reconciled_job_title'];
          jobAdData.position_inserted = coverLetterData['position_inserted'];
          resolve(jobAdData);
        }
      ).fail(
        function (err) {
          console.log(err);
          resolve(jobAdData);
        }
      )
    })
  }

  extractPaginationUrlsUpToLastPage(limit, baseSearchUrl) {
    let pageNumbers = [];
    for (let i = 0; i < limit; i++) {
      if (i !== 0) {
        pageNumbers.push((i * 10).toString())
      }
    }
    let urlsUpToMax = [];
    for (let i = 0; i < pageNumbers.length; i++) {
      let url = baseSearchUrl + '&start=' + (pageNumbers[i].toString());
      urlsUpToMax.push(url);
    }
    urlsUpToMax.unshift(baseSearchUrl);
    return urlsUpToMax
  }

  extractIndeedPaginatedSearchResults() {
    let instance = this;
    let baseSearchUrl = this.compileSearchUrl();
    return new Promise((resolve, reject) => {
      this.findAdsPaginationLimit(baseSearchUrl).then(
        function (response) {
          if (response === 'ERROR' || response === 'TRIGGERED') {
            resolve('ERROR');
          } else if (response) {
            let allPaginationUrls = instance.extractPaginationUrlsUpToLastPage(response, baseSearchUrl);
            resolve(allPaginationUrls)
          }
        }
      )
    })
  }
}

function getCurrentDateInMilliSec() {
  let date = new Date();
  return date.getTime()
}

function conditionallyExtractCompanyName(html) {
  let company;
  if ($(html).find('.company').length > 0) {
    company = $(html).find('company').text();
  } else {
    company = $(html).find(INDEED.single_job_page.company.parent).children().eq(INDEED.single_job_page.company.child.index).text()
  }
  return company
}

function conditionallyExtractPositionTitle(html) {
  let position;
  if ($(html).find('.jobtitle').length > 0) {
    position = $(html).find('.jobtitle').text();
  } else {
    position = $(html).find(INDEED.single_job_page.job_title).text()
  }
  return position
}

function conditionallyExtractCompanyLogo(html) {
  let company;
  if ($(html).find('.cmp_logo_img').length > 0) {
    company = $(html).find('.cmp_logo_img').attr('src')
  } else {
    company = $(html).find(INDEED.single_job_page.company_logo).attr('src');
  }
  return company
}

function conditionallyExtractJobDesc(html) {
  let desc;
  if ($(html).find('#job_summary').length > 0) {
    desc = $(html).find('#job_summary').html();
  } else {
    desc = $(html).find(INDEED.single_job_page.description).html();
  }
  return desc
}

function conditionallyExtractEmploymentType(html) {
  let employmentType = null;
  let container = $(html).find('.jobsearch-DesktopStickyContainer');
  let container2 = $(html).find('.jobsearch-JobMetadataHeader-item');
  let container3 = $(html).find('.jobsearch-JobDescriptionSection-sectionItemKey');
  if ($(html).find('.no-wrap').length > 0) {
    if ($(html).find('.no-wrap').text().includes('Temporarily remote')) {
      employmentType = 'Temporarily remote';
    } else if ($(html).find('.no-wrap').text().includes('Remote')) {
      employmentType = 'Remote';
    } else if ($(html).find('.no-wrap').text().includes('Contract')) {
      employmentType = 'Contract';
    } else if ($(html).find('.no-wrap').text().includes('Casual')) {
      employmentType = 'Casual';
    } else if ($(html).find('.no-wrap').text().includes('Part-time')) {
      employmentType = 'Part-time';
    } else if ($(html).find('.no-wrap').text().includes('Full-time')) {
      employmentType = 'Full-time';
    }
  } else if ($(html).find('#job_summary').length > 0) {
    let jobSummaryElements = $(html).find('#job_summary');
    for (let i = 0; i < jobSummaryElements.length; i++) {
      let jobSummaryElementText = $(jobSummaryElements[i]).text();
      if (jobSummaryElementText.includes('Job Type:')) {
        employmentType = jobSummaryElementText.replace('Job Type:', '')
      } else if (jobSummaryElementText.includes('Job Types:')) {
        employmentType = jobSummaryElementText.replace('Job Types:', '')
      }
    }
  } else if (container.length > 0) {
    if ($(container).text().includes('Temporarily remote')) {
      employmentType = 'Temporarily remote'
    } else if ($(container).text().includes('Remote')) {
      employmentType = 'Remote'
    } else if ($(container).text().includes('Contract')) {
      employmentType = 'Contract'
    } else if ($(container).text().includes('Casual')) {
      employmentType = 'Casual'
    } else if ($(container).text().includes('Part-time')) {
      employmentType = 'Part-time'
    } else if ($(container).text().includes('Full-time')) {
      employmentType = 'Full-time, Permanent'
    } else if ($(container).text().includes('Permanent')) {
      employmentType = 'Permanent'
    }
  } else if (container2.length > 0) {
    if ($(container2).text().includes('Temporarily remote')) {
      employmentType = 'Temporarily remote'
    } else if ($(container2).text().includes('Remote')) {
      employmentType = 'Remote'
    } else if ($(container2).text().includes('Contract')) {
      employmentType = 'Contract'
    } else if ($(container2).text().includes('Casual')) {
      employmentType = 'Casual'
    } else if ($(container2).text().includes('Part-time')) {
      employmentType = 'Part-time'
    } else if ($(container2).text().includes('Full-time')) {
      employmentType = 'Full-time, Permanent'
    } else if ($(container2).text().includes('Permanent')) {
      employmentType = 'Permanent'
    }
  } else if (container3.length > 0) {
    let possibleElements = $(html).find('.jobsearch-JobDescriptionSection-sectionItemKey');
    for (let i = 0; i < possibleElements.length; i++) {
      if ($(possibleElements[i]).text() === 'Job Type') {
        employmentType = $(possibleElements[i]).next().text();
      }
    }
  }
  if (employmentType) {
    if (employmentType.includes(' - ')) {
      return employmentType.replace(' - ', '')
    }
  }
  console.log('Employment type:');
  console.log(employmentType);
  return employmentType
}

function conditionallyExtractSalary(html) {
  let salary;
  if ($(html).find('span.salaryText').lenght > 0) {
    salary = $(html).find('span.salaryText').text();
  } else if ($(html).find('#job_summary').length > 0) {
    let salaryElements = $(html).find('#job_summary');
    for (let i = 0; i < salaryElements.length; i++) {
      let salaryElementText = $(salaryElements[i]).text();
      if (salaryElementText.includes('Salary:')) {
        salary = salaryElementText.replace('Salary:', '')
      } else if (salaryElementText.includes('Pay:')) {
        salary = salaryElementText.replace('Pay:', '')
      }
    }
  } else if ($(html).find('.jobsearch-JobDescriptionSection-sectionItemKey').length > 0) {
    let possibleElements = $(html).find('.jobsearch-JobDescriptionSection-sectionItemKey');
    for (let i = 0; i < possibleElements.length; i++) {
      if ($(possibleElements[i]).text() === 'Salary') {
        salary = $(possibleElements[i]).next().text();
      }
    }
  } else if ($(html).find(INDEED.single_job_page.salary.parent).children().eq(INDEED.single_job_page.salary.child.index).text().includes('$')) {
    salary = $(html).find(INDEED.single_job_page.salary.parent).children().eq(INDEED.single_job_page.salary.child.index).text();
  } else {
    salary = null;
  }
  return salary
}

function conditionallyExtractDatePosted(html) {
  let date;
  if ($(html).find('.date').length > 0) {
    date = $(html).find('.date').text();
    if (date.includes(' - ')) {
      date = date.replace(' - ', '')
    }
  } else {
    let dateElements = $(html).find(INDEED.single_job_page.time_posted.parent).children();
    if ($(dateElements).length > 0) {
      for (let i = 0; i < dateElements.length; i++) {
        let dateElementText = $(dateElements[i]).text();
        if (dateElementText.includes('Just posted')) {
          date = 'Just posted';
        } else if (dateElementText.includes('Today')) {
          date = 'Today';
        } else if (dateElementText.includes('30+')) {
          date = '31 days ago';
        } else if (dateElementText.includes('days ago')) {
          date = dateElementText;
        } else if (dateElementText.includes('day ago')) {
          date = dateElementText;
        }
      }
      if (date.includes(' - ')) {
        date = date.replace(' - ', '')
      }
    } else {
      let spans = $(html).find('span');
      for (let i = 0; i < spans.length; i++) {
        if ($(spans[i]).text().includes(' days ago')) {
          date = $(spans[i]).text();
          if (date.includes(' - ')) {
            date = date.replace(' - ', '')
          }
        }
      }
    }
    console.log('days ago text from job ad: ' + date)
    return date
  }
}

function conditionallyExtractLocation(html) {
  let location;
  if ($(html).find('.location').length > 0) {
    location = $(html).find('.location').text();
  } else if ($(html).find('.jobsearch-JobDescriptionSection-sectionItemKey').length > 0) {
    location = $(html).find(INDEED.single_job_page.location.parent).next().text();
  } else if ($(html).find(INDEED.single_job_page.location.parent).children().length === 3) {
    location = $(html).find(INDEED.single_job_page.location.parent).children().eq(INDEED.single_job_page.location.child.index).text();
  } else if ($(html).find(INDEED.single_job_page.location.parent).children().length === 2) {
    location = $(html).find(INDEED.single_job_page.location.parent).next().text();
  } else if ($(html).find(INDEED.single_job_page.location.parent).children().length === 1) {
    location = $(html).find(INDEED.single_job_page.location.parent).next().text();
  } else {
    location = null
  }
  return location
}

function conditionalyExtractInternalApplyUrl(html) {
  let internalApplyBtn;
  if ($(html).find(INDEED.single_job_page.indeed_apply_btn.parent)) {
    internalApplyBtn = $(html).find(INDEED.single_job_page.indeed_apply_btn.parent).children().eq(INDEED.single_job_page.indeed_apply_btn.child.index).prop('outerHTML');
  } else if ($(html).find('.indeed-apply-button').length > 0) {
    internalApplyBtn = $(html).find('.indeed-apply-button').attr('href');
  } else {
    internalApplyBtn = null
  }
  return internalApplyBtn
}

function conditionallyExtractExternalApplyUrl(html) {
  let externalApplyBtn;
  if ($(html).find('.view-apply-button').length > 0) {
    externalApplyBtn = $(html).find('.view-apply-button').text();
  } else {
    externalApplyBtn = $(html).find(INDEED.single_job_page.external_apply_btn).find('a').attr('href');
  }
  return externalApplyBtn
}

function generateIndeedUid(str) {
  // iaUid is an unique identifier that's 16 chars long
  // iaUid first half and last 3 characters has the same chars as 'tk' but the chars from index 8 to 13 are different
  let randId = '';
  let chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let idLength = 6;
  let charsLength = chars.length;
  for (let i = 0; i < idLength; i++) {
    randId += chars.charAt(Math.floor(Math.random() * charsLength));
  }
  // https://gdc.indeed.com/conv/orgIndApp?co=AU&vjtk=1eru2s2phriup800&jk=9eef4ecbea99d731&mvj=0&acct_key=a5be0ff314bf4f3a&sj=1&vjfrom=web&advn=466436596812529&adid=362785890&ad=-6NYlbfkN0CGsh2galCL8Aa8EV1kDWwvYqkTWJCqWwzQ_tBDHiaYWutRWorpuGwQ0u8nD5sOiUXsr0twhhvqORRpP9kAcZ_YwyWItQY497Geu7_qHH6-VYUmVwH6IP-Frv6m5SekAkyHpCj_pa_ha8wjvVD70w0a9p66muRjIZS5jkvBBVzZmN7bDBj5oFbJG4jzDcxgozHVbMbNYOgf86k0tQ9XF5O3TB2yLXQomfvUbkYRDUB5FbNEpaS7DbGvXJE6Lf268y9Zt1OMriYNPGdOhIBLyqNMmU0Ji5zzRj3lSaMpd5dResYNRfZ-Pnh8&astse=80b7b5a9113b7246&assa=465
  str = str.split('vjtk=')[1].split('&jk')[0];
  return str.slice(0, 7) + randId + str.slice(13,);
}

function extractIndeedHLAttribute(str) {
  return str.split('?hl=')[1].split('&')[0];
}

function extractIndeedCOAttribute(str) {
  return str.split('&co=')[1].split('&')[0];
}

function parseIndeedApplyBtn(btnHtml, coAndHlURL, url, iaUid) {
  // let el = document.createElement('html');
  // el.innerHTML = '<html><head><title>Indeed Apply Now Button</title></head><body>' + btnHtml + '</body></html>';
  // let html = el.innerHTML;
  if (btnHtml.includes('<span')) {
    let btnData;
    let btn = btnHtml;

    if ($(btn).length) {
      console.log('Button found')

      let pingBackUrl = $(btn).data(INDEED.single_job_page.indeed_apply_btn.attributes.pingbackUrl)

      if (!iaUid) {
        iaUid = generateIndeedUid(pingBackUrl); //generate iaUid if we can't find the iaUid
      }


      let hl;
      let co;
      if (coAndHlURL) {
        hl = extractIndeedHLAttribute(coAndHlURL);
        co = extractIndeedCOAttribute(coAndHlURL);
      } else {
        hl = '';
        co = '';
      }

      btnData = {
        jobUrl: $(btn).data(INDEED.single_job_page.indeed_apply_btn.attributes.jobUrl),
        postUrl: $(btn).data(INDEED.single_job_page.indeed_apply_btn.attributes.postUrl),
        continueUrl: $(btn).data(INDEED.single_job_page.indeed_apply_btn.attributes.continueUrl),
        questions: $(btn).data(INDEED.single_job_page.indeed_apply_btn.attributes.questions),
        phone: 'optional',
        coverletter: 'OPTIONAL',
        jobId: $(btn).data(INDEED.single_job_page.indeed_apply_btn.attributes.jobId),
        jk: $(btn).data(INDEED.single_job_page.indeed_apply_btn.attributes.jk),
        jobTitle: $(btn).data(INDEED.single_job_page.indeed_apply_btn.attributes.jobTitle),
        jobCompany: $(btn).data(INDEED.single_job_page.indeed_apply_btn.attributes.jobCompany),
        jobLocation: $(btn).data(INDEED.single_job_page.indeed_apply_btn.attributes.jobLocation),
        apiToken: $(btn).data(INDEED.single_job_page.indeed_apply_btn.attributes.apiToken),
        advNum: $(btn).data(INDEED.single_job_page.indeed_apply_btn.attributes.advNum),
        pingBackUrl: pingBackUrl,
        onready: $(btn).data(INDEED.single_job_page.indeed_apply_btn.attributes.onready),
        clickHandler: $(btn).data(INDEED.single_job_page.indeed_apply_btn.attributes.clickHandler),
        dismissHandler: $(btn).data(INDEED.single_job_page.indeed_apply_btn.attributes.dismissHandler),
        inpageApplyHandler: $(btn).data(INDEED.single_job_page.indeed_apply_btn.attributes.inpageApplyHandler),
        resume: $(btn).data(INDEED.single_job_page.indeed_apply_btn.attributes.resume),
        noButtonUI: $(btn).data(INDEED.single_job_page.indeed_apply_btn.attributes.noButtonUI),
        onappliedstatus: $(btn).data(INDEED.single_job_page.indeed_apply_btn.attributes.onappliedstatus),
        recentsearchquery: $(btn).data(INDEED.single_job_page.indeed_apply_btn.attributes.recentsearchquery),
        iaUid: iaUid,
        hl: hl,
        co: co,
        mob: 0,
        preload: 0,
        spn: 0,
        iip: 1,
        autoString: 'none',
        twoPaneGroup: -1,
        twoPaneVjGroup: -1,
        m3AllocGrp: -1,
        jobApplies: -1,
        ms: getCurrentDateInMilliSec(),
        href: url,
        isITA: 0,
        isCreateIAJobApiSuccess: false,
        src: 'idd-vj'
      }
      return compileIndeedApplyUrl(btnData)
    } else {
      return null
    }
  }
}

function calculateTimePosted(str) {
  let datePosted;
  if (str.toLowerCase().includes('just posted') || str.toLowerCase().includes('today') || str.toLowerCase().includes('a day ago') || str.toLowerCase().includes('hour')) {
    datePosted = new Date()
  } else {
    let matches = str.match(/\d+/g);
    if (matches.length > 0) {
      let daysAgo = matches[0];
      let date = new Date();
      datePosted = new Date(date.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    }
  }
  return datePosted
}

function compileIndeedApplyUrl(applyBtnData) {
  let btnUrl = 'https://apply.indeed.com/indeedapply/resumeapply?';
  let date = new Date().getTime();
  applyBtnData.ms = date; // milliseconds formatted date
  // ECMAscript v5 for older browser compatibility
  let i = 0;
  for (let key in applyBtnData) {
    // check if the property/key is defined in the object itself, not in parent
    if (applyBtnData.hasOwnProperty(key)) {
      if (i === 0) {
        if (applyBtnData[key]) {
          // console.log(key)
          // console.log(applyBtnData[key])
          btnUrl += key.toString() + '=' + encodeURIComponent(applyBtnData[key].toString()); // https://www.w3schools.com/tags/ref_urlencode.ASP
        }
      } else {
        if (applyBtnData[key]) {
          // console.log(key)
          // console.log(applyBtnData[key])
          btnUrl += '&' + key.toString() + '=' + encodeURIComponent(applyBtnData[key].toString()); // https://www.w3schools.com/tags/ref_urlencode.ASP
        }
      }

      i += 1;
    }
  }
  return btnUrl
}

export {
  IndeedAdParser
};