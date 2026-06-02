import {storage} from "./storage.js";
import {tinyEditor} from "../third_party/tiny-editor-bundle.js";
import {positionLookup, languageLookup, degreeLookup} from "../../main.js";
import {tagin} from "../third_party/tagin.min.js";
import {pdf} from "./pdf.js";
import {wizard} from "./wizard.js";

let resume = {
  loadResumeForm: function (hashId, publicDataFilename, privateDataFilename, jobDetails) {
    let type = 'resume';
    $('.container').load('../../templates/job_ad_wizard/resume/resume_form.html', function () {
      $('#profileSummaryInput').load('../../templates/components/editor.html', function () {
        $('#tinyEditor').find('p').html('Include 2-3 clear sentences about your overall experience');
        tinyEditor();
      });
      $('#linkedinResumeBtn').on('click', function () {
        posthog.capture('fill_in_resume_using_linkedin');
        $('#linkedinPopup').modal('show');
        $('#okayLinkedinPopup').on('click', function () {
          $('#linkedinPopup').modal('hide');
        });
      });
      let skillEl = document.getElementById('skillsResume');
      let toolEl = document.getElementById('toolsResume');
      tagin(skillEl);
      tagin(toolEl);
      $('.references-ios-btn-checkbox-container').on('click', function () {
        $('.references-ios-btn-checkbox').toggleClass('references-checked', 'references-unchecked');
        if ($('.references-ios-btn-checkbox').attr('class').includes('-checked')) {
          posthog.capture('toggled_references');
        }
        $(this).toggleClass('references-_checked', 'references-_unchecked');
        if ($('.reference-item').length < 5) {
          $('.add-reference-container').toggleClass('no-click');
          $('.add-reference-container').toggleClass('transparent');
        }
      });
      $('.additional-personal-btn-link-container').on('click', function () {
        $('.additional-personal-btn-link-container').find('span').toggleText('Edit additional details', 'Hide additional details');
        $('.additional-personal-container').toggleClass('show').slideToggle();
        $('.additional-personal-btn-link-container').find('svg').toggleClass('flip-icon');
        $(`.add-language-container`).prop('disabled', false).css('opacity', 1);
        $('.add-language-container').on('click', function (event) {
          let languageID = resume.fetchLatestResumeElementID('language');
          languageID += 1;
          let addBtn = this;
          resume.addResumeElementHandler(event.target.className, languageID, null);
          if ($('.language-item').length >= 10) {
            $(addBtn).toggleClass('no-click');
            $(addBtn).toggleClass('transparent');
          }
        })
      });
      $('.add-reference-container').on('click', function (event) {
        let referenceID = resume.fetchLatestResumeElementID('reference');
        referenceID += 1;
        let addBtn = this;
        resume.addResumeElementHandler(event.target.className, referenceID, null);
        if ($('.reference-item').length >= 5) {
          // $(addBtn).prop('disabled',true).css('opacity',0.5);
          $(addBtn).toggleClass('no-click');
          $(addBtn).toggleClass('transparent');
        }
      });
      $('.add-education-container').on('click', function (event) {
        let educationID = resume.fetchLatestResumeElementID('education');
        educationID += 1;
        let addBtn = this;
        resume.addResumeElementHandler(event.target.className, educationID, null);
        if ($('.education-item').length >= 6) {
          // $(addBtn).prop('disabled',true).css('opacity',0.5);
          $(addBtn).toggleClass('no-click');
          $(addBtn).toggleClass('transparent');
        }
      });
      $('.add-experience-container').on('click', function (event) {
        let experienceID = resume.fetchLatestResumeElementID('experience');
        experienceID += 1;
        let addBtn = this;
        resume.addResumeElementHandler(event.target.className, experienceID, null);
        if ($('.experience-item').length >= 10) {
          // $(addBtn).prop('disabled',true).css('opacity',0.5);
          $(addBtn).toggleClass('no-click');
          $(addBtn).toggleClass('transparent');
        }
      });
      let data = resume.retrieveResumeInputValues();
      let resumeSaveInterval = window.setInterval(function () {
        storage.resume.storeResumeData();
      }, 5000);
      let universalResumeTemplate = localStorage.getItem('UniversalResumeTemplate');
      $('.preview-btn-container').on('click', function () {
        posthog.capture('clicked_preview_and_download_resume');
        data = resume.retrieveResumeInputValues();
        clearInterval(resumeSaveInterval);
        $('.resume-form-container').removeClass('show').addClass('hide');
        $('.preview-container').removeClass('hide').addClass('show');
        let resumeBodyHTML = pdf.resume.createResumeBodyHTML(data);
        pdf.previewer.loadFilePreview(data, resumeBodyHTML, 'resume', hashId);
        $('.back-to-editor-outer-container').on('click', function () {
          $('.resume-form-container').removeClass('hide').addClass('show');
          $('.preview-container').removeClass('show').addClass('hide');
          let existingIframe = $('.preview-iframe');
          existingIframe.remove();
          resumeSaveInterval = window.setInterval(function () {
            storage.resume.storeResumeData();
          }, 5000);
        });
      })
      $('.close-resume-form').on('click', function () {
        // $('.job-wizard').remove();
        clearInterval(resumeSaveInterval);
        if (universalResumeTemplate) {
          wizard.startApplicationWizard(hashId, publicDataFilename, privateDataFilename, jobDetails)
        } else {
          wizard.loadChooseTemplate(hashId, publicDataFilename, privateDataFilename, jobDetails, type);
        }
      });
    });
  },
  retrieveResumeInputValues: function () {
    // TODO: event here will be handeled by API instead of posthog to reduce number of requests.
    let personaLocalData = storage.personal.retrievePersonalDetails();
    let resumeData = JSON.parse(localStorage.getItem('JobAssistantResume'));

    let firstName = '', middleName = '', lastName = '', fullName = '', preferredJobTitle = '', address = '', email = '',
      country = '', phone = '', city = '', state = '', zipCode = '', profileSummaryText = '', profileSummaryHTML = '',
      education = [], experience = [], skills = [], tools = [], languages = [], references = [],
      referencesExclude = false, templateChoice = 1;
    let data = {
      first_name: firstName,
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
      languages: languages,
      skills: skills,
      tools: tools,
      profile_summary: profileSummaryText,
      profile_summary_html: profileSummaryHTML,
      education: education,
      experience: experience,
      references: references,
      references_exclude: referencesExclude,
      template_style: templateChoice
    }

    if (personaLocalData) {
      if (personaLocalData['first_name'] !== '' && personaLocalData['first_name'] !== ' ') {
        $('#firstNameInput').val(personaLocalData['first_name']);
        data.first_name = personaLocalData['first_name'];
        firstName = personaLocalData['first_name'];
      }
      if (personaLocalData['last_name'] !== '' && personaLocalData['last_name'] !== ' ') {
        $('#lastNameInput').val(personaLocalData['last_name']);
        data.last_name = personaLocalData['last_name'];
        lastName = personaLocalData['last_name'];
      }
      if (personaLocalData['middle_name'] !== '' && personaLocalData['middle_name'] !== ' ' && typeof personaLocalData['middle_name'] !== 'undefined') {
        $('#middleNameInput').val(personaLocalData['middle_name']);
        data.middle_name = personaLocalData['middle_name'];
        middleName = personaLocalData['middle_name'];
      }
      if (personaLocalData['job_title'] !== '' && personaLocalData['job_title'] !== ' ') {
        $('#jobTitleInput').val(personaLocalData['job_title']);
        data.preferred_job_title = personaLocalData['job_title'];
      }
      if (personaLocalData['email'] !== '' && personaLocalData['email'] !== ' ') {
        $('#emailInput').val(personaLocalData['email']);
        data.email = personaLocalData['email'];
      }
      if (personaLocalData['phone_number'] !== '' && personaLocalData['phone_number'] !== ' ') {
        $('#phoneNumberInput').val(personaLocalData['phone_number']);
        data.phone_number = personaLocalData['phone_number'];
      }
      if (personaLocalData['address'] !== '' && personaLocalData['address'] !== ' ') {
        $('#addressInput').val(personaLocalData['address']);
        data.address = personaLocalData['address'];
      }
      if (personaLocalData['city'] !== '' && personaLocalData['city'] !== ' ') {
        $('#cityInput').val(personaLocalData['city']);
        data.city = personaLocalData['city'];
      }
      if (personaLocalData['state'] !== '' && personaLocalData['state'] !== ' ') {
        $('#stateInput').val(personaLocalData['state']);
        data.state = personaLocalData['state'];
      }
      if (personaLocalData['zip_code'] !== '' && personaLocalData['zip_code'] !== ' ') {
        $('#zipCodeInput').val(personaLocalData['zip_code']);
        data.zip_code = personaLocalData['zip_code'];
      }
      if (personaLocalData['country'] !== '' && personaLocalData['country'] !== ' ') {
        $('#countryInput').val(personaLocalData['country']);
        data.country = personaLocalData['country'];
      }
    }

    if (resumeData) {
      if (resumeData['first_name']) {
        $('#firstNameInput').val(resumeData['first_name']);
        data.first_name = resumeData['first_name'];
        firstName = resumeData['first_name'];
      }
      if (resumeData['last_name']) {
        $('#lastNameInput').val(resumeData['last_name']);
        data.last_name = resumeData['last_name'];
        lastName = resumeData['last_name'];
      }
      if (resumeData['middle_name']) {
        $('#middleNameInput').val(resumeData['middle_name']);
        data.middle_name = resumeData['middle_name'];
        middleName = resumeData['middle_name'];
      }
      if (resumeData['preferred_job_title']) {
        $('#jobTitleInput').val(resumeData['preferred_job_title']);
        data.preferred_job_title = resumeData['preferred_job_title'];
      }
      if (resumeData['middle_name']) {
        $('#middleNameInput').val(resumeData['middle_name']);
        data.middle_name = resumeData['middle_name'];
      }
      if (resumeData['phone_number']) {
        $('#phoneNumberInput').val(resumeData['phone_number']);
        data.phone_number = resumeData['phone_number'];
      }
      if (resumeData['email']) {
        $('#emailInput').val(resumeData['email']);
        data.email = resumeData['email'];
      }
      if (resumeData['city']) {
        $('#cityInput').val(resumeData['city']);
        data.city = resumeData['city'];
      }
      if (resumeData['state']) {
        $('#stateInput').val(resumeData['state']);
        data.state = resumeData['state'];
      }
      if (resumeData['zip_code']) {
        $('#zipCodeInput').val(resumeData['zip_code']);
        data.zip_code = resumeData['zip_code'];
      }
      if (resumeData['country']) {
        $('#countryInput').val(resumeData['country']);
        data.country = resumeData['country'];
      }
      if (resumeData['address']) {
        $('#addressInput').val(resumeData['address']);
        data.address = resumeData['address'];
      }
      if (resumeData['profile_summary_html']) {
        setTimeout(function () {
          $('#profileSummaryInput').find('#tinyEditor').html(resumeData['profile_summary_html']);
        }, 20);
        data.profile_summary_html = resumeData['profile_summary_html'];
      }
      if (resumeData['profile_summary']) {
        data.profile_summary = resumeData['profile_summary']
      }
      if (resumeData['tools'].length) {
        let existingToolEls = $('.skills-row').find('.left-col').find('.tagin-wrapper').find('.tagin-tag');
        let existingTools = [];
        if (existingToolEls.length) {
          for(let i = 0; i < existingToolEls.length; i++) {
            let existingTool = existingToolEls[i].innerText;
            existingTools.push(existingTool);
          }
        }
        for (let i = 0; i < resumeData['tools'].length; i++) {
          let tool = resumeData['tools'][i];
          if (!existingTools.includes(tool)) {
            data.tools.push(tool);
            if (tool !== '' && tool !== null) {
              let el = `<span class="tagin-tag">${tool}<span class="tagin-tag-remove"></span></span>`
              $('.skills-row').find('.left-col').find('.tagin-wrapper').prepend(el);
            }
          }
        }
      }
      if (resumeData['skills'].length) {
        let existingSkillEls = $('.skills-row').find('.right-col').find('.tagin-wrapper').find('.tagin-tag');
        let existingSkills = [];
        if (existingSkillEls.length) {
          for(let i = 0; i < existingSkillEls.length; i++) {
            let existingSkill = existingSkillEls[i].innerText;
            existingSkills.push(existingSkill);
          }
        }
        for (let i = 0; i < resumeData['skills'].length; i++) {
          let skill = resumeData['skills'][i];
          if (!existingSkills.includes(skill)) {
            data.skills.push(skill);
            if (skill !== '' && skill !== null) {
              let el = `<span class="tagin-tag">${skill}<span class="tagin-tag-remove"></span></span>`
              $('.skills-row').find('.right-col').find('.tagin-wrapper').prepend(el);
            }
          }
        }
      }
      if (resumeData['languages'].length) {
        for (let i = 0; i < resumeData['languages'].length; i++) {
          let languageData = resumeData['languages'][i];
          let languageID = i + 1;
          data.languages.push(languageData);
          resume.addResumeElementHandler('add-language-container', languageID);
          setTimeout(function () {
            $(`#language-${languageID}`).find('.language-header-text').text(languageData['language']);
            $(`#language-${languageID}`).find('.language-left-input-container').find('.language-input-focus').val(languageData['language']);
            $(`#language-${languageID}`).find('.language-right-input-container').find('.select-language-level-input-text').text(languageData['level'])
          }, 30)
          if ($('.language-item').length >= 10) {
            $(`.add-language-container`).toggleClass('no-click');
            $(`.add-language-container`).toggleClass('transparent');
          }
        }
      }
      if (resumeData['experience'].length) {
        for (let i = 0; i < resumeData['experience'].length; i++) {
          let experience = resumeData['experience'][i];
          let experienceID = i + 1;
          let expJobTitle = experience['job_title'];
          let expCompany = experience['company'];
          let expCity = experience['city'];
          let expStartDate = experience['start_date'];
          let expEndDate = experience['end_date'];
          let expDescriptionHTML = experience['description_html'];
          data.experience.push(experience);
          resume.addResumeElementHandler('add-experience-container', experienceID, expDescriptionHTML);
          setTimeout(function () {
            $(`#experience-${i + 1}`).find('.experience-header-text').text(expJobTitle)
            $(`#experience-${i + 1}`).find('.jobtitle-input').val(expJobTitle);
            $(`#experience-${i + 1}`).find('.company-input').val(expCompany);
            $(`#experience-${i + 1}`).find('.city-input').val(expCity);
            $(`#experience-${i + 1}`).find('.experience-input-general.date-input.start-date').val(expStartDate);
            $(`#experience-${i + 1}`).find('.experience-input-general.date-input.end-date').val(expEndDate);
            // $(`#experience-${i + 1}`).find('#tinyEditor').html(expDescriptionHTML);
          }, 30);
          if ($('.experience-item').length >= 10) {
            $(`.add-experience-container`).toggleClass('no-click');
            $(`.add-experience-container`).toggleClass('transparent');
          }
        }
      }
      if (resumeData['education'].length) {
        for (let i = 0; i < resumeData['education'].length; i++) {
          let education = resumeData['education'][i];
          let educationID = i + 1;
          let degree = education['degree'];
          let school = education['school'];
          let eduStartDate = education['start_date'];
          let eduEndDate = education['end_date'];
          let eduCity = education['city'];
          let eduDescriptionHTML = education['description_html'];
          data.education.push(education);
          resume.addResumeElementHandler('add-education-container', educationID, eduDescriptionHTML);
          setTimeout(function () {
            $(`#education-${educationID}`).find('.education-header-text').text(degree);
            $(`#education-${educationID}`).find('.degree-input').val(degree);
            $(`#education-${educationID}`).find('.school-input').val(school);
            $(`#education-${educationID}`).find('.city-input').val(eduCity);
            $(`#education-${educationID}`).find('.education-input-general.date-input.start-date').val(eduStartDate);
            $(`#education-${educationID}`).find('.education-input-general.date-input.end-date').val(eduEndDate);
            // $(`#education-${educationID}`).find('#tinyEditor').html(eduDescriptionHTML);
          }, 30);
          if ($('.education-item').length >= 10) {
            $(`.add-education-container`).toggleClass('no-click');
            $(`.add-education-container`).toggleClass('transparent');
          }
        }
      }
      if (resumeData['references'].length) {
        for (let i = 0; i < resumeData['references'].length; i++) {
          let reference = resumeData['references'][i];
          let referenceID = i + 1;
          let refFirstName = reference['first_name'];
          let refLastName = reference['last_name'];
          let refPhone = reference['phone'];
          let refEmail = reference['email'];
          let refPosition = reference['position'];
          let refCompany = reference['company'];
          data.references.push(reference);
          resume.addResumeElementHandler('add-reference-container', referenceID);
          setTimeout(function () {
            $(`#reference-${referenceID}`).find('.reference-header-text').text(refFirstName);
            $(`#reference-${referenceID}`).find('.firstname-input').val(refFirstName);
            $(`#reference-${referenceID}`).find('.lastname-input').val(refLastName);
            $(`#reference-${referenceID}`).find('.phone-input').val(refPhone);
            $(`#reference-${referenceID}`).find('.email-input').val(refEmail);
            $(`#reference-${referenceID}`).find('.position-input').val(refPosition);
            $(`#reference-${referenceID}`).find('.company-input').val(refCompany);
          }, 20)
          if ($('.reference-item').length >= 10) {
            $(`.add-reference-container`).toggleClass('no-click');
            $(`.add-reference-container`).toggleClass('transparent');
          }
        }
      }
      if (resumeData['references_exclude']) {
        if (resumeData['references_exclude'] === true) {
          data.references_exclude = true;
          $('.references-ios-btn-checkbox-container').addClass('references-_checked');
          $('.references-ios-btn-checkbox').addClass('references-checked');
        }
      }
    }

    if (middleName !== '' && firstName !== '' && lastName !== '') {
      data.full_name = firstName + ' ' + middleName + ' ' + lastName;
    } else if (firstName !== '' && lastName !== '') {
      data.full_name = firstName + ' ' + lastName;
    } else {
      data.full_name = '';
    }
    return data
  },
  addResumeElementHandler: function (element, ID, descriptionHTML) {
    let targetElement = element;
    let globalTarget;
    let globalType;
    if (targetElement.includes('language')) {
      globalTarget = `#language-${ID}`;
      globalType = 'language';
      $('.' + `${globalType}` + 's-loading-container').append(`<div id="language-${ID}" class="language-item"></div>`);
    } else if (targetElement.includes('experience')) {
      globalTarget = `#experience-${ID}`;
      globalType = 'experience';
      $('.' + `${globalType}` + 's-loading-container').append(`<div id="experience-${ID}" class="experience-item"></div>`);
    } else if (targetElement.includes('education')) {
      globalTarget = `#education-${ID}`;
      globalType = 'education';
      $('.' + `${globalType}` + 's-loading-container').append(`<div id="education-${ID}" class="education-item"></div>`);
    } else if (targetElement.includes('reference')) {
      globalTarget = `#reference-${ID}`;
      globalType = 'reference';
      $('.' + `${globalType}` + 's-loading-container').append(`<div id="reference-${ID}" class="reference-item"></div>`);
    }
    $(`${globalTarget}`).load(`../../templates/job_ad_wizard/resume/${globalType}s.html`, function () {
      let target = this;
      if (`${globalType}`.includes('experience') || `${globalType}`.includes('education')) {
        flatpickr(".date-input", {
          plugins: [
            new monthSelectPlugin({
              shorthand: true, //defaults to false
              dateFormat: "F Y", //defaults to "F Y"
              altFormat: "F Y", //defaults to "F Y"
              theme: "dark" // defaults to "light"
            })
          ]
        });
        let clicked = false;
        $('.start-date').on('click', function (e) {
          let currentlyWorkingEl = $('.flatpickr-rContainer').find('.currently-working').remove();
          $(currentlyWorkingEl).remove();
        });
        $('.end-date').on('click', function () {
          let targetInput = this;
          $('.flatpickr-rContainer').find('.currently-working').remove();
          let flatPickr = $('.flatpickr-calendar.animate.flatpickr-monthSelect-theme-dark.open.arrowBottom.arrowLeft');
          let originalTopValue;
          let topValue;
          if (!clicked) {
            originalTopValue = parseInt($(flatPickr).css('top'));
            topValue = (originalTopValue - 30.5).toString() + 'px';
            clicked = true;
          } else {
            topValue = parseInt($(flatPickr).css('top'));
          }
          $(flatPickr).css({'top': topValue});
          let currentText = 'Currently working here';
          if (globalType === 'education') {
            currentText = 'Currently studying here';
          }
          let checkBox = `<label class="ios-checkbox-label currently-working"><input type="checkbox" checked="false" class="ios-checkbox"><div class="ios-btn-checkbox-container _unchecked"><div class="ios-btn-checkbox unchecked"></div></div><span>${currentText}</span></label>`
          $('.flatpickr-rContainer').prepend(checkBox);
          let formCheck = $('.ios-checkbox');
          $('.ios-btn-checkbox-container').on('click', function () {
            $('.ios-btn-checkbox').toggleClass('checked', 'unchecked');
            $(this).toggleClass('_checked', '_unchecked');
          });
          $(formCheck).on('click', function () {
            $(this).attr('readonly', false);
            $(targetInput).val('Present');
            $('.flatpickr-monthSelect-month').on('click', function () {
              $(formCheck).val('off');
              $(formCheck).attr('checked', false);
              $(this).attr('readonly', true);
            });
          });
          if ($(targetInput).val() === 'Present') {
            $('.ios-btn-checkbox').toggleClass('checked', 'unchecked');
            $('.ios-btn-checkbox-container').toggleClass('_checked', '_unchecked');
            $(formCheck).val('on');
            $(formCheck).attr('checked', true);
          }
        });
        $(globalTarget).find('.editor-container').load('../../templates/components/editor.html', function (e) {
          tinyEditor();
          if (descriptionHTML !== null) {
            $(globalTarget).find('#tinyEditor').html(descriptionHTML);
            $('#firstNameInput').focus();
          } else {
            $(globalTarget).find('#tinyEditor').html(`<p>Write about what you did and your accomplishments</p>`);
            $(globalTarget).find('input')[0].focus();
          }
          setTimeout(function () {
            let allEditors = $('.form-row');
            for (let i = 0; i < allEditors.length; i++) {
              let editor = allEditors[i];
              let toolbars = $(editor).find('.__toolbar');
              if (toolbars.length > 1) {
                $(toolbars[0]).remove();
              }
            }
            if ($(globalTarget).find('.__toolbar').length > 1) {
              $(globalTarget).find('.__toolbar')[0].remove();
            }
          }, 10)
        });
      } else if (`${globalType}`.includes('language')) {
        $(globalTarget).find('.language-level-select-dropdown').change(function () {
          let val = $(this).val();
          if (val !== '') {
            $(globalTarget).find('.select-language-level-input-text').text(val);
          } else {
            $(globalTarget).find('.select-language-level-input-text').text('Select value');
          }
        });
      }
      $(target).find('.' + `${globalType}` + '-header').on('click', function (event) {
        if (event.target.className === `${globalType}s-edit-delete-btn`) {
          $(document).on('click', function (_event) {
            if (_event.target.className !== 'edit-container' && _event.target.className !== 'edit-btn-container'
              && _event.target.className !== `${globalType}s-edit-delete-btn` && _event.target.className !== 'delete-btn-container') {
              if (!$(target).find('.edit-container').attr('class').includes('hide')) {
                $(target).find('.edit-container').toggleClass('hide', 'show');
              }
            }
          });
          $(target).find('.edit-container').toggleClass('hide', 'show');
          $(target).find('.edit-btn-container').on('click', function () {
            if ($(target).find('.' + `${globalType}` + '-body').attr('class').includes('closed')) {
              $(target).find('.edit-container').on('click', function () {
                $(target).find('.' + `${globalType}` + '-body').toggleClass('closed');
              })
            }
          });
          $(target).find('.delete-btn-container').on('click', function () {
            $(target).remove();
            $(`.add-${globalType}-container`).removeClass('no-click');
            $(`.add-${globalType}-container`).removeClass('transparent');
          });
        } else if (event.target.className === `${globalType}` + '-toggle-btn') {
          $(target).find('.' + `${globalType}` + '-body').toggleClass('closed');
          $(target).find('.' + `${globalType}` + '-collapse-expand-icon').toggleClass('collapse-icon');
        } else {
          $(target).find('.' + `${globalType}` + '-body').toggleClass('closed');
          $(target).find('.' + `${globalType}` + '-collapse-expand-icon').toggleClass('collapse-icon');
        }
      });
      let source;
      if (`${globalType}` === 'experience' || `${globalType}` === 'reference') {
        source = positionLookup[0];
      } else if (`${globalType}` === 'language') {
        source = languageLookup[0];
      } else if (`${globalType}` === 'education') {
        source = degreeLookup[0];
      }
      $(this).find('.' + `${globalType}` + '-search').autocomplete({
        source: source
      });
      $(this).find('.' + `${globalType}` + '-input-focus').on('focusout', function () {
        let text;
        $(target).find('.dropdown-item').on('click', function () {
          text = $(this).text();
          $(target).find('.' + `${globalType}` + '-header-text').html(text);
        });
        text = $(this).val();
        if (text !== '') {
          $(target).find('.' + `${globalType}` + '-header-text').html(text);
        } else {
          $(target).find('.' + `${globalType}` + '-header-text').html('(Not specified)');
        }
      });
    })
  },
  fetchLatestResumeElementID: function (type) {
    let ID
    if (type === 'language') {
      if ($('.language-item').length > 0) {
        let el = $('.language-item')[$('.language-item').length - 1];
        let strNum = $(el).attr('id').match(/(\d+)/);
        ID = parseInt(strNum);
      } else {
        ID = 0;
      }
    } else if (type === 'experience') {
      if ($('.experience-item').length > 0) {
        let el = $('.experience-item')[$('.experience-item').length - 1];
        let strNum = $(el).attr('id').match(/(\d+)/);
        ID = parseInt(strNum);
      } else {
        ID = 0;
      }
    } else if (type === 'education') {
      if ($('.education-item').length > 0) {
        let el = $('.education-item')[$('.education-item').length - 1];
        let strNum = $(el).attr('id').match(/(\d+)/);
        ID = parseInt(strNum);
      } else {
        ID = 0;
      }
    } else if (type === 'reference') {
      if ($('.reference-item').length > 0) {
        let el = $('.reference-item')[$('.reference-item').length - 1];
        let strNum = $(el).attr('id').match(/(\d+)/);
        ID = parseInt(strNum);
      } else {
        ID = 0;
      }
    }
    return ID
  },
  chooseResumeBtnHandler: function (useTempBtn, hashId, publicDataFilename, privateDataFilename, jobDetails) {
    $(useTempBtn).on('click', function () {
      posthog.capture('selected_a_resume_template');
      resume.loadResumeForm(hashId, publicDataFilename, privateDataFilename, jobDetails);
    })
  }
}


export {resume}
