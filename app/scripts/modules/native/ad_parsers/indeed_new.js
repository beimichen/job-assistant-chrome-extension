import {cityLookup} from "../../../main.js";
import {extractData, resolveCityToCountry} from "../tools.js";

export let INDEED = {
  search_results_page_elements: {
    retrieveElementsOfAllAdsFromResultPage: function (document) {
      let jobAds = $(document).find('.tapItem.fs-unmask.result');
      if (jobAds.length) {
        return jobAds
      } else {
        return []
      }
    },
    getJobAdUrl: function (jobAdEl, baseUrl) { // baseUrl = https://*.indeed.com  NOTE: No '/' after baseurl
      return baseUrl + $(jobAdEl).attr('href');
    },
    getJobAdSummary: function (jobAdEl) {
      return $(jobAdEl).find('.job-snippet').text().trim();
    },
    getJobAdAge: function(jobAdEl) {
      return $(jobAdEl).find('.date').text().trim();
    },
    getJobAdSalary: function(jobAdEl) {
      let salaryEl = $(jobAdEl).find('.salary-snippet');
      if (salaryEl.length) {
        return $(salaryEl).text().trim();
      } else {
        return ''
      }
    },
    getJobTitle: function(jobAdEl) {
      return $(jobAdEl).find('.jobTitle').text();
    },
    getCompanyName: function(jobAdEl) {
      return $(jobAdEl).find('.companyName').text().trim();
    },
    getJobAdLocation: function(jobAdEl) {
      return $(jobAdEl).find('.companyLocation').text().trim();
    },
    getAdId: function (jobAdEl) {
      return $(jobAdEl).attr('id');
    },
    getSinglePaginationSearchResultURL: function (document, baseUrl, pageNum, limit) {
      let list = $(document).find('.pagination-list').find('li');
      let _limit = Math.min(limit, list.length);
      let url = null;
      if (pageNum < _limit) {
        url = baseUrl + list[pageNum].find(a).attr('href');
      }
      return url
    },
    extractLinksFromPagination: function (document, searchUrl, limit) { // baseUrl = https://*.indeed.com  NOTE: No '/' after baseurl
      let list = $(document).find('.pagination-list').find('li');
      let hrefs = [];
      if (list.length) {
        let _limit = Math.min(limit, list.length - 1); // ignore last item in list
        if (_limit !== 0) {
          let page = 10;
          if (list.length >= 2) {
            for (let i=1;i<=_limit;i++) {
              page += 10;
              hrefs.push(searchUrl + '&start=' + page.toString());
            }
          }
        }
      }
      return hrefs
    },
  },
  job_ad_page_elements: {
    extractJobTitle: function (document) {
      return $(document).find('.jobsearch-JobInfoHeader-title').text();
    },
    extractCompanyName: function (document) {
      return $(document).find('.icl-u-lg-mr--sm.icl-u-xs-mr--xs').text();
    },
    extractCompanyLogo: function (document) {
      let company;
      if ($(document).find('.cmp_logo_img').length > 0) {
        company = $(document).find('.cmp_logo_img').attr('src')
      } else {
        company = '';
      }
      return company
    },
    extractSkills: function() {
      return []
    },
    extractLocation: function (document) {
      let location;
      if ($(document).find('.location').length > 0) {
        location = $(document).find('.location').text();
      } else if ($(document).find('.jobsearch-JobDescriptionSection-sectionItemKey').length > 0) {
        location = $(document).find('.jobsearch-InlineCompanyRating').next().text();
      } else if ($(document).find('.jobsearch-InlineCompanyRating').children().length === 3) {
        location = $(document).find('.jobsearch-InlineCompanyRating').children().eq(INDEED.single_job_page.location.child.index).text();
      } else if ($(document).find('.jobsearch-InlineCompanyRating').children().length === 2) {
        location = $(document).find('.jobsearch-InlineCompanyRating').next().text();
      } else if ($(document).find('.jobsearch-InlineCompanyRating').children().length === 1) {
        location = $(document).find('.jobsearch-InlineCompanyRating').next().text();
      } else {
        location = null
      }
      return location
    },
    extractSalary: function (document) {
      let salary;
      if ($(document).find('span.salaryText').lenght > 0) {
        salary = $(document).find('span.salaryText').text();
      } else if ($(document).find('#job_summary').length > 0) {
        let salaryElements = $(document).find('#job_summary');
        for (let i = 0; i < salaryElements.length; i++) {
          let salaryElementText = $(salaryElements[i]).text();
          if (salaryElementText.includes('Salary:')) {
            salary = salaryElementText.replace('Salary:', '')
          } else if (salaryElementText.includes('Pay:')) {
            salary = salaryElementText.replace('Pay:', '')
          }
        }
      } else if ($(document).find('.jobsearch-JobDescriptionSection-sectionItemKey').length > 0) {
        let possibleElements = $(document).find('.jobsearch-JobDescriptionSection-sectionItemKey');
        for (let i = 0; i < possibleElements.length; i++) {
          if ($(possibleElements[i]).text() === 'Salary') {
            salary = $(possibleElements[i]).next().text();
          }
        }
      } else if ($(document).find('div.jobsearch-JobMetadataHeader-item').children().eq(0).text().includes('$')) {
        salary = $(document).find('div.jobsearch-JobMetadataHeader-item').children().eq(0).text();
      } else {
        salary = null;
      }
      return salary
    },
    extractPositionType: function (document) {
      let employmentType = null;
      let container = $(document).find('.jobsearch-DesktopStickyContainer');
      let container2 = $(document).find('.jobsearch-JobMetadataHeader-item');
      let container3 = $(document).find('.jobsearch-JobDescriptionSection-sectionItemKey');
      if ($(document).find('.no-wrap').length > 0) {
        if ($(document).find('.no-wrap').text().includes('Temporarily remote')) {
          employmentType = 'Temporarily remote';
        } else if ($(document).find('.no-wrap').text().includes('Temporary')) {
          employmentType = 'Tempory';
        } else if ($(document).find('.no-wrap').text().includes('Remote')) {
          employmentType = 'Remote';
        } else if ($(document).find('.no-wrap').text().includes('Contract')) {
          employmentType = 'Contract';
        } else if ($(document).find('.no-wrap').text().includes('Casual')) {
          employmentType = 'Casual';
        } else if ($(document).find('.no-wrap').text().includes('Part-time')) {
          employmentType = 'Part-time';
        } else if ($(document).find('.no-wrap').text().includes('Full-time')) {
          employmentType = 'Full-time';
        }
      } else if ($(document).find('#job_summary').length > 0) {
        let jobSummaryElements = $(document).find('#job_summary');
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
        } else if ($(container).text().includes('Temporary')) {
          employmentType = 'Tempory';
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
        } else {
          employmentType = 'Full-time'
        }
      } else if (container2.length > 0) {
        if ($(container2).text().includes('Temporarily remote')) {
          employmentType = 'Temporarily remote'
        } else if ($(container2).text().includes('Temporary')) {
          employmentType = 'Tempory';
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
        } else {
          employmentType = 'Full-time'
        }
      } else if (container3.length > 0) {
        let possibleElements = $(document).find('.jobsearch-JobDescriptionSection-sectionItemKey');
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
      return employmentType
    },
    extractJobDescription: function (document) {
      let desc;
      // console.log('JOB DESCRIPTION:');
      if ($(document).find('#job_summary').length > 0) {
        // console.log('extracting description....');
        desc = $(document).find('#job_summary').text();
      } else {
        // console.log('extracting description...');
        desc = $(document).find('#jobDescriptionText').text();
      }
      return desc
    },
    extractTimePosted: function (document) {
      let date;
      if ($(document).find('.date').length > 0) {
        date = $(document).find('.date').text();
        if (date.includes(' - ')) {
          date = date.replace(' - ', '')
        }
      } else {
        let dateElements = $(document).find('.jobsearch-JobMetadataFooter').children();
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
            date = date.replace(' - ', '');
          }
        } else {
          let spans = $(document).find('span');
          for (let i = 0; i < spans.length; i++) {
            if ($(spans[i]).text().includes(' days ago')) {
              date = $(spans[i]).text();
              if (date.includes(' - ')) {
                date = date.replace(' - ', '')
              }
            }
          }
        }
        return date
      }
    },
    extractApplyLink: function(document){
      let internalApplyBtn;
      if ($(document).find('#indeedApplyButtonContainer')) {
        internalApplyBtn = $(document).find('#indeedApplyButtonContainer').children().eq(0).prop('outerHTML');
      } else if ($(document).find('.indeed-apply-button').length > 0) {
        internalApplyBtn = $(document).find('.indeed-apply-button').attr('href');
      } else {
        internalApplyBtn = null
      }
      return internalApplyBtn
    }
  }
}

