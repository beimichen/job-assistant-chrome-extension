import {extractData} from "../tools.js";
import {resolveCityToCountry} from "../tools.js";


export function checkForZipRedirect(_document, originUrl) {
  let docString = _document.toString();
  // console.log(originUrl);
  if (_document) {
    if (!docString.includes('rocket-loader.min.js') && !docString.includes('class="no_js_header"')) {
      let doc = new DOMParser().parseFromString(docString, 'text/html');
      let zipredirect = doc.querySelector('meta[property="og:url"]');
      if (zipredirect) {
        zipredirect = zipredirect.getAttribute('content');
        if (zipredirect.includes('ziprecruiter')) {
          console.log('ziprecruiter internal link - no redirect needed');
          console.log(zipredirect);
          return {
            redirect: false,
            redirect_url: zipredirect,
            internal: true,
            source: 'ZipRecruiter',
            content: doc
          }
        } else if (zipredirect.includes('careerone')) {
          console.log('careerone redirect link');
          console.log(zipredirect);
          return {
            redirect: true,
            redirect_url: zipredirect,
            internal: false,
            source: null,
            content: doc
          }
        } else {
          console.log('external link');
          if (docString.includes('hays.com')) {
            return {
              redirect: false,
              redirect_url: null,
              internal: false,
              source: 'HAYS',
              content: doc
            }
          } else {
            let source = 'Unknown'
            if (docString.includes('www.glassdoor.')) {
              source = 'Glassdoor'
            }
            return {
              redirect: false,
              redirect_url: null,
              internal: false,
              source: source,
              content: doc
            }
          }
        }
      } else {
        console.log('checking title');
        let title = doc.querySelector('title');
        console.log(title);
        if (title) {
          let titleString = title.textContent;
          console.log(titleString);
          if (titleString === 'You are now being redirected to your next job') {
            console.log('redirect page');
            let redirecturl = docString.match('class="row" data-redirect-url="(.*)" data-redirect-url="')[1];
            console.log(redirecturl);
            return {
              redirect: true,
              redirect_url: redirecturl,
              internal: false,
              source: null,
              content: doc
            }
          } else if (titleString === 'Redirecting...') {
            console.log('actively redirecting...');
            let redirecturl = docString.match('window.parent, window, "(.*);')[1].replace('"); }, timeout)', '');
            console.log(redirecturl);
            return {
              redirect: true,
              redirect_url: redirecturl,
              internal: false,
              source: null,
              content: doc
            }
          } else if (titleString === 'Adzuna Jobs Search') {
            console.log('adzuna redirect');
            let redirecturl = docString.match('<link rel="preconnect" href="(.*)" />')[1];
            console.log(redirecturl);
            return {
              redirect: true,
              redirect_url: redirecturl,
              internal: false,
              source: null,
              content: doc
            }
          } else if (titleString.includes('Redirect Page')) {
            console.log('actively redirecting...');
            if (docString.includes('allthetopbananas')) {
              let redirecturl = 'https://www.allthetopbananas.com' + docString.match('<a href="(.*)" id="lnkDest">Click Here</a>')[1];
              console.log(redirecturl);
              return {
                redirect: true,
                redirect_url: redirecturl,
                internal: false,
                source: null,
                content: doc
              }
            } else if (docString.includes('JobSwipe')) {
              return {
                redirect: false,
                redirect_url: null,
                internal: false,
                source: 'JobSwipe',
                content: doc
              }
            } else {
              return {
                redirect: false,
                redirect_url: null,
                internal: false,
                source: null,
                content: doc
              }
            }
          } else if (titleString.includes('| ZipRecruiter')) {
            console.log('ziprecruiter link');
            return {
              redirect: true,
              redirect_url: false,
              internal: true,
              source: 'ZipRecruiter',
              content: doc
            }
          } else if (titleString.includes('MyKellyJobs')) {
            return {
              redirect: false,
              redirect_url: null,
              internal: false,
              source: null,
              content: null
            }
          } else if (docString.includes('id="lnkDst"')) {
            console.log('actively redirecting......');
            let redirecturl = docString.match('<a href="(.*)" id="lnkDst" rel="nofollow">')[1];
            console.log(redirecturl);
            return {
              redirect: true,
              redirect_url: redirecturl,
              internal: false,
              source: null,
              content: doc
            }
          } else {
            return {
              redirect: false,
              redirect_url: null,
              internal: false,
              source: null,
              content: doc
            }
          }
        } else {
          let possibleRedirect = docString.match("window.location = '(.*)';");
          let data = {
            redirect: false,
            redirect_url: null,
            internal: false,
            source: null,
            content: doc
          }
          if (possibleRedirect) {
            if (possibleRedirect.length > 0) {
              let redirect = possibleRedirect[1];
              data = {
                redirect: true,
                redirect_url: redirect,
                internal: false,
                source: null,
                content: doc
              }
            }
          } else if (docString.includes('| CareerOne') && !docString.includes('You may also be interested in these jobs')) {
            possibleRedirect = docString.match('property="og:url" content="(.*)"><meta data-n-head="ssr" data-hid="twitter:description"');
            if (possibleRedirect) {
              let redirect = possibleRedirect[1];
              data = {
                redirect: true,
                redirect_url: redirect,
                internal: false,
                source: 'CareerOne',
                content: doc
              }
            }
          } else if (docString.includes('www.glassdoor.')) {
            console.log('REDIRECTING...')
            let redirecturl = docString.split('"seoJobLink":"')[1].split('","adOrderId":')[0];
            data = {
              redirect: true,
              redirect_url: redirecturl,
              internal: false,
              source: 'Glassdoor',
              content: null
            }
          } else {
            data = {
              redirect: false,
              redirect_url: null,
              internal: false,
              source: null,
              content: doc
            }
          }
          return data
        }
      }
    } else {
      console.log('rocket loader present or javascript required');
      return {
        redirect: false,
        redirect_url: null,
        internal: false,
        source: null,
        content: null
      }
    }
  } else {
    return {
      redirect: false,
      redirect_url: null,
      internal: false,
      source: null,
      content: null
    }
  }
}

