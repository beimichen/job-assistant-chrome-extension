function createCityLookup() {
  // let citiesAndStates = [];
  // let countries = [];
  let _data;
  return new Promise((resolve, reject) => {
    d3.tsv('../../lookup_lists/cities_updated.tsv').then(function (data) {
      let citiesObj = {};
      let resolver = {};
      for (let i = 0; i < data.length; i++) {
        let city = data[i].original;
        // let state = data[i].state_code;
        // if (!isNaN(parseInt(data[i].state_code))) {
        //   state = data[i].state_name;
        // }
        // let key = data[i].city + ' ' + state;
        // let city = data[i].city
        // let country = data[i].country
        let _data = {
          'real_id': data[i].realId,
          'city_type': data[i].locationType,
          'city_fullname': data[i].longName,
        }
        citiesObj[city] = _data;
        // citiesAndStates.push(city + ' ' + state);
        // countries.push(country)
        let countryShort = 'US';
        if (data[i].countryName === 'Australia') {
          countryShort = 'AU';
        } else if (data[i].countryName === 'United Kingdom') {
          countryShort = 'GB';
        } else if (data[i].countryName === 'Canada') {
          countryShort = 'CA';
        } else if (data[i].countryName === 'New Zealand') {
          countryShort = 'NZ';
        } else if (data[i].countryName === 'United States') {
          countryShort = 'US';
        }
        resolver[city] = countryShort;
      }
      // resolver = JSON.stringify(resolver);
      // citiesObj = JSON.stringify(citiesObj);
      // _data = [citiesObj, resolver]
      resolve({'cities': citiesObj, 'resolver': resolver})
    })
  })
}

export {createCityLookup}