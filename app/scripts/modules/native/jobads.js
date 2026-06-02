import {storage} from "./storage.js";
import {tagin} from "../third_party/tagin.min.js";
import {wizard} from "./wizard.js";
import {calculateTimePosted, extractData, findSourceOfAd, randDelay} from "./tools.js";
import {fetchS3File, uploadToS3} from "./s3.js";
import {createCoverLetter} from "./coverletter.js";
import {handleZipRedirect} from "./ad_parsers/ziprecruiter.js";

export function addJobCards(document, jobData) {
  $('.jobs-none').remove();
  for (let i = 0; i < jobData.length; i++) {
    let newCards = true;
    let hashId = jobData[i]['hash_id'];
    let fileName = jobData[i]['filename'];
    let privateData = JSON.parse(localStorage.getItem('jobassistantCoverLetter_' + fileName))
    let match_score = privateData['match_score'];
    addSingleJobCard(document, jobData[i], match_score, newCards);
  }
}

// We split the data that's considered sensntive like a cover letter containing the user's name and store it only locally
// Public data is data like job ad text which gets stored in both local memory and our s3 bucket for future usage
export function separateDataPublicPrivate(data) {
  if (data) {
    let publicData = {
      source: data['source'],
      source_logo: data['source_logo'],
      hash_id: data['hash_id'],
      job_title: data['job_title'],
      summary: data['summary'],
      requirements: data['requirements'],
      company: data['company'],
      location: data['location'],
      company_logo: data['company_logo'],
      salary: data['salary'],
      time_posted: data['time_posted'],
      calculated_date_of_time_posted: data['calculated_date_of_time_posted'],
      employment_type: data['employment_type'],
      description: data['description'],
      apply_btn_url: data['apply_btn_url'],
      external_apply_url: data['external_apply_url'],
      extracted_skills: data['extracted_skills'],
      sponsered: data['sponsered'],
      filename: data['filename'],
    }
    let privateData = {
      user_id: data['user_id'],
      raw_job_title: data['raw_job_title'],
      reconciled_job_title: data['reconciled_job_title'],
      matched_skills: data['matched_skills'],
      matched_score: data['match_score'],
      inserted_position: data['position_inserted'],
      topics_of_interest_extracted_from_ad: data['topics_of_interest_extracted_from_ad'],
      visited: data['visited'],
      apply_clicked: data['apply_clicked'],
      read: data['read'],
      recommended: data['recommended'],
      favourite: data['favourite'],
      cover_letter: data['cover_letter'],
      hiring_manager: '',
      cover_letter_edited: '',
      cover_letter_html: '',
      calculated_date_of_time_posted: data['calculated_date_of_time_posted'],
      filename: data['filename'],
      hash_id: data['hash_id'],
    }
    return {private: privateData, public: publicData}
  } else {
    return null
  }
}

export function sortPrivateData(coverLetterData, publicData) {
  return {
    user_id: null,
    raw_job_title: coverLetterData['raw_job_title'],
    reconciled_job_title: coverLetterData['reconciled_job_title'],
    matched_skills: coverLetterData['matched_skills'],
    matched_score: coverLetterData['match_score'],
    inserted_position: coverLetterData['position_inserted'],
    topics_of_interest_extracted_from_ad: coverLetterData['topics_of_interest_extracted_from_ad'],
    visited: false,
    apply_clicked: false,
    read: false,
    recommended: false,
    favourite: false,
    cover_letter: coverLetterData['coverletter_text'],
    hiring_manager: '',
    cover_letter_edited: '',
    cover_letter_html: '',
    calculated_date_of_time_posted: publicData['calculated_date_of_time_posted'],
    filename: publicData['filename'],
    hash_id: publicData['hash_id']
  }
}

export class JobAdIngester {
  constructor(url, searchTerm, resume, location, skills, cityLookup) {
    if (url) {
      this.source = findSourceOfAd(url);
    } else {
      this.source = null;
    }
    this.resume = resume;
    this.url = url; // string or null - null is the user is using search instead of scraping from a job ad page
    this.searchTerm = searchTerm; // string or null - null is for when the user isn't using our job search function
    this.location = location; // string or null - null is for when the user isn't using our job search function
    this.skills = skills;
    if (cityLookup.includes(location)) {
      this.country = cityLookup[location];
    } else {
      this.country = null;
    }
  }

  async checkCache(urls, filenames) {
    let instance = this;
    let urlsWithoutData = [];
    for (let i = 0; i < filenames.length; i++) {
      let filename = filenames[i];
      let localData = storage.jobAds.retrieveAdLocally(filename);

      function checkFile(filename) {
        return new Promise((resolve, reject) => {
          $.when(fetchS3File(filename)).done(function (_response) {
            let publicData = _response;
            $.when(createCoverLetter(publicData['job_title'], publicData, null, instance.skills)).done(
              function (__response) {
                let privateData = sortPrivateData(__response, publicData);
                storage.jobAds.storeAdLocally(publicData['hash_id'], filename, publicData);
                storage.coverletter.storeCoverLetterLocally(publicData['hash_id'], filename, privateData);
                loadJobAdBody();
                resolve(null);
              }
            ).fail(
              function () {
                resolve(urls[i]);
              }
            )
          }).fail(function () {
            // console.log('URL not found in cache:');
            // console.log(urls[i]);
            resolve(urls[i]);
          })
        })
      }

      if (localData) {
        console.log('file already exists...');
      } else {
        urlsWithoutData.push(
          checkFile(filename)
        )
      }
    }
    return await Promise.all(urlsWithoutData);
  }

  getSearchJobSites() {
    let indeedUrl = null
    if (this.country === null || this.country === 'US') {
      indeedUrl = 'https://www.indeed.com/';
    } else if (this.country === 'Australia') {
      indeedUrl = 'https://au.indeed.com/'
    } else if (this.country === 'United States') {
      indeedUrl = 'https://www.indeed.com/'
    } else if (this.country === 'United Kingdom') {
      indeedUrl = 'https://uk.indeed.com/'
    } else if (this.country === 'New Zealand') {
      indeedUrl = 'https://nz.indeed.com/'
    } else if (this.country === 'Canada') {
      indeedUrl = 'https://ca.indeed.com/'
    }
    return {
      'indeed': indeedUrl
    }
  }

  parseAdData(source, html, url, position, resume, summary, requirements, skills, filename, instance) {
    return new Promise((resolve, reject) => {
      if (source === 'indeed') {
        instance.parseIndeedAd(html, url, position, resume, summary, requirements, skills, filename).then(
          //TODO: parse private public here and resolve response
          function (response) {
            let data = separateDataPublicPrivate(response)
            resolve(data);
          }
        )
      }
    })
  }
}

/*** NEW CODE ***/

import {SIMPLYHIRED, SIMPLYHIRED_LIMIT, SimplyhiredParser} from "./ad_parsers/simplyhired.js";
import {INDEED, INDEED_LIMIT, IndeedParser} from "./ad_parsers/indeed_new.js";
import {GLASSDOOR, GLASSDOOR_LIMIT, GlassDoorParser} from "./ad_parsers/glassdoor.js";
import {ZIPRECRUITER, ZIPRECRUITER_LIMIT, ZipRecruiterParser} from "./ad_parsers/ziprecruiter.js";
import {JORA, JORA_LIMIT, JoraParser} from "./ad_parsers/jora.js";
import {CAREERJET, CAREERJET_LIMIT, CareerjetParser} from "./ad_parsers/careerjet.js";
import {createHashId} from "../third_party/hash.js";