export async function handleZipRedirect(doc, url) {
  let redirectData0 = checkForZipRedirect(doc, url);
  if (redirectData0['redirect']) {
    console.log('there is a redirect');
    console.log(redirectData0);
    let _doc = await extractData(redirectData0['redirect_url']);
    let redirectData1 = checkForZipRedirect(_doc, redirectData0['redirect_url'])
    if (redirectData1['redirect']) {
      console.log('there is a redirect (2nd time)');
      let __doc = await extractData(redirectData1['redirect_url']);
      let redirectData2 = checkForZipRedirect(__doc, redirectData1['redirect_url']);
      if (redirectData2['redirect']) {
        console.log('there is a redirect (3rd time)');
        let ___doc = await extractData(redirectData2['redirect_url']);
        return checkForZipRedirect(___doc, redirectData2['redirect_url']);
      } else {
        return redirectData2
      }
    } else {
      return redirectData1
    }
  } else {
    return redirectData0
  }
}

export const ZIPRECRUITER_LOGO_SRC = 'https://www.ziprecruiter.com/img/logos/ziprecruiter-blacktext.svg';

export const ZIPRECRUITER_LIMIT = 5;

export const ZIPRECRUITER_COUNTRY_URLS = {
  'AU': 'https://www.ziprecruiter.com.au',
  'US': 'https://www.ziprecruiter.com',
  'GB': 'https://www.ziprecruiter.co.uk',
  'CA': 'https://www.ziprecruiter.com',
  'NZ': 'https://www.ziprecruiter.nz'
}

