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

    const getAnalyzedFunction = () =>{
      let analyzedFunction: FunctionDescription | null = null;
      if (isFunctionDeclaration) {
        if(!node.name){
          return;
        }
        
        analyzedFunction = {
          name: node.name.escapedText.toString(),
          numOfParams: node.parameters.length
        };
      }
      else if(isVariableStatement){
        node.declarationList.declarations.forEach(declaration => {
          const declarationInitializer = declaration.initializer;
          if(declarationInitializer){
            const isFunctionLike = ts.isFunctionLike(declarationInitializer);
            const hasName = ts.isIdentifier(declaration.name);
            if(isFunctionLike && hasName){
              analyzedFunction = {
                name: declaration.name.escapedText.toString(),
                numOfParams: declarationInitializer.parameters.length
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

    if (isImportDeclaration) {
      const isStringLiteral = ts.isStringLiteral(node.moduleSpecifier);
      if (!isStringLiteral) {
        return;
      }

      const importedModuleSpecifierPath = require.resolve(path.resolve(path.dirname(filePath), node.moduleSpecifier.text));
      forEachElementInImportClause(node, element => {
        importedElements.push({
          name: element.name.escapedText.toString(),
          importedModuleSpecifierPath
        });
      })
    }
    else if(isExportedVariableOrFunction){
      const maybeExportedFunction = getAnalyzedFunction();
      if(maybeExportedFunction){
        exportedFunctions.push(maybeExportedFunction);
      }

      return;
    } else if (isExportDeclaration) {
      if(node.exportClause && node.moduleSpecifier){
        const isStringLiteral = ts.isStringLiteral(node.moduleSpecifier);
        if (isStringLiteral) {
          const exportedModuleSpecifierPath = require.resolve(path.resolve(path.dirname(filePath), node.moduleSpecifier.text));
          const moduleListExportedFunctionsRes = listExportedFunctions(exportedModuleSpecifierPath, processedFiles);
          forEachElementInExportClause(node, (element)=>{
            const exportedFunctionIndex = moduleListExportedFunctionsRes.findIndex((func: FunctionDescription) => func.name === element.name.escapedText);
            if(exportedFunctionIndex !== -1){
              const exportedFunction = moduleListExportedFunctionsRes[exportedFunctionIndex];
              exportedFunctions.push(exportedFunction);
            }
          })
        }
      }
      if(node.exportClause){
        forEachElementInExportClause(node, (element)=>{exportedElements.push(element.name.escapedText.toString())})
      } else if(node.moduleSpecifier){
        const isStringLiteral = ts.isStringLiteral(node.moduleSpecifier);
        if(isStringLiteral){
          const exportedModuleSpecifierPath = require.resolve(path.resolve(path.dirname(filePath), node.moduleSpecifier.text));
          const moduleListExportedFunctionsRes = listExportedFunctions(exportedModuleSpecifierPath, processedFiles);
          exportedFunctions.push(...moduleListExportedFunctionsRes);
        }
      }

      return;
    }
    else {
      const maybeFunction = getAnalyzedFunction();
      if(maybeFunction){
        functions.push(maybeFunction);
      }

      return;
    }
  });

  exportedElements.forEach(exportedElement => {
    const exportedFunctionIndex = functions.findIndex(func => func.name === exportedElement);
    if(exportedFunctionIndex !== -1){
      const exportedFunction = functions[exportedFunctionIndex];
      return exportedFunctions.push(exportedFunction);
    }

    const importedElementIndex = importedElements.findIndex(importedElement => importedElement.name === exportedElement);
    if(importedElementIndex !== -1){
      const importedElement = importedElements[importedElementIndex];
      const moduleListExportedFunctionsRes = listExportedFunctions(importedElement.importedModuleSpecifierPath, processedFiles);

      const exportedFunctionIndex = moduleListExportedFunctionsRes.findIndex(func => func.name === importedElement.name);
      if(exportedFunctionIndex !== -1){
        const exportedFunction = moduleListExportedFunctionsRes[exportedFunctionIndex];
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