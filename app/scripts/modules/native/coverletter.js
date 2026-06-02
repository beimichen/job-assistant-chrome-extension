// Our backend API populates a cover letter template we provide based on the position with data like skills, user name,
// company and position. We DO NOT store personal data and all data passed in exists temporarily in memory.
import {tinyEditor} from "../third_party/tiny-editor-bundle.js";
import {storage} from "./storage.js";
import {pdf} from "./pdf.js";
import {wizard} from "./wizard.js";

function createCoverLetter(position, data, resume, skills) {
  if (data) {
    console.log('CREATING COVER LETTER');
    console.log(data);
    let description = data['description'];
    // let descriptionHTML = $.parseHTML(data['description']);
    // let parsedDescription = $(descriptionHTML).text();
    let manifestData = chrome.runtime.getManifest();
    let appVersion = manifestData.version;
    // source_url: data['source'],
    let company;
    if (typeof data['company'] === 'object') {
      company = 'ERROR';
    } else {
      company = data['company'];
    }
    let payload = {
      candidate_name: '',
      parsed_resume: null,
      resume_file_link: null,
      hiring_manager_name: null,
      raw_job_title: position,
      job_ad_description: description,
      company_name: company,
      hash_id: data['hash_id'],
      source_url: data['url'],
      searched_skills: skills,
      include_resume_skills_in_match: false,
      pre_compiled_coverletter: null,
      chrome_app_version: appVersion
    }
    if (resume) {
      payload.include_resume_skills_in_match = true;
      payload.candidate_name = `${resume['user_first_name']} ${resume['user_last_name']}`;
      payload.parsed_resume = '';
    }
    let parsedPayload = JSON.stringify(payload);
    return $.ajax({
      // url: 'http://127.0.0.1:5000/create-job-application',
      url: 'YOUR_API_HOST/create-job-application',
      timeout: 60000,
      type: 'POST',
      dataType: 'json',
      data: parsedPayload,
      contentType: 'application/json',
      success: function (res) {
        if (res['force_update_message']) {
          if (res['force_update_message'] === 'force_update_message') {
            alert(`Please update your app. App version ${appVersion} is no longer supported.`)
          }
        }
        console.log('COVER LETTER');
        console.log(res);
        return res
      },
      error: function (request, status, err) {
        if (request['statusText'] === 'timeout') {
          // timeout -> reload the page and try again
          alert('Timed out creating cover letter template');
          // clearInterval(tools.url.extractData);
        } else {
          // another error occurred
          if (request['force_update_message']) {
            if (request['force_update_message'] === 'force_update_message') {
              alert(`Please update your app. App version ${appVersion} is no longer supported.`)
            }
          }
        }
      },
    });
  }
}