export async function fetchFromAllJobSources(city, position, skills, resume) {
  let promises = [];
  let simplyhired = new SimplhiredResultPageParser(city, position, skills, resume);
  promises.push(simplyhired.parseJobElements()); // returns []
  let ziprecruiter = new ZipRecruiterResultPageParser(city, position, skills, resume)
  promises.push(ziprecruiter.parseJobElements()); // returns []
  //TODO: do the rest - glassdoor, indeed, etc
  return await Promise.all(promises);
}

export function alternateJobAds(jobs) {
  let indeed = jobs[0], simplyhired = jobs[1], ziprecruiter = jobs[2], glassdoor = jobs[3], jora = jobs[4], careerjet = jobs[5];
  let jobAds = [];
  const longest = Math.max(indeed.length, simplyhired.length, ziprecruiter.length, glassdoor.length, jora.length, careerjet.length)
  for (let i = 0; i < longest; i++) {
    let indeedAds, simplyhiredAds, ziprecruiterAds, glassdoorAds, joraAds, careerjetAds;
    if(indeed[i].length) {
      indeedAds = indeed[i]
    } else {
      indeedAds = null
    }
    if(simplyhired[i].length) {
      simplyhiredAds = simplyhired[i]
    } else {
      simplyhiredAds = null
    }
    if(ziprecruiter[i].length) {
      ziprecruiterAds = ziprecruiter[i]
    } else {
      ziprecruiterAds = null
    }
    if(glassdoor[i].length) {
      glassdoorAds = glassdoor[i]
    } else {
      glassdoorAds = null
    }
    if(jora[i].length) {
      joraAds = jora[i]
    } else {
      joraAds = null
    }
    if(careerjet[i].length) {
      careerjetAds = careerjet[i]
    } else {
      careerjetAds = null
    }
    jobAds.push(indeedAds, simplyhiredAds, ziprecruiterAds, glassdoorAds, joraAds, careerjetAds);
  }
  return jobAds
}

export function segmentAdsIntoBatches(ads, chunkSize) {
  Object.defineProperty(Array.prototype, 'chunk', {
    value: function (chunkSize) {
      var R = [];
      for (var i = 0; i < this.length; i += chunkSize)
        R.push(this.slice(i, i + chunkSize));
      return R;
    },
    configurable: true
  });
  return ads.chunk(chunkSize)
}

export async function jobAdQueueManager(jobads) {
  let promises = [];
  for (let i = 0; i < jobads.length; i++) {
    if (jobads[i]) {
      let _jobad = new JobAd(jobads[i]);
      promises.push(_jobad.parseJobAd());
    }
  }
  return await Promise.all(promises).then(function (res) {
    return res
  })
}

export async function jobAdResultPageQueue(instances, pageNumber) {
  let promises = [];
  for (let i=0; i< instances.length;i++) {
    let instance = instances[i]
    if (instance) {
      promises.push(instance.parseJobElementsFromSingleResultPage(pageNumber)); // returns {source: source, data: []} - data contains array of jobs, and an emtpy array if there are no jobs
    }
  }
  return await Promise.all(promises).then(function (res) {
    let queue = {
      'indeed': [],
      'ziprecruiter':[],
      'jora': [],
      'careerjet': [],
      'simplyhired':[],
      'glassdoor': []
    };
    for (let i=0;i<res.length;i++) {
      let source = res[i]['source'];
      let data = res[i]['data'];
      if (data.length) {
        queue[source] = data;
      }
    }
    return queue
  })
}

// export async function searchJobAds(city, position, skills, resume) {
//   // let lowerLimit = Math.min(INDEED_LIMIT,JORA_LIMIT,CAREERJET_LIMIT,GLASSDOOR_LIMIT,ZIPRECRUITER_LIMIT, SIMPLYHIRED_LIMIT);
//   let limit = Math.max(INDEED_LIMIT,JORA_LIMIT,CAREERJET_LIMIT,GLASSDOOR_LIMIT,ZIPRECRUITER_LIMIT, SIMPLYHIRED_LIMIT);
//   let indeed = new IndeedParser(city, position, skills, resume);
//   let ziprecruiter = new ZipRecruiterParser(city, position, skills, resume);
//   let jora = new JoraParser(city, position, skills, resume);
//   let careerjet = new CareerjetParser(city, position, skills, resume);
//   let simplyhired = new SimplyhiredParser(city, position, skills, resume);
//   let glassdoor = new GlassDoorParser(city, position, skills, resume);
//
//   for (let i=0;i<limit;i++) {
//     let pageNumber = i + 1;
//     if (pageNumber > GLASSDOOR_LIMIT) {
//       glassdoor = null;
//     }
//     if (pageNumber > INDEED_LIMIT) {
//       indeed = null;
//     }
//     if (pageNumber > ZIPRECRUITER_LIMIT) {
//       ziprecruiter = null;
//     }
//     if (pageNumber > JORA_LIMIT) {
//       jora = null;
//     }
//     if (pageNumber > CAREERJET_LIMIT) {
//       careerjet = null;
//     }
//     if (pageNumber > SIMPLYHIRED_LIMIT) {
//       simplyhired = null;
//     }
//     let jobAdQueue = {
//       'indeed': [],
//       'ziprecruiter': [],
//       'jora': [],
//       'careerjet': [],
//       'simplyhired': [],
//       'glassdoor': [],
//     };
//     let jobAds = await jobAdResultPageQueue([ // returns job ad data in arrays
//       {'indeed':indeed},
//       {'ziprecruiter':ziprecruiter},
//       {'jora':jora},
//       {'careerjet':careerjet},
//       {'simplyhired':simplyhired},
//       {'glassdoor': glassdoor},
//     ], pageNumber);
//     let largestNumberOfAds = Math.max(jobAds['indeed'].length, jobAds['jora'].length,jobAds['ziprecruiter'].length, jobAds['simplyhired'], jobAds['careerjet'],jobAds['glassdoor']);
//     if (jobAds['indeed'].length <= largestNumberOfAds) {
//       let overflow = [];
//       let difference = largestNumberOfAds - jobAds['indeed'].length;
//       if (difference > 0) {
//         for (let k=0; k< difference; k++) {
//           overflow.push(null);
//         }
//       }
//       jobAdQueue['indeed'] = jobAds['indeed'].concat(overflow);
//     }
//     if (jobAds['jora'].length <= largestNumberOfAds) {
//       let overflow = [];
//       let difference = largestNumberOfAds - jobAds['jora'].length;
//       if (difference > 0) {
//         for (let k = 0; k < difference; k++) {
//           overflow.push(null);
//         }
//       }
//       jobAdQueue['jora'] = jobAds['jora'].concat(overflow);
//     }
//     if (jobAds['ziprecruiter'].length <= largestNumberOfAds) {
//       let overflow = [];
//       let difference = largestNumberOfAds - jobAds['ziprecruiter'].length;
//       if (difference > 0) {
//         for (let k = 0; k < difference; k++) {
//           overflow.push(null);
//         }
//       }
//       jobAdQueue['ziprecruiter'] = jobAds['ziprecruiter'].concat(overflow);
//     }
//     if (jobAds['simplyhired'].length <= largestNumberOfAds) {
//       let overflow = [];
//       let difference = largestNumberOfAds - jobAds['simplyhired'].length;
//       if (difference > 0) {
//         for (let k = 0; k < difference; k++) {
//           overflow.push(null);
//         }
//       }
//       jobAdQueue['simplyhired'] = jobAds['simplyhired'].concat(overflow);
//     }
//     if (jobAds['careerjet'].length <= largestNumberOfAds) {
//       let overflow = [];
//       let difference = largestNumberOfAds - jobAds['careerjet'].length;
//       if (difference > 0) {
//         for (let k=0; k< difference; k++) {
//           overflow.push(null);
//         }
//       }
//       jobAdQueue['careerjet'] = jobAds['careerjet'].concat(overflow);
//     }
//     if (jobAds['glassdoor'].length <= largestNumberOfAds) {
//       let overflow = [];
//       let difference = largestNumberOfAds - jobAds['glassdoor'].length;
//       if (difference > 0) {
//         for (let k = 0; k < difference; k++) {
//           overflow.push(null);
//         }
//       }
//       jobAdQueue['glassdoor'] = jobAds['glassdoor'].concat(overflow);
//     }
//     for (let j=0;j<largestNumberOfAds;j++) {
//       let min;
//       let max;
//       if (j === 0 && i === 0) {
//         min = 1;
//         max = 3;
//       } else {
//         min = 2;
//         max = 8;
//       }
//       let randNum = Math.random() * (max - min + 1) + min;
//       let indeedAds = jobAdQueue['indeed'][j];
//       let joraAds = jobAdQueue['jora'][j];
//       let simplyhiredAds = jobAdQueue['simplyhired'][j];
//       let ziprecruiterAds = jobAdQueue['ziprecruiter'][j];
//       let careerjetAds = jobAdQueue['careerjet'][j];
//       let glassdoorAds = jobAdQueue['glassdoor'][j];
//       await randDelay(randNum);
//       let parsedAds = await jobAdQueueManager([indeedAds,joraAds,simplyhiredAds,ziprecruiterAds,careerjetAds,glassdoorAds]);
//       if (parsedAds) {
//         loadJobAdBody('loading'); // message passed in > 'loading'
//         jobAdsHeaderHandler(true);
//       }
//     }
//   }
//   jobAdsHeaderHandler(false);
// }

