const listExportedFunctions = require('./listExportedFunctions.js');

console.time('listExportedFunctions');
console.log(listExportedFunctions('./empty4.js'));
console.timeEnd('listExportedFunctions');