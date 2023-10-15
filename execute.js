const path = require('path');
const {listExportedFunctions} = require('./listExportedFunctions.js');

const filePath = path.resolve(__dirname, './test/fixtures/empty4.js');
console.time('listExportedFunctions');
console.log(listExportedFunctions(filePath));
console.timeEnd('listExportedFunctions');