export class JobAd {
  constructor(data) { //position, data, resume, skills
    this.position = data['position'];
    this.resume = data['resume'];
    this.skills = data['skills'];
    this.id = data['id'];
    this.url = data['url'];
    this.summary = data['summary'];
    this.source = data['source'];
    this.country = data['country'];
    this.sourceLogo = data['source_logo'];
    this.rawJobTitle = data['job_title'];
    this.jobType = data['job_type'];
    this.jobAge = data['job_age'];
    this.salary = data['salary'];
    this.jobLocation = data['job_location'];
    this.company = data['company_name'];
    this.companyLogo = data['company_logo'];
    this.baseUrl = data['base_url'];
    this.data = data;
    if (this.source.toString().toLowerCase() === 'simplyhired') {
      this.parser = SIMPLYHIRED
    } else if (this.source.toString().toLowerCase() === 'glassdoor') {
      this.parser = GLASSDOOR
    } else if (this.source.toString().toLowerCase() === 'indeed') {
      this.parser = INDEED
    } else if (this.source.toString().toLowerCase() === 'ziprecruiter') {
      if (data['country'] === 'AU' || data['country'] === 'NZ' || data['country'] === 'GB') {
        this.parser = ZIPRECRUITER.GLOBAL;
      } else {
        this.parser = ZIPRECRUITER.US_and_CA;
      }
    } else if (this.source.toString().toLowerCase() === 'jora') {
      this.parser = JORA
    } else if (this.source.toString().toLowerCase() === 'careerjet') {
      this.parser = CAREERJET
    } else {
      this.parser = null
    }
  }

  async parseJobAd() { // Parses data and stores it
    let data = await this.#extractData();
    if (data) {
      return data
    } else {
      return null
    }
  }

