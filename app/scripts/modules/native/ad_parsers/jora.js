import {extractData, resolveCityToCountry} from "../tools.js";

export let JORA = {
  search_results_page_elements: {
    retrieveElementsOfAllAdsFromResultPage: function (document) {
      let jobAds = $(document).find('.organic-job');
      if (jobAds.length) {
        return jobAds
      } else {
        return null
      }
    },
    getJobAdLocation: function (jobAdEl) {
      return $(jobAdEl).find('.job-location').text().trim();
    },
    getJobTitle: function(jobAdEl) {
      return $(jobAdEl).find('.job-title').text().trim();
    },
    getCompanyName: function (jobAdEl) {
      return $(jobAdEl).find('.job-company').text().trim();
    },
    getJobAdUrl: function (jobAdEl, baseUrl) {
      return baseUrl + $(jobAdEl).find('.job-link').attr('href'); // ad url needs appending to baseurl for full url
    },
    getJobAdAge: function (jobAdEl) {
      return $(jobAdEl).find('.job-listed-date').text().trim();
    },
    getJobAdSummary: function (jobAdEl) {
      return $(jobAdEl).find('.job-abstract').text().trim(); // ad summary
    },
    getAdId: function (jobAdEl) {
      return $(jobAdEl).attr('id'); // each ad has an unique id which can used for caching
    },
    getSinglePaginationSearchResultURL: function (document, baseUrl, pageNum, limit) {
      let footerLi = $(document).find('.pagination-page');
      let url = null;
      if (footerLi.length) {
        if (pageNum !== 0 && pageNum <= limit) {
          url = baseUrl + $(footerLi[pageNum - 1]).attr('href');
        }
      }
      return url
    },
    getJobAdSalary: function (jobAdEl) {
      let el = $(jobAdEl).find('.badge.-default-badge');
      if (el.length) {
        return $(el).find('.content').text().trim();
      } else {
        return ''
      }
    },
    extractLinksFromPagination: function (document, searchUrl, limit) {
      let hrefs = [];
      let footerLi = $(document).find('.pagination-page');
      if (footerLi.length) {
        let _limit = Math.min(limit, footerLi.length);
        let page = 2
        if (_limit > 0) {
          for (let i=0; i<=limit; i++) {
            let href = searchUrl + "&p=" + page.toString();
            hrefs.push(href);
            page += 1;
          }
        }
      }
      return hrefs
    }
  },
  job_ad_page_elements: {
    extractJobTitle: function (document) {
      return $(document).find('.job-title').text();
    },
    extractCompanyName: function (document) {
      return $(document).find('.company').text();
    },
    extractCompanyLogo: function () {
      return null
    },
    extractSalary: function (data) {
      return null
    },
    extractLocation: function (document) {
      return $(document).find('.location').text()
    },
    extractPositionType: function (document) {
      let badges = $(document).find('.-default-badge'); // there can be more than one badge - position type text is next to the badge
      if (badges) {
        if (badges.length > 1) {
          return $(badges[badges.length - 1]).find('.content').text();
        } else {
          return $(badges[0]).find('.content').text();
        }
      } else {
        return null
      }
    },
    extractJobDescription: function (document) {
      return $(document).find('#job-description-container').text();
    },
    extractTimePosted: function (document) {
      return $(document).find('.listed-date').text();
    },
    extractApplyLink: function (document) {
      return $(document).find('.apply-button').attr('href');
    }
  }
}

export let JORA_COUNTRY_URLS = {
  'AU': 'https://au.jora.com',
  'US': 'https://us.jora.com',
  'GB': 'https://uk.jora.com',
  'CA': 'https://ca.jora.com',
  'NZ': 'https://nz.jora.com'
}

export const JORA_LOGO_SRC = 'https://cpp-prod-seek-company-image-uploads.s3.ap-southeast-2.amazonaws.com/826949/logo/db4ba761-cd44-11ea-bfc5-69c296d2dc49.jpeg'

export const JORA_LIMIT = 10;

export function joraSearchUrl(baseUrl, position, location) {
  return baseUrl + 'j?l=' + location.replaceAll(' ', '+').replaceAll(',', '%2C') + '&q=' + position.replaceAll(' ', '+') + +'&sp=homepage&st=date'
}

export class JoraParser {

