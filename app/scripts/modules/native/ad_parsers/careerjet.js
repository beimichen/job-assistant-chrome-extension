import {extractData, resolveCityToCountry} from "../tools.js";


export let CAREERJET = {
  search_results_page_elements: {
    retrieveElementsOfAllAdsFromResultPage: function (jobAdEl) {
      return $(jobAdEl).find('.job.clicky'); // 20 ads per page
    },
    getJobTitle: function(jobAdEl) {
      return $(jobAdEl).find('a').text().trim();
    },
    getJobAdUrl: function (jobAdEl, baseUrl) {
      return baseUrl + $(jobAdEl).find('header').find('a').attr('href');
    },
    getJobAdSummary: function (jobAdEl) {
      return $(jobAdEl).find('.desc').text().trim();
    },
    getCompanyName: function(jobAdEl) {
      let companyEl = $(jobAdEl).find('.company');
      if (companyEl.length) {
        return $(companyEl).text().trim();
      } else {
        return null
      }
    },
    getJobAdLocation: function(jobAdEl) {
      return $(jobAdEl).find('.location').text().trim();
    },
    getJobAdAge: function (jobAdEl) {
      return $(jobAdEl).find('.badge.badge-r.badge-s').text().trim();
    },
    getJobAdSalary: function(jobAdEl) {
      let salaryEl = $(jobAdEl).find('.salary');
      if (salaryEl.length) {
        return $(salaryEl).text().trim();
      } else {
        return null
      }
    },
    getAdId: function (jobAdEl) {
      return $(jobAdEl).attr('data-url').replace('/jobad/', ''); // each ad has an unique id which can used for caching
    },
    getSinglePaginationSearchResultURL: function (searchUrl, pageNum, limit) {
      let url = null;
      if (pageNum <= limit) {
        url = searchUrl + `?p=${pageNum}`;
      }
      return url
    },
    extractLinksFromPagination: function (searchUrl, document, limit) {
      let nextPageLink = $(document).find('.more').find('a').attr('href'); // check if there are more ads
      if (nextPageLink) {
        let links = [];
        for (let i = 2; i <= limit; i++) {
          links.push(searchUrl + `?p=${i}`)
        }
        if (links.length) {
          return links
        } else {
          return null
        }
      } else {
        return null
      }
    }
  },
  job_ad_page_elements: {
    extractJobTitle: function (document) {
      return $(document).find('#job').find('header').find('h1').text();
    },
    extractCompanyName: function (document) {
      let companyEls = $(document).find('#job').find('.company');
      if (companyEls.length) {
        return $(companyEls[0]).text().trim();
      } else {
        return null
      }
    },
    extractCompanyLogo: function(document){
      let logo = $(document).find('#job').find('.lazy.logo.lazy-done');
      if (logo.length) {
        return $(logo).attr('src');
      } else {
        return null
      }
    },
    extractSalary: function (document) {
      // $('svg[xlink\\:href="#icon-money"]')
      let icons = $(document).find('use');
      let salary = null;
      if (icons.length) {
        for (let i = 0; i < icons.length; i++) {
          let svgXlink = $(icons[i]).attr('xlink:href');
          if (svgXlink === '#icon-money') {
            salary = icons[i].parentNode.parentNode.innerText.trim();
          }
        }
      }
      return salary
    },
    extractLocation: function (document) { // DONE - NOTE - location found in both single result page and global results page
      return $(document).find('#job').find('.details').find('span')[0].innerText
    },
    extractPositionType: function (document) {
      let icons = $(document).find('use');
      let duration = null;
      if (icons.length) {
        for (let i = 0; i < icons.length; i++) {
          let svgXlink = $(icons[i]).attr('xlink:href');
          if (svgXlink === '#icon-duration') {
            duration = icons[i].parentNode.parentNode.innerText.trim();
          }
        }
      }
      return duration
    },
    extractJobDescription: function (document) {
      return $(document).find('.content').text();
    },
    extractTimePosted: function (document) {
      return $(document).find('#job').find('.badge.badge-r.badge-s')[0].innerText // eg. 4 hours ago, 1 day ago, 2 days ago
    },
    extractApplyLink: function(document, baseUrl){
      let applyBtn = $(document).find('.nav').find('button.cj-apply.btn.btn-r.btn-primary.btn-apply');
      let applyLink = null;
      if (applyBtn.length) {
        applyLink = baseUrl + $(applyBtn).attr('data-url');
      } else {
        applyLink = baseUrl +  $(document).find(''.nav).find('.col.col-xs-8.col-m-6').find('a').attr('href');
      }
      return applyLink;
    }
  }
}

export let CAREERJET_COUNTRY_URLS = {
  'AU': 'https://www.careerjet.com.au',
  'US': 'https://www.careerjet.com',
  'GB': 'https://www.careerjet.co.uk',
  'CA': 'https://www.careerjet.ca',
  'NZ': 'https://www.careerjet.co.nz'
}

