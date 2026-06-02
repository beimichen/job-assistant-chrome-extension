function createDegreeLookup() {
  let degrees = [];
  let degreesObj = {};
  d3.tsv('../../lookup_lists/degrees.tsv').then(function (data) {
    for (let i = 0; i < data.length; i++) {
      let degree = data[i].degrees;
      degreesObj[degree] = i;
      degrees.push(degree);
    }
  })
  return [degreesObj, degrees]
}

export {createDegreeLookup}