  async #extractData() {
    let coverLetterData = null;
    let jobFilename = this.id + '.json';
    let coverLetterFilename = 'jobassistantCoverLetter_' + jobFilename;
    let localStoredAd = localStorage.getItem(jobFilename);
    let localStoredCoverletter = localStorage.getItem(coverLetterFilename);
    if (localStoredCoverletter) {
      coverLetterData = JSON.parse(localStoredCoverletter);
    }
    if (localStoredAd) { // check for local cache first
      console.log('Data is cached locally');
      let jobAdData = JSON.parse(localStoredAd);
      if (!coverLetterData) {
        coverLetterData = await this.#createCoverLetter(jobAdData, jobAdData['hash_id'], jobAdData['calculated_date_of_time_posted']);
      }
      if (jobAdData && coverLetterData) {
        jobAdData['extracted_skills'] = coverLetterData['skills_extracted_from_ad'];
        jobAdData['matched_skills'] = coverLetterData['matched_skills'];
        jobAdData['matched_score'] = coverLetterData['match_score'];
      }
      localStorage.setItem(jobFilename, JSON.stringify(jobAdData));
      storage.coverletter.storeCoverLetterLocally(jobAdData['hash_id'], jobFilename, coverLetterData);
      return {
        job_ad: jobAdData,
        cover_letter: coverLetterData
      }
    } else {
      try {
        console.log('Data is cached in s3');
        let jobAdData = await fetchS3File(jobFilename); // check for s3 cache
        // jobAdData = JSON.parse(jobAdData);
        if (!coverLetterData) {
          coverLetterData = await this.#createCoverLetter(jobAdData, jobAdData['hash_id'], jobAdData['calculated_date_of_time_posted']);
        }
        if (jobAdData && coverLetterData) {
          jobAdData['extracted_skills'] = coverLetterData['skills_extracted_from_ad'];
          jobAdData['matched_skills'] = coverLetterData['matched_skills'];
          jobAdData['match_score'] = coverLetterData['match_score'];
        }
        localStorage.setItem(jobFilename, JSON.stringify(jobAdData));
        storage.coverletter.storeCoverLetterLocally(jobAdData['hash_id'], jobFilename, coverLetterData);
        return {
          job_ad: jobAdData,
          cover_letter: coverLetterData
        }
      } catch (err) {
        try {
          console.log('Data is not cached in s3');
          let jobAdData;
          let html = await extractData(this.url);
          if (this.source.toLowerCase() === 'ziprecruiter') {
            html = await handleZipRedirect(html, this.url);
            console.log('ziprecruiter redirect html:');
            console.log(html);
            jobAdData = this.#parseData(html['content'], html['source']);
          } else {
            jobAdData = this.#parseData(html, this.source);
          }
          console.log('AD PARSED:');
          console.log(jobAdData);
          if (jobAdData) {
            console.log('JOB AD DATA');
            console.log(jobAdData);
            let bucket = 'YOUR_S3_BUCKET';
            uploadToS3(jobFilename, JSON.stringify(jobAdData), bucket);
            if (!coverLetterData) {
              coverLetterData = await this.#createCoverLetter(jobAdData, jobAdData['hash_id'], jobAdData['calculated_date_of_time_posted']);
              if (coverLetterData) {
                storage.coverletter.storeCoverLetterLocally(jobAdData['hash_id'], jobFilename, coverLetterData);
                console.log('Successfully created cover letter for ', this.source);
              } else {
                console.log('FAILED CREATING COVER LETTER FROM SOURCE:', this.source, this.url);
              }
            }
            if (jobAdData && coverLetterData) {
              jobAdData['extracted_skills'] = coverLetterData['skills_extracted_from_ad'];
              jobAdData['matched_skills'] = coverLetterData['matched_skills'];
              jobAdData['match_score'] = coverLetterData['match_score'];
            }
            localStorage.setItem(jobFilename, JSON.stringify(jobAdData));
            return {
              job_ad: jobAdData,
              cover_letter: coverLetterData
            }
          } else {
            return null
          }
        } catch (_err) {
          return null
        }
      }
    }
  }

  #parseData(html, source) {
    if (html) {
      let data = null;
      let filename = this.id + '.json';
      let sourceParser;
      let extractedSkills = [];
      let dateOfPosted;
      let jobDescription;
      let applyLink;
      let jobTitle = this.rawJobTitle, companyName = this.company, companyLogo = this.companyLogo,
        location = this.jobLocation, salary = this.salary, positionType = this.jobType,
        timePosted = this.jobAge, hashId = null;
      if (source.toLowerCase() === 'glassdoor') {
        sourceParser = GLASSDOOR;
        console.log('PARSING GLASSDOOR');
        // jobTitle = sourceParser.job_ad_page_elements.extractJobTitle(html);
        location = sourceParser.job_ad_page_elements.extractLocation(html);
        companyName = sourceParser.job_ad_page_elements.extractCompanyName(html);
        companyLogo = sourceParser.job_ad_page_elements.extractCompanyLogo(html);
        salary = sourceParser.job_ad_page_elements.extractSalary(html);
        positionType = sourceParser.job_ad_page_elements.extractPositionType(html);
        jobDescription = sourceParser.job_ad_page_elements.extractJobDescription(html);
        applyLink = sourceParser.job_ad_page_elements.extractApplyLink(html);
        extractedSkills = sourceParser.job_ad_page_elements.extractSkills(html);
      } else if (source.toLowerCase() === 'indeed') {
        sourceParser = INDEED;
        console.log('PARSING INDEED:');
        // console.log(html);
        jobDescription = sourceParser.job_ad_page_elements.extractJobDescription(html);
        jobTitle = sourceParser.job_ad_page_elements.extractJobTitle(html);
        companyName = sourceParser.job_ad_page_elements.extractCompanyName(html);
        companyLogo = sourceParser.job_ad_page_elements.extractCompanyLogo(html);
        // salary = sourceParser.job_ad_page_elements.extractSalary(html);
        // location = sourceParser.job_ad_page_elements.extractLocation(html);
        positionType = sourceParser.job_ad_page_elements.extractPositionType(html);
        // timePosted = sourceParser.job_ad_page_elements.extractTimePosted(html);
        // applyLink = sourceParser.job_ad_page_elements.extractApplyLink(html);
        applyLink = this.url;
      } else if (source.toLowerCase() === 'careerjet' || this.source.toLowerCase() === 'careerjet') {
        sourceParser = CAREERJET;
        console.log('PARSING CAREERJET');
        jobTitle = sourceParser.job_ad_page_elements.extractJobTitle(html);
        console.log(jobTitle);
        companyName = sourceParser.job_ad_page_elements.extractCompanyName(html);
        companyLogo = sourceParser.job_ad_page_elements.extractCompanyLogo(html);
        salary = sourceParser.job_ad_page_elements.extractSalary(html);
        location = sourceParser.job_ad_page_elements.extractLocation(html);
        jobDescription = sourceParser.job_ad_page_elements.extractJobDescription(html);
        positionType = sourceParser.job_ad_page_elements.extractPositionType(html);
        timePosted = sourceParser.job_ad_page_elements.extractTimePosted(html);
        applyLink = sourceParser.job_ad_page_elements.extractApplyLink(html);
      } else if (source.toLowerCase() === 'jora') { //job_ad_page_elements: extractJobTitle, extractCompanyName, extractCompanyLogo, extractSalary, extractLocation, extractPositionType, extractJobDescription, extractTimePosted, extractApplyLink
        sourceParser = JORA;
        console.log('PARSING JORA');
        companyName = sourceParser.job_ad_page_elements.extractCompanyName(html);
        companyLogo = sourceParser.job_ad_page_elements.extractCompanyLogo(html);
        salary = sourceParser.job_ad_page_elements.extractSalary(html);
        location = sourceParser.job_ad_page_elements.extractLocation(html);
        jobDescription = sourceParser.job_ad_page_elements.extractJobDescription(html);
        positionType = sourceParser.job_ad_page_elements.extractPositionType(html);
        timePosted = sourceParser.job_ad_page_elements.extractTimePosted(html);
        applyLink = sourceParser.job_ad_page_elements.extractApplyLink(html);
      } else if (source.toLowerCase() === 'simplyhired') {
        sourceParser = SIMPLYHIRED;
        console.log('PARSING SIMPLYHIRED');
        if (typeof this.data['company'] === 'object') {
          companyName = sourceParser.job_ad_page_elements.extractCompanyName(html)
        } else {
          companyName = this.data['company'];
        }
        // console.log(companyName);
        companyLogo = sourceParser.job_ad_page_elements.extractCompanyLogo(html, this.baseUrl);
        // salary = sourceParser.job_ad_page_elements.extractSalary(html);
        jobDescription = sourceParser.job_ad_page_elements.extractJobDescription(html);
        positionType = sourceParser.job_ad_page_elements.extractPositionType(html);
        timePosted = sourceParser.job_ad_page_elements.extractTimePosted(html);
        applyLink = sourceParser.job_ad_page_elements.extractApplyLink(html);
        location = this.jobLocation;
        // console.log(location);
      } else if (source.toLowerCase() === 'ziprecruiter') {
        console.log('PARSING ZIPRECRUITER');
        if (jobTitle === null || typeof jobTitle === 'undefined') {
          jobTitle = this.data['job_title'];
        } else {
          if (this.source.toLowerCase() === 'simplyhired') {
            jobTitle = this.parser.job_ad_page_elements.extractJobTitle(html, this.rawJobTitle);
          } else if (this.source.toLowerCase() !== 'ziprecruiter') {
            jobTitle = this.parser.job_ad_page_elements.extractJobTitle(html);
          }
        }
        if (this.country === 'AU' || this.country === 'NZ' || this.country === 'GB') {
          sourceParser = ZIPRECRUITER.GLOBAL;
          jobTitle = sourceParser.job_ad_page_elements.internal.extractJobTitle(html);
          location = sourceParser.job_ad_page_elements.internal.extractLocation(html, this.jobLocation);
          companyName = sourceParser.job_ad_page_elements.internal.extractCompanyName(html);
          jobDescription = sourceParser.job_ad_page_elements.internal.extractJobDescription(html);
          positionType = sourceParser.job_ad_page_elements.internal.extractPositionType(html);
          applyLink = sourceParser.job_ad_page_elements.internal.extractApplyLink(html, this.url);
          timePosted = sourceParser.job_ad_page_elements.internal.extractTimePosted(html);
        } else {
          sourceParser = ZIPRECRUITER.US_and_CA;
          jobTitle = sourceParser.job_ad_page_elements.internal.extractJobTitle(html);
          positionType = sourceParser.job_ad_page_elements.internal.extractJobType(html);
          jobDescription = sourceParser.job_ad_page_elements.internal.extractJobDescription(html);
          location = sourceParser.job_ad_page_elements.internal.extractLocation(html);
          companyName = sourceParser.job_ad_page_elements.internal.getCompanyName(html);
          companyLogo = sourceParser.job_ad_page_elements.internal.extractCompanyLogo(html);
          timePosted = sourceParser.job_ad_page_elements.internal.extractTimePosted(html);
        }
      } else if (source.toLowerCase() === 'hays') {
          let matches = html.scripts;
          console.log(matches);
          if (matches.length) {
            let match = matches[0].innerHTML;
            if (match) {
              jobDescription = JSON.parse(match)['description'];
              console.log(jobDescription);
            }
          }
      } else {
        jobDescription = ZIPRECRUITER.US_and_CA.job_ad_page_elements.external.extractJobDescription(html);
      }
      if (jobDescription !== null && jobDescription !== '' && typeof jobDescription !== 'undefined') {
        hashId = createHashId(jobDescription);
        if (!timePosted) {
          timePosted = 'posted a day ago';
        }
        if (!applyLink) {
          applyLink = this.url;
        }
        if (typeof companyName === 'undefined' || companyName === '' || companyName === null) {
          companyName = '[org]';
        }
        dateOfPosted = calculateTimePosted(timePosted);
        data = {
          source: this.source,
          url: this.url,
          source_logo: this.sourceLogo,
          job_title: jobTitle,
          summary: this.summary,
          requirements: null,
          company: companyName,
          location: location,
          company_logo: companyLogo,
          salary: salary,
          time_posted: timePosted,
          employment_type: positionType,
          description: jobDescription,
          apply_btn_url: applyLink,
          external_apply_url: this.url,
          sponsered: false,
          extracted_skills: extractedSkills,
          filename: filename,
          calculated_date_of_time_posted: dateOfPosted,
          hash_id: hashId,
        };
        console.log(data);
      }
      return data
    } else {
      return null
    }
  }

  async #createCoverLetter(data, hashId, dateOfPosted) {
    let filename = 'jobassistantCoverLetter_' + this.id + '.json';
    let coverletter = await this.#analyzeData(this.rawJobTitle, data, this.resume, this.skills, filename);
    if (coverletter) {
      return {
        raw_job_title: coverletter['raw_job_title'],
        reconciled_job_title: coverletter['reconciled_job_title'],
        matched_skills: coverletter['matched_skills'],
        matched_score: coverletter['match_score'],
        inserted_position: coverletter['position_inserted'],
        topics_of_interest_extracted_from_ad: coverletter['topics_of_interest_extracted_from_ad'],
        visited: false,
        apply_clicked: false,
        read: false,
        recommended: false,
        favourite: false,
        cover_letter: coverletter['coverletter_text'],
        hiring_manager: '',
        cover_letter_edited: '',
        cover_letter_html: coverletter['coverletter_html_full_styling'],
        calculated_date_of_time_posted: dateOfPosted,
        filename: filename,
        job_ad_id: this.id,
        hash_id: hashId
      };
    } else {
      return null
    }
  }

  async #analyzeData(position, data, resume, skills, filename) {
    let localStored = localStorage.getItem(filename);
    if (localStored) {
      return JSON.parse(localStored);
    } else {
      try {
        let _data = await createCoverLetter(position, data, resume, skills);
        return _data
      } catch {
        return null
      }
    }
  }
}