export const CAREERJET_LOGO_SRC = 'https://images.jobscore.com/careerjet.png';

export const CAREERJET_LIMIT = 5;

export class CareerjetParser {

  #constructSearchUrl(baseUrl, position, location) {
    return `${baseUrl}/search/jobs?s=${position.replaceAll(' ', '+')}&l=${location.replaceAll(' ', '+').replaceAll(',', '%2C')}&radius=25&sort=date`
  }

  constructor(city, position, skills, resume) {
    this.source = 'CareerJet';
    this.resume = resume;
    this.skills = skills;
    this.sourceLogo = CAREERJET_LOGO_SRC;
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
    this.limit = CAREERJET_LIMIT;
    this.isMoreThanLimit= false;
    this.paginationLinks = [];
    if (this.country) {
      this.baseUrl = CAREERJET_COUNTRY_URLS[this.country];
      this.searchUrl = this.#constructSearchUrl(this.baseUrl, this.position, this.location);
    } else {
      this.baseUrl = null;
      this.searchUrl = null;
    }
  }

  async #extractFirstPageDocumentAndPaginationLinks() {
    let document = await extractData(this.searchUrl);
    if (document) {
      let links = CAREERJET.search_results_page_elements.extractLinksFromPagination(document, this.baseUrl, this.limit);
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
    let jobsFromFirstPage = CAREERJET.search_results_page_elements.retrieveElementsOfAllAdsFromResultPage(firstPageOfResults); // 20 job ads per page
    if (firstPageOfResults) {
      if (jobsFromFirstPage.length) {
        for (let i = 0; i < jobsFromFirstPage.length; i++) {
          elementsOfAllJobs.push(jobsFromFirstPage[i]);
        }
        let jobsOfRemainingResultPages = await this.#extractJobsFromResultPages(linksOfResultPages)
        if (jobsOfRemainingResultPages) {
          for (let j = 0; j < jobsOfRemainingResultPages.length; j++) {
            let jobsFromPage = CAREERJET.search_results_page_elements.retrieveElementsOfAllAdsFromResultPage(jobsOfRemainingResultPages[j]); // parses the document and collects all job elements
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
        let jobUrl = CAREERJET.search_results_page_elements.getJobAdUrl(element, this.baseUrl);
        let jobId = CAREERJET.search_results_page_elements.getAdId(element);
        let jobSummary = CAREERJET.search_results_page_elements.getJobAdSummary(element);
        let companyName = CAREERJET.search_results_page_elements.getCompanyName(element);
        let location = CAREERJET.search_results_page_elements.getJobAdLocation(element);
        let jobAge = CAREERJET.search_results_page_elements.getJobAdAge(element);
        let jobSalary = CAREERJET.search_results_page_elements.getJobAdSalary(element);
        data.push({
          position: this.position, // searched position
          url: jobUrl,
          base_url: this.baseUrl,
          id: jobId,
          summary: jobSummary,
          source: this.source,
          job_title: this.raw_position, // job title extracted from result page
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
      for (let i=2;i <= this.limit; i++) {
        this.paginationLinks.push(CAREERJET.search_results_page_elements.getSinglePaginationSearchResultURL(this.searchUrl, i, this.limit));
      }
      // console.log('LINKS (careerjet):');
      // console.log(this.paginationLinks);
    } else {
      // console.log('LINKS (careerjet):');
      // console.log(this.paginationLinks);
      if (pageNumber <= this.limit) {
        document = await extractData(this.paginationLinks[pageNumber - 1]);
      }
    }
    if (document) {
      jobsFromPage = CAREERJET.search_results_page_elements.retrieveElementsOfAllAdsFromResultPage(document);
    }
    return jobsFromPage
  }

  async parseJobElementsFromSingleResultPage(pageNumber) {
    let elements =  await this.#extractElementsOfJobAdsFromSingleResultPage(pageNumber);
    let data = [];
    if (elements) {
      for (let i = 0; i < elements.length; i++) {
        let element = elements[i];
        let jobUrl = CAREERJET.search_results_page_elements.getJobAdUrl(element, this.baseUrl);
        let jobId = CAREERJET.search_results_page_elements.getAdId(element);
        let jobSummary = CAREERJET.search_results_page_elements.getJobAdSummary(element);
        let jobTitle = CAREERJET.search_results_page_elements.getJobTitle(element);
        let companyName = CAREERJET.search_results_page_elements.getCompanyName(element);
        let location = CAREERJET.search_results_page_elements.getJobAdLocation(element);
        let jobAge = CAREERJET.search_results_page_elements.getJobAdAge(element);
        let jobSalary = CAREERJET.search_results_page_elements.getJobAdSalary(element);
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
    return {'source': 'careerjet', 'data': data }
  }
}