  #constructSearchUrl(baseUrl, position, location) {
    location = location.replaceAll(' ', '+').replaceAll(',', '%2C');
    position = position.replaceAll(' ', '+');
    return `${baseUrl}/j?a=14&l=${location}&q=${position}&sp=facet_listed_date&st=date`
  }

  constructor(city, position, skills, resume) {
    this.source = 'Jora';
    this.resume = resume;
    this.skills = skills;
    this.sourceLogo = JORA_LOGO_SRC;
    this.country = resolveCityToCountry(city);
    this.location = city;
    this.position = position;
    this.company = null;
    this.jobAge = null;
    this.companyLogo = null;
    this.raw_position = null;
    this.job_location = null;
    this.job_type = null;
    this.limit = JORA_LIMIT;
    this.salary = null;
    this.isMoreThanLimit = false;
    this.paginationLinks = [];
    if (this.country) {
      this.baseUrl = JORA_COUNTRY_URLS[this.country];
      this.searchUrl = this.#constructSearchUrl(this.baseUrl, this.position, this.location);
    } else {
      this.baseUrl = null;
      this.searchUrl = null;
    }
  }

  async #extractFirstPageDocumentAndPaginationLinks() {
    let document = await extractData(this.searchUrl);
    if (document) {
      let links = JORA.search_results_page_elements.extractLinksFromPagination(document, this.baseUrl, this.limit);
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
    let jobsFromFirstPage = JORA.search_results_page_elements.retrieveElementsOfAllAdsFromResultPage(firstPageOfResults); // 26 job ads per page
    if (firstPageOfResults) {
      if (jobsFromFirstPage.length) {
        for (let i = 0; i < jobsFromFirstPage.length; i++) {
          elementsOfAllJobs.push(jobsFromFirstPage[i]);
        }
        let jobsOfRemainingResultPages = await this.#extractJobsFromResultPages(linksOfResultPages)
        if (jobsOfRemainingResultPages) {
          for (let j = 0; j < jobsOfRemainingResultPages.length; j++) {
            let jobsFromPage = JORA.search_results_page_elements.retrieveElementsOfAllAdsFromResultPage(jobsOfRemainingResultPages[j]); // parses the document and collects all job elements
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
        let jobUrl = JORA.search_results_page_elements.getJobAdUrl(element, this.baseUrl);
        let jobId = JORA.search_results_page_elements.getAdId(element);
        let jobSummary = JORA.search_results_page_elements.getJobAdSummary(element)
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
          job_age: this.jobAge,
        })
      }
    }
    return data
  }

  async #extractElementsOfJobAdsFromSingleResultPage(pageNumber) {
    let jobsFromPage = [];
    let document = null;
    let parsedDocument = null;
    if (pageNumber === 1) {
      document = await extractData(this.searchUrl);
      let matches = document.toString().match(/<div class="jobresults" id="jobresults">(.*?)<\/div><div class="modal" data-closed="true" data-dismissible="true" id="suggest-better-alert-modal">/g);
      if (matches) {
        parsedDocument = matches[0].replace('</div><div class="modal" data-closed="true" data-dismissible="true" id="suggest-better-alert-modal">', '');
      }
      let links = [];
      if (parsedDocument) {
        links = JORA.search_results_page_elements.extractLinksFromPagination(parsedDocument, this.searchUrl, this.limit);
      }
      if (links.length) {
        this.paginationLinks.push(this.searchUrl);
        for (let i = 0; i <= this.limit; i++) {
          this.paginationLinks.push(links[i]);
        }
      }
    } else {
      if (pageNumber <= this.limit && this.paginationLinks.length) {
        document = await extractData(this.paginationLinks[pageNumber - 1]);
        let matches = document.toString().match(/<div class="jobresults" id="jobresults">(.*?)<\/div><div class="modal" data-closed="true" data-dismissible="true" id="suggest-better-alert-modal">/g);
        if (matches) {
          parsedDocument = matches[0].replace('</div><div class="modal" data-closed="true" data-dismissible="true" id="suggest-better-alert-modal">', '');
        }
      }
    }
    if (parsedDocument) {
      jobsFromPage = JORA.search_results_page_elements.retrieveElementsOfAllAdsFromResultPage(parsedDocument);
    }
    return jobsFromPage
  }

  async parseJobElementsFromSingleResultPage(pageNumber) {
    let elements = await this.#extractElementsOfJobAdsFromSingleResultPage(pageNumber);
    let data = [];
    if (elements) {
      for (let i = 0; i < elements.length; i++) {
        let element = elements[i];
        let jobUrl = JORA.search_results_page_elements.getJobAdUrl(element, this.baseUrl);
        let jobId = JORA.search_results_page_elements.getAdId(element);
        let jobSummary = JORA.search_results_page_elements.getJobAdSummary(element);
        let companyName = JORA.search_results_page_elements.getCompanyName(element);
        let location = JORA.search_results_page_elements.getJobAdLocation(element);
        let jobTitle = JORA.search_results_page_elements.getJobTitle(element);
        let jobAge = JORA.search_results_page_elements.getJobAdAge(element);
        let jobSalary = JORA.search_results_page_elements.getJobAdSalary(element);
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
    return {'source': 'jora', 'data': data}
  }
}
