import path from 'path';
import ts from 'typescript';
import fs from 'fs';

interface FunctionDescription {
  name: string;
  numOfParams: number;
}

interface ImportedElement {
  name: string;
  importedModuleSpecifierPath: string;
}

const listExportedFunctions = (filePath: string, processedFiles = new Map()) => {
  if (processedFiles.has(filePath)) {
    return processedFiles.get(filePath);
  }
  
  const exportedFunctions: FunctionDescription[] = [];
  const exportedElements: string[] = [];
  const importedElements: ImportedElement[] = [];
  const functions: FunctionDescription[] = [];

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, fileContent, ts.ScriptTarget.ESNext, true);

  ts.forEachChild(sourceFile, (node: ts.Node) => {
    debugger
    const isFunctionDeclaration = ts.isFunctionDeclaration(node);
    const isVariableStatement = ts.isVariableStatement(node);
    let isExportedVariableOrFunction = false;
    if (isFunctionDeclaration || isVariableStatement) {
      isExportedVariableOrFunction = node.modifiers?.some(modifier => {
        return modifier.kind === ts.SyntaxKind.ExportKeyword;
      }) || false;
    }
    const isExportDeclaration = ts.isExportDeclaration(node);
    const isImportDeclaration = ts.isImportDeclaration(node);
    const isModuleSpecifierStringLiteral = (isExportDeclaration || isImportDeclaration) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier);

    const tryExtractFunctionFromNode = () =>{
      let analyzedFunction: FunctionDescription | null = null;
      if (isFunctionDeclaration && node.name) {
        analyzedFunction = {
          name: node.name.escapedText.toString(),
          numOfParams: node.parameters.length
        };
      }
      else if(isVariableStatement){
        node.declarationList.declarations.forEach(declaration => {
          if(declaration.initializer){
            const isFunctionLike = ts.isFunctionLike(declaration.initializer);
            const hasName = ts.isIdentifier(declaration.name);
            if(isFunctionLike && hasName){
              analyzedFunction = {
                name: declaration.name.escapedText.toString(),
                numOfParams: declaration.initializer.parameters.length
              };
            }
          }
        });
      }

      return analyzedFunction;
    }

    const forEachElementInExportClause = (node: ts.ExportDeclaration, callback: (element: ts.ExportSpecifier) => void) => {
      if(!node.exportClause){
        return;
      }

      const isNamedExports = ts.isNamedExports(node.exportClause);

      if (!isNamedExports) {
        return;
      }
      
      node.exportClause?.elements.forEach((element: ts.ExportSpecifier) => {
        const isIdentifier = ts.isIdentifier(element.name);
        if(isIdentifier){
          callback(element);
        }
      });
    }

    const forEachElementInImportClause = (node: ts.ImportDeclaration, callback: (element: ts.ImportSpecifier) => void) => {
      if(!node.importClause?.namedBindings){
        return;
      }

      const isNamedImports = ts.isNamedImports(node.importClause.namedBindings);

      if (!isNamedImports) {
        return;
      }

      node.importClause?.namedBindings?.elements.forEach(element => {
        const isIdentifier = ts.isIdentifier(element.name);
        if(isIdentifier){
          callback(element);
        }
      });
    }

    if (isImportDeclaration && isModuleSpecifierStringLiteral) {
      const importedModuleSpecifierPath = require.resolve(path.resolve(path.dirname(filePath), node.moduleSpecifier.text));
      forEachElementInImportClause(node, element => {
        importedElements.push({
          name: element.name.escapedText.toString(),
          importedModuleSpecifierPath
        });
      })
    }
    else if(isExportedVariableOrFunction){
      const maybeExportedFunction = tryExtractFunctionFromNode();
      if(maybeExportedFunction){
        exportedFunctions.push(maybeExportedFunction);
      }

      return;
    } else if (isExportDeclaration) {
      // use case: export { func1, func2 } from 'some-module';
      if(node.exportClause && isModuleSpecifierStringLiteral){
          const exportedModuleSpecifierPath = require.resolve(path.resolve(path.dirname(filePath), node.moduleSpecifier.text));
          const moduleListExportedFunctionsRes = listExportedFunctions(exportedModuleSpecifierPath, processedFiles);
          forEachElementInExportClause(node, (element)=>{
            const exportedFunction = moduleListExportedFunctionsRes.find((func: FunctionDescription) => func.name === element.name.escapedText);
            if(exportedFunction){
              exportedFunctions.push(exportedFunction);
            }
          })
      }

      if (node.exportClause) {
        // use case: export { func1, func2 };
        forEachElementInExportClause(node, (element)=>{exportedElements.push(element.name.escapedText.toString())})
      } else if (isModuleSpecifierStringLiteral) {
        // use case: export * from 'some-module';
          const exportedModuleSpecifierPath = require.resolve(path.resolve(path.dirname(filePath), node.moduleSpecifier.text));
          const moduleListExportedFunctionsRes = listExportedFunctions(exportedModuleSpecifierPath, processedFiles);
          exportedFunctions.push(...moduleListExportedFunctionsRes);
      }

      return;
    }
    else {
      // use case: const func1 = () => {};
      const extractedFunction = tryExtractFunctionFromNode();
      if(extractedFunction){
        functions.push(extractedFunction);
      }

      return;
    }
  });

  exportedElements.forEach(exportedElement => {
    const exportedFunction = functions.find((func: FunctionDescription) => func.name === exportedElement);
    if(exportedFunction){
      exportedFunctions.push(exportedFunction);
    }

    const importedElement = importedElements.find((importedElement: ImportedElement) => importedElement.name === exportedElement);
    if(importedElement){
      const moduleListExportedFunctionsRes = listExportedFunctions(importedElement.importedModuleSpecifierPath, processedFiles);

      const exportedFunction = moduleListExportedFunctionsRes.find((func: FunctionDescription) => func.name === importedElement.name);
      if(exportedFunction){
        exportedFunctions.push(exportedFunction);
      }
    }
  });

  processedFiles.set(filePath, exportedFunctions);

  return exportedFunctions;
}

export {
  listExportedFunctions,
}