export const ZIPRECRUITER = {
  US_and_CA: {
    search_results_page_elements: {
      retrieveElementsOfAllAdsFromResultPage: function (document) {
        return $(document).find('.t_job_result'); // 20 job ads per page
      },
      getSinglePaginationSearchResultURL: function (searchUrl, pageNum) {
        return `${searchUrl}&page=${pageNum}`;
      },
      getJobAdLocation: function (jobAdEl) {
        return $(jobAdEl).find('.t_location_link.location').text().trim();
      },
      getJobAdUrl: function (jobAdEl) {
        return $(jobAdEl).find('.t_job_link').attr('href');
      },
      getJobAdSummary: function (jobAdEl) {
        return $(jobAdEl).find('.job_snippet').text().trim(); // ad summary
      },
      getAdId: function (jobAdEl) {
        return $(jobAdEl).attr('data-job-id'); // each ad has an unique id which can used for caching
      },
      extractLinksFromPagination: function (searchUrl) {
        let hrefs = [];
        // 20 ads per page
        for (let i = 1; i < 5; i++) { // need pages 2 to 5 (4 more pages)
          hrefs.push(`${searchUrl} + &page=${i + 1}`);
        }
        return hrefs
      },
      getCompanyName: function (jobAdEl) {
        return $(jobAdEl).find('.t_org_link').text().trim();
      },
      getJobTitle: function (jobAdEl) {
        return $(jobAdEl).find('.just_job_title').text().trim();
      },
      getJobLocation: function (jobAdEl) {
        return $(jobAdEl).find('.t_location_link').text().trim();
      },
      getJobSalary: function (jobAdEl) {
        let salaryEl = $(jobAdEl).find('.perks_compensation');
        let salary = null;
        if (salaryEl.length) {
          salary = $(jobAdEl).find('.perks_compensation').find('.data_item').text().trim();
        }
        return salary
      },
      getJobType: function (jobAdEl) {
        let jobTypeEl = $(jobAdEl).find('.perks_type')
        let type = null;
        if (jobTypeEl.length) {
          type = $(jobAdEl).find('.perks_type').find('.data_item').text().trim();
        }
        return type
      },
      getTimePosted: function (jobAdEl) {
        return null
      }
    },
    job_ad_page_elements: {
      internal: {
        extractCompanyName: function(document) {
          return $(document).find('.t_company_name').text().trim();
        },
        extractLocation: function(document) {
          return $(document).find('.address').text().trim();
        },
        extractJobTitle: function (document) {
          return $(document).find('.job_header').find('.job_title').text().trim();
        },
        extractCompanyLogo: function (document) {
          let logo = $(document).find('.company_logo').find('img');
          if (logo.length) {
            return $(logo).attr('src')
          } else {
            return null
          }
        },
        extractJobDescription: function (document) {
          return $(document).find('.jobDescriptionSection').text();
        },
        extractJobType: function(document) {
          let jobTypeEl = $(document).find('.data.t_employment_type');
          if (jobTypeEl) {
            return $(jobTypeEl).text().trim();
          } else {
            return null
          }
        },
        extractTimePosted: function (document) {
          let timePostedEl = $(document).find('.job_more_section').find('.job_more');
          if (timePostedEl.length) {
            let timePosted = null;
            for (let i=0; i<timePostedEl.length;i++) {
              let text = $(timePostedEl[i]).find('.text').text().trim();
              if (text.includes('Date posted:')) {
                timePosted = $(timePostedEl[i]).find('.data').text();
              }
            }
            return timePosted;
          } else {
            return 'posted a day ago'
          }
        },
      },
      external: {
        extractJobDescription: function (document) {
          // External sites have many possibilities
          if ($(document).find('div[class^="jobDetails"]').length) {
            return $(document).find('div[class^="jobDetails"]').text()
          } else if ($(document).find('.jobs-description-content').length) {
            return $(document).find('.jobs-description-content').text()
          } else if ($(document).find('.ats-description').length) {
            return $(document).find('.ats-description').text()
          } else if ($(document).find('.job-description-tab').length) {
            return $(document).find('.job-description-tab').text()
          } else if ($(document).find('.ant-layout-content').length) {
            return $(document).find('.ant-layout-content').text()
          } else if ($(document).find('.job-listing-body').length) {
            return $(document).find('.job-listing-body').text()
          } else if ($(document).find('.description-info').length) {
            return $(document).find('.description-info').text()
          } else if ($(document).find('.job-description').length) {
            return $(document).find('.job-description').text()
          } else if ($(document).find('.description').length) {
            return $(document).find('.description').text()
          } else if ($(document).find('.job-text').length) {
            return $(document).find('.job-text').text()
          } else if ($(document).find('.content').length) {
            return $(document).find('.content').text()
          } else if ($(document).find('.profileDetails').length) {
            return $(document).find('.profileDetails').text()
          } else {
            let spans = $(document).find('body').find('span').text().replaceAll('\n', '').trim();
            let pars = $(document).find('body').find('p').text().replaceAll('\n', '').trim();
            if (spans.length > pars.length) {
              return spans
            } else {
              return pars
            }
          }
        },
        getTimePosted: function () {
          return 'posted 1 day ago'
        },
        // TODO: add all the different data types (refer too glassdoor.js)
        extractJobDescriptionFromZipGlassdoorPartner: function (data) {
          return JSON.parse(data.split('<script>window.appCache=')[1].split(';</script>')[0])['initialState']['jlData']['job']['description'];
        },
        getTimePostedFromZipGlassdoorPartner: function (data) {
          let datePosted = new Date(JSON.parse(data.split('<script>window.appCache=')[1].split(';</script>')[0])['initialState']['jlData']['job']['discoverDate']);
          let now = new Date();
          let dif = now.getDate() - datePosted.getDate();
          return `posted ${dif} days ago`
        }
      }
      // Apply link = null;
      // salary, jobType, companyName are extracted from result pages
    }
  },
  GLOBAL: {
    search_results_page_elements: {
      retrieveElementsOfAllAdsFromResultPage: function (document) {
        return $(document).find('.job-listing'); // 25 job ads per page
      },
      getJobAdUrl: function (jobAdEl) {
        return $(jobAdEl).find('.jobList-title').attr('href');
      },
      getJobAdSummary: function (jobAdEl) {
        return $(jobAdEl).find('.jobList-description').text(); // ad summary
      },
      getAdId: function (jobAdEl) {
        return $(jobAdEl).find('.jobList-title').attr('data-track').slice(0, 206); // each ad has an unique id which can used for caching
      },
      getJobAdLocation: function (jobAdEl) {
        return $(jobAdEl).find('.text-muted.fas.fa-map-marker-alt').parent().text();
      },
      getSinglePaginationSearchResultURL: function (searchUrl, pageNum) {
        return `${searchUrl}&page=${pageNum}`;
      },
      extractLinksFromPagination: function (searchUrl, limit) {
        let hrefs = [];
        // 20 ads per page
        for (let i = 2; i <= limit; i++) { // LIMIT = 4 - need pages 2 to 4 (3 more pages)
          hrefs.push(`${searchUrl}&page=${i}`);
        }
        return hrefs
      },
      getCompanyName: function (jobAdEl) {
        return $(jobAdEl).find('.jobList-introMeta').find('li')[0].innerText;
      },
      getJobTitle: function (jobAdEl) {
        return $(jobAdEl).find('.jobList-title').text(); // DONE
      },
      getJobLocation: function (jobAdEl) {
        return $(jobAdEl).find('.jobList-introMeta').find('li')[1].innerText;
      },
      getJobSalary: function (jobAdEl) {
        return null
      },
      getJobType: function (jobAdEl) {
        return null
      },
      getTimePosted: function (jobAdEl) {
        let now = new Date();
        let posted = $(jobAdEl).find('.jobList-date').text() + ' ' + now.getFullYear();
        let dif = now.getDate() - new Date(posted).getDate();
        return `posted ${dif} days ago`
      }
    },
    job_ad_page_elements: {
      internal: {
        isPrimary: function(document) {
          let primaryZipJobDescription = $(document).find('.job_body');
          return !!primaryZipJobDescription.length;
        },
        extractJobTitle: function (document) {
          if (this.isPrimary(document)) {
            return $(document).find('.u-mv--remove.u-textH2').text()
          }  else {
            return $(document).find('.job_title').text()
          }
        },
        extractLocation: function(document, location) {
          if (this.isPrimary(document)) {
            let locationEl = $('.fas.fa-map-marker-alt');
            if (locationEl.length) {
              return $(locationEl).find('.u-ml--xsmall').text()
            } else {
              return location
            }
          }  else {
            return $(document).find('.job_sub').find('.sub_item')[1].textContent
          }
        },
        extractCompanyName: function(document) {
          if (this.isPrimary(document)) {
            return $(document).find('.jobDetail-header').find('.text-primary.text-large').text()
          }  else {
            return $(document).find('.job_sub').find('.sub_item')[0].textContent
          }
        },
        extractPositionType: function (document) {
          if (this.isPrimary(document)) {
            let jobTypeIcon = $(document).find('.fa-hourglass');
            if (jobTypeIcon.length) {
              return $(jobTypeIcon).find('.u-ml--xsmall').text()
            } else {
              return null
            }
          }  else {
            return $(document).find('.employment_type').text()
          }
        },
        extractJobDescription: function (document) {
          if (this.isPrimary(document)) {
            return $(document).find('.job-body').text()
          }  else {
            return $(document).find('.job_description').text()
          }
        },
        extractTimePosted: function (document) {
          if (this.isPrimary(document)) {
            let timePosted = $(document).find('.panel-body').find('.text-muted')[0].textContent.trim().replace('Posted ','');
            let currentTime = new Date().getTime();
            let timePostedTimestamp = Date.parse(timePosted);
            let dif = (currentTime - timePostedTimestamp) / (1000 * 3600 * 24);
            return `posted ${dif} days ago`
          }  else {
            return $('.posted').text()
          }
        },
        extractApplyLink: function (document, url) {
          if (this.isPrimary(document)) {
            let applyLinkEl = $(document).find('#apply_button_job-details-bottom');
            if (applyLinkEl.length) {
              return $(applyLinkEl).attr('href');
            } else {
              return url
            }
          }  else {
            return url
          }
        }
      },
      external: {
        extractJobDescription: function (document) {
          // External sites have many possibilities
          if ($(document).find('div[class^="jobDetails"]').length) {
            return $(document).find('div[class^="jobDetails"]').text()
          } else if ($(document).find('.jobs-description-content').length) {
            return $(document).find('.jobs-description-content').text()
          } else if ($(document).find('.ats-description').length) {
            return $(document).find('.ats-description').text()
          } else if ($(document).find('.job-description-tab').length) {
            return $(document).find('.job-description-tab').text()
          } else if ($(document).find('.ant-layout-content').length) {
            return $(document).find('.ant-layout-content').text()
          } else if ($(document).find('.job-listing-body').length) {
            return $(document).find('.job-listing-body').text()
          } else if ($(document).find('.description-info').length) {
            return $(document).find('.description-info').text()
          } else if ($(document).find('.job-description').length) {
            return $(document).find('.job-description').text()
          } else if ($(document).find('.description').length) {
            return $(document).find('.description').text()
          } else if ($(document).find('.job-text').length) {
            return $(document).find('.job-text').text()
          } else if ($(document).find('.content').length) {
            return $(document).find('.content').text()
          } else if ($(document).find('.profileDetails').length) {
            return $(document).find('.profileDetails').text()
          } else {
            let spans = $(document).find('body').find('span').text().replaceAll('\n', '').trim();
            let pars = $(document).find('body').find('p').text().replaceAll('\n', '').trim();
            if (spans.length > pars.length) {
              return spans
            } else {
              return pars
            }
          }
        },
        getTimePosted: function () {
          return 'posted 1 day ago'
        },
      }
    }
  }
}

