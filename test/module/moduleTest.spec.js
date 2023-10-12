const path = require('path');
const { listExportedFunctions } = require('../../listExportedFunctions');

describe('listExportedFunctions', () => {
    const sourceFile = path.resolve(__dirname, './someFile.js');
    it('should return exported functions', () => {
        const exportedFunctions = listExportedFunctions(sourceFile);

        expect(exportedFunctions).toEqual(expect.arrayContaining(['add1', 'add2', 'add3', 'add4','add5', 'add6', 'add7']));
        expect(exportedFunctions).not.toEqual(expect.arrayContaining(['add0']));
    });
}); 