export let INDEED_COUNTRY_URLS = {
  'AU': 'https://au.indeed.com',
  'US': 'https://www.indeed.com',
  'GB': 'https://uk.indeed.com',
  'CA': 'https://ca.indeed.com',
  'NZ': 'https://nz.indeed.com'
}

export const INDEED_LOGO_SRC = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRfcgTlZ6hSGT-uIZ01Qwztc1qc6pWGVWKlTg&usqp=CAU';

export const INDEED_LIMIT = 7;

export class IndeedParser {

  #constructSearchUrl (baseUrl, position, location) {
    if (baseUrl) {
      return `${baseUrl}/jobs?q=${position.replaceAll(' ', '+')}&l=${location.replaceAll(' ', '+').replaceAll(',', '%2C')}&fromage=14&sort=date`
      // return `${baseUrl}/jobs?as_and=${position.replace(' ', '+')}&as_phr=&as_any=&as_not=&as_ttl=&as_cmp=&jt=all&st=&salary=&radius=25&l=${location.replace(' ', '+').replaceAll(',', '%2C')}&fromage=15&limit=50&sort=date&psf=advsrch&from=advancedsearch`
    } else {
      return null
    }
  }

  constructor(city, position, skills, resume) {
    this.source = 'Indeed';
    this.resume = resume;
    this.skills = skills;
    this.sourceLogo = INDEED_LOGO_SRC;
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
    this.limit = INDEED_LIMIT;
    this.isMoreThanLimit = false;
    this.paginationLinks = [];
    if (this.country) {
      this.baseUrl = INDEED_COUNTRY_URLS[this.country];
      this.searchUrl = this.#constructSearchUrl(this.baseUrl, this.position, this.location);
    } else {
      this.baseUrl = null;
      this.searchUrl = null;
    }
  }
  async #extractFirstPageDocumentAndPaginationLinks() {
    let document = await extractData(this.searchUrl);
    if (document) {
      let links = INDEED.search_results_page_elements.extractLinksFromPagination(document, this.baseUrl, this.limit);
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
    let jobsFromFirstPage = INDEED.search_results_page_elements.retrieveElementsOfAllAdsFromResultPage(firstPageOfResults); // 26 job ads per page
    if (firstPageOfResults) {
      if (jobsFromFirstPage.length) {
        for (let i = 0; i < jobsFromFirstPage.length; i++) {
          elementsOfAllJobs.push(jobsFromFirstPage[i]);
        }
        let jobsOfRemainingResultPages = await this.#extractJobAdsFromResultPages(linksOfResultPages)
        if (jobsOfRemainingResultPages) {
          for (let j = 0; j < jobsOfRemainingResultPages.length; j++) {
            let jobsFromPage = INDEED.search_results_page_elements.retrieveElementsOfAllAdsFromResultPage(jobsOfRemainingResultPages[j]); // parses the document and collects all job elements
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
        let jobUrl = INDEED.search_results_page_elements.getJobAdUrl(element, this.baseUrl);
        let jobId = INDEED.search_results_page_elements.getAdId(element);
        let jobSummary = INDEED.search_results_page_elements.getJobAdSummary(element);
        let jobLocation = INDEED.search_results_page_elements.getJobAdLocation(element);
        let jobTitle = INDEED.search_results_page_elements.getJobTitle(element);
        let companyName = INDEED.search_results_page_elements.getCompanyName(element);
        let salary = INDEED.search_results_page_elements.getJobAdSalary(element);
        let jobAge = INDEED.search_results_page_elements.getJobAdAge(element);
        data.push({
          position: this.position, // searched position
          url: jobUrl,
          base_url: this.baseUrl,
          id: jobId,
          summary: jobSummary,
          source: this.source,
          job_title: jobTitle, // job title extracted from result page
          job_location: jobLocation, // job location extracted from result page
          company: companyName, // company name extracted from result page
          company_logo: this.companyLogo,
          job_type: this.job_type, // job type extracted from result page
          salary: salary, // salary extracted from result page
          country: this.country,
          source_logo: this.sourceLogo,
          skills: this.skills,
          resume: this.resume,
          job_age: jobAge
        })
      }
    }
    return data
  }
  async #extractElementsOfJobAdsFromSingleResultPage(pageNumber) {
    let document = null;
    let links;
    let jobsFromPage = [];
    if (pageNumber === 1) {
      document = await extractData(this.searchUrl);
      links = INDEED.search_results_page_elements.extractLinksFromPagination(document, this.searchUrl, this.limit);
      // this.paginationLinks.push(this.baseUrl + links[1]);
      if (links.length) {
        this.paginationLinks.push(this.searchUrl);
        if (this.limit <= links.length) {
          for (let i = 1; i <= this.limit; i++) {
            this.paginationLinks.push(links[i]);
          }
        } else {
          for (let i = 1; i <= links.length; i++) {
            this.paginationLinks.push(links[i]);
          }
        }
      }
    } else {
      if (pageNumber <= this.limit && this.paginationLinks.length) {
        document = await extractData(this.paginationLinks[pageNumber - 1]);
      }
    }
    if (document) {
      jobsFromPage = INDEED.search_results_page_elements.retrieveElementsOfAllAdsFromResultPage(document);
    }
    return jobsFromPage
  }

  async parseJobElementsFromSingleResultPage(pageNumber) {
    let elements =  await this.#extractElementsOfJobAdsFromSingleResultPage(pageNumber);
    let data = [];
    if (elements.length) {
      for (let i = 0; i < elements.length; i++) {
        let element = elements[i];
        let jobUrl = INDEED.search_results_page_elements.getJobAdUrl(element, this.baseUrl);
        let jobId = INDEED.search_results_page_elements.getAdId(element);
        let jobSummary = INDEED.search_results_page_elements.getJobAdSummary(element);
        let companyName = INDEED.search_results_page_elements.getCompanyName(element);
        let jobTitle = INDEED.search_results_page_elements.getJobTitle(element);
        let location = INDEED.search_results_page_elements.getJobAdLocation(element);
        let jobAge = INDEED.search_results_page_elements.getJobAdAge(element);
        let jobSalary = INDEED.search_results_page_elements.getJobAdSalary(element);
        data.push({
          position: this.position, // searched position
          url: jobUrl,
          base_url: this.baseUrl,
          id: jobId,
          summary: jobSummary,
          source: this.source.toLowerCase(),
          job_title: jobTitle.replace('new',''), // job title extracted from result page
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
    return {'source': 'indeed', 'data': data }
  }
}