export class ZipRecruiterParser {

  #constructSearchUrl(baseUrl, position, location, country) {
    if (country === 'AU' || country === 'GB' || country === 'NZ') {
      return `${baseUrl}/jobs/search?q=${position.replaceAll(' ', '+')}&l=${location.replaceAll(' ', '+').replaceAll(',', '%2C')}`
    } else {
      return `${baseUrl}/candidate/search?search=${position.replaceAll(' ', '+')}&location=${location.replaceAll(' ', '+').replaceAll(',', '%2C')}&days=10`
    }
  }

  constructor(city, position, skills, resume) {
    this.source = 'ZipRecruiter';
    this.resume = resume;
    this.skills = skills;
    this.sourceLogo = ZIPRECRUITER_LOGO_SRC;
    this.country = resolveCityToCountry(city);
    this.location = city;
    this.position = position;
    this.company = null;
    this.companyLogo = null;
    this.jobAge = null;
    this.raw_position = null;
    this.job_location = null;
    this.job_type = null;
    this.salary = null;
    this.limit = ZIPRECRUITER_LIMIT;
    this.isMoreThanLimit = true;
    this.paginationLinks = [];
    if (this.country) {
      this.baseUrl = ZIPRECRUITER_COUNTRY_URLS[this.country];
      this.searchUrl = this.#constructSearchUrl(this.baseUrl, this.position, this.location, this.country);
    } else {
      this.baseUrl = null;
      this.searchUrl = null;
    }
  }

  async #extractFirstPageDocumentAndPaginationLinks() {
    let document = await extractData(this.searchUrl);
    if (document) {
      let links = ZIPRECRUITER.search_results_page_elements.extractLinksFromPagination(this.searchUrl, this.limit);
      return {
        document: document,
        hrefs: links
      }
    } else {
      return {
        document: null,
        hrefs: []
      }
    }
  }

  async #extractJobsFromResultPages(urls) {
    if (urls.length) {
      let promises = [];
      for (let i = 0; i < urls.length; i++) {
        if (urls[i]) {
          promises.push(extractData(urls[i]));
        }
      }
      return await Promise.all(promises).then(function (res) {
        return res
      })
    } else {
      return null
    }
  }

  async #extractElementsOfJobsFromResultPages() {
    let data = await this.#extractFirstPageDocumentAndPaginationLinks(); // Extracts from from the search url
    let elementsOfAllJobs = [];
    let firstPageOfResults = data['document'];
    let linksOfResultPages = data['hrefs']; // excludes the first page
    let jobsFromFirstPage = ZIPRECRUITER.search_results_page_elements.retrieveElementsOfAllAdsFromResultPage(firstPageOfResults); // 26 job ads per page
    if (firstPageOfResults) {
      if (jobsFromFirstPage.length) {
        for (let i = 0; i < jobsFromFirstPage.length; i++) {
          elementsOfAllJobs.push(jobsFromFirstPage[i]);
        }
        let jobsOfRemainingResultPages = await this.#extractJobsFromResultPages(linksOfResultPages)
        if (jobsOfRemainingResultPages) {
          for (let j = 0; j < jobsOfRemainingResultPages.length; j++) {
            let jobsFromPage = ZIPRECRUITER.search_results_page_elements.retrieveElementsOfAllAdsFromResultPage(jobsOfRemainingResultPages[j]); // parses the document and collects all job elements
            for (let k = 0; k < jobsFromPage.length; k++) {
              elementsOfAllJobs.push(jobsFromPage[k]);
            }
          }
        }
        return elementsOfAllJobs
      } else {
        console.log('No jobs in the first page')
        return null // If there aren't any jobs in the first page, there won't be pagination links
      }
    } else {
      console.log('No html document present')
      return null // If there isn't any data extracted from search url
    }
  }

  async parseJobElements() {
    let elements = await this.#extractElementsOfJobsFromResultPages();
    let data = [];
    let searchPage;
    if (this.country === 'AU' || this.country === 'NZ' || this.country === 'GB') {
      searchPage = ZIPRECRUITER.GLOBAL.search_results_page_elements;
    } else {
      searchPage = ZIPRECRUITER.US_and_CA.search_results_page_elements;
    }
    if (elements) {
      for (let i = 0; i < elements.length; i++) {
        let element = elements[i];
        let jobUrl = searchPage.getJobAdUrl(element, this.baseUrl);
        let jobId = searchPage.getAdId(element);
        let jobSummary = searchPage.getJobAdSummary(element);
        let rawPosition = searchPage.getJobTitle(element);
        let companyName = searchPage.getCompanyName(element);
        let location = searchPage.getJobLocation(element);
        let salary = null;
        let jobType = null;
        let timePosted = 'posted a day ago';
        if (this.country === 'US' || this.country === 'CA') {
          salary = searchPage.getJobSalary(element);
          jobType = searchPage.getJobType(element);
        } else {
          timePosted = searchPage.getTimePosted(element);
        }
        data.push({
          position: this.position, // searched position
          url: jobUrl,
          base_url: this.baseUrl,
          id: jobId,
          summary: jobSummary,
          source: this.source,
          job_title: rawPosition, // job title extracted from result page
          job_location: location, // job location extracted from result page
          company: companyName, // company name extracted from result page
          company_logo: this.companyLogo,
          job_type: jobType, // job type extracted from result page
          salary: salary, // salary extracted from result page
          country: this.country,
          source_logo: this.sourceLogo,
          skills: this.skills,
          resume: this.resume,
          job_age: this.jobAge
        })
      }
    }
    return data
  }

  async #extractElementsOfJobAdsFromSingleResultPage(pageNumber) {
    let jobsFromPage = [];
    let document;
    if (pageNumber === 1) {
      document = await extractData(this.searchUrl);
      this.paginationLinks.push(this.searchUrl);
      for (let i = 2; i <= this.limit; i++) {
        if (this.country === 'US' || this.country === 'CA') {
          this.paginationLinks.push(ZIPRECRUITER.US_and_CA.search_results_page_elements.getSinglePaginationSearchResultURL(this.searchUrl, i));
        } else {
          this.paginationLinks.push(ZIPRECRUITER.GLOBAL.search_results_page_elements.getSinglePaginationSearchResultURL(this.searchUrl, i));
        }
      }
      // console.log('LINKS (zip):');
      // console.log(this.paginationLinks);
    } else {
      // console.log('LINKS (zip):');
      // console.log(this.paginationLinks);
      if (pageNumber <= this.limit) {
        document = await extractData(this.paginationLinks[pageNumber - 1]);
      }
    }
    if (document) {
      if (this.country === 'US' || this.country === 'CA') {
        jobsFromPage = ZIPRECRUITER.US_and_CA.search_results_page_elements.retrieveElementsOfAllAdsFromResultPage(document);
      } else {
        jobsFromPage = ZIPRECRUITER.GLOBAL.search_results_page_elements.retrieveElementsOfAllAdsFromResultPage(document);
      }
    }
    return jobsFromPage
  }

  async parseJobElementsFromSingleResultPage(pageNumber) {
    let elements = await this.#extractElementsOfJobAdsFromSingleResultPage(pageNumber);
    let data = [];
    let parser;
    if (this.country === 'US' || this.country === 'CA') {
      parser = ZIPRECRUITER.US_and_CA.search_results_page_elements;
    } else {
      parser = ZIPRECRUITER.GLOBAL.search_results_page_elements;
    }
    if (elements) {
      for (let i = 0; i < elements.length; i++) {
        let element = elements[i];
        let jobUrl = parser.getJobAdUrl(element, this.baseUrl);
        let jobId = parser.getAdId(element);
        let jobSummary = parser.getJobAdSummary(element);
        let rawPosition = parser.getJobTitle(element);
        let companyName = parser.getCompanyName(element);
        let salary = null;
        let jobType = null;
        let timePosted = 'posted a day ago';
        if (this.country === 'US' || this.country === 'CA') {
          salary = parser.getJobSalary(element);
          jobType = parser.getJobType(element);
        } else {
          timePosted = parser.getTimePosted(element);
        }
        let location = parser.getJobLocation(element);
        data.push({
          position: rawPosition, // searched position
          url: jobUrl,
          base_url: this.baseUrl,
          id: jobId,
          summary: jobSummary,
          source: this.source.toLowerCase(),
          job_title: rawPosition, // job title extracted from result page
          job_location: location, // job location extracted from result page
          company: companyName, // company name extracted from result page
          company_logo: this.companyLogo,
          job_type: this.job_type, // job type extracted from result page
          salary: salary, // salary extracted from result page
          country: this.country,
          source_logo: this.sourceLogo,
          skills: this.skills,
          resume: this.resume,
          job_age: timePosted,
        });
      }
    }
    return {'source': 'ziprecruiter', 'data': data}
  }
}