import path from 'path';
import { listExportedFunctions } from './listExportedFunctions';

const filePath = path.resolve(__dirname, './test/fixtures/empty3.js');
console.time('listExportedFunctions');
console.log(listExportedFunctions(filePath));
console.timeEnd('listExportedFunctions');