let coverletter = {
  createHTMLOfCoverLetterPDF: function (coverletterText, userName, companyName, positionTitle, email, phone, formattedDate, userNamePresentInCoverLetter) {
    let manifestData = chrome.runtime.getManifest();
    let appVersion = manifestData.version;
    let payload = {
      raw_job_title: positionTitle,
      company_name: companyName,
      candidate_name: userName,
      sign_off: null,
      contact_number: phone,
      date: formattedDate,
      pre_intro: null,
      email: email,
      intro_paragraph: null,
      body_paragraphs: null,
      outro_paragraph: null,
      parsed_resume: null,
      resume_file_link: null,
      hiring_manager_name: null,
      pre_compiled_coverletter_text: coverletterText,
      user_name_present: userNamePresentInCoverLetter,
      chrome_app_version: appVersion
    }
    let parsedPayload = JSON.stringify(payload);
    return $.ajax({
      url: 'http://127.0.0.1:5000/coverletter_as_html',
      // url: 'https:YOUR_API_HOST/coverletter_as_html',
      timeout: 50000,
      type: 'POST',
      dataType: 'json',
      data: parsedPayload,
      contentType: 'application/json',
      success: function (res) {
        if (res['force_update_message']) {
          if (res['force_update_message'] === 'force_update_message') {
            alert(`Please update your app. App version ${appVersion} is no longer supported.`)
          }
        }
        return res
      },
      error: function (request, status, err) {
        if (request['statusText'] === 'timeout') {
          // timeout -> reload the page and try again
          alert('Timed out creating cover letter PDF')
          // clearInterval(tools.url.extractData);
        } else {
          // another error occurred
        }
      },
    });
  },
  loadCoverLetterEditorHTML: function (coverletterArray, position, company, email, phoneNumber) {
    let paragraphsFormattedHTML = '';
    let paragraphsFormattedText = '';
    let id = 1;
    // let dotpoints = false;
    // let unmarkedDotpoints = false;
    coverletterArray = coverletterArray.filter(function (el) {
      return el !== '';
    });
    const regex = /^(?=[a-z02-9]*$)(?:\d+[a-z]|[a-z]+\d)[a-z\d]*$/i;
    for (let i = 0; i < coverletterArray.length; i++) {
      let words = coverletterArray[i].split(' ');
      let hash = false;
      for (let j = 0; j < words.length; j++) {
        if (regex.test(words[j])) {
          words[j] = '';
          hash = true;
        }
      }
      if (hash) {
        coverletterArray[i] = words.join(' ');
      }
      let text = coverletterArray[i];
      if (phoneNumber !== '') {
        text = text.replace('[phone number]', phoneNumber);
      }
      if (email !== '') {
        text = text.replace('[email]', email);
      }
      // text = text.replaceAll('[org]', '[insert organization]');
      // text = text.replaceAll('[edu_institution]', '[insert education institute]');
      paragraphsFormattedText += text;
      if (text.includes(position)) {
        text = text.replaceAll(position, `<mark class="jobtitle-entity entity" id="${id}">${position}</mark>`);
        id += 1;
      }
      if (text.includes(company)) {
        text = text.replaceAll(company, `<mark class="company-entity entity" id="${id}">${company}</mark>`);
        id += 1;
      }
      if (text[0] === ' ') {
        text = text.slice(1, text.length);
      }
      if (text[0] === '*') {
        text = text.replace('*', '•');
      }
      let sentenceRegex = /[^\.!\?]+[\.!\?]+["']?|.+$/g
      let currentPar = text.match(sentenceRegex);
      if (currentPar.length > 1) {
        paragraphsFormattedHTML += '<p>' + text + '</p>'
      } else {
        if (!text.includes('•') && (text[text.length - 2] !== ':' && text[text.length - 1] !== ':')) {
          text = '•' + text;
        }
        if (i !== coverletterArray[coverletterArray.length - 1]) {
          let nextPar = coverletterArray[i + 1];
          if (typeof nextPar !== 'undefined') {
            nextPar = nextPar.match(sentenceRegex);
            if (nextPar.length > 1) {
              if (text.includes('•')) {
                paragraphsFormattedHTML += '<p style="padding-left:16px;padding-right:16px">' + text + '</p>'
              } else {
                paragraphsFormattedHTML += '<p>' + text + '</p>'
              }
            } else {
              if (text.includes('•')) {
                paragraphsFormattedHTML += '<p style="margin-bottom:0;padding-bottom:0;padding-left:16px;padding-right:16px;">' + text + '</p>'
              } else {
                paragraphsFormattedHTML += '<p style="margin-bottom:0;padding-bottom:0;">' + text + '</p>'
              }
            }
          } else {
            if (text.includes('•')) {
              paragraphsFormattedHTML += '<p style="padding-left:16px;padding-right:16px">' + text + '</p>'
            } else {
              paragraphsFormattedHTML += '<p>' + text + '</p>'
            }
          }
        } else {
          if (text.includes('•')) {
            paragraphsFormattedHTML += '<p style="padding-left:16px;padding-right:16px">' + text + '</p>'
          } else {
            paragraphsFormattedHTML += '<p>' + text + '</p>'
          }
        }
      }
    }

    let entities = paragraphsFormattedHTML.match(/(?<=\[)[^\][]*(?=])/g);

    for (let i=0;i<entities.length;i++) {
      let entity = '[' + entities[i] + ']';
      let insertedEntity;
      if (entities[i] === 'org') {
        insertedEntity = 'organization';
      } else if (entities[i]==='edu_institution') {
        insertedEntity = 'education institution';
      } else {
        insertedEntity = entities[i];
      }
      paragraphsFormattedHTML = paragraphsFormattedHTML.replace(entity, `<strong>[please insert ${insertedEntity}]</strong>`);
    }

    return {
      coverletter_html: paragraphsFormattedHTML,
      coverletter_text: paragraphsFormattedText
    }
  },
  extendCoverletterEditorToolbar: function () {
    let toolbar = $('.__toolbar');
    let companyEntityBtn = `<button class="__toolbar-item-custom company-entity-btn" title="Company" type="button">Label Company Keyword</button>`;
    let jobTitleEntityBtn = `<button class="__toolbar-item-custom position-entity-btn" title="Job Title" type="button">Label Job Title Keyword</button>`;
    $(toolbar).append(companyEntityBtn);
    $(toolbar).append(jobTitleEntityBtn);
    let selection;
    $('#tinyEditor').on('click', function (event) {
      selection = coverletter.getSelection();
    });
    let id = 1;
    $('.company-entity-btn, .position-entity-btn').on('click', function (event) {
      let className;
      if (event.target.className.includes('company-entity-btn')) {
        className = 'company-entity entity';
        posthog.capture('labelled_company_keyword');
        // For both account and cover letter sections
      } else if (event.target.className.includes('position-entity-btn')) {
        className = 'jobtitle-entity entity';
        posthog.capture('labelled_position_entity_keyword');
        // For both account and cover letter sections
      }
      if (selection) {
        let targetInnerHTML = selection.focusNode.parentNode.innerHTML;
        if (selection.extentOffset > selection.baseOffset) {
          let text = selection.toString();
          let start = selection.baseOffset;
          let end = selection.extentOffset;
          let insertion = `<mark class="${className}" id="${id}">${text}</mark>`
          let lastEntity = selection.focusNode.previousSibling;
          if (lastEntity) {
            if (lastEntity.localName === 'mark') {
              let parentNodeTextList = selection.focusNode.parentNode.innerHTML.split(lastEntity.outerHTML)
              if (end === parentNodeTextList[1].length) {
                selection.focusNode.parentNode.innerHTML = parentNodeTextList[0] + lastEntity.outerHTML + parentNodeTextList[1].substring(0, start) + insertion + '&nbsp;';
              } else if (end === parentNodeTextList[1].replace('&nbsp;', ' ').length) {
                selection.focusNode.parentNode.innerHTML = parentNodeTextList[0] + lastEntity.outerHTML + parentNodeTextList[1].substring(0, start + 5) + insertion + '&nbsp;';
              } else {
                if (parentNodeTextList[1].includes('&nbsp;')) {
                  parentNodeTextList[1].replace('&nbsp;', ' ')
                }
                selection.focusNode.parentNode.innerHTML = parentNodeTextList[0] + lastEntity.outerHTML + parentNodeTextList[1].substring(0, start) + insertion + parentNodeTextList[1].substring(end);
              }
              id += 1
            } else {
              targetInnerHTML = selection.focusNode.nodeValue;
              let targetNodeWholeText = selection.focusNode.wholeText;
              let targetNodeFirstPortion = targetNodeWholeText.substring(0, targetNodeWholeText.length - targetInnerHTML.length);
              if (end === targetInnerHTML.length) {
                selection.focusNode.parentNode.innerHTML = targetNodeFirstPortion + targetInnerHTML.substring(0, start) + insertion + '&nbsp;';
              } else {
                selection.focusNode.parentNode.innerHTML = targetNodeFirstPortion + targetInnerHTML.substring(0, start) + insertion + targetInnerHTML.substring(end);
              }
              id += 1
            }
          } else {
            if (end === targetInnerHTML.length) {
              selection.focusNode.parentNode.innerHTML = targetInnerHTML.substring(0, start) + insertion + '&nbsp;';
            } else {
              let updatedHTML = targetInnerHTML.substring(0, start) + insertion + targetInnerHTML.substring(end);
              let cleanedHTML = coverletter.formatHTML(updatedHTML);
              selection.focusNode.parentNode.innerHTML = cleanedHTML;
            }
            id += 1
          }
        }
      }
    })
  },
  formatHTML: function (html) {
    return html.replace('&nbsp;', ' ').replace('\n', ' ').replace('/ /g', ' ');
  },
  loadCoverletterForm: function () {
    return new Promise((resolve, reject) => {
      $('.container').load('../../templates/job_ad_wizard/coverletter/coverletter_form.html', function () {
        $('#coverletterInput').load('../../templates/components/editor.html', function () {
          tinyEditor();
          resolve(setTimeout(function () {
            coverletter.extendCoverletterEditorToolbar();
          }, 30));
        })
      })
    })
  },
  retrieveCoverletterInputValues: function (coverletterFileName, jobData) {

    let personaLocalData = storage.personal.retrievePersonalDetails();
    let coverletterLocalData = JSON.parse(localStorage.getItem(coverletterFileName));
    let universalCoverletterLocalData = localStorage.getItem('JobAssistantUniversalCoverLetter');

    let firstName = '', lastName = '', jobTitle = '', address = '', email = '', phoneNumber = '', companyName = '',
      hiringManager = '', coverletterHTML = '', coverletterParagraphsFormatted = '', city = '', state = '',
      zipCode = '', country = '';

    if (coverletterLocalData.hasOwnProperty('hiring_manager')) {
      $('#hiringManagerNameInput').val(coverletterLocalData['hiring_manager']);
      hiringManager = coverletterLocalData['hiring_manager'];
    }

    if (personaLocalData) {
      console.log(personaLocalData);
      if (personaLocalData['first_name'] !== '' && personaLocalData['first_name'] !== ' ') {
        $('#firstNameInput').val(personaLocalData['first_name']);
        firstName = personaLocalData['first_name'];
      }
      if (personaLocalData['last_name'] !== '' && personaLocalData['last_name'] !== ' ') {
        $('#lastNameInput').val(personaLocalData['last_name']);
        lastName = personaLocalData['last_name'];
      }
      if (personaLocalData['job_title'] !== '' && personaLocalData['job_title'] !== ' ') {
        $('#jobTitleInput').val(personaLocalData['job_title']);
        jobTitle = personaLocalData['job_title'];
      }
      if (personaLocalData['address'] !== '' && personaLocalData['address'] !== ' ') {
        $('#addressInput').val(personaLocalData['address']);
        address = personaLocalData['address'];
      }
      if (personaLocalData['city'] !== '' && personaLocalData['city'] !== ' ') {
        $('#cityInput').val(personaLocalData['city']);
        city = personaLocalData['city'];
      }
      if (personaLocalData['state'] !== '' && personaLocalData['state'] !== ' ') {
        $('#stateInput').val(personaLocalData['state']);
        state = personaLocalData['state'];
      }
      if (personaLocalData['country'] !== '' && personaLocalData['country'] !== ' ') {
        $('#countryInput').val(personaLocalData['country']);
        country = personaLocalData['country'];
      }
      if (personaLocalData['zip_code'] !== '' && personaLocalData['zip_codee'] !== ' ') {
        $('#zipCodeInput').val(personaLocalData['zip_code']);
        zipCode = personaLocalData['zip_code'];
      }
      if (personaLocalData['email'] !== '' && personaLocalData['email'] !== ' ') {
        $('#emailInput').val(personaLocalData['email']);
        email = personaLocalData['email'];
      }
      if (personaLocalData['phone_number'] !== '' && personaLocalData['phone_number'] !== ' ') {
        $('#phoneNumberInput').val(personaLocalData['phone_number']);
        phoneNumber = personaLocalData['phone_number'];
      }
      if (personaLocalData['company_name'] !== '' && personaLocalData['company_name'] !== ' ') {
        $('#companyNameInput').val(personaLocalData['company_name']);
        companyName = personaLocalData['company_name'];
      }
    }
    if (jobData['company'] !== '' && jobData['company'] !== null && typeof jobData['company'] !== 'undefined') {
      $('#companyNameInput').val(jobData['company']);
      companyName = jobData['company'];
    }
    if (universalCoverletterLocalData) {
      if (jobTitle !== '' && companyName !== '') {
        let coverletterHTML = coverletter.populateCoverletterEntitySlots(universalCoverletterLocalData, companyName, jobTitle);
        $('#tinyEditor').html(coverletterHTML);
      } else {
        $('#tinyEditor').html(universalCoverletterLocalData);
      }
    } else if (coverletterLocalData['cover_letter'] !== [] && coverletterLocalData['cover_letter'] !== null && typeof coverletterLocalData['cover_letter'] !== 'undefined') {
      if (coverletterLocalData['cover_letter'].constructor === Array) {
        console.log('COVER LETTER (ARRAY)');
        console.log(coverletterLocalData['cover_letter']);
        let coverletterArray = coverletterLocalData['cover_letter'];
        let slicedCoverletterArray = coverletterArray.slice(1, coverletterLocalData['cover_letter'].length - 2);
        let _coverletter = coverletter.loadCoverLetterEditorHTML(slicedCoverletterArray, coverletterLocalData['inserted_position'], jobData['company'], email, phoneNumber);
        $('#tinyEditor').html(_coverletter['coverletter_html']);
        coverletterHTML = _coverletter['coverletter_html'];
        coverletterParagraphsFormatted = _coverletter['coverletter_text'];
      } else {
        $('#tinyEditor').html(coverletterLocalData['cover_letter_html']);
        coverletterHTML = coverletterLocalData['cover_letter_html'];
      }
    } else {
      coverletterHTML = document.getElementById('tinyEditor').innerHTML;
      coverletterParagraphsFormatted = $('#tinyEditor').text();
    }

    let fullName = firstName + ' ' + lastName;
    let templateChoice = 1;

    return {
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      job_title: jobTitle,
      address: address,
      city: city,
      state: state,
      country: country,
      zip_code: zipCode,
      email: email,
      phone_number: phoneNumber,
      company_name: companyName,
      coverletter_text: coverletterParagraphsFormatted,
      coverletter_html: coverletterHTML,
      template_style: templateChoice,
      hiring_manager: hiringManager,
      coverletter_data: coverletterLocalData
    }
  },
  handleEmptyField: function(field, type) {
    if(typeof field === 'undefined' || field === '' || field ===' ') {
      return `<strong>[please insert ${type}]</strong>`
    } else {
      return field
    }
  },
  populateCoverletterEntitySlots: function (coverletterHTML, companyName, jobTitle) {
    let coverletterArray = $.parseHTML(coverletterHTML);

    let coverletterHTMLParsed = '';

    for (let j = 0; j < coverletterArray.length; j++) {
      let coverletterEl = coverletterArray[j];
      let jobTitleEntities = $(coverletterEl).find('.jobtitle-entity');
      let companyEntities = $(coverletterEl).find('.company-entity');

      for (let i = 0; i < jobTitleEntities.length; i++) {
        $(jobTitleEntities[i]).text(jobTitle);
      }
      for (let i = 0; i < companyEntities.length; i++) {
        $(companyEntities[i]).text(companyName);
      }
      coverletterHTMLParsed += coverletterEl.outerHTML;
    }

    return coverletterHTMLParsed
  },
  getSelection: function () {
    var selection = null;
    if (window.getSelection) {
      selection = window.getSelection();
    }
    return selection;
  },
  chooseCoverletterBtnHandler: function(useTempBtn, hashId, publicDataFilename, privateDataFilename, jobDetails) {
    $(useTempBtn).on('click', function () {
      posthog.capture('selected_a_coverletter_template');
      // let type = 'cover_letter';
      coverletter.loadCoverletterFormAndData(hashId, publicDataFilename, privateDataFilename, jobDetails);
    });
  },
  loadCoverletterFormAndData: function(hashId, publicDataFilename, privateDataFilename, jobDetails){
    coverletter.loadCoverletterForm().then(function () {
      let type = 'cover_letter';
      let universalCoverletterTemplate = JSON.parse(localStorage.getItem('UniversalCoverletterTemplate'));
      let data = coverletter.retrieveCoverletterInputValues(privateDataFilename, jobDetails);
      if(data['coverletter_text'].length >= 90) {
        $('#cover-letter-alert-warning').addClass('show');
      }
      let coverletterSaveInterval = window.setInterval(function () {
        // personal data is stored in local storage only
        storage.personal.storePersonalDetails();
        storage.coverletter.storeCoverletterData(privateDataFilename, data['template_style']);
      }, 5000);
      $('.preview-btn-container').on('click', function () {
        posthog.capture('clicked_preview_and_download_coverletter');
        data = coverletter.retrieveCoverletterInputValues(privateDataFilename, jobDetails);
        clearInterval(coverletterSaveInterval);
        $('.coverletter-form-container').removeClass('show').addClass('hide');
        $('.preview-container').removeClass('hide').addClass('show');
        let coverletterBodyHTML = pdf.coverletter.createCoverLetterBodyHTML(data['coverletter_html'], data['company_name'], data['phone_number'], data['full_name'], data['hiring_manager']);
        pdf.previewer.loadFilePreview(data, coverletterBodyHTML, 'cover_letter', hashId);
        $('.back-to-editor-outer-container').on('click', function () {
          $('.coverletter-form-container').removeClass('hide').addClass('show');
          $('.preview-container').removeClass('show').addClass('hide');
          let existingIframe = $('.preview-iframe');
          existingIframe.remove();
          data = coverletter.retrieveCoverletterInputValues(privateDataFilename, jobDetails);
          coverletterSaveInterval = window.setInterval(function () {
            storage.personal.storePersonalDetails();
            storage.coverletter.storeCoverletterData(privateDataFilename, data['template_style']);
          }, 5000);
        });
      });
      $('.close-coverletter-form').on('click', function () {
        // $('.job-wizard').remove();
        clearInterval(coverletterSaveInterval);
        if(universalCoverletterTemplate) {
          wizard.startApplicationWizard(hashId, publicDataFilename, privateDataFilename, jobDetails);
        } else {
          wizard.loadChooseTemplate(hashId, publicDataFilename, privateDataFilename, jobDetails, type);
        }
      });
    })
  }
}

export {coverletter, createCoverLetter}