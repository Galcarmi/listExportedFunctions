const path = require('path');
const filePath = path.resolve(__dirname, './someFile.js');
const ts = require('typescript');
const fs = require('fs');

const listExportedFunctions = (filePath, processedFiles = new Set()) => {
  if (processedFiles.has(filePath)) {
    return [];
  }

  processedFiles.add(filePath);

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, fileContent, ts.ScriptTarget.ESNext, true);
  
  const exportedFunctions = [];
  ts.forEachChild(sourceFile, node => {
      debugger
    if (ts.isFunctionDeclaration(node) && (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) !== 0) {
      exportedFunctions.push(node.name.text);
    } else if (ts.isVariableStatement(node) && (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) !== 0) {
      for (const declaration of node.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) {
          exportedFunctions.push(declaration.name.text);
        }
      }
    } else if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
      for (const element of node.exportClause.elements) {
        if (ts.isIdentifier(element.name)) {
          exportedFunctions.push(element.name.text);
        }
      }
    } else if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        const moduleSpecifierPath = path.resolve(path.dirname(filePath), node.moduleSpecifier.text);
            exportedFunctions.push(...listExportedFunctions(moduleSpecifierPath, processedFiles));
        }
  });

  return exportedFunctions;
}

export {
    listExportedFunctions
}