export function blacklistFilter(keywords, ads) {
  let filteredAds = [];
  for (let i = 0; i < ads.length; i++) {
    let ad = ads[i];
    let flagged = false;
    let adText = ad['description'].toLowerCase();
    // let skills = ad['extracted_skills'];
    // let company = ad['company'].split(' ');
    for (let j = 0; j < keywords.length; j++) {
      let word = keywords[j].toLowerCase();
      flagged = adText.includes(word);
      if (flagged === true) {
        break
      }
    }
    if (!flagged) {
      filteredAds.push(ad)
    }
  }
  let errMessage = null;
  if (!keywords.length) {
    errMessage = `Please type keywords you want excluded in the job results.`
  } else if (!filteredAds.length) {
    errMessage = `There are no ads that excludes those keywords. Please try again.`
  }
  return {ads: filteredAds, errMessage: errMessage};
}

export function timeFilter(time, ads) {
  let filteredAds = [];
  let currentDate = new Date();
  if (time === 0) {
    filteredAds = ads;
  } else {
    for (let i = 0; i < ads.length; i++) {
      let ad = ads[i];
      let dateOfAd = new Date(ad['calculated_date_of_time_posted']);
      let timeDifference = currentDate.getTime() - dateOfAd.getTime();
      let differenceInDays = timeDifference / (1000 * 3600 * 24);
      if (differenceInDays <= time) {
        filteredAds.push(ad);
      }
    }
  }
  let errMessage = null;
  if (!filteredAds.length) {
    errMessage = `There are no ads that are ${time} old. Please try again.`
  }
  return {ads: filteredAds, errMessage: errMessage};
}

export function keywordFilter(keywords, ads) {
  let filteredAds = [];
  for (let i = 0; i < ads.length; i++) {
    let ad = ads[i];
    let match = false;
    let adText = ad['description'].toLowerCase();
    // let skills = ad['extracted_skills'];
    // let company = ad['company'];
    for (let j = 0; j < keywords.length; j++) {
      let word = keywords[j].toLowerCase();
      match = adText.includes(word);
      if (match === false) {
        break
      }
    }
    if (match) {
      filteredAds.push(ad)
    }
  }
  let errMessage = null;
  if (!keywords.length) {
    errMessage = `Please type keywords you want included in the job results.`
  } else if (!filteredAds.length) {
    errMessage = `There are no ads that contain those keywords. Please try again.`
  }
  return {ads: filteredAds, errMessage: errMessage};
}



export function jobAdsHeaderHandler(loading) {
  let headerCenter = $('.header-center');
  if (loading) {
    $('#filter-results').addClass('hide');
    $('.header-right').find('#circle').removeClass('hide').addClass('show');
    if (storage.jobAds.numOfLocalJobAds() !== 0) {
      let done = storage.jobAds.numOfLocalJobAds();
      $('#filter-results').addClass('hide');
      $('.header-right').find('#circle').removeClass('hide').addClass('show');
      $('.header-center').find('h5').text(`Loading jobs... ${done} found`);
    } else {
      headerCenter.find('h5').text('Job Ads');
    }
  } else {
    $('.header-right').find('#circle').removeClass('show').addClass('hide');
    headerCenter.find('h5').text(`Job Ads (${storage.jobAds.numOfLocalJobAds()})`);
    if (!window.loadingStatus) {
      $('.stop-search-btn').addClass('hide').removeClass('show');
      $('#filter-results').removeClass('hide');
    }
  }
}

export function retrieveJobCardsFiltered(ads, errMessage) {
  let headerCenter = $('.header-center');
  if (ads.length) {
    let cache = [];
    for (let i = 0; i < ads.length; i++) {
      let jobAd = ads[i];
      let fileName = jobAd['filename'];
      let privateData = JSON.parse(localStorage.getItem('jobassistantCoverLetter_' + fileName))
      let match_score = privateData['match_score'];
      if (jobAd) {
        let newCards = false;
        let hashId = jobAd['hash_id'];
        if (!cache.includes(hashId)) {
          cache.push(hashId);
          addSingleJobCard(document, jobAd, match_score, newCards);
        }
      }
    }
    let numOfJobs = $('.job-card').length;
    headerCenter.find('h5').text(`Jobs filtered (${numOfJobs})`);
  } else {
    let jobDataBody = $(document).find('.job-ads');
    jobDataBody.append(`<div class="jobs-none"><p>{message}</p></div>`)
  }
}

export function retrieveJobCards() {
  let localJobAds = storage.jobAds.retrieveArrayOfParsedAds();
  // let headerCenter = $('.header-center');
  if (localJobAds) {
    let cache = [];
    for (let i = 0; i < localJobAds.length; i++) {
      let jobAd = localJobAds[i];
      let fileName = jobAd['filename'];
      let privateData = JSON.parse(localStorage.getItem('jobassistantCoverLetter_' + fileName))
      let match_score = privateData['match_score'];
      if (jobAd) {
        let newCards = false;
        let hashId = jobAd['hash_id'];
        if (!cache.includes(hashId)) {
          cache.push(hashId);
          addSingleJobCard(document, jobAd, match_score, newCards);
        }
      }
    }
  } else {
    let jobDataBody = $(document).find('.job-ads');
    jobDataBody.append('<div class="jobs-none"><p>No jobs added yet. If you are running a search, allow 5-20 seconds for ads to appear without closing the JobAssistant extension.</p></div>')
  }
}

