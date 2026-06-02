import {cityLookup} from "../../../main.js";
import {extractData, resolveCityToCountry} from "../tools.js";

export let GLASSDOOR = {
  search_results_page_elements: {
    retrieveElementsOfAllAdsFromResultPage: function (document) {
      try {
        let jobAds = JSON.parse(document.toString().match(/"jobListings":(.*?),"pageFooterText":"/g)[0].replace('"jobListings":','').split(',"jobSearchTrackingKey"')[0]); // 30 ads per page
        if (jobAds.length) {
          return jobAds
        } else {
          return []
        }
      } catch {
        return []
      }
    },
    getJobTitle: function(data) {
      return data['jobTitle'];
    },
    getJobAdUrl: function (data) {
      try {
        return data['seoJobLink'];
      } catch {
        return null
      }
    },
    getJobAdLocation(data){
      try {
        return data['locationName'];
      } catch {
        return null
      }
    },
    getCompanyName: function (data) {
      try {
        return data['employerNameFromSearch'];
      } catch {
        return null
      }
    },
    getJobAdSummary: function() {
      return null
    },
    getJobAdSalary(data) {
      try {
        return '$' + data['payPercentile90'].toString();
      } catch {
        return null
      }
    },
    getJobAdAge: function (data) {
      try {
        return `posted ${data['ageInDays'].toString()} days ago`;
      } catch {
        return null
      }
    },
    getAdId: function (data) {
      return data['listingId']
    },
    getSinglePaginationSearchResultURL: function (searchUrl, pageNum) {
      if (pageNum === 1) {
        return searchUrl
      } else {
        return null
      }
    },
    extractLinksFromPagination: function (searchUrl, limit) {
      let hrefs = [];
      // for (let i=0;i<limit;i++) { // LIMIT = 4
      //   hrefs.push(searchUrl + `&p=${i+1}`);
      // }
      return hrefs
    },
  },
  job_ad_page_elements: {
    extractJobTitle: function (data) {
      try {
        return JSON.parse(data.split('<script>window.appCache=')[1].split(';</script>')[0])['initialState']['jlData']['header']['jobTitleText'];
      } catch {
        return null
      }
    },
    extractCompanyName: function (data) {
      try {
        return JSON.parse(data.split('<script>window.appCache=')[1].split(';</script>')[0])['initialState']['jlData']['header']['employerNameFromSearch'];
      } catch {
        return null
      }
    },
    extractCompanyLogo: function () {
      try {
        return JSON.parse(data.split('<script>window.appCache=')[1].split(';</script>')[0])['initialState']['jlData']['header']['employer']['squareLogoUrl'];
      } catch {
        return null
      }
    },
    extractSkills: function (data) {
      try {
        return JSON.parse(data.split('<script>window.appCache=')[1].split(';</script>')[0])['initialState']['jlData']['header']['indeedJobAttribute']['skillsLabel'];
      } catch {
        return []
      }
    },
    extractLocation: function (data) {
      try {
        return JSON.parse(data.split('<script>window.appCache=')[1].split(';</script>')[0])['initialState']['jlData']['header']['locationName'];
      } catch {
        return null
      }
    },
    extractSalary: function (data) {
      try {
        let parsedData = JSON.parse(data.split('<script>window.appCache=')[1].split(';</script>')[0])['initialState']['jlData']['header'];
        return 'Estimated ' +  parsedData['payPercentile90'] + parsedData['payCurrency'];
      } catch {
        return null
      }
    },
    extractPositionType: function () {
      try {
        let positionType = JSON.parse(data.split('<script>window.appCache=')[1].split(';</script>')[0])['initialState']['jlData']['header']['jobTypeKeys'][0];
        let positionTypeSplit = positionType.split('.');
        return positionTypeSplit[positionTypeSplit.length - 1];
      } catch {
        return null
      }
    },
    extractJobDescription: function (data) {
      try {
        return JSON.parse(data.split('<script>window.appCache=')[1].split(';</script>')[0])['initialState']['jlData']['job']['description'];
      } catch {
        return null
      }
    },
    extractTimePosted: function (data) {
      try {
        let datePosted = new Date(JSON.parse(data.split('<script>window.appCache=')[1].split(';</script>')[0])['initialState']['jlData']['job']['discoverDate']);
        let now = new Date();
        let dif = now.getDate() - datePosted.getDate();
        return `posted ${dif} days ago`
      } catch {
        return 'posted a day ago'
      }
    },
    extractApplyLink: function(data, baseUrl){
      try {
        return baseUrl + JSON.parse(data.split('<script>window.appCache=')[1].split(';</script>')[0])['initialState']['jlData']['header']['applyUrl'];
      } catch {
        return null
      }
    }
  }
}

// export function parseGlassDoor(doc) {
//   return JSON.parse(doc.split('<script>window.appCache=')[1].split(';</script>')[0])['initialState']['jlData']['job']['description'];
// }

export let GLASSDOOR_COUNTRY_URLS = {
  'AU': 'https://www.glassdoor.com.au/',
  'US': 'https://www.glassdoor.com/',
  'GB': 'https://www.glassdoor.co.uk/',
  'CA': 'https://www.glassdoor.ca/',
  'NZ': 'https://www.glassdoor.co.nz/'
}

export const GLASSDOOR_LOGO_SRC = 'https://www.jobalign.com/wp-content/uploads/2018/01/glassdoor-logo.png';

export const GLASSDOOR_LIMIT = 1;

export class GlassDoorParser {
  #constructSearchUrl (baseUrl, position, location_type, location_id, location_fullname) {
    if (location_id) {
      let url = `${baseUrl}Job/jobs.htm?sc.keyword=${position.replaceAll(' ','+')}&suggestCount=0&suggestChosen=false&clickSource=searchBox&locId=${location_id}&locT=${location_type}&locName=${encodeURIComponent(location_fullname)}`;
      // console.log('GLASSDOOR URL:');
      // console.log(url);
      return url
    } else {
      return null
    }
  }

  constructor(city, position, skills, resume) {
    this.source = 'Glassdoor';
    this.resume = resume;
    this.skills = skills;
    this.sourceLogo = GLASSDOOR_LOGO_SRC;
    this.country = resolveCityToCountry(city);
    this.location = city;
    this.position = position;
    this.company = null;
    this.companyLogo = null;
    this.raw_position = null;
    this.job_location = null;
    this.job_type = null;
    this.salary = null;
    this.jobAge = null;
    this.limit = GLASSDOOR_LIMIT;
    this.isMoreThanLimit= false;
    this.paginationLinks = [];
    try {
      this.location_id = cityLookup['cities'][this.location]['real_id'];
      this.location_type = cityLookup['cities'][this.location]['city_type'];
      this.location_fullname = cityLookup['cities'][this.location]['city_fullname'];
    } catch {
      this.location_id = null;
      this.location_type = null;
      this.location_fullname = null;
    }
    if (this.country) {
      this.baseUrl = GLASSDOOR_COUNTRY_URLS[this.country];
      this.searchUrl = this.#constructSearchUrl(this.baseUrl, this.position, this.location_type, this.location_id, this.location_fullname);
    } else {
      this.baseUrl = null;
      this.searchUrl = null;
    }
  }
  async #extractFirstPageDocumentAndPaginationLinks() {
    let document = await extractData(this.searchUrl);
    if (document) {
      let links = GLASSDOOR.search_results_page_elements.extractLinksFromPagination(this.searchUrl, this.limit);
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

  async #extractJobAdsFromResultPages(urls) {
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

  async #extractElementsOfJobAdsFromResultPages() {
    let data = await this.#extractFirstPageDocumentAndPaginationLinks(); // Extracts from from the search url
    let elementsOfAllJobs = [];
    let firstPageOfResults = data['document'];
    let linksOfResultPages = data['hrefs']; // excludes the first page
    let jobsFromFirstPage = GLASSDOOR.search_results_page_elements.retrieveElementsOfAllAdsFromResultPage(firstPageOfResults); // 26 job ads per page
    if (firstPageOfResults) {
      if (jobsFromFirstPage.length) {
        for (let i = 0; i < jobsFromFirstPage.length; i++) {
          elementsOfAllJobs.push(jobsFromFirstPage[i]);
        }
        let jobsOfRemainingResultPages = await this.#extractJobAdsFromResultPages(linksOfResultPages)
        if (jobsOfRemainingResultPages) {
          for (let j = 0; j < jobsOfRemainingResultPages.length; j++) {
            let jobsFromPage = GLASSDOOR.search_results_page_elements.retrieveElementsOfAllAdsFromResultPage(jobsOfRemainingResultPages[j]); // parses the document and collects all job elements
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
    let elements = await this.#extractElementsOfJobAdsFromResultPages();
    let data = [];
    if (elements) {
      for (let i = 0; i < elements.length; i++) {
        let element = elements[i];
        let jobUrl = GLASSDOOR.search_results_page_elements.getJobAdUrl(element, this.baseUrl);
        let jobId = GLASSDOOR.search_results_page_elements.getAdId(element);
        let jobSummary = null;
        // TODO: add all other elements here
        data.push({
          position: this.position, // searched position
          url: jobUrl,
          base_url: this.baseUrl,
          id: jobId,
          summary: jobSummary,
          source: this.source,
          job_title: this.raw_position, // job title extracted from result page
          job_location: this.job_location, // job location extracted from result page
          company: this.company, // company name extracted from result page
          company_logo: this.companyLogo,
          job_type: this.job_type, // job type extracted from result page
          salary: this.salary, // salary extracted from result page
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
    let document = null;
    if (pageNumber === 1) {
      document = await extractData(this.searchUrl);
      // console.log('GLASSDOOR HTML:');
      // console.log(document);
    }
    if (document) {
      jobsFromPage = GLASSDOOR.search_results_page_elements.retrieveElementsOfAllAdsFromResultPage(document);
    }
    return jobsFromPage
  }

  async parseJobElementsFromSingleResultPage(pageNumber) {
    let data = [];
    if (pageNumber === 1) {
      let elements =  await this.#extractElementsOfJobAdsFromSingleResultPage(pageNumber);
      if (elements.length) {
        for (let i = 0; i < elements.length; i++) {
          let element = elements[i];
          let jobUrl = GLASSDOOR.search_results_page_elements.getJobAdUrl(element);
          let jobTitle = GLASSDOOR.search_results_page_elements.getJobTitle(element);
          let jobId = GLASSDOOR.search_results_page_elements.getAdId(element);
          let jobSummary = GLASSDOOR.search_results_page_elements.getJobAdSummary(element);
          let companyName = GLASSDOOR.search_results_page_elements.getCompanyName(element);
          let location = GLASSDOOR.search_results_page_elements.getJobAdLocation(element);
          let jobAge = GLASSDOOR.search_results_page_elements.getJobAdAge(element);
          let jobSalary = GLASSDOOR.search_results_page_elements.getJobAdSalary(element);
          data.push({
            position: this.position, // searched position
            url: jobUrl,
            base_url: this.baseUrl,
            id: jobId,
            summary: jobSummary,
            source: this.source.toLowerCase(),
            job_title: jobTitle, // job title extracted from result page
            job_location: location, // job location extracted from result page
            company: companyName, // company name extracted from result page
            company_logo: this.companyLogo,
            job_type: this.job_type, // job type extracted from result page
            salary: jobSalary, // salary extracted from result page
            country: this.country,
            source_logo: this.sourceLogo,
            skills: this.skills,
            resume: this.resume,
            job_age: jobAge,
          });
        }
      }
    }
    return {'source': 'glassdoor', 'data': data }
  }
}
