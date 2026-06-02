import {extractData} from "../tools.js";
import {resolveCityToCountry} from "../tools.js";

export const SIMPLYHIRED = {
  search_results_page_elements: {
    retrieveElementsOfAllAdsFromResultPage: function (document) {
      return $(document).find('.SerpJob-jobCard') // 11 job ads per page
    },
    getJobAdUrl: function (jobAdEl, baseURL) {
      return baseURL + $(jobAdEl).find('.card-link').attr('href');
    },
    getJobTitle: function(jobAdEl) {
      return $(jobAdEl).find('.jobposting-title').text().trim();
    },
    getJobAdSummary: function (jobAdEl) {
      return $(jobAdEl).find('.jobposting-snippet').text().trim(); // ad summary
    },
    getCompanyName(jobAdEl) {
      return $(jobAdEl).find('.jobposting-company').text().trim();
    },
    getJobAdLocation(jobAdEl) {
      return $(jobAdEl).find('.jobposting-location').text().trim();
    },
    getJobAdAge(jobAdEl) {
      return $(jobAdEl).find('.SerpJob-timestamp').text().trim();
    },
    getAdId: function (jobAdEl) {
      return $(jobAdEl).attr('data-jobkey'); // each ad has an unique id which can used for caching
    },
    getSinglePaginationSearchResultURL: function (document, baseUrl, pageNum, limit) {
      let list = $(document).find('.pagination-list').find('li');
      let _limit = Math.min(limit, list.length);
      let url;
      if (pageNum <= _limit) {
        url = baseUrl + $(list[pageNum]).find('a').attr('href');
      }
      return url
    },
    extractLinksFromPagination: function (document, searchUrl, limit) {
      let hrefs = [];
      let footerLi = $(document).find('.Pagination-link');
      let page = 2;
      if (footerLi.length) { // check if there are links
        for (let i = 0; i <= limit - 1; i++) {
          hrefs.push(searchUrl + 'pn=' + page.toString());
          page += 1;
        }
      }
      if (hrefs.length > SIMPLYHIRED_LIMIT) {
        return hrefs.slice(0, SIMPLYHIRED_LIMIT)
      } else {
        return hrefs
      }
    }
  },
  job_ad_page_elements: {
    extractJobTitle: function (document, position) {
      let jobTitle = $(document).find('.viewjob-jobTitle');
      if (jobTitle.length) {
        return $(jobTitle).text();
      } else {
        return position
      }
    },
    extractCompanyName: function (document) {
      // return $('.after-company').parent().text().replace(' - ','');
      let companyNameEl = $(document).find('.viewjob-labelWithIcon-icon.fas.fa-building')[0];
      if (companyNameEl) {
        return companyNameEl.nextSibling.textContent
      } else {
        return ''
      }
    },
    extractCompanyLogo: function (document, baseUrl) {
      let logo = $(document).find('.viewjob-company-logoImg');
      if (logo.length) {
        return baseUrl + $(logo).attr('src');
      } else {
        return null
      }
    },
    extractSalary: function (data) {
      return null
    },
    extractLocation: function (document) {
      let locationEl = $(document).find('.viewjob-labelWithIcon-icon.fas.fa-map-marker-alt')[0];
      if (locationEl) {
        return locationEl.nextSibling.textContent
      } else {
        return null
      }
    },
    extractPositionType: function (document) {
      let jobTypeIcon = $(document).find('.viewjob-labelWithIcon-icon.fas.fa-briefcase')[0];
      if (jobTypeIcon) {
        return jobTypeIcon.nextSibling.textContent
      } else {
        return null
      }
    },
    extractJobDescription: function (document) {
      return $(document).find('.viewjob-jobDescription').text();
    },
    extractTimePosted: function (document) {
      return $(document).find('.viewjob-age').text();
    },
    extractApplyLink: function (document) {
      let applyLink = $(document).find('.apply').attr('href');
      if (applyLink) {
        return applyLink
      } else {
        return null
      }
    }
  }
}

export const SIMPLYHIRED_COUNTRY_URLS = {
  'AU': 'https://www.simplyhired.com.au',
  'US': 'https://www.simplyhired.com',
  'GB': 'https://www.simplyhired.co.uk',
  'CA': null,
  'NZ': null
}

export const SIMPLYHIRED_LOGO_SRC = 'https://image4.owler.com/logo/simply-hired_owler_20190703_104557_large.png';

export const SIMPLYHIRED_LIMIT = 10;

export class SimplyhiredParser {