export function loadJobDetails(hashId, publicDataFilename, privateDataFilename, jobDetails) {
  // console.log('JOB DETAILS');
  // console.log(jobDetails);
  window.currentPage = 'job ad details';
  $('#filter-results').addClass('hide');
  $('.job-detail-section').append(`<span class="hash-id-span hide">${hashId}</span>`)
  $('.job-detail-section').append(`<span class="job-id-span hide">${publicDataFilename}</span>`)
  let applyLink;
  let headerLogo = $('.header-logo')
  $('.header-center').find('h5').text('Job Details');
  headerLogo.find('img').remove();
  $('#circle').addClass('hide');
  headerLogo.append('<i class = "bi bi-arrow-left" id="job-detail-back"></i>');
  headerLogo.on('click', function () {
    $(this).find('i').remove();
    if (window.loadingStatus) {
      resetHeaderLogo();
      loadJobAdBody('loading');
    } else {
      loadJobAdBody();
    }
  })
  let privateJobDetails = JSON.parse(localStorage.getItem(privateDataFilename));
  if (jobDetails['company_logo']) {
    $('.job-detail-company-logo').append('<img alt="Company logo in JobAssistant job description" src="' + jobDetails['company_logo'] + '">');
  } else {
    $('.job-detail-company-logo').remove();
  }
  if (privateJobDetails['inserted_position']) {
    $('.job-detail-position-text').append('<h6 class="job-item-label job-detail-text" style="font-size:15px;font-weight:550;">Position:</h6><p class="job-detail-text" style="font-size:12.5px;">' + privateJobDetails['inserted_position'] + '</p>');
  } else {
    let position = truncateString(jobDetails['job_title']);
    $('.job-detail-position-text').append('<h6 class="job-item-label job-detail-text" style="font-size:15px;font-weight:550;">Position:</h6><p class="job-detail-text" style="font-size:12.5px;">' + position + '</p>');
  }
  if (jobDetails['company']) {
    $('.job-detail-company-text').append('<h6 class="job-item-label job-detail-text" style="font-size:15px;font-weight:550;">Company:</h6><p class="job-detail-text" style="font-size:12.5px;">' + jobDetails['company'] + '</p>');
  }
  if (jobDetails['salary']) {
    $('.job-detail-salary-text').append('<h6 class="job-item-label job-detail-text" style="font-size:15px;font-weight:550;">Salary:</h6><p class="job-detail-text" style="font-size:12.5px;">' + jobDetails['salary'] + '</p>');
  } else {
    $('.job-detail-salary').remove();
  }
  if (jobDetails['location']) {
    $('.job-detail-location-text').append('<h6 class="job-item-label job-detail-text" style="font-size:15px;font-weight:550;">Location:</h6><p class="job-detail-text" style="font-size:12.5px;">' + jobDetails['location'] + '</p>');
  } else {
    $('.job-detail-location-text').remove();
  }
  if ('topics_of_interest_extracted_from_ad' in privateJobDetails) {
    if (privateJobDetails['topics_of_interest_extracted_from_ad'].length) {
      let skills = '';
      for (let i = 0; i < privateJobDetails['topics_of_interest_extracted_from_ad'].length; i++) {
        let skill = privateJobDetails['topics_of_interest_extracted_from_ad'][i];
        if (i !== privateJobDetails['topics_of_interest_extracted_from_ad'].length - 1) {
          skills += skill + ', '
        } else {
          skills += skill
        }
      }
      $('.job-detail-knowledge-and-abilities-text').append('<h6 class="job-item-label job-detail-text" style="font-size:15px;font-weight:550;">Knowledge and Abilities required:</h6><p class="job-detail-text" style="font-size:12.5px;">' + skills + '</p>');
    } else {
      $('.job-detail-knowledge-and-abilities-text').remove()
    }
  }
  if (jobDetails['extracted_skills']) {
    let extracted_skills = '';
    for (let i = 0; i < jobDetails['extracted_skills'].length; i++) {
      let skill = jobDetails['extracted_skills'][i];
      if (i !== jobDetails['extracted_skills'].length - 1) {
        extracted_skills += skill + ', '
      } else {
        extracted_skills += skill
      }
    }
    let lineHeight = Math.ceil(extracted_skills.length / 69) * 18;
    $('.job-detail-extracted-skills-text').append(`<h6 class="job-item-label job-detail-text" style="font-size:15px;font-weight:550;">Skills in Ad:</h6><p class="job-detail-text" style="font-size:12.5px;">` + extracted_skills + '</p>');
    $('.job-detail-extracted-skills').css('margin-bottom', `${lineHeight + 20}px`);
  } else {
    $('.job-detail-extracted-skills-text').remove()
  }

  if (privateJobDetails['matched_skills'].length) {
    let skills = '';
    for (let i = 0; i < privateJobDetails['matched_skills'].length; i++) {
      let skill = privateJobDetails['matched_skills'][i];
      if (i !== privateJobDetails['matched_skills'].length - 1) {
        skills += skill + ', '
      } else {
        skills += skill
      }
    }
    $('.job-detail-matched-skills-text').append('<h6 class="job-item-label job-detail-text" style="font-size:15px;font-weight:550;">Matched Skills:</h6><p class="job-detail-text" style="font-size:12.5px;">' + skills + '</p>');
  } else {
    $('.job-detail-matched-skills-text').remove();
  }
  //job-detail-matched-skills-text
  if (jobDetails['employment_type']) {
    $('.job-detail-employment-type-text').append('<h6 class="job-item-label job-detail-text" style="font-size:15px;font-weight:550;">Employment Type:</h6><p class="job-detail-text" style="font-size:12.5px;">' + jobDetails['employment_type'] + '</p>');
  } else {
    $('.job-detail-employment-type-text').remove();
  }
  if (jobDetails['source']) {
    $('.job-detail-source').html('<a target="__blank" href="' + jobDetails['url'] + '">See original job ad</a>')
  }
  if (jobDetails['description']) {
    if (jobDetails['description'].includes("jobSectionHeader")) {
      let jobAdHTML = $.parseHTML(jobDetails['description']);
      let jobAdHTMLParsed = $(jobAdHTML).find('.jobSectionHeader').remove();
      $('.job-detail-description').find('div').html($(jobAdHTML));
    } else {
      $('.job-detail-description').find('div').html(jobDetails['description']);
    }
  } else {
    $('.job-detail-description').find('div').text('This ad has no description.');
  }
  if (jobDetails['external_apply_url']) {
    applyLink = jobDetails['external_apply_url'];
  } else if (jobDetails['apply_btn_url']) {
    applyLink = jobDetails['apply_btn_url'];
  } else {
    applyLink = jobDetails['source'];
  }
}

