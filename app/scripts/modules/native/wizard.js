import {storage} from "./storage.js";
import {coverletter as cv} from "./coverletter.js"
import {loadNavBar} from "./navbar.js";
import {loadAccountBody} from "./account.js";
import {loadJobDetails} from "./jobads.js";
import {pdf} from "./pdf.js"
import {resume} from "./resume.js";

let wizard = {
  startApplicationWizard:function(hashId, publicDataFilename, privateDataFilename, jobDetails) {
    $('body, .container').width('800').css('margin', '0px');
    let existingPersonalDetails = JSON.parse(localStorage.getItem('jobassistantPersonalDetails'));
    let existingResumeDetails = JSON.parse(localStorage.getItem('JobAssistantResume'));
    $('.container').load('../../templates/job_ad_wizard/job_app_wizard.html', function(){
      let universalResumeTemplate = localStorage.getItem('UniversalResumeTemplate');
      let universalCoverletterTemplate = JSON.parse(localStorage.getItem('UniversalCoverletterTemplate'));
      if (existingPersonalDetails) {
        $('.coverletter-sample-btn').addClass('edit-mode').text('Edit Cover Letter');
      }
      if (existingResumeDetails) {
        $('.resume-sample-btn').addClass('edit-mode').text('Edit Resume');
      }
      $('.svg-close').on('click', function(){
        wizard.resetAppHeightAndWidth();
        let appStructureHTML = `
        <div class="header-container border" style="width:450px;height:60px;">
        </div>
        <div class="body-container" style="width:450px;height:480px;">
        </div>
        <div class="nav-container border">
        </div>`
        $('.container').html(appStructureHTML);
        setTimeout(function () {
          $('.header-container').load('../../templates/components/header.html');
          loadNavBar();
          $('.body-container').load('../../templates/job_ads/job_ad_details.html', function () {
            loadJobDetails(hashId, publicDataFilename, privateDataFilename, jobDetails);
            $('#job-apply').on('click', function () {
              wizard.startApplicationWizard(hashId, publicDataFilename, privateDataFilename, jobDetails);
            });
          });
        }, 20);
      });
      wizard.skipApplicationBtnHandler(publicDataFilename);
      $('.coverletter-sample-btn').on('click', function(){
        posthog.capture('clicked_create_cover_letter');
        let type = 'cover_letter';
        if (universalCoverletterTemplate) {
          cv.loadCoverletterFormAndData(hashId, publicDataFilename, privateDataFilename, jobDetails);
        } else {
          wizard.loadChooseTemplate(hashId, publicDataFilename, privateDataFilename, jobDetails, type);
        }
      });
      $('.resume-sample-btn').on('click', function(){
        posthog.capture('clicked_create_resume');
        let type = 'resume';
        if (universalResumeTemplate) {
          resume.loadResumeForm(hashId, publicDataFilename, privateDataFilename, jobDetails);
        } else {
          wizard.loadChooseTemplate(hashId, publicDataFilename, privateDataFilename, jobDetails, type);
        }
      });
    })
  },
  // Users can choose a template for their PDF - currently, we're starting with just one template.
  loadChooseTemplate: function(hashId, publicDataFilename, privateDataFilename, jobDetails, type) {
      if (type === 'cover_letter') {
        $('.container').load('../../templates/job_ad_wizard/coverletter/choose_template.html', function() {
          wizard.skipApplicationBtnHandler(publicDataFilename);
          new Glider(document.querySelector('.glider'), {
            slidesToShow: 3,
            // dots: '.dots',
            arrows: {
              prev: '.glider-prev',
              next: '.glider-next'
            }
          });
          let gliderCenter = $('.glider-slide.visible.center');
          // let gliderElements = $('.glider-slide.visible');
          let useTempBtn = `
        <div class="coverletter-choose-sample-btn-container" style="position:relative;">
          <button class="coverletter-sample-choose-btn">Use This Template</button>
        </div>`
          let existingBtn = $('.coverletter-choose-sample-btn-container');
          if (existingBtn.length === 0) {
            gliderCenter.append(useTempBtn);
            wizard.addUserTempBtn(type).then(function(btn) {
              if (btn.childNodes[0].className !== 'coverletter-sample-choose-btn-coming-soon') {
                useTempBtn = btn;
                cv.chooseCoverletterBtnHandler(useTempBtn, hashId, publicDataFilename, privateDataFilename, jobDetails);
              }
            });
          }
          document.getElementsByClassName('glider-next')[0].addEventListener('click', function () {
            wizard.addUserTempBtn(type).then(function(btn) {
              if (btn.childNodes[0].className !== 'coverletter-sample-choose-btn-coming-soon') {
                useTempBtn = btn;
                cv.chooseCoverletterBtnHandler(useTempBtn, hashId, publicDataFilename, privateDataFilename, jobDetails);
              }
            });
          });
          document.getElementsByClassName('glider-prev')[0].addEventListener('click', function () {
            wizard.addUserTempBtn(type).then(function(btn) {
              if (btn.childNodes[0].className !== 'coverletter-sample-choose-btn-coming-soon') {
                useTempBtn = btn;
                cv.chooseCoverletterBtnHandler(useTempBtn, hashId, publicDataFilename, privateDataFilename, jobDetails);
              }
            });
          });
          $('.svg-close').on('click', function(){
            wizard.startApplicationWizard(hashId, publicDataFilename, privateDataFilename, jobDetails);
          })
        })
      } else if (type === 'resume') {
        $('.container').load('../../templates/job_ad_wizard/resume/choose_template.html', function() {
          wizard.skipApplicationBtnHandler(publicDataFilename);
          new Glider(document.querySelector('.glider'), {
            slidesToShow: 3,
            // dots: '.dots',
            arrows: {
              prev: '.glider-prev',
              next: '.glider-next'
            }
          });
          let gliderCenter = $('.glider-slide.visible.center');
          // let gliderElements = $('.glider-slide.visible');
          let useTempBtn = `
        <div class="resume-choose-sample-btn-container" style="position:relative;">
          <button class="resume-sample-choose-btn">Use This Template</button>
        </div>`
          let existingBtn = $('.resume-choose-sample-btn-container');
          if (existingBtn.length === 0) {
            gliderCenter.append(useTempBtn);
            wizard.addUserTempBtn(type).then(function(btn) {
              if (btn.childNodes[0].className !== 'resume-sample-choose-btn-coming-soon') {
                useTempBtn = btn;
                resume.chooseResumeBtnHandler(useTempBtn, hashId, publicDataFilename, privateDataFilename, jobDetails);
              }
            });
          }
          document.getElementsByClassName('glider-next')[0].addEventListener('click', function () {
            wizard.addUserTempBtn(type).then(function(btn) {
              if (btn.childNodes[0].className !== 'resume-sample-choose-btn-coming-soon') {
                useTempBtn = btn;
                resume.chooseResumeBtnHandler(useTempBtn, hashId, publicDataFilename, privateDataFilename, jobDetails);
              }
            });
          });
          document.getElementsByClassName('glider-prev')[0].addEventListener('click', function () {
            wizard.addUserTempBtn(type).then(function(btn) {
              if (btn.childNodes[0].className !== 'resume-sample-choose-btn-coming-soon') {
                useTempBtn = btn;
                resume.chooseResumeBtnHandler(useTempBtn, hashId, publicDataFilename, privateDataFilename, jobDetails);
              }
            });
          });
          $('.svg-close').on('click', function(){
            wizard.startApplicationWizard(hashId, publicDataFilename, privateDataFilename, jobDetails);
          });
        });
      }
    },
  addUserTempBtnUniversal:function(type) {
    return new Promise((resolve, reject) => {
      if (type === 'coverletter') {
        document.getElementsByClassName('coverletter-choose-sample-btn-container-universal')[0].remove();
      } else if (type === 'resume') {
        document.getElementsByClassName('resume-choose-sample-btn-container-universal')[0].remove();
      }
      setTimeout(function () {
        let div = document.createElement('div');
        if (type === 'coverletter') {
          div.classList.add("coverletter-choose-sample-btn-container-universal");
          div.innerHTML = '<button class="coverletter-sample-choose-btn-universal">Use This Template</button>';
        } else if (type === 'resume') {
          div.classList.add("resume-choose-sample-btn-container-universal");
          div.innerHTML = '<button class="resume-sample-choose-btn-universal">Use This Template</button>';
        }
        div.style['position'] = 'relative';
        div.style['width'] = '246.422px';
        document.getElementsByClassName('glider-slide visible center')[0].appendChild(div);
        if(div.parentNode.id === 'coverletter-template-2' || div.parentNode.id === 'coverletter-template-3' ||
          div.parentNode.id === 'coverletter-template-4'|| div.parentNode.id === 'resume-template-2' ||
          div.parentNode.id === 'resume-template-3' || div.parentNode.id === 'resume-template-4') {
          if(type === 'coverletter') {
            div.innerHTML = '<button class="coverletter-sample-choose-btn-coming-soon-universal" style="pointer-events:none;opacity:0.5;">Coming Soon</button>';
          } else if(type === 'resume') {
            div.innerHTML = '<button class="resume-sample-choose-btn-coming-soon-universal" style="pointer-events:none;opacity:0.5;">Coming Soon</button>';
          }
        }
        resolve(div);
      }, 120)
    });
  },
  addUserTempBtn:function(type) {
    return new Promise((resolve, reject) => {
      if (type === 'cover_letter') {
        document.getElementsByClassName('coverletter-choose-sample-btn-container')[0].remove();
      } else if (type === 'resume') {
        document.getElementsByClassName('resume-choose-sample-btn-container')[0].remove();
      }
      setTimeout(function () {
        let div = document.createElement('div');
        if (type === 'cover_letter') {
          div.classList.add("coverletter-choose-sample-btn-container");
          div.innerHTML = '<button class="coverletter-sample-choose-btn">Use This Template</button>';
        } else if (type === 'resume') {
          div.classList.add("resume-choose-sample-btn-container");
          div.innerHTML = '<button class="resume-sample-choose-btn">Use This Template</button>';
        }
        div.style['position'] = 'relative';
        div.style['width'] = '246.422px';
        document.getElementsByClassName('glider-slide visible center')[0].appendChild(div);
        if(div.parentNode.id === 'coverletter-template-2' || div.parentNode.id === 'coverletter-template-3' ||
          div.parentNode.id === 'coverletter-template-4'|| div.parentNode.id === 'resume-template-2' ||
          div.parentNode.id === 'resume-template-3' || div.parentNode.id === 'resume-template-4') {
          if(type === 'cover_letter') {
            div.innerHTML = '<button class="coverletter-sample-choose-btn-coming-soon" style="pointer-events:none;opacity:0.5;">Coming Soon</button>';
          } else if(type === 'resume') {
            div.innerHTML = '<button class="resume-sample-choose-btn-coming-soon" style="pointer-events:none;opacity:0.5;">Coming Soon</button>';
          }
        }
        resolve(div);
      }, 120)
    });
  },
  loadChooseTemplateBody:function(type) {
    $('.set-template-body-container').load(`../../templates/job_ad_wizard/set_template_${type}.html`, function () {
      new Glider(document.querySelector('.glider'), {
        slidesToShow: 3,
        // dots: '.dots',
        arrows: {
          prev: '.glider-prev',
          next: '.glider-next'
        }
      });
      let gliderCenter = $('.glider-slide.visible.center');
      // let gliderElements = $('.glider-slide.visible');
      let useTempBtn = `
        <div class="${type}-choose-sample-btn-container-universal" style="position:relative;">
          <button class="${type}-sample-choose-btn-universal">Use This Template</button>
        </div>`
      let existingBtn = $(`.${type}-choose-sample-btn-container-universal`);
      if (existingBtn.length === 0) {
        gliderCenter.append(useTempBtn);
        wizard.addUserTempBtnUniversal(type).then(function(btn) {
          if (btn.childNodes[0].className !== `${type}-sample-choose-btn-coming-soon-universal`) {
            useTempBtn = btn;
            $(useTempBtn).on('click', function(){
              if (type === 'coverletter') {
                $('#coverletterTemplatePopup').modal('show');
                $('#confirmCoverletterTemplate').on('click', function(){
                  storage.coverletter.storeUniversalCoverletterTemplate(1);
                  $('#coverletterTemplatePopup').modal('hide');
                  $('#storedCoverletterSuccessPopup').modal('show');
                  $('#confirmSuccess').on('click', function(){
                    $('#storedCoverletterSuccessPopup').modal('hide');
                  });
                })
                $('#cancelCoverletterTemplate').on('click', function(){
                  $('#coverletterTemplatePopup').modal('hide')
                });
                // loadAccountBody();
              } else if (type==='resume') {
                $('#resumeTemplatePopup').modal('show');
                $('#confirmResumeTemplate').on('click', function(){
                  storage.resume.storeUniversalResumeTemplate(1);
                  $('#resumeTemplatePopup').modal('hide');
                  $('#storedResumeSuccessPopup').modal('show');
                  $('#confirmSuccess').on('click', function(){
                    $('#storedResumeSuccessPopup').modal('hide');
                  });
                })
                $('#cancelResumeTemplate').on('click', function(){
                  $('#resumeTemplatePopup').modal('hide')
                });
                // loadAccountBody();
              }
            })
          }
        });
      }
      document.getElementsByClassName('glider-next')[0].addEventListener('click', function () {
        wizard.addUserTempBtnUniversal(type).then(function(btn) {
          if (btn.childNodes[0].className !== `${type}-sample-choose-btn-coming-soon-universal`) {
            useTempBtn = btn;
            $(useTempBtn).on('click', function(){
              if (type === 'coverletter') {
                storage.coverletter.storeUniversalCoverletterTemplate(1);
                loadAccountBody();
              } else if (type==='resume') {
                storage.resume.storeUniversalResumeTemplate(1);
                loadAccountBody();
              }
            })
          }
        });
      });
      document.getElementsByClassName('glider-prev')[0].addEventListener('click', function () {
        wizard.addUserTempBtnUniversal(type).then(function(btn) {
          if (btn.childNodes[0].className !== `${type}-sample-choose-btn-coming-soon-universal`) {
            useTempBtn = btn;
            $(useTempBtn).on('click', function(){
              if (type === 'coverletter') {
                storage.coverletter.storeUniversalCoverletterTemplate(1);
                loadAccountBody();
              } else if (type==='resume') {
                storage.resume.storeUniversalResumeTemplate(1);
                loadAccountBody();
              }
            })
          }
        });
      });
      let checkBox = $(`.${type}-ios-btn-checkbox-container`);
      if (checkBox.length) {
        $(checkBox).on('click', function(){
          if ($(this).attr('class').includes(`${type}-_checked`)) {
            localStorage.removeItem(`Universal${type.toProperCase()}Template`)
          }
          $(this).toggleClass(`${type}-_checked`);
          $(`.${type}-ios-btn-checkbox`).toggleClass(`${type}-checked`);
          $('.template-slider').toggleClass('disabled');
        });
      }
    });
  },
  skipApplicationBtnHandler:function(publicDataFilename) {
    $('.job-wizard-skip').on('click', function(){
      let adData = JSON.parse(localStorage.getItem(publicDataFilename));
      if(adData) {
        // let internalApplyBtn = adData['apply_btn_url'];
        // let externalApplyBtn = adData['external_apply_url'];
        // let source = adData['source'];
        // if (internalApplyBtn) {
        //   chrome.tabs.create({ url: source });
        // } else if (externalApplyBtn) {
        //   chrome.tabs.create({ url: externalApplyBtn });
        // } else {
        //   chrome.tabs.create({ url: source });
        // }
        let applyLink = adData['url'];
        chrome.tabs.create({'url': applyLink});
      }
    });
  },
  resetAppHeightAndWidth:function() {
    $('.container').width('450px');
    $('.container').height('600px');
    $('.global').width('450px');
    $('.global').height('600px');
  }
}

export {wizard}
