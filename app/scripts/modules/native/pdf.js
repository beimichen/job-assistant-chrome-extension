let pdf = {
  coverletter: {
    coverletterTemplate1Style: function (templateChoice, chosenColor) {
      if (!chosenColor) {
        chosenColor = '#cf8a05'
      }
      let html =
        `<style>
    article, section {
      display: block;
    }
    html, body {
      background: white;
      font-size: 13.5px;
      color: #222;
    }
    h3 {
      padding-bottom: 12px;
      margin-bottom: 0 !important;
      margin-top: 0 !important;
      font-weight: 700;
    }
    .div-placeholder {
      height: 8px;  
      margin-bottom: 0 !important;
    }
    p {
      font-size: 13.5px;
      line-height: 1.4em;
      margin-bottom: 0 !important;
      margin-top: 0 !important;
      color: #444;
    }
    div {
      font-size: 13.5px;
      line-height: 1.4em;
      padding-bottom: 10px;
      margin-bottom: 0 !important;
      margin-top: 0 !important;
      color: #444;
    }
    .cv {
      width: 100%;
      max-height: 297mm;
      page-break-after: always;
      background: white;
      margin: 0;
      overflow: visible;
    }
    .multipage-printable {
      width: 100%;
      page-break-after: always;
      background: white;
      margin: 0;
      overflow: visible;
    }
    .fullname-heading-text {
      padding-bottom:10px!important;
      margin-bottom: 0 !important;
    }
    .mainDetails {
      padding: 25px 35px;
      border-bottom: 2px solid ${chosenColor};
      background: white;
    }
    .mainArea {
      padding: 0 40px;
    }
    .mainArea p {
      padding-bottom: 10px;
    }
    .contactDetails {
      float: right;
    }
    .contactDetails ul {
      list-style-type: none;
      font-size: 0.9em;
      padding-top: 2px;
      margin-top: 0px;
    }
    .contactDetails ul li {
      margin-bottom: 3px;
      color: #444;
    }
    .contactDetails ul li a, a[href^=tel] {
      color: #444;
      text-decoration: none;
      -webkit-transition: all .3s ease-in;
      -moz-transition: all .3s ease-in;
      -o-transition: all .3s ease-in;
      -ms-transition: all .3s ease-in;
      transition: all .3s ease-in;
    }
    section {
      border-top: 1px solid #dedede;
      padding: 20px 0 0;
    }
    section:first-child {
      border-top: 0;
    }
    section:last-child {
      padding: 20px 0 10px;
    }
    .sectionTitle {
      float: left;
      width: 25%;
    }
    .signoff, .fullname-text {
      margin: 0 !important;
    }
    .signoff {
      padding-bottom:0 !important;
    }
    @-webkit-keyframes reset {
      0% {
        opacity: 0;
      }
      100% {
        opacity: 0;
      }
    }
    @-webkit-keyframes fade-in {
      0% {
        opacity: 0;
      }
      40% {
        opacity: 0;
      }
      100% {
        opacity: 1;
      }
    }
    @-moz-keyframes reset {
      0% {
        opacity: 0;
      }
      100% {
        opacity: 0;
      }
    }
    @-moz-keyframes fade-in {
      0% {
        opacity: 0;
      }
      40% {
        opacity: 0;
      }
      100% {
        opacity: 1;
      }
    }
    @keyframes reset {
      0% {
        opacity: 0;
      }
      100% {
        opacity: 0;
      }
    }
    @keyframes fade-in {
      0% {
        opacity: 0;
      }
      40% {
        opacity: 0;
      }
      100% {
        opacity: 1;
      }
    }
    * {
      box-sizing: border-box;
      -moz-box-sizing: border-box;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 0;
      margin: 0;
      border: 0;
      overflow: hidden;
      background-color: white;
      display: block
    }
    @page {
      size: A4;
      margin: 0;
      margin-bottom: 30px;
      margin-top: 40px;
    }
    </style>`
      return html
    },
    createCoverletterHeaderHTML: function (position, fullname) {
      let date = new Date()
      let formattedDate = date.toLocaleString('en-US', {
        day: 'numeric', // numeric, 2-digit
        year: 'numeric', // numeric, 2-digit
        month: 'long', // numeric, 2-digit, long, short, narrow
      });
      if (position === '') {
        position = '[insert job title]'
      }
      if (fullname === ' ') {
        fullname = '[insert fullname]'
      }
      let html =
        ` <div id="name">
        <h1 class="fullname-heading-text">${fullname}</h1>
        <h2 class="position-heading-text"">${position}</h2>
      </div>
      <div class="contactDetails">
        <ul>
          <li class="date-text">${formattedDate}</li>
        </ul>
      </div>`
      return html
    },
    createCoverLetterBodyHTML: function (coverletterHTML, company, phonenumber, fullname, hiringManager) {
      if (phonenumber === '') {
        phonenumber = '[insert phone number]';
      }
      if (company === '') {
        company = '[insert company name]';
      }
      if (fullname === ' ') {
        fullname = '[insert fullname]';
      }
      if (hiringManager === '') {
        hiringManager = `Dear recruitment manager at ${company},`
      } else {
        hiringManager = `Dear ${hiringManager}`
      }
      // coverletter = coverletter.replaceAll(' style="margin-bottom:0;"', '')
      if (coverletterHTML.includes('<mark')) {
        let updatedHTMLString = '';
        let html = $.parseHTML(coverletterHTML);
        $(html).find('p');
        for (let i = 0; i < html.length; i++) {
          let par = html[i];
          let marks = $(par).find('mark');
          if (marks.length) {
            for (let j = 0; j < marks.length; j++) {
              let text = $(marks[j]).text();
              $(marks[j]).replaceWith(text);
            }
            updatedHTMLString += $(par).prop('outerHTML');
          } else {
            updatedHTMLString += $(par).prop('outerHTML');
          }
        }
        coverletterHTML = updatedHTMLString;
      }
      let html = `
      <h3 class="phonenumber-text">${phonenumber}</h3>
      <h3 class="company-text">${company}</h3>
      <div class="div-placeholder"></div>
      <p class="coverletter-intro-text">${hiringManager},</p>
      ${coverletterHTML}
      <p class="signoff">Kind Regards,</p>
      <p class="fullname-text" >${fullname}</p>
      `
      let entities = html.match(/(?<=\[)[^\][]*(?=])/g);
      if (entities.length) {
        for (let i=0; i<entities.length;i++) {
          let entity = '[' + entities[i] + ']';
          html = html.replace(entity, `<strong>${entity}</strong>`);
        }
      }
      return html
    },
    createCoverletterHTMLTemplate: function (coverletterHTML, fullname, header, style) {
      let html =
        `<html>
      <body class="page">
      ${style}
      <div class="cv">
        <div class="mainDetails">
          ${header}
        </div>
        <div class="mainArea">
          <section>
            <article>
               ${coverletterHTML}
            </article>
          </section>
        </div>
      </div>
      </body>
    </html>`
      return html
    },
    createCoverletterPDF: function (documentHTMLString, _document, hashId) {
      let iframe = _document.createElement('iframe');
      return new Promise((resolve, reject) => {
        setTimeout(function () {
          $('body').append($(iframe).addClass('preview-iframe'));
          let iframedoc = iframe.contentDocument || iframe.contentWindow.document;
          $('body', $(iframedoc)).html(documentHTMLString);
          let canvasOnePageHeight = 5555;
          html2canvas(iframedoc.body, {
            dpi: 300,
            scale: 5
          }).then(function (canvas) {
            let img = canvas.toDataURL('image/jpeg', 1);
            let imgWidth = 210;
            let pageHeight = 297;
            let imgHeight = canvas.height * imgWidth / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;
            let doc = new jspdf.jsPDF('p', 'mm');
            doc.addImage(img, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
            while (heightLeft >= 0) {
              position += heightLeft - imgHeight; // top padding for other pages
              if (canvas.height > canvasOnePageHeight) {
                doc.addPage();
              }
              doc.addImage(img, 'PNG', 0, position, imgWidth, imgHeight);
              heightLeft -= pageHeight;
            }
            if (document) {
              let filename = `coverletter_${hashId.toString()}.pdf`;
              resolve(doc.save(filename))
              $('.preview-iframe').remove();
            }
          })
        }, 3);
      })
    },
    trimCoverletterElements: function (coverletterElements, headerHeight, paddingHeight, sectionTopPaddingHeight) {
      let pageTracker = 1;
      let heightTracker = headerHeight + paddingHeight + sectionTopPaddingHeight;
      let page1Elements = [];
      let page2Elements = ['<div style="height:40px;"></div>'];
      let page3Elements = ['<div style="height:40px;"></div>'];
      for (let i = 0; i < coverletterElements.length; i++) {
        heightTracker += coverletterElements[i].offsetHeight;
        if (heightTracker >= 1123 - 40 && heightTracker < (1123 - 80) * 2) {
          pageTracker = 2;
          page2Elements.push(coverletterElements[i]);
          $(coverletterElements[i]).remove();
          // $(updatedIframe[0]).remove(coverletterElements[i])
        } else if (heightTracker >= (1123 - 80) * 2) {
          pageTracker = 3;
          page3Elements.push(coverletterElements[i]);
          $(coverletterElements[i]).remove();
        } else {
          page1Elements.push(coverletterElements[i]);
        }
      }
      return {
        page1Elements: page1Elements,
        page2Elements: page2Elements,
        page3Elements: page3Elements
      }
    }
  },
  resume: {
    resumeTemplate1Style: function (templateChoice, chosenColor) {
      if (!chosenColor) {
        chosenColor = '#cf8a05'
      }
      let style =
        `
        <style>
        html, body, div, span, object, iframe, h1, h2, h3, h4, h5, h6, p, blockquote, pre, abbr, address, cite, code, del, dfn, em, img, ins, kbd, q, samp, small, strong, sub, sup, var, b, i, dl, dt, dd, ol, ul, li, fieldset, form, label, legend, table, caption, tbody, tfoot, thead, tr, th, td, article, aside, canvas, details, figcaption, figure, footer, header, hgroup, menu, nav, section, summary, time, mark, audio, video {
          border: 0;
          font: inherit;
          font-size: 100%;
          margin: 0;
          padding: 0;
          vertical-align: baseline;
          float: none;
          position: static;
          overflow: visible;
        }
      
        article, aside, details, figcaption, figure, footer, header, hgroup, menu, nav, section {
          display: block;
        }
      
        html, body {
          background: white;
          font-family: 'Lato', helvetica, arial, sans-serif;
          font-size: 16px;
          color: #222;
        }
      
        html, body {
          background: white;
          font-size: 13.5px;
          color: #222;
        }
      
        h3 {
          padding-bottom: 12px;
          margin-bottom: 0 !important;
          margin-top: 0 !important;
          font-weight: 700;
        }
        
        .position-heading-text {
          padding-bottom:10px;
        }
        
        .experience-html ul {
          margin-top: -20px;
          padding-left: 30px;
        }
        
        .education-html ul {
          margin-top: -20px;
          padding-left: 30px;
        }
      
        .div-placeholder {
          height: 8px;
          margin-bottom: 0 !important;
        }
      
        p, div {
          font-size: 13.5px;
          line-height: 1.4em;
          padding-bottom: 10px;
          margin-bottom: 0 !important;
          margin-top: 0 !important;
          color: #444;
        }
      
        .cv {
          width: 100%;
          max-height: 297mm;
          page-break-after: always;
          background: white;
          margin: 0;
          overflow: visible;
        }
      
        .multipage-printable {
          width: 100%;
          page-break-after: always;
          background: white;
          margin: 0;
          overflow: visible;
        }
      
        .fullname-heading-text {
          padding-bottom: 10px !important;
          margin-bottom: 0 !important;
        }
      
        .mainDetails {
          padding: 25px 35px;
          border-bottom: 2px solid ${chosenColor};
          background: white;
        }
      
        .mainArea {
          padding: 0 40px;
        }
      
        .contactDetails {
          float: right;
        }
      
        .contactDetails ul {
          list-style-type: none;
          font-size: 0.9em;
          padding-top: 2px;
          margin-top: 0px;
        }
      
        .contactDetails ul li {
          margin-bottom: 3px;
          color: #444;
        }
      
        .contactDetails ul li a, a[href^=tel] {
          color: #444;
          text-decoration: none;
          -webkit-transition: all .3s ease-in;
          -moz-transition: all .3s ease-in;
          -o-transition: all .3s ease-in;
          -ms-transition: all .3s ease-in;
          transition: all .3s ease-in;
        }
      
        section {
          border-top: 1px solid #dedede;
          padding: 20px 0 0;
        }
      
        section:first-child {
          border-top: 0;
        }
      
        section:last-child {
          padding: 20px 0 10px;
        }
      
        .sectionTitle {
          float: left;
          width: 25%;
        }
      
        .signoff, .fullname-text {
          margin: 0 !important;
        }
      
        .signoff {
          padding-bottom: 0 !important;
        }
      
        .clear {
          clear: both;
        }
      
        #name {
          float: left;
        }
      
        #name h1 {
          font-size: 2.5em;
          font-weight: 700;
          font-family: 'Rokkitt', Helvetica, Arial, sans-serif;
          margin-bottom: -6px;
        }
      
        #name h2 {
          font-size: 2em;
          font-family: 'Rokkitt', Helvetica, Arial, sans-serif;
        }
      
        #contactDetails {
          float: right;
        }
      
        #contactDetails ul {
          list-style-type: none;
          font-size: 0.9em;
          margin-top: 2px;
        }
      
        #contactDetails ul li {
          margin-bottom: 3px;
          color: #444;
        }
      
        .mainArea {
          padding: 0 40px;
        }
      
        @-webkit-keyframes reset {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 0;
          }
        }
      
        @-webkit-keyframes fade-in {
          0% {
            opacity: 0;
          }
          40% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
      
        @-moz-keyframes reset {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 0;
          }
        }
      
        @-moz-keyframes fade-in {
          0% {
            opacity: 0;
          }
          40% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
      
        @keyframes reset {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 0;
          }
        }
      
        @keyframes fade-in {
          0% {
            opacity: 0;
          }
          40% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
      
        * {
          box-sizing: border-box;
          -moz-box-sizing: border-box;
        }
      
        .page {
          width: 210mm;
          min-height: 297mm;
          padding: 0;
          margin: 0;
          border: 0;
          overflow: hidden;
          background-color: white;
          display: block
        }
      
        .sectionTitle {
          float: left;
          width: 25%;
        }
      
        .sectionTitle h1 {
          font-family: 'Rokkitt', Helvetica, Arial, sans-serif;
          font-style: italic;
          font-size: 1.5em;
          color: ${chosenColor};
        }
      
        .sectionContent {
          float: right;
          width: 72.5%;
        }
      
        p {
          font-size: 1em;
          line-height: 1.4em;
          color: #444;
        }
      
        @page {
          size: A4;
          margin: 0;
          margin-bottom: 30px;
          margin-top: 40px;
        }
      </style>
    `
      return style
    },
    createResumePDF: function (documentHTMLString, _document, hashId) {
      let iframe = _document.createElement('iframe');
      return new Promise((resolve, reject) => {
        setTimeout(function () {
          $('body').append($(iframe).addClass('preview-iframe'));
          let iframedoc = iframe.contentDocument || iframe.contentWindow.document;
          $('body', $(iframedoc)).html(documentHTMLString);
          let canvasOnePageHeight = 5555;
          html2canvas(iframedoc.body, {
            dpi: 300,
            scale: 5
          }).then(function (canvas) {
            let img = canvas.toDataURL('image/jpeg', 1);
            let imgWidth = 210;
            let pageHeight = 297;
            let imgHeight = canvas.height * imgWidth / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;
            let doc = new jspdf.jsPDF('p', 'mm');
            doc.addImage(img, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
            while (heightLeft >= 0) {
              position += heightLeft - imgHeight; // top padding for other pages
              if (canvas.height > canvasOnePageHeight) {
                console.log('add page')
                doc.addPage();
              }
              doc.addImage(img, 'PNG', 0, position, imgWidth, imgHeight);
              heightLeft -= pageHeight;
            }
            if (document) {
              let filename = `coverletter_${hashId.toString()}.pdf`;
              resolve(doc.save(filename));
              $('.preview-iframe').remove();
            }
          })
        }, 3);
      })
    },
    createResumeHeaderHTML: function (position, fullname, street, city, state, country, zipcode, phone, email) {
      let line1Address = '[Insert address]', line2Address = '', line3Address = '', _phone = '[Insert phone]',
        _email = '[Insert email]';
      if (street && city) {
        line1Address = `${street}, ${city}`;
      } else {
        line1Address = '[Insert address]';
      }
      if (state && zipcode) {
        line2Address = `${state}, ${zipcode}`;
      } else {
        line2Address = '';
      }
      if (country) {
        line3Address = `${country}`;
      } else {
        line3Address = '';
      }
      if (phone) {
        _phone = `p: ${phone}`;
      }
      if (email) {
        _email = `e: ${email}`
      }
      let html = ` 
      <div id="name">
        <h1 class="fullname-heading-text">${fullname}</h1>
        <h2 class="position-heading-text">${position}</h2>
        <p class="address">${line1Address}<br>${line2Address}<br>${line3Address}</p></div>
      <div id="contactDetails">
        <ul>
          <li>p: ${_phone}</li>
          <li>e: ${_email}</li>
        </ul>
      </div>
      <div class="clear"></div>`
      return html
    },
    createResumeBodyHTML: function (data) {
      let html = ''
      if (data) {
        if (data['profile_summary_html']) {
          html += `
          <section class="profile-section" style="margin-bottom:20px;">
            <article class="profile-pdf-item">
              <div class="sectionTitle"><h1>Profile Summary</h1></div>
              <div class="sectionContent">
                ${data['profile_summary_html']}
              </div>
            </article>
            <div class="clear"></div>
          </section>`
        } else {
          html += `
          <section class="profile-section" style="margin-bottom:20px;">
            <article class="profile-pdf-item">
              <div class="sectionTitle"><h1>Profile Summary</h1></div>
              <div class="sectionContent">
                Please complete your resume form
              </div>
            </article>
            <div class="clear"></div>
          </section>`
        }
        let experienceSectionInnerHTML = '';
        let experienceSectionHTML = '';
        let spacing, padding;
        if (data['experience'].length > 0) {
          for (let i = 0; i < data['experience'].length; i++) {
            let experience = data['experience'][i];
            let expJobTitle = '', expCompany = '', expCity = '', expStartDate = '', expEndDate = '',
              expDescriptionHTML = '';
            if (experience ['job_title']) {
              expJobTitle = experience ['job_title'].toProperCase();
            }
            if (experience ['company']) {
              expCompany = experience ['company'];
            }
            if (experience ['city']) {
              expCity = '- ' + experience ['city'];
            }
            if (experience ['start_date']) {
              expStartDate = experience ['start_date'];
            }
            if (experience ['end_date']) {
              expEndDate = experience ['end_date'];
            }
            if (experience ['description_html']) {
              expDescriptionHTML = experience ['description_html'];
            }
            if (i !== data['education'].length - 1) {
              spacing = '<p></p>';
              padding = 'style="padding-bottom:10px;"'
            } else {
              spacing = '';
              padding = 'style="padding-bottom:0px;"'
            }
            let experienceItemHTML = `
            <article class="experience-pdf-item">
              <h2>${expJobTitle}</h2>
              <h4>${expCompany} ${expCity}</h4>
              <p class="subDetails">${expStartDate} to ${expEndDate}</p>
              <div ${padding} class="experience-html">
                ${expDescriptionHTML}
              </div>
              ${spacing}
            </article>`
            experienceSectionInnerHTML += experienceItemHTML
          }
          experienceSectionHTML = `
          <section class="experience-section" style="margin-bottom:0px">
            <div class="sectionTitle"><h1>Work Experience</h1></div>
            <div class="sectionContent">
               ${experienceSectionInnerHTML} 
            </div>
            <div class="clear"></div>
          </section>`
        } else {
          experienceSectionHTML = `
          <section class="experience-section" style="margin-bottom:0px">
            <div class="sectionTitle"><h1>Work Experience</h1></div>
            <div class="sectionContent">
               Please complete your resume form 
            </div>
            <div class="clear"></div>
          </section>`
        }
        html += experienceSectionHTML;

        let educationSectionInnerHTML = '';
        let educationSectionHTML = '';
        if (data['education'].length > 0) {
          for (let i = 0; i < data['education'].length; i++) {
            let education = data['education'][i];
            let degree, school, eduStartDate, eduEndDate, eduCity, eduDescriptionHTML;
            if (education['degree']) {
              degree = education['degree'];
            }
            if (education['school']) {
              school = education['school'];
            }
            if (education['start_date']) {
              eduStartDate = education['start_date'];
            }
            if (education['end_date']) {
              eduEndDate = education['end_date'];
            }
            if (education['city']) {
              eduCity = education['city'];
            }
            if (education['description_html']) {
              eduDescriptionHTML = education['description_html'];
            }
            if (i !== data['experience'].length - 1) {
              spacing = '<p></p>';
              padding = 'style="padding-bottom:10px;"'
            } else {
              spacing = '';
              padding = 'style="padding-bottom:0px;"'
            }
            let educationItemHTML = `
            <article class="education-item">
              <h2>${school}</h2>
              <h4>${eduCity}</h4>
              <p class="subDetails">${degree}, ${eduStartDate} - ${eduEndDate}</p>
              <div ${padding} class="education-html">
                ${eduDescriptionHTML}
              </div>  
              ${spacing}
            </article>`
            educationSectionInnerHTML += educationItemHTML
          }
          educationSectionHTML = `
          <section class="education-section" style="margin-bottom:0px">
            <div class="sectionTitle"><h1>Education</h1></div>
            <div class="sectionContent">
              ${educationSectionInnerHTML}
            </div>
            <div class="clear"></div>
          </section>`
        } else {
          educationSectionHTML = `
          <section class="education-section" style="margin-bottom:0px">
            <div class="sectionTitle"><h1>Education</h1></div>
            <div class="sectionContent">
              Please complete your resume form
            </div>
            <div class="clear"></div>
          </section>`
        }
        html += educationSectionHTML;

        let skillsSectionInnerHTML = '';
        let skillsSectionHTML = '';
        if (data['skills'].length > 0) {
          for (let i = 0; i < data['skills'].length; i++) {
            let skill = '<li>' + data['skills'][i] + '</li>';
            skillsSectionInnerHTML += skill;
          }
          skillsSectionHTML = `
          <section class="skills-section" style="margin-bottom:0px;">
            <div class="sectionTitle"><h1>Skills</h1></div>
            <div class="sectionContent">
              <ul class="keySkills">
                ${skillsSectionInnerHTML}
              </ul>
            </div>
            <div class="clear"></div>
          </section>`
        } else {
          skillsSectionHTML = `
          <section class="skills-section" style="margin-bottom:0px;">
            <div class="sectionTitle"><h1>Skills</h1></div>
            <div class="sectionContent">
              <ul class="keySkills">
                Please complete your resume form
              </ul>
            </div>
            <div class="clear"></div>
          </section>`
        }
        html += skillsSectionHTML

        let toolsSectionInnerHTML = '';
        let toolsSectionHTML = '';
        if (data['tools'].length > 0) {
          for (let i = 0; i < data['tools'].length; i++) {
            let tool = '<li>' + data['tools'][i] + '</li>';
            toolsSectionInnerHTML += tool;
          }
          toolsSectionHTML = `
          <section class="skills-section" style="margin-bottom:0px;">
            <div class="sectionTitle"><h1>Tools</h1></div>
            <div class="sectionContent">
              <ul class="keySkills">
                ${toolsSectionInnerHTML}
              </ul>
            </div>
            <div class="clear"></div>
          </section>`
        } else {
          toolsSectionHTML = `
          <section class="skills-section" style="margin-bottom:0px;">
            <div class="sectionTitle"><h1>Tools</h1></div>
            <div class="sectionContent">
              <ul class="keySkills">
                Please complete your resume form
              </ul>
            </div>
            <div class="clear"></div>
          </section>`
        }
        html += toolsSectionHTML

        let languagesSectionInnerHTML = '';
        let languagesSectionHTML = '';
        if (data['languages'].length > 0) {
          for (let i = 0; i < data['languages'].length; i++) {
            let language = data['languages'][i]['language'];
            let level = data['languages'][i]['level'];
            let languageEl = `
            <div class="sectionContent"><p style="margin-bottom:0px;">${language}</p>
              <p style="font-size:12px;font-style:italic;">${level}</p>
            </div>`;
            languagesSectionInnerHTML += languageEl;
          }
          languagesSectionHTML = `
          <section class="languages-section"">
            <div class="sectionTitle"><h1>Languages</h1></div>
                ${languagesSectionInnerHTML}
            <div class="clear" style="padding-bottom:0px"></div>
          </section>`
        } else {
          languagesSectionHTML = `
          <section class="languages-section" style="padding-bottom:10px;">
            <div class="sectionTitle"><h1>Languages</h1></div>
              <div class="sectionContent">
                Please complete your resume form
              </div>
            <div class="clear" style="padding-bottom:0px"></div>
          </section>`
        }
        html += languagesSectionHTML

        let referencesSectionInnerHTML = '';
        let referencesSectionHTML = '';
        if (data['references_exclude']) {
          referencesSectionHTML = `
        <section class="references-section" style="margin-bottom:20px">
          <div class="sectionTitle"><h1>References</h1></div>
          <div class="sectionContent">
            <p>References available upon request</p>
          </div>
          <div class="clear"></div>
        </section>`
          } else if (data['references'].length) {
            for (let i = 0; i < data['references'].length; i++) {
              let reference = data['references'][i];
              let refFirstName, refLastName, refPhone, refEmail, refPosition, refCompany
              if (reference['first_name']) {
                refFirstName = reference['first_name'] + ' ';
              }
              if (reference['first_name']) {
                refLastName = reference['last_name'];
              }
              if (reference['phone']) {
                refPhone = 'Phone: ' + reference['phone'];
              }
              if (reference['email']) {
                refEmail = 'Email: ' + reference['email'];
              }
              if (reference['position']) {
                refPosition = reference['position'];
              }
              if (reference['company']) {
                refCompany = ' at ' + reference['company'];
              }
              if (i !== data['references'].length - 1) {
                spacing = '<p></p>';
                padding = 'style="padding-bottom:10px;"'
              } else {
                spacing = '';
                padding = 'style="padding-bottom:0px;"'
              }
              let referenceItemHTML = `
          <article class="reference-item">
            <div style="${padding}">
              <h2>${refFirstName} ${refLastName}</h2>
              <p class="subDetails">${refPosition}${refCompany}</p>
              <p>${refPhone}</p>
              <p>${refEmail}</p>
              ${spacing}
            </div>
          </article>`
              referencesSectionInnerHTML += referenceItemHTML
            }
            referencesSectionHTML = `
        <section class="references-section" style="margin-bottom:20px">
          <div class="sectionTitle"><h1>References</h1></div>
          <div class="sectionContent">
            ${referencesSectionInnerHTML}
          </div>
          <div class="clear"></div>
        </section>`
          } else {
            referencesSectionHTML = `
        <section class="references-section" style="margin-bottom:20px">
          <div class="sectionTitle"><h1>References</h1></div>
          <div class="sectionContent">
            Please complete your resume form
          </div>
          <div class="clear"></div>
        </section>`
        }
        html += referencesSectionHTML;
      }
      return html
    },
    createResumeHTMLTemplate: function (resumeHTML, header, style) {
      let html =
        `<html>
        <body class="page">
        ${style}
        <div class="cv">
          <div class="mainDetails">
            ${header}
          </div>
          <div class="mainArea">
            ${resumeHTML}
          </div>
        </div>
        </body>
      </html>`
      return html
    },
  },
  previewer: {
    parseElements: function (pageElements, pageNum, headerHeight, paddingHeight) {
      let pageWrapper = document.createElement('div');
      pageWrapper.style.height = '297mm';
      let pageHTML = '';
      if (pageNum === 1) {
        let height = 1123 - headerHeight - paddingHeight;
        pageWrapper.style.height = height.toString() + 'px';
        pageWrapper.classList.add('page1');
      } else {
        pageHTML += '<div style="height:40px;"></div>';
        pageWrapper.classList.add(`page${pageNum}`);
      }
      for (let i = 0; i < pageElements.length; i++) {
        pageHTML += pageElements[i].outerHTML;
      }
      pageWrapper.innerHTML = pageHTML;
      return pageWrapper
    },
    handleEmptyField: function(field, type) {
      if(typeof field === 'undefined' || field === '') {
        return `[please insert ${type}]`
      } else {
        return field
      }
    },
    setTemplateStyle: function (choiceTemplate, colorChoice, type) {
      if (!choiceTemplate) {
        choiceTemplate = 1
      }
      let template;
      if (type === 'cover_letter') {
        template = pdf.coverletter.coverletterTemplate1Style(choiceTemplate, colorChoice);
      } else if (type === 'resume') {
        template = pdf.resume.resumeTemplate1Style(choiceTemplate, colorChoice);
      }
      let html = `
        ${template}
        <!--    <link href='http://fonts.googleapis.com/css?family=Rokkitt:400,700|Lato:400,300' rel='stylesheet' type='text/css'>-->`
      return html
    },
    loadFilePreview: function (data, HTML, type, hashId) {
      let body = HTML;
      let docHTML, color, style, headerHTML, position, fullname, template, street, city, state, country, zipcode, phone,
        email;
      console.log(data);
      if (type === 'cover_letter') {
        position = pdf.previewer.handleEmptyField(data['job_title'], 'job title');
        fullname = pdf.previewer.handleEmptyField(data['full_name'], 'your full name');
        template = data['template_style'];
        color = '#cf8a05';
        style = pdf.previewer.setTemplateStyle(template, color, type);
        headerHTML = pdf.coverletter.createCoverletterHeaderHTML(position, fullname);
        docHTML = pdf.coverletter.createCoverletterHTMLTemplate(body, fullname, headerHTML, style);
      } else if (type === 'resume') {
        position = pdf.previewer.handleEmptyField(data['preferred_job_title'],'job title');
        fullname = pdf.previewer.handleEmptyField(data['full_name'],'your full name');
        template = data['template_style'];
        street = pdf.previewer.handleEmptyField(data['address'],'street address');
        city = pdf.previewer.handleEmptyField(data['city'], 'the city you live in');
        state = pdf.previewer.handleEmptyField(data['state'], 'the state you live in');
        country = pdf.previewer.handleEmptyField(data['country'], 'the country you live in');
        zipcode = pdf.previewer.handleEmptyField(data['zip_code'],'your zip code');
        phone = pdf.previewer.handleEmptyField(data['phone_number'],'your phone number');
        email = pdf.previewer.handleEmptyField(data['email'], 'your email');
        color = '#cf8a05';
        style = pdf.previewer.setTemplateStyle(template, color, type);
        headerHTML = pdf.resume.createResumeHeaderHTML(position, fullname, street, city, state, country, zipcode, phone, email);
        docHTML = pdf.resume.createResumeHTMLTemplate(body, headerHTML, style);
      }
      $('.color-1, .color-2, .color-3, .color-4, .color-5').on('click', function () {
        // TODO: event here
        // call in type for deterining coverletter or resume
        let colors = ['.color-1', '.color-2', '.color-3', '.color-4', '.color-5'];
        color = $(this).attr('color');
        posthog.capture('choose_preview_color', {color: color, type: type});
        let colorClassName = '.' + $(this).attr('class');
        $(this).find('svg').removeClass('inactive-color').addClass('active-color');
        let colorIndex = colors.indexOf(colorClassName)
        if (colorIndex > -1) {
          colors.splice(colorIndex, 1);
          for (let i = 0; i < colors.length; i++) {
            let colorSVGClassName = $(colors[i]).find('svg').attr('class');
            if (colorSVGClassName === 'active-color') {
              $(colors[i]).find('svg').removeClass('active-color').addClass('inactive-color');
            }
            style = pdf.previewer.setTemplateStyle(template, color, type);
            if (type === 'cover_letter') {
              headerHTML = pdf.coverletter.createCoverletterHeaderHTML(position, fullname);
              docHTML = pdf.coverletter.createCoverletterHTMLTemplate(body, fullname, headerHTML, style);
            } else if (type === 'resume') {
              headerHTML = pdf.resume.createResumeHeaderHTML(position, fullname, street, city, state, country, zipcode, phone, email);
              docHTML = pdf.resume.createResumeHTMLTemplate(body, headerHTML, style);
            }
            $('.preview-iframe').remove();
            pdf.previewer.loadFileHTML(docHTML, fullname, style, headerHTML, type, hashId);
          }
        }
      });
      pdf.previewer.loadFileHTML(docHTML, fullname, style, headerHTML, type, hashId);
    },
    loadFileHTML: function (docHTML, fullname, style, headerHTML, type, hashId) {
      let iframe = document.createElement('iframe');
      $('.preview-inner-container').append($(iframe).addClass('preview-iframe'));
      let iframedoc = iframe.contentDocument || iframe.contentWindow.document;
      let updatedIframe = $('body', $(iframedoc)).html(docHTML);
      $(iframedoc).find('body').addClass('page');
      let header, article, elements, body;
      if (type === 'cover_letter') {
        header = $(updatedIframe[0]).find('.mainDetails')[0];
        article = $(updatedIframe[0]).find('article')[0];
        elements = $(article).children();
      } else if (type === 'resume') {
        header = $(updatedIframe[0]).find('.mainDetails')[0];
        body = $(updatedIframe[0]).find('.mainArea')[0];
        elements = $(body).children();
      }
      let paddingHeight = 10;
      let mainContentHeight = $(updatedIframe[0]).find('.mainArea')[0].offsetHeight;
      let headerHeight = $(updatedIframe[0]).find('.mainDetails')[0].offsetHeight;
      let totalHeight = headerHeight + paddingHeight + mainContentHeight;
      let perPageHeight = 1113;
      let sectionTopPaddingHeight = 20;
      let pages = Math.ceil(totalHeight / perPageHeight);
      let fileObjects = {
        header: header,
        pages: [],
        length: 1
      };
      if (pages > 1) {
        let pageElementsObjects = pdf.previewer.trimElements(elements, headerHeight, paddingHeight, sectionTopPaddingHeight);
        for (let i = 0; i < pageElementsObjects.length; i++) {
          let pageElementsParsed = pdf.previewer.parseElements(pageElementsObjects[i]['elements'], i + 1, headerHeight, paddingHeight);
          fileObjects['pages'].push(pageElementsParsed.outerHTML);
        }
        fileObjects['length'] = pageElementsObjects.length;
        let currentPage = 1;
        $(header).show();
        if (type === 'cover_letter') {
          $(article).html('');
          $(article).append(fileObjects['pages'][currentPage - 1]);
        } else if (type === 'resume') {
          $(body).html('');
          $(body).append(fileObjects['pages'][currentPage - 1]);
        }
        $('.page-tracker').html(`${currentPage} / ${fileObjects['length']}`);
        let pageForwardBtn = $(document).find('.page-forward')[0];
        let pageBackBtn = $(document).find('.page-back')[0];
        $([pageForwardBtn, pageBackBtn]).each(function () {
          $(this).on('click', function (e) {
            if (e.target.className === 'page-forward') {
              if (currentPage < fileObjects['length']) {
                currentPage += 1;
              }
            } else if (e.target.className === 'page-back') {
              if (currentPage > 1 && currentPage <= fileObjects['length']) {
                currentPage -= 1;
              }
            }
            $('.page-tracker').html(`${currentPage} / ${fileObjects['length']}`);
            if (currentPage === 1) {
              $(header).show();
            } else {
              $(header).hide();
            }
            if (type === 'cover_letter') {
              $(article).html('');
              $(article).append(fileObjects['pages'][currentPage - 1]);
            } else if (type === 'resume') {
              $(body).html('');
              $(body).append(fileObjects['pages'][currentPage - 1]);
            }
          });
        });
      } else {
        let pagesParsed = pdf.previewer.parseElements(elements, 1, headerHeight, paddingHeight);
        fileObjects['pages'].push(pagesParsed.outerHTML);
        fileObjects['length'] = 1;
      }
      $('.download-btn-container').on('click', function () {
        posthog.capture('downloaded_pdf', {type: type});
        pdf.previewer.downloadFile(fileObjects, fullname, style, headerHTML, pages, type, hashId);
      })
    },
    trimElements: function (resumeElements, headerHeight, paddingHeight, sectionTopPaddingHeight) {
      let pageTracker = 1;
      let heightTracker = headerHeight + paddingHeight + sectionTopPaddingHeight;
      let elementsOfPages = [];
      let cache = '';
      let nextPageElements = null;
      for (let i = 0; i < resumeElements.length; i++) {
        heightTracker += resumeElements[i].offsetHeight;
        if (heightTracker >= 1123 - 80) {
          if (pageTracker === 1) {
            elementsOfPages.push({page: pageTracker, element_separator: null, elements: cache});
          } else {
            elementsOfPages.push({
              page: pageTracker,
              element_separator: '<div style="height:40px;"></div>',
              elements: cache
            });
          }
          heightTracker = resumeElements[i].offsetHeight + 40; //TODO: Fix this
          nextPageElements = resumeElements[i].outerHTML;
          pageTracker += 1;
          cache = '';
        } else if (i === resumeElements.length - 1) {
          cache += resumeElements[i].outerHTML;
          elementsOfPages.push({page: pageTracker, element_separator: '<div style="height:40px;"></div>', elements: cache});
        } else {
          if (nextPageElements) {
            cache += nextPageElements;
            nextPageElements = null;
          }
          cache += resumeElements[i].outerHTML;
        }
      }
      return elementsOfPages
    },
    downloadFile: function (fileObjects, fullname, style, header, numOfPages, type, hashId) {
      let iframe = document.createElement('iframe');
      $('.printable-iframe-container').append(iframe);
      $(iframe).addClass('printable-iframe');
      $('.printable-iframe').css('width', '210mm').css('min-height', '297mm');
      return new Promise((resolve, reject) => {
        let iframedoc = iframe.contentDocument || iframe.contentWindow.document;
        let html = '';
        for (let i = 0; i < fileObjects['pages'].length; i++) {
          html += fileObjects['pages'][i];
        }
        let docHTML;
        if (type === 'cover_letter') {
          docHTML = pdf.coverletter.createCoverletterHTMLTemplate(html, fullname, header, style);
        } else if (type === 'resume') {
          docHTML = pdf.resume.createResumeHTMLTemplate(html, header, style);
        }
        if (numOfPages > 1) {
          docHTML = docHTML.replace('<div class="cv">', '<div class="multipage-printable">');
        }
        $(iframedoc).find('body').addClass('page');
        $(iframedoc).find('.page').css('overflow', 'scroll');
        $('body', $(iframedoc)).html(docHTML);
        html2canvas(iframedoc.body, {
          dpi: 300,
          scale: 3
        }).then(function (canvas) {
          let img = canvas.toDataURL('image/jpeg', 1);
          let imgWidth = 210;
          let pageHeight = 297;
          let imgHeight = canvas.height * imgWidth / canvas.width;
          let heightLeft = imgHeight;
          let position = 0;
          let doc = new jspdf.jsPDF('p', 'mm');
          doc.addImage(img, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
          let i = 1;
          while (i < numOfPages) {
            i++;
            position += heightLeft - imgHeight; // top padding for other pages
            doc.addPage();
            doc.addImage(img, 'PNG', 0, position, imgWidth, imgHeight);
          }
          let filename = `${type}_${hashId}`;
          resolve(doc.save(filename))
          $('.printable-iframe').remove();
        })
      })
    }
  }
}

export {pdf}