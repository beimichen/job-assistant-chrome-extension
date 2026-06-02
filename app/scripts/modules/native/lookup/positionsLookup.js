function createPositionLookup() {
  let positions = [];
  let positionsObj = {};
  d3.tsv('../../lookup_lists/positions.tsv').then(function (data) {
    for (let i = 0; i < data.length; i++) {
      let position = data[i].position;
      positionsObj[position] = i;
      positions.push(position);
    }
  })
  return [positionsObj, positions]
}

export {createPositionLookup}