import {tinyEditor} from "../third_party/tiny-editor-bundle.js";
import {tagin} from "../third_party/tagin.min.js";
import {resume} from "./resume.js";
import {storage} from "./storage.js";
import {loadPersonalData} from "./personal.js";
import {wizard} from "./wizard.js";
import {coverletter as cv} from "./coverletter.js";
import {resetHeaderLogo} from "./jobads.js";

export function loadAccountBody() {
  $('.body-container').load('../../templates/components/account.html', function () {
    $('.navbar-home').removeClass('active');
    $('.navbar-search').removeClass('active');
    $('.header-center').find('h5').text('Account');
    $('.pdf-template').on('click', function(){
      $('.body-container').load('../../templates/job_ad_wizard/set_template.html', function () {
        let type = 'coverletter';
        let coverletterUniversalTemplate = localStorage.getItem('UniversalCoverletterTemplate');
        let resumeUniversalTemplate = localStorage.getItem('UniversalResumeTemplate');
        if(coverletterUniversalTemplate) {
          setTimeout(function(){
            $('.coverletter-ios-btn-checkbox-container').click();
          },10)
        }
        wizard.loadChooseTemplateBody(type);
        let headerLogo = $('.header-logo');
        $('.header-center').find('h5').text('Set PDF Template');
        headerLogo.find('img').remove();
        headerLogo.append('<i class = "bi bi-arrow-left" id="account-detail-back"></i>');
        headerLogo.on('click', function () {
          $(this).find('i').remove();
          loadAccountBody();
        })
        $('#resume-tab').on('click', function(){
          $('.pdf-nav-item-coverletter').removeClass('active');
          $('.pdf-nav-item-resume').addClass('active');
          type = 'resume';
          wizard.loadChooseTemplateBody(type);
          if(resumeUniversalTemplate) {
            setTimeout(function(){
              $('.resume-ios-btn-checkbox-container').click();
            },10)
          }
        })
        $('#coverletter-tab').on('click', function(){
          $('.pdf-nav-item-resume').removeClass('active');
          $('.pdf-nav-item-coverletter').addClass('active');
          type = 'coverletter';
          wizard.loadChooseTemplateBody(type);
          if(coverletterUniversalTemplate) {
            setTimeout(function(){
              $('.coverletter-ios-btn-checkbox-container').click();
            },10)
          }
        })
      })
    });
    $('.resume-settings').on('click', function(){
      $('.body-container').load('../../templates/job_ad_wizard/resume/resume_form.html', function () {
        let headerLogo = $('.header-logo');
        $('.header-center').find('h5').text('Resume');
        headerLogo.find('img').remove();
        headerLogo.append('<i class = "bi bi-arrow-left" id="account-detail-back"></i>');
        headerLogo.on('click', function () {
          $(this).find('i').remove();
          loadAccountBody();
        });
        $('#linkedinResumeBtn').on('click', function(){
          posthog.capture('fill_in_resume_using_linkedin');
          $('#linkedinPopup').modal('show');
          $('#okayLinkedinPopup').on('click', function(){
            $('#linkedinPopup').modal('hide');
          });
        });
        $('#profileSummaryInput').load('../../templates/components/editor.html', function () {
          $('#tinyEditor').find('p').html('Include 2-3 clear sentences about your overall experience');
          tinyEditor();
        });
        $('.preview-btn-container').hide();
        let skillEl = document.getElementById('skillsResume');
        let toolEl = document.getElementById('toolsResume');
        tagin(skillEl);
        tagin(toolEl);
        $('.references-ios-btn-checkbox-container').on('click', function(){
          // TODO: event here
          // EXAMPLE FOR CHECKING IF CHECKED: $('.references-ios-btn-checkbox').attr('class').includes('-checked');
          $('.references-ios-btn-checkbox').toggleClass('references-checked', 'references-unchecked');
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
          $(`.add-language-container`).prop('disabled',false).css('opacity',1);
          $('.add-language-container').on('click', function (event) {
            let languageID= resume.fetchLatestResumeElementID('language');
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
        setTimeout(function(){
          $('.reference-inputs-inner-container').addClass('account-settings-references-inner-container');
          $('.reference-input-container').addClass('account-settings-input-references');
        },30);
        let resumeSaveInterval = window.setInterval(function(){
          storage.resume.storeResumeData();
        }, 5000);
      })
    });
    $('.cover-letter-settings').on('click', function(){
      let headerLogo = $('.header-logo');
      $('.header-center').find('h5').text('Cover Letter Details');
      headerLogo.find('img').remove();
      headerLogo.append('<i class = "bi bi-arrow-left" id="account-detail-back"></i>');
      headerLogo.on('click', function () {
        $(this).find('i').remove();
        loadAccountBody();
      })
      $('.body-container').load('../../templates/job_ad_wizard/coverletter/account_settings_coverletter.html', function () {
        $('#coverletterInput').load('../../templates/components/editor.html', function(){
          $('#tinyEditor').find('p').html('Include 2-3 clear sentences about your overall experience');
          $('#tinyEditor').css('height','270px');
          tinyEditor();
          cv.extendCoverletterEditorToolbar();
          let toolBarSeparator = $('.__toolbar-separator')[$('.__toolbar-separator').length - 1];
          $(toolBarSeparator ).css('width','100px');
          $('.__toolbar-item-custom').css('margin-top','10px');
          $('#close-alert').on('click', function(){
            $('#tinyEditor').css('height','350px');
          })
          $('.form-row').css('padding-bottom','0px');
          $('#saveCoverLetterUniversal').on('click', function(){
            posthog.capture('save_to_reuse_coverletter');
            let coverletterHTML = $('#tinyEditor').html();
            let jobEntities = $('#tinyEditor').find('.jobtitle-entity');
            let companyEntities = $('#tinyEditor').find('.company-entity');
            $('#confirmSave').modal('show');
            if (!jobEntities.length && !companyEntities.length) {
              $('#confirmSave').find('.modal-body').find('p').text('Please label words that are companies and job titles.');
              $('#save-keyword').text('Okay');
              $('#confirmSave').css('left','66px');
              $('#save-keyword').on('click', function(){ // confirm save
                // TODO event here
                $('#confirmSave').modal('hide');
              });
            } else {
              $('#save-keyword').on('click', function(){
                localStorage.setItem('JobAssistantUniversalCoverLetter', coverletterHTML);
                $('#confirmSave').modal('hide');
              });
            }
          });
        });
      })
    });
    $('.account-settings').on('click', function(){
      $('.body-container').load('../../templates/components/personal.html', function () {
        // All data here, filled in from the form are saved in local memory.
        // TODO: event here for personal form completion
        let data = storage.personal.retrievePersonalDetails();
        loadPersonalData(data);
        let personalSaveInterval = window.setInterval(function () {
          storage.personal.storePersonalDetails();
        }, 5000);
        let headerLogo = $('.header-logo');
        $('.header-center').find('h5').text('Personal Details');
        headerLogo.find('img').remove();
        headerLogo.append('<i class = "bi bi-arrow-left" id="account-detail-back"></i>');
        $('.bi.bi-arrow-left').on('click', function () {
          $(this).find('i').remove();
          clearInterval(personalSaveInterval);
          loadAccountBody();
        });
        $('.nav-container').on('click', function () {
          clearInterval(personalSaveInterval);
        });
      });
    });
    $('.account-feedback').on('click', function(){
      chrome.tabs.create({ url: 'YOUR_FEEDBACK_FORM_URL?usp=sf_link'});
    });
  });
  resetHeaderLogo();
}