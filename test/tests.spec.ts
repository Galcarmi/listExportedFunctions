import path from 'path';
import { listExportedFunctions } from '../listExportedFunctions';

describe('listExportedFunctions', () => {
    it('should return exported functions in file', () => {
        const sourceFile = path.resolve(__dirname, './fixtures/empty2.js');
        const exportedFunctions = listExportedFunctions(sourceFile);

        expect(exportedFunctions).toEqual(expect.arrayContaining([{"name": "func3", "numOfParams": 1}, {"name": "func4", "numOfParams": 2}, {"name": "func5", "numOfParams": 3}, {"name": "func6", "numOfParams": 4}]));
    });

    it('should return exported functions when importing from other file', () => {
        const sourceFile = path.resolve(__dirname, './fixtures/empty7.js');
        const exportedFunctions = listExportedFunctions(sourceFile);

        expect(exportedFunctions).toEqual(expect.arrayContaining([{"name": "func12", "numOfParams": 1}, {"name": "func10", "numOfParams": 1}]));
    });

    it('should return exported functions transitive', () => {
        const sourceFile = path.resolve(__dirname, './fixtures/empty4.js');
        const exportedFunctions = listExportedFunctions(sourceFile);

        expect(exportedFunctions).toEqual(expect.arrayContaining([{"name": "func8", "numOfParams": 1}, {"name": "func9", "numOfParams": 1}, {"name": "func10", "numOfParams": 1}, {"name": "func11", "numOfParams": 1}, {"name": "func12", "numOfParams": 1}, {"name": "func13", "numOfParams": 1}, {"name": "func14", "numOfParams": 1}, {"name": "func15", "numOfParams": 1}, {"name": "func16", "numOfParams": 1}]));
        // expect(exportedFunctions).not.toEqual(expect.arrayContaining(['add0']));
    });

    it('should return exported functions transitive specific', () => {
        const sourceFile = path.resolve(__dirname, './fixtures/empty6.js');
        const exportedFunctions = listExportedFunctions(sourceFile);

        expect(exportedFunctions).toEqual(expect.arrayContaining([{"name": "func8", "numOfParams": 1}]));
    });
}); 