export function jobDetailAndCoverLetterHandler() {
  // Source link included in the details page for job ad
  $('.job-card').each(function (i, obj) {
    let publicDataFilename = $(this).attr('id') + '.json';
    let privateDataFilename = 'jobassistantCoverLetter_' + publicDataFilename;
    let jobDetails = JSON.parse(storage.jobAds.retrieveAdLocally(publicDataFilename));
    let jobAdPrivateData = JSON.parse(localStorage.getItem(privateDataFilename));
    // console.log( jobAdPrivateData);
    let hashId = jobDetails['hash_id'];
    if (jobAdPrivateData['visited'] === true) {
      $(this).removeClass('unread').addClass('read');
    }
    $(this).on('click', function () {
      posthog.capture('clicked_on_a_job');
      jobAdPrivateData['visited'] = true;
      localStorage.setItem(privateDataFilename, JSON.stringify(jobAdPrivateData));
      $('.body-container').load('../../templates/job_ads/job_ad_details.html', function () {
        loadJobDetails(hashId, publicDataFilename, privateDataFilename, jobDetails);
        let applyBtn = $(this).find('#job-apply');
        applyBtn.on('click', function () {
          posthog.capture('clicked_apply_now');
          jobAdPrivateData['apply_clicked'] = true;
          localStorage.setItem(privateDataFilename, JSON.stringify(jobAdPrivateData));
          // A step by step guide for users to create application PDFs, including cover letter
          // (we provide cover letter templates) and resume.
          // Users download them - all processing for template styles and pdf generation are done locally.
          // Only generated cover letter templates requires our backend API.
          wizard.startApplicationWizard(hashId, publicDataFilename, privateDataFilename, jobDetails);
        })
      })
    })
  })
}

