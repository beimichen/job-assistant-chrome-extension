import {cityLookup} from "../../main.js";

export function extractData(url) {
  console.log(url);
  if (url) {
    return $.ajax({
      url: url,
      timeout: 30000, // TODO: make timeout an API
      type: 'GET',
      dataType: 'text',
      success: function(res) {
        if (res.toString().includes('<title>hCaptcha solve page</title>')){
          alert('Please try again later. JobAssistant is experiencing problems searching for the ads right now.');
          return 'TRIGGERED'
        } else {
          // console.log(url);
          // console.log(res);
          return res
        }
      },
      error: function (request, status, err) {
        if (request['statusText'] === 'timeout') {
          // timeout -> reload the page and try again
          alert('Please try again later. JobAssistant is experiencing problems searching for the ads right now.');
          return 'TIMEOUT'
        } else {
          return 'ERROR'
        }
      },
    });
  } else {
    console.log('undefined url');
  }
}

export function batchUrls(array, chunkSize) {
  Object.defineProperty(Array.prototype, 'chunk', {
    value: function (chunkSize) {
      var R = [];
      for (var i = 0; i < this.length; i += chunkSize)
        R.push(this.slice(i, i + chunkSize));
      return R;
    },
    configurable: true
  });
  return array.chunk(chunkSize)
}

export function findBaseUrl(url) {
  let baseUrl;
  let protocol;
  let host;
  let pathArray;
  pathArray = url.split('/');
  protocol = pathArray[0];
  host = pathArray[2];
  baseUrl = protocol + '//' + host;
  return baseUrl
}

export function extractAdIDFromURL(url, source) {
  let adID;
  if (source==='indeed'){
    let adIDSplit = url.split('/');
    let lastIndex = adIDSplit.length - 1;
    adID = adIDSplit[lastIndex];
    if (adID.includes('&tk=')) {
      adID = adID.split('&tk=')[0];
      if (adID.includes('&q=')) {
        adID = adID.split('&q=')[0];
      }
    }
  }
  return adID
}

export function findSourceOfAd(url) {
  let source;
  if (url.indexOf('www.') >= 0) {
    source = url.split('.')[1];
  } else {
    source = url.split('.')[0];
    if (source.indexOf('https://') >= 0) {
      source = url.split('.')[1];
    }
  }
  return source
}

export async function getDataOfAds(urls, randNum) {
  let promises = [];
  for (let k=0;k<urls.length;k++) {
    if(urls[k]) {
      promises.push(extractData(urls[k]));
    }
  }
  return await Promise.all(promises).then(function(res){return res})
}

export function findBatchesOfUncachedUrls(urls, filenames, jobAd, batchSize) {
  return new Promise(
    resolve => jobAd.checkCache(urls, filenames).then(function (response) {
      let uncachedUrls = response.filter(function (e) {
        return e != null;
      });
      let uncachedUrlsChunked = batchUrls(uncachedUrls, batchSize);
      resolve(uncachedUrlsChunked);
    })
  )
}

export function randDelay(randNum) {
  return new Promise(resolve => setTimeout(resolve, randNum * 1000));
}

export function resolveCityToCountry(city) {
  let resolver = cityLookup.resolver;
  if (city in resolver) {
    return resolver[city];
  } else {
    return null
  }
}

export function calculateTimePosted(str) {
  let datePosted;
  if (str.toLowerCase().includes('just posted') || str.toLowerCase().includes('now') || str.toLowerCase().includes('today') || str.toLowerCase().includes('a day ago') || str.toLowerCase().includes('hour')) {
    datePosted = new Date();
  } else {
    let matches = str.match(/\d+/g);
    if (matches.length > 0) {
      let daysAgo = matches[0];
      let date = new Date();
      datePosted = new Date(date.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    }
  }
  return datePosted
}

export function parseTimePosted(str) {
  let datePosted;
  if (str.toLowerCase().includes('just posted') || str.toLowerCase().includes('today') || str.toLowerCase().includes('a day ago')) {
    datePosted = new Date()
  } else {
    let matches = str.match(/\d+/g);
    if (matches.length > 0) {
      let daysAgo = matches[0];
      let date = new Date();
      datePosted = new Date(date.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    }
  }
  return datePosted
}

