function createLanguageLookup() {
  let languages = [];
  let languagesObj = {};
  d3.tsv('../../lookup_lists/languages.tsv').then(function (data) {
    for (let i = 0; i < data.length; i++) {
      let language = data[i].languages;
      languagesObj[language] = i;
      languages.push(language);
    }
  })
  return [languagesObj, languages]
}

export {createLanguageLookup}