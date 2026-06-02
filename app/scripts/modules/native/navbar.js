import {loadJobAdBody} from "./jobads.js";
import {loadSearchBody} from "./search.js";
import {loadAccountBody} from "./account.js";

export function loadNavBar() {
  $('.nav-container').load('../../templates/components/nav.html', function () {
    $('.svg-close').on('click', function () {
      window.close();
    });
    $('.navbar-home').on('click', function () {
      $(this).addClass('active');
      window.currentPage = 'job ads';
      if (!window.loadingStatus) {
        $('#filter-results').addClass('hide');
        $('.header-right').find('#circle').removeClass('show').addClass('hide');
      } else {
        $('.header-right').find('#circle').removeClass('hide').addClass('show');
      }
      loadJobAdBody();
      if (window.loadingStatus) {
        $('.stop-search-btn').removeClass('hide').addClass('show');
      }
    });
    $('.navbar-search').on('click', function () {
      window.currentPage = 'search';
      $(this).addClass('active');
      $('#filter-results').addClass('hide');
      $('.header-right').find('#circle').removeClass('show').addClass('hide');
      loadSearchBody();
      $('.stop-search-btn').removeClass('show').addClass('hide');
    });
    $('.navbar-account').on('click', function () {
      window.currentPage = 'account';
      $(this).addClass('active');
      $('#filter-results').addClass('hide');
      $('.header-right').find('#circle').removeClass('show').addClass('hide');
      loadAccountBody();
      $('.stop-search-btn').removeClass('show').addClass('hide');
    });
    setTimeout(function () {
      document.getElementById('filter-results').addEventListener('click', function () {
        document.getElementById('filter-results-options').classList.toggle('hide');
      });
    }, 50);
  });
}
