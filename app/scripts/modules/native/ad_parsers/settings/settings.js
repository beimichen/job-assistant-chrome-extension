/***
 * Job sites supported:
 * Indeed
 * Glassdoor
 * Simplyhired
 * Linkedin
 * Monster // format: https://www.monster.com/job-openings/senior-software-engineer-melbourne-07--7edc0f2b-f040-4d9b-bc9a-d05df1a3e47b
 ***/

const INDEED_REQUEST_LIMIT = 100;
const INDEED_PAGES_LIMIT = 2;
const INDEED_PER_PAGE_LIMIT = 50;

const INDEED = {
  multi_job_page: {
    job_ad_hrefs: '.jobtitle.turnstileLink', // this element's href doesn't include base url
    pagination: '.pagination-list',
    job_ad_summary: {
      sibling: '.jobtitle.turnstileLink',
      parent: '.jobsearch-SerpJobCard',
      child: '.summary'
    },
    job_ad_requirements: {
      parent: '.jobsearch-SerpJobCard',
      child: '.jobCardReqItem'
    }
  },
  single_job_page: {
    job_title: '.jobsearch-JobInfoHeader-title', // h1 text
    company: {
      parent: '.jobsearch-InlineCompanyRating',
      child: {
        index: 0
      }
    },
    location: {
      parent: '.jobsearch-InlineCompanyRating',
      child: {
        index: -1
      }
    },
    company_logo: '.jobsearch-CompanyAvatar-image', // img src (cloudfront url)
    salary: {
      parent: 'div.jobsearch-JobMetadataHeader-item',
      child: {
        index: 0
      }
    },
    time_posted: {
      parent: '.jobsearch-JobMetadataFooter',
      child: {
        index: null
      },
    },
    employment_type: {
      parent: 'span.jobsearch-JobMetadataHeader-item',
      child: {
        index: -1
      }
    },
    description: '#jobDescriptionText',
    indeed_apply_btn: {
      parent: '#indeedApplyButtonContainer',
      child: {
        index: 0,
      },
      attributes: {
        jobUrl: 'indeed-apply-joburl',
        postUrl: 'indeed-apply-posturl',
        continueUrl: 'indeed-apply-continueurl',
        questions: 'indeed-apply-questions',
        phone: 'optional',
        coverletter: 'OPTIONAL',
        jobId: 'indeed-apply-jobid',
        jk: 'indeed-apply-jk',
        jobTitle: 'indeed-apply-jobtitle',
        jobCompany: 'indeed-apply-jobcompanyname',
        jobLocation: 'indeed-apply-joblocation',
        apiToken: 'indeed-apply-apitoken',
        advNum: 'indeed-apply-advnum',
        pingbackUrl: 'indeed-apply-pingbackurl',
        onready: 'indeed-apply-onready',
        clickHandler: 'indeed-apply-clickhandler',
        dismissHandler: 'indeed-apply-dismisshandler',
        inpageApplyHandler: 'indeed-apply-inpageapplyhandler',
        resume: 'indeed-apply-resume',
        noButtonUI: 'indeed-apply-nobuttonui',
        onappliedstatus: 'indeed-apply-onappliedstatus',
        recentsearchquery: 'indeed-apply-recentsearchquery',
        iaUid: 'iframe[id^=\'indeedapply-modal-preload-\']',
        hl: '.gnav-LoggedOutAccountLink',
        co: '.gnav-LoggedOutAccountLink',
        mob: 0,
        preload: 0,
        spn: 0,
        iip: 1,
        autoString: 'none',
        twoPaneGroup: -1,
        twoPaneVjGroup: -1,
        m3AllocGrp: -1,
        jobApplies: -1,
        ms: null,
        href: null,
        isITA: 0,
        isCreateIAJobApiSuccess: false,
        src: 'idd-vj'
      }
    }, // this element includes base url
    external_apply_btn: '#originalJobLinkContainer' // this element's href doesn't include base url
  }
}

const LINKEDIN_REQUEST_LIMIT = 300;
const LINKEDIN_PAGES_LIMIT = 10;

const LINKEDIN = {
  multi_job_page: {
    job_ad_hrefs: '.result-card__full-card-link', // this element's href doesn't include base url
    pagination: '.pagination-list',
    job_ad_summary: {
      sibling: '.jobtitle.turnstileLink',
      parent: '.jobsearch-SerpJobCard',
      child: '.summary'
    },
    job_ad_requirements: {
      parent: '.jobsearch-SerpJobCard',
      child: '.jobCardReqItem'
    }
  },
  single_job_page: {
    job_title: '.jobsearch-JobInfoHeader-title', // h1 text
    company: {
      parent: '.jobsearch-InlineCompanyRating',
      child: {
        index: 0
      }
    },
    location: {
      parent: '.jobsearch-InlineCompanyRating',
      child: {
        index: -1
      }
    },
    company_logo: '.jobsearch-CompanyAvatar-image', // img src (cloudfront url)
    salary: {
      parent: 'div.jobsearch-JobMetadataHeader-item',
      child: {
        index: 0
      }
    },
    time_posted: {
      parent: '.jobsearch-JobMetadataFooter',
      child: {
        index: null
      },
    },
    employment_type: {
      parent: 'span.jobsearch-JobMetadataHeader-item',
      child: {
        index: -1
      }
    },
    description: '#jobDescriptionText',
    indeed_apply_btn: {
      parent: '#indeedApplyButtonContainer',
      child: {
        index: 0,
      },
      attributes: {
        jobUrl: 'indeed-apply-joburl',
        postUrl: 'indeed-apply-posturl',
        continueUrl: 'indeed-apply-continueurl',
        questions: 'indeed-apply-questions',
        phone: 'optional',
        coverletter: 'OPTIONAL',
        jobId: 'indeed-apply-jobid',
        jk: 'indeed-apply-jk',
        jobTitle: 'indeed-apply-jobtitle',
        jobCompany: 'indeed-apply-jobcompanyname',
        jobLocation: 'indeed-apply-joblocation',
        apiToken: 'indeed-apply-apitoken',
        advNum: 'indeed-apply-advnum',
        pingbackUrl: 'indeed-apply-pingbackurl',
        onready: 'indeed-apply-onready',
        clickHandler: 'indeed-apply-clickhandler',
        dismissHandler: 'indeed-apply-dismisshandler',
        inpageApplyHandler: 'indeed-apply-inpageapplyhandler',
        resume: 'indeed-apply-resume',
        noButtonUI: 'indeed-apply-nobuttonui',
        onappliedstatus: 'indeed-apply-onappliedstatus',
        recentsearchquery: 'indeed-apply-recentsearchquery',
        iaUid: 'iframe[id^=\'indeedapply-modal-preload-\']',
        hl: '.gnav-LoggedOutAccountLink',
        co: '.gnav-LoggedOutAccountLink',
        mob: 0,
        preload: 0,
        spn: 0,
        iip: 1,
        autoString: 'none',
        twoPaneGroup: -1,
        twoPaneVjGroup: -1,
        m3AllocGrp: -1,
        jobApplies: -1,
        ms: null,
        href: null,
        isITA: 0,
        isCreateIAJobApiSuccess: false,
        src: 'idd-vj'
      }
    }, // this element includes base url
    external_apply_btn: '#originalJobLinkContainer' // this element's href doesn't include base url
  }
}

export {
  INDEED_REQUEST_LIMIT,
  INDEED_PAGES_LIMIT,
  INDEED_PER_PAGE_LIMIT,
  INDEED
};