export function addSingleJobCard(document, job, match_score, newCards) {
  $('.jobs-none').remove();
  let jobKey;
  try {
    // job = JSON.parse(job);
    jobKey = job['filename']
  } catch {
    job = null
  }

  if (job) {
    // console.log('Job data: ');
    // console.log(job);

    let jobDataBody = $(document).find('.job-ads');
    let sourceLogo, sourceLogoHtml, companyLogo, companyLogoHtml, summary, badge;

    if (match_score === 3) {
      badge = '<span class="match-circle-high"></span>';
    } else if (match_score === 2) {
      badge = '<span class="match-circle-medium"></span>';
    } else if (match_score === 1) {
      badge = '<span class="match-circle-low"></span>';
    } else {
      badge = '<span class="match-circle-low"></span>';
    }

    if (job['source_logo'] !== null || job['source_logo'] !== '') {
      sourceLogo = job['source_logo']
      sourceLogoHtml = '<img src="' + sourceLogo + '" class="card-source-logo">'
    } else {
      sourceLogoHtml = '';
    }

    if (job['company_logo'] !== null || job['company_logo'] !== '') {
      companyLogo = job['company_logo']
      companyLogoHtml = '<img src="' + companyLogo + '" class="card-company-logo">'
    } else {
      companyLogoHtml = '';
    }

    console.log(job);

    if (job['summary']) {
      // for (let i=0; i<job['summary'].length;i++){
      //   summary += job['summary'][i] + ' ';
      // }
      summary = job['summary'];
    } else {
      let jobAdHTML = $.parseHTML(job['description'])
      summary = $(jobAdHTML).text();
    }

    let daysAgo;
    let adDatePosted = new Date(job['calculated_date_of_time_posted']);
    let currentDate = new Date();
    let differenceInTime = currentDate.getTime() - adDatePosted.getTime();
    let differenceInDays = differenceInTime / (1000 * 3600 * 24);

    if (differenceInDays > 30) {
      daysAgo = '30+ days ago';
    } else {
      daysAgo = Math.round(differenceInDays).toString() + ' days ago'
      if (daysAgo === '1 days ago') {
        daysAgo = '1 day ago';
      } else if (daysAgo === '0 days ago') {
        daysAgo = 'Today';
      }
    }

    let idFriendlyFilename = jobKey.replace('.json', '')

    let newTagDiv = '<div class="new hide" data-tooltip-align="t,l">new</div>'

    jobDataBody.prepend(
      '<div class="card job-card"' + ' id="' + idFriendlyFilename + '"' + '>' +
      newTagDiv +
      ' <div class="card-body">' +
      '  <div style="text-align:right;">' +
      '   <span style="right:110px;position:absolute;margin-top:15px;">Skill Match:</span>' +
      '   ' + badge +
      '  </div>' +
      '  <div style="text-align:right;">' +
      '   <i class="bi bi-chevron-right job-card-icon-right"></i>' +
      '  </div>' +
      '  <div style="text-align:right;">' +
      '  <p class="card-text job-card-time-text">' + daysAgo + '</p>' +
      '</div>' +
      '  <div style="text-align:right;">' +
      '   ' + sourceLogoHtml +
      '  </div>' +
      '  <h4 class="card-title job-card-position-title">' + truncateString(job['job_title'], 30) + '</h4>' +
      '  <h6 class="job-card-company-title">' + 'Company: ' + truncateString(job['company'], 25) + '</h6>' +
      '  <p class="card-text job-card-summary-text">' + truncateString(summary, 85) + '</p>' +
      ' </div>' +
      '<div>' +
      '</div>' +
      '   <span style="position:absolute;margin-top:90px;font-size:12px;left:425px;cursor:pointer;"><i class="bi bi-trash-fill"></i></span>' +
      '</div>'
    )

    let localPrivateAdObject = JSON.parse(localStorage.getItem('jobassistantCoverLetter_' + jobKey));
    let jqueryFriendlyId = idFriendlyFilename.replace(/([#;&,.+\-_=?{}*~\':%"!^$[\]()=>|\/])/g, "\\$1");
    let uniqueJobCard = $('#' + jqueryFriendlyId);

    uniqueJobCard.find('.bi-trash-fill').on('click', function (event) {
      localStorage.removeItem('jobassistantCoverLetter_' + jobKey);
      localStorage.removeItem(jobKey);
      // uniqueJobCard.remove();
      $('.header-center').find('h5').text('Job Ads (' + storage.jobAds.numOfLocalJobAds().toString() + ')');
      $('.job-ads').find('.job-card').remove();
      retrieveJobCards();
      jobDetailAndCoverLetterHandler();
    })

    if (newCards === true) {
      uniqueJobCard.find('.new').removeClass('hide').addClass('show');
      setTimeout(function () {
        uniqueJobCard.find('.new').removeClass('show').addClass('fade');
      }, 5000)
    }

    if (localPrivateAdObject) {
      if (localPrivateAdObject['read'] === false) {
        uniqueJobCard.addClass('unread');
      } else {
        uniqueJobCard.addClass('read');
      }
      uniqueJobCard.on('click', function () {
        $(this).removeClass('unread').addClass('read');
        localPrivateAdObject['read'] = true;
        localStorage.setItem('jobassistantCoverLetter_' + jobKey, JSON.stringify(localPrivateAdObject));
      })
    }
  }
}

export function loadJobAdBody(message) {
  window.currentPage = 'job ads';
  // Loads in the data that's parsed by our backend API. In the frontend, users can see truncated data such as
  // Summary, Requirements, Skills at a glance and position title.
  // We use the match score (user's data vs job ad text) to sort the ads in the frontend.
  // We provide job ad details as well as the source link
  $('.body-container').load('../../templates/job_ads/job_ads.html', function () {
    $('.navbar-account').removeClass('active')
    $('.navbar-search').removeClass('active');
    $('.navbar-home').addClass('active');
    let headerCenter = $('.header-center');
    let headerRight = $('.header-right');
    if (message) {
      if (message === 'loading') {
        showProgress();
        retrieveJobCards();
        jobDetailAndCoverLetterHandler();
      } else {
        headerCenter.find('h5').text('Searching for jobs...');
        headerRight.find('#circle').removeClass('hide').addClass('show');
        let jobsNoneElement = $('.jobs-none');
        if (jobsNoneElement.length) {
          $(jobsNoneElement).find('p').text('Currently searching for jobs. Please leave this window open & avoid clicking on the page. Allow atleast 30 seconds for ads to appear');
        }
        retrieveJobCards();
        jobDetailAndCoverLetterHandler();
      }
    } else {
      if (storage.jobAds.numOfLocalJobAds() !== 0) {
        // Frontend offers filtering for all ads.
        // Three types of filters:
        // - blacklist words (must not include keyword)
        // - must include words
        // - days old filters
        if (!window.loadingStatus) {
          $('#filter-results').removeClass('hide');
        }
        headerCenter.find('h5').text('Job Ads (' + storage.jobAds.numOfLocalJobAds().toString() + ')');
        retrieveJobCards();
        jobDetailAndCoverLetterHandler();
        resetHeaderLogo();
        $('.keywords-filter').on('click', function (event) {
          setTimeout(function () {
            let taginWrappers = document.getElementsByClassName('tagin-wrapper');
            for (let l = 0; l < taginWrappers.length; l++) {
              if (l !== taginWrappers.length - 1) {
                $(taginWrappers[l]).remove();
              }
            }
          }, 20);
          if (!$('.blacklist-filter-container').hasClass('hide')) {
            $('.blacklist-filter-container').addClass('hide');
          }
          if (!$('.blacklist-filter-btn-container').hasClass('hide')) {
            $('.blacklist-filter-btn-container').addClass('hide');
          }
          $('#keywordsFilterContainer').toggleClass('hide');
          $('#keywordsFilterBtnContainer').toggleClass('hide');
          let el = document.getElementById('keywordsFilterInput');
          tagin(el);
          $('#keywordFilterSubmitBtn').on('click', function () {
            let keywords = [];
            $('.tag-container-keywords').find('.tagin-wrapper').find('span').each(function () {
              let word = $(this).text();
              if (word !== '') {
                keywords.push(word);
              }
            });
            let jobCards = $('.job-card');
            let adIds = [];
            for (let i = 0; i < jobCards.length; i++) {
              let id = $(jobCards[i]).attr('id') + '.json';
              adIds.push(id);
            }
            let ads = [];
            for (let i = 0; i < adIds.length; i++) {
              let ad = JSON.parse(localStorage.getItem(adIds[i]));
              ads.push(ad);
            }
            ads = ads.reverse()
            let filtered = keywordFilter(keywords, ads);
            let filteredAds = filtered['ads'];
            let errMessage = filtered['errMessage'];
            if (errMessage) {
              alert(errMessage);
            } else {
              $('.job-card').remove();
              retrieveJobCardsFiltered(filteredAds, errMessage);
              jobDetailAndCoverLetterHandler();
            }
          });
          event.stopPropagation();
        });
        $('.blacklist-filter').on('click', function (event) {
          setTimeout(function () {
            let taginWrappers = document.getElementsByClassName('tagin-wrapper');
            for (let l = 0; l < taginWrappers.length; l++) {
              if (l !== taginWrappers.length - 1) {
                $(taginWrappers[l]).remove();
              }
            }
          }, 20);
          if (!$('.keywords-filter-container').hasClass('hide')) {
            $('.keywords-filter-container').addClass('hide');
          }
          if (!$('.keywords-filter-btn-container').hasClass('hide')) {
            $('.keywords-filter-btn-container').addClass('hide');
          }
          $('#blacklistFilterContainer').toggleClass('hide');
          $('#blacklistFilterBtnContainer').toggleClass('hide');
          let el = document.getElementById('blacklistFilterInput');
          tagin(el);
          $('#blacklistFilterSubmitBtn').on('click', function () {
            let keywords = [];
            $('.tag-container-blacklist').find('.tagin-wrapper').find('span').each(function () {
              let word = $(this).text();
              if (word !== '') {
                keywords.push(word);
              }
            });
            let jobCards = $('.job-card');
            let adIds = [];
            for (let i = 0; i < jobCards.length; i++) {
              let id = $(jobCards[i]).attr('id') + '.json';
              adIds.push(id);
            }
            let ads = [];
            for (let i = 0; i < adIds.length; i++) {
              let ad = JSON.parse(localStorage.getItem(adIds[i]));
              ads.push(ad);
            }
            ads = ads.reverse()
            let filtered = blacklistFilter(keywords, ads);
            let filteredAds = filtered['ads'];
            let errMessage = filtered['errMessage'];
            if (errMessage) {
              alert(errMessage);
            } else {
              $('.job-card').remove();
              retrieveJobCardsFiltered(filteredAds, errMessage);
              jobDetailAndCoverLetterHandler();
            }
            $('.keywords-filter-container').toggleClass('hide');
            $('.blacklist-filter-container').toggleClass('hide');
          });
          $('.no-jobs-yet').remove();
          event.stopPropagation();
        });
        $('.time-option').on('click', function () {
          let time;
          if ($(this).attr('id') === 'timeOption1') {
            time = 0;
          } else if ($(this).attr('id') === 'timeOption2') {
            time = 7;
          } else if ($(this).attr('id') === 'timeOption3') {
            time = 14;
          } else if ($(this).attr('id') === 'timeOption4') {
            time = 30;
          }
          let jobCards = $('.job-card');
          let adIds = [];
          for (let i = 0; i < jobCards.length; i++) {
            let id = $(jobCards[i]).attr('id') + '.json';
            adIds.push(id);
          }
          let ads = [];
          for (let i = 0; i < adIds.length; i++) {
            let ad = JSON.parse(localStorage.getItem(adIds[i]));
            ads.push(ad);
          }
          ads = ads.reverse()
          let filtered = timeFilter(time, ads)
          let filteredAds = filtered['ads'];
          let errMessage = filtered['errMessage'];
          if (errMessage) {
            alert(errMessage);
          } else {
            $('.job-card').remove();
            retrieveJobCardsFiltered(filteredAds, errMessage);
            jobDetailAndCoverLetterHandler();
          }
        })
        $(document).click(function (event) {
          if (event.target.className !== 'blacklist-filter-btn-container' && event.target.className !== 'tagin-input' && event.target.className !== 'tagin-wrapper' && event.target.className !== 'tagin-tag-remove' && event.target.className !== 'tagin-tag' && event.target.className !== 'tagin-wrapper focus') {
            $('.keywords-filter-container').addClass('hide');
            $('#keywordsFilterBtnContainer').addClass('hide');
            $('.blacklist-filter-container').addClass('hide');
            $('#blacklistFilterBtnContainer').addClass('hide');
          }
        });
        $('.bi-arrow-counterclockwise').on('click', function () {
          retrieveJobCards();
          jobDetailAndCoverLetterHandler();
        });
      } else {
        headerCenter.find('h5').text('Job Ads');
        $('#filter-results').addClass('hide');
        $('.job-ads').append('<div class="no-jobs-yet"><p>No jobs added yet...</p></div>');
      }
    }
  });
}

export function resetHeaderLogo() {
  let imgElement = $('.header-logo').find('img');
  let iconElement = $('.header-logo').find('i');
  if (iconElement.length > 0) {
    iconElement.remove();
  }
  if (imgElement.length === 0) {
    $('.header-logo').append('<img alt="JobAssistant logo" src="../images/jobassistant-logo.png" style="width:45px;height:45px; padding-bottom:2px;">');
  }
}

export function truncateString(str, num) {
  console.log(str);
  if(typeof str !== 'object') {
    if (str.length <= num) {
      return str
    }
    // Return str truncated with '...' concatenated to the end of str.
    return str.slice(0, num) + '...'
  } else {
    return ''
  }
}

export function showProgress() {
  let done = storage.jobAds.numOfLocalJobAds();
  $('#filter-results').addClass('hide');
  $('.header-right').find('#circle').removeClass('hide').addClass('show');
  $('.header-center').find('h5').text(`Loading jobs... ${done} found`);
}