  #constructSearchUrl(baseUrl, position, location) {
    if (baseUrl) {
      return `${baseUrl}/search?q=${position.replaceAll(' ', '+')}&l=${location.replaceAll(' ', '+').replaceAll(',', '%2C')}&fdb=14&sb=dd`
    } else {
      return null
    }
  }

  constructor(city, position, skills, resume) {
    this.source = 'Simplyhired';
    this.resume = resume;
    this.skills = skills;
    this.sourceLogo = SIMPLYHIRED_LOGO_SRC;
    this.country = resolveCityToCountry(city);
    this.location = city;
    this.position = position;
    this.company = null;
    this.jobAge = null;
    this.companyLogo = null;
    this.raw_position = null;
    this.job_location = null;
    this.job_type = null;
    this.salary = null;
    this.limit = SIMPLYHIRED_LIMIT;
    this.isMoreThanLimit = false;
    this.paginationLinks = [];
    if (this.country) {
      this.baseUrl = SIMPLYHIRED_COUNTRY_URLS[this.country];
      this.searchUrl = this.#constructSearchUrl(this.baseUrl, this.position, this.location);
    } else {
      this.baseUrl = null;
      this.searchUrl = null;
    }
  }

  async #extractFirstPageDocumentAndPaginationLinks() {
    let document;
    if (this.searchUrl) {
      document = await extractData(this.searchUrl);
    }
    if (document) {
      let links = SIMPLYHIRED.search_results_page_elements.extractLinksFromPagination(document, this.baseUrl, this.limit);
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

  async #extractElementsOfJobAdsFromResultPages() {
    let data = await this.#extractFirstPageDocumentAndPaginationLinks(); // Extracts from from the search url
    let elementsOfAllJobs = [];
    let firstPageOfResults = data['document'];
    let linksOfResultPages = data['hrefs']; // excludes the first page
    let jobsFromFirstPage = SIMPLYHIRED.search_results_page_elements.retrieveElementsOfAllAdsFromResultPage(firstPageOfResults); // 26 job ads per page
    if (firstPageOfResults) {
      if (jobsFromFirstPage.length) {
        for (let i = 0; i < jobsFromFirstPage.length; i++) {
          elementsOfAllJobs.push(jobsFromFirstPage[i]);
        }
        let jobsOfRemainingResultPages = await this.#extractJobsFromResultPages(linksOfResultPages)
        if (jobsOfRemainingResultPages) {
          for (let j = 0; j < jobsOfRemainingResultPages.length; j++) {
            let jobsFromPage = SIMPLYHIRED.search_results_page_elements.retrieveElementsOfAllAdsFromResultPage(jobsOfRemainingResultPages[j]); // parses the document and collects all job elements
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
        let jobUrl = SIMPLYHIRED.search_results_page_elements.getJobAdUrl(element, this.baseUrl);
        let jobId = SIMPLYHIRED.search_results_page_elements.getAdId(element);
        let jobSummary = SIMPLYHIRED.search_results_page_elements.getJobAdSummary(element)
        let jobTitle = SIMPLYHIRED.search_results_page_elements.getJobTitle(element);
        data.push({
          position: jobTitle, // searched position
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
          job_age: this.jobAge,
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
      this.paginationLinks.push(this.searchUrl);
      let links = SIMPLYHIRED.search_results_page_elements.extractLinksFromPagination(document, this.searchUrl, this.limit);
      if (links.length) {
        if (this.limit <= links.length) {
          this.isMoreThanLimit = true;
          for (let i = 2; i <= this.limit; i++) {
            this.paginationLinks.push(links[i]);
          }
        } else {
          for (let i = 1; i < links.length; i++) {
            this.paginationLinks.push(links[i]);
          }
        }
        // console.log('LINKS (simplyhired):');
        // console.log(this.paginationLinks);
      }
    } else {
      // console.log('LINKS (simplyhired):');
      // console.log(this.paginationLinks);
      if (pageNumber <= this.limit) {
        document = await extractData(this.paginationLinks[pageNumber - 1]);
      }
    }
    if (document) {
      jobsFromPage = SIMPLYHIRED.search_results_page_elements.retrieveElementsOfAllAdsFromResultPage(document);
    }
    return jobsFromPage
  }

  async parseJobElementsFromSingleResultPage(pageNumber) {
    let elements = await this.#extractElementsOfJobAdsFromSingleResultPage(pageNumber);
    let data = [];
    if (elements) {
      for (let i = 0; i < elements.length; i++) {
        let element = elements[i];
        let jobUrl = SIMPLYHIRED.search_results_page_elements.getJobAdUrl(element, this.baseUrl);
        let jobId = SIMPLYHIRED.search_results_page_elements.getAdId(element);
        let jobSummary = SIMPLYHIRED.search_results_page_elements.getJobAdSummary(element);
        let companyName = SIMPLYHIRED.search_results_page_elements.getCompanyName(element);
        let location = SIMPLYHIRED.search_results_page_elements.getJobAdLocation(element);
        let jobAge = SIMPLYHIRED.search_results_page_elements.getJobAdAge(element);
        let jobTitle = SIMPLYHIRED.search_results_page_elements.getJobTitle(element);
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
          salary: this.salary, // salary extracted from result page
          country: this.country,
          source_logo: this.sourceLogo,
          skills: this.skills,
          resume: this.resume,
          job_age: jobAge,
        });
      }
    }
    return {'source': 'simplyhired', 'data': data}
  }
}
