let storage = {
  jobAds: {
    storeAdLocally: function(adId, filename, adObject) {
      filename = storage.jobAds.checkFileName(filename);
      let locallyStoredAd = storage.jobAds.retrieveAdLocally(filename);
      if (!locallyStoredAd) {
        let adObjReadyForStorage = JSON.stringify(adObject);
        try {
          localStorage.setItem(filename, adObjReadyForStorage);
        } catch(e) {
          if (e.code === 22 || e.code === '22') {
            storage.jobAds.handleStorageMemory(adId, filename, adObject);
          }
        }
      }
    },
    handleStorageMemory: function (adId, filename, object) {
      filename = storage.jobAds.checkFileName(filename);
      let allObj = storage.jobAds.allAdsFromStorage();
      let objOver30DaysOld = false;
      let enoughMemory = false;
      let objReadyForStorage = JSON.stringify(object);
      for (let i=0; i< allObj.length; i++) {
        let obj = JSON.parse(allObj[i]);
        if (obj['calculated_date_of_time_posted'].includes('30+')) {
          objOver30DaysOld = true;
          let key = allObj[i]['filename'];
          localStorage.removeItem(key);
          try {
            localStorage.setItem(filename, objReadyForStorage)
            enoughMemory = true;
            break
          } catch(e) {
            if (e.code === 22 || e.code === '22') {
              enoughMemory = false;
            }
          }
        }
      }
      if(enoughMemory === false) {
        // Deleting one at a time after detecting ads older than 30 days fails
        // Delete 5 ads to at the start of the list (oldest 5);
        let enoughMemorySecondTry = false;
        let allAds = allObj;
        if (allAds.length >= 5) {
          for (let j=0; j < 5; j++ ) {
            let key = allAds[j]['filename'];
            localStorage.removeItem(key);
          }
        }
        try {
          localStorage.setItem(filename, objReadyForStorage)
          enoughMemorySecondTry = true;
        } catch(e) {
          if (e.code === 22 || e.code === '22') {
            enoughMemorySecondTry = false;
          }
        }
        if(enoughMemorySecondTry === false) {
          //After the 2nd try, if there still isn't enough memory, just clear the entire localstorage
          localStorage.clear();
          localStorage.setItem(filename, objReadyForStorage)
        }
      }
    },
    retrieveAdLocally: function (filename) {
      let localAdObj = localStorage.getItem(filename);
      if (localAdObj !== null) {
        return localAdObj
      } else {
        return null
      }
    },
    allAdsFromStorage: function () {
      let adData = [],
        keys = Object.keys(localStorage),
        i = keys.length;
      while ( i-- ) {
        if (!keys[i].includes('aws.cognito.identity-id') && !keys[i].includes('jobassistantCoverLetter_') && !keys[i].includes('jobassistantPersonalDetails') && keys[i] !== 'JobAssistantUniversalCoverLetter' && keys[i] !== 'JobAssistantResume' && keys[i] !== 'UniversalCoverletterTemplate' && keys[i] !== 'UniversalResumeTemplate'){
          let privateDataFileName = 'jobassistantCoverLetter_' + keys[i];
          adData.push([JSON.parse(localStorage.getItem(keys[i])), JSON.parse(localStorage.getItem(privateDataFileName))]);
        }
      }
      let adDataOrdered = storage.jobAds.sortByMatchScore(adData);
      let adsOrdered = [];
      for (let i=0;i<adDataOrdered.length;i++){
        let ad = adDataOrdered[i][0];
        adsOrdered.push(ad);
      }
      return adsOrdered
    },
    sortByMatchScore: function (values) {
      console.log(values);
      return values.sort(function compare(a, b) {
        let matchA = parseInt(a[1].match_score);
        let matchB = parseInt(b[1].match_score);
        return  matchA - matchB;
      })
    },
    numOfLocalJobAds: function () {
      return storage.jobAds.allAdsFromStorage().length
    },
    retrieveArrayOfParsedAds: function () {
      let allAds = storage.jobAds.allAdsFromStorage();
      if (allAds.length > 0) {
        return allAds
      } else {
        return null
      }
    },
    checkFileName: function (filename) {
      if(!filename.includes('.json')) {
        return filename + '.json';
      } else {
        return filename
      }
    }
  },
  coverletter:{
    storeUniversalCoverletterTemplate: function (choice) {
      localStorage.setItem('UniversalCoverletterTemplate', choice.toString());
    },
    storeCoverLetterLocally: function (objId, filename, coverLetterObject) {
      filename = storage.jobAds.checkFileName(filename);
      filename = 'jobassistantCoverLetter_' + filename;
      let locallyStoredCoverLetter = storage.coverletter.retrieveCoverLetterLocally(filename);
      if (!locallyStoredCoverLetter) {
        let coverLetterObjReadyForStorage = JSON.stringify(coverLetterObject);
        try {
          localStorage.setItem(filename, coverLetterObjReadyForStorage);
        } catch(e) {
          if (e.code === 22 || e.code === '22') {
            console.log(e);
            // storage.jobAds.handleStorageMemory(objId, filename, coverLetterObject); TODO: handle cover letters
          }
        }
      }
    },
    retrieveCoverLetterLocally: function (filename) {
      let localCoverLetterObj = localStorage.getItem(filename);
      if (localCoverLetterObj !== null) {
        return localCoverLetterObj
      } else {
        return null
      }
    },
    storeCoverletterData: function (coverletterFileName, templateChoice) {
      let data = JSON.parse(localStorage.getItem(coverletterFileName));
      data.hiring_manager = $('#hiringManagerNameInput').val();
      data.inserted_position = $('#jobTitleInput').val();
      if (data.read !== true) {
        data.read = true;
      }
      let coverletterHTML = document.getElementById('tinyEditor').innerHTML;
      let coverletterParagraphs = $('#tinyEditor').find('p');
      let coverletterParagraphsFormatted = '';
      for (let i = 0; i < coverletterParagraphs.length; i++) {
        let par = coverletterParagraphs[i].innerText + '\n';
        coverletterParagraphsFormatted += par;
      }
      data.company = $('#companyNameInput').val();
      data.cover_letter = coverletterParagraphsFormatted;
      data.cover_letter_html = coverletterHTML;
      data.template_style = templateChoice;
      localStorage.setItem(coverletterFileName, JSON.stringify(data));
    },
  },
  resume:{
    storeUniversalResumeTemplate: function (choice) {
      localStorage.setItem('UniversalResumeTemplate', choice.toString());
    },
    storeResumeData: function () {
      let firstName = $('#firstNameInput').val();
      let middleName = $('#middleNameInput').val();
      let lastName = $('#lastNameInput').val();
      let fullName;
      if (middleName !== '' && firstName !== '' && lastName !== '') {
        fullName = firstName + ' ' + middleName + ' ' + lastName;
      } else if (firstName !== '' && lastName !== '') {
        fullName = firstName + ' ' + lastName;
      } else {
        fullName = ''
      }
      let preferredJobTitle = $('#jobTitleInput').val();
      let email = $('#emailInput').val();
      let phone = $('#phoneNumberInput').val();
      let city = $('#cityInput').val();
      let state = $('#stateInput').val();
      let address = $('#addressInput').val();
      let zipCode = $('#zipCodeInput').val();
      let country = $('#countryInput').val();
      let profileSummaryText = $('#profileSummaryInput').find('#tinyEditor').text();
      let profileSummaryHTML = $('#profileSummaryInput').find('#tinyEditor').html();
      let excludeReferences = $('.references-ios-btn-checkbox').attr('class').includes('-checked');
      let data = {
        first_name:firstName,
        last_name: lastName,
        middle_name: middleName,
        full_name: fullName,
        preferred_job_title: preferredJobTitle,
        email: email,
        phone_number: phone,
        city: city,
        state: state,
        address: address,
        zip_code: zipCode,
        country: country,
        languages: [],
        skills: [],
        tools: [],
        profile_summary: profileSummaryText,
        profile_summary_html: profileSummaryHTML,
        education: [],
        experience: [],
        references: [],
        references_exclude: excludeReferences
      }
      let languages = $('.language-item');
      for (let i=0;i<languages.length;i++) {
        let language = $(languages[i]).find('.language-left-input-container').find('.language-input-focus').val();
        let level = $(languages[i]).find('.language-right-input-container').find('.select-language-level-input-text').text();
        data.languages.push({language:language,level:level})
      }
      let experience = $('.experience-item');
      for(let i=0;i<experience.length;i++) {
        let jobTitle = $(experience[i]).find('.jobtitle-input').val();
        let company = $(experience[i]).find('.company-input').val();
        let city = $(experience[i]).find('.city-input').val();
        let startDate = $(experience[i]).find('.experience-input-general.date-input.start-date').val();
        let endDate = $(experience[i]).find('.experience-input-general.date-input.end-date').val();
        let description = $(experience[i]).find('#tinyEditor').text();
        let descriptionHTML = $(experience[i]).find('#tinyEditor').html();
        data.experience.push({
          job_title: jobTitle,
          company: company,
          city: city,
          start_date: startDate,
          end_date: endDate,
          description: description,
          description_html: descriptionHTML,
        });
      }
      let education = $('.education-item');
      for (let i=0;i<education.length;i++) {
        let degree = $(education[i]).find('.degree-input').val();
        let school = $(education[i]).find('.school-input').val();
        let startDate = $(education[i]).find('.education-input-general.date-input.start-date').val();
        let endDate = $(education[i]).find('.education-input-general.date-input.end-date').val();
        let city = $(education[i]).find('.city-input').val();
        let description = $(education[i]).find('#tinyEditor').text();
        let descriptionHTML = $(education[i]).find('#tinyEditor').html();
        data.education.push({
          degree: degree,
          school: school,
          start_date: startDate,
          end_date: endDate,
          city: city,
          description: description,
          description_html: descriptionHTML
        })
      }
      let references = $('.reference-item');
      for (let i=0; i<references.length;i++) {
        let firstName = $(references[i]).find('.firstname-input').val();
        let lastName = $(references[i]).find('.lastname-input').val();
        let fullName = firstName + ' ' + lastName;
        let phone = $(references[i]).find('.phone-input').val();
        let email = $(references[i]).find('.email-input').val();
        let position = $(references[i]).find('.position-input').val();
        let company = $(references[i]).find('.company-input').val();
        data.references.push({
          first_name: firstName,
          last_name: lastName,
          full_name: fullName,
          phone: phone,
          email: email,
          position: position,
          company: company
        })
      }
      let skills = $('.skills-row').find('.right-col').find('.tagin-tag');
      if (skills.length) {
        for (let i=0; i<skills.length;i++) {
          data.skills.push($(skills[i]).text())
        }
      }
      let tools = $('.skills-row').find('.left-col').find('.tagin-tag');
      if (tools.length) {
        for (let i=0; i<tools.length;i++) {
          data.tools.push($(tools[i]).text())
        }
      }
      localStorage.setItem('JobAssistantResume', JSON.stringify(data));
    }
  },
  personal:{
    storePersonalDetails: function () {
      console.log('Storing data');
      let firstName = $('#firstNameInput').val();
      if (typeof firstName === 'undefined') {
        firstName = '';
      }
      let lastName = $('#lastNameInput').val();
      if (typeof lastName === 'undefined') {
        lastName = '';
      }
      let fullName;
      if (typeof firstName !== 'undefined' && typeof lastName !== 'undefined') {
        fullName = firstName + ' ' + lastName
      } else {
        fullName = ''
      }
      let jobTitle = $('#jobTitleInput').val();
      if (typeof jobTitle === 'undefined') {
        jobTitle = '';
      }
      let address = $('#addressInput').val();
      if (typeof address === 'undefined') {
        address = '';
      }
      let city = $('#cityInput').val();
      if (typeof city === 'undefined') {
        city = '';
      }
      let zipCode = $('#zipCodeInput').val();
      if (typeof zipCode === 'undefined') {
        zipCode = '';
      }
      let state = $('#stateInput').val();
      if (typeof state === 'undefined') {
        state = '';
      }
      let country = $('#countryInput').val();
      if (typeof country === 'undefined') {
        country = '';
      }
      let email = $('#emailInput').val();
      if (typeof email === 'undefined') {
        email = '';
      }
      let phoneNumber = $('#phoneNumberInput').val();
      if (typeof phoneNumber === 'undefined') {
        phoneNumber = '';
      }
      let data = {
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        job_title: jobTitle,
        address: address,
        city: city,
        zip_code: zipCode,
        state: state,
        country: country,
        email: email,
        phone_number: phoneNumber
      }
      localStorage.setItem('jobassistantPersonalDetails', JSON.stringify(data));
    },
    retrievePersonalDetails: function (){
      return JSON.parse(localStorage.getItem('jobassistantPersonalDetails'));
    }
  }
}

export {storage}