const path = require('path');
const { listExportedFunctions } = require('../listExportedFunctions');

describe('listExportedFunctions', () => {
    const sourceFile = path.resolve(__dirname, './empty4.js');
    it('should return exported functions', () => {
        const exportedFunctions = listExportedFunctions(sourceFile);

        expect(exportedFunctions).toEqual(expect.arrayContaining([{"name": "func8", "numOfParams": 1}, {"name": "func9", "numOfParams": 1}, {"name": "func10", "numOfParams": 1}, {"name": "func11", "numOfParams": 1}, {"name": "func12", "numOfParams": 1}, {"name": "func13", "numOfParams": 1}, {"name": "func14", "numOfParams": 1}, {"name": "func15", "numOfParams": 1}, {"name": "func16", "numOfParams": 1}]));
        // expect(exportedFunctions).not.toEqual(expect.arrayContaining(['add0']));
    });
}); 