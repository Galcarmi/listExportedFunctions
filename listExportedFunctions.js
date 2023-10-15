const path = require('path');
const ts = require('typescript');
const fs = require('fs');

const listExportedFunctions = (filePath, processedFiles = new Map()) => {
  if (processedFiles.has(filePath)) {
    console.log('already processed', filePath)
    return processedFiles.get(filePath);
  }
  
  const exportedFunctions = [];
  const exportedElements = [];
  const importedElementsFromModule = [];
  const functions = [];

  const fileContent = fs.readFileSync(filePath, 'utf8');
  console.time('parse')
  const sourceFile = ts.createSourceFile(filePath, fileContent, ts.ScriptTarget.ESNext, true);
  console.timeEnd('parse')

  ts.forEachChild(sourceFile, node => {
    const combinedModifierFlags = ts.getCombinedModifierFlags(node);
    const isExported = (combinedModifierFlags & ts.ModifierFlags.Export) !== 0;
    const isFunctionDeclaration = ts.isFunctionDeclaration(node);
    const isVariableStatement = ts.isVariableStatement(node);
    const isExportDeclaration = ts.isExportDeclaration(node);
    const isImportDeclaration = ts.isImportDeclaration(node);

    const getAnalyzedFunction = () =>{
      let analyzedFunction = null;
      if(isFunctionDeclaration){
        analyzedFunction = {
          name: node.name.escapedText,
          numOfParams: node.parameters.length
        };
      }
      else if(isVariableStatement){
        node.declarationList.declarations.forEach(declaration => {
          const declarationInitializer = declaration.initializer;
          if(declarationInitializer){
            const isFunctionLike = ts.isFunctionLike(declarationInitializer);
            if(isFunctionLike){
              analyzedFunction = {
                name: declaration.name.escapedText,
                numOfParams: declarationInitializer.parameters.length
              };
            }
          }
        });
      }

      return analyzedFunction;
    }

    const forEachElementInExportClause = (fun) => {
      node.exportClause?.elements.forEach(element => {
        const isIdentifier = ts.isIdentifier(element.name);
        if(isIdentifier){
          fun(element);
        }
      });
    }

    const forEachElementInImportClause = (fun) => {
      node.importClause?.namedBindings?.elements.forEach(element => {
        const isIdentifier = ts.isIdentifier(element.name);
        if(isIdentifier){
          fun(element);
        }
      });
    }

    if(isImportDeclaration){
      const importedModuleSpecifierPath = require.resolve(path.resolve(path.dirname(filePath), node.moduleSpecifier.text));
      forEachElementInImportClause(element => {
        importedElementsFromModule.push({
          name: element.name.escapedText,
          importedModuleSpecifierPath
        });
      })
    }
    else if(isExported){
      // named export
      const maybeExportedFunction = getAnalyzedFunction();
      if(maybeExportedFunction){
        exportedFunctions.push(maybeExportedFunction);
      }

      return;
    } else if(isExportDeclaration){
      if(node.exportClause && node.moduleSpecifier){
        const isStringLiteral = ts.isStringLiteral(node.moduleSpecifier);
        if(isStringLiteral){
          const exportedModuleSpecifierPath = require.resolve(path.resolve(path.dirname(filePath), node.moduleSpecifier.text));
          const moduleListExportedFunctionsRes = listExportedFunctions(exportedModuleSpecifierPath, processedFiles);
          forEachElementInExportClause((element)=>{
            const exportedFunctionIndex = moduleListExportedFunctionsRes.findIndex(func => func.name === element.name.escapedText);
            if(exportedFunctionIndex !== -1){
              const exportedFunction = moduleListExportedFunctionsRes[exportedFunctionIndex];
              return exportedFunctions.push(exportedFunction);
            }
          })
        }
      }
      // export element
      if(node.exportClause){
        forEachElementInExportClause((element)=>{exportedElements.push(element.name.escapedText)})
      } else if(node.moduleSpecifier){
        // transitive export
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
      // try finding functions
      const maybeFunction = getAnalyzedFunction();
      if(maybeFunction){
        functions.push(maybeFunction);
      }

      return;
    }
  });

  // console.log('exportedElements', exportedElements);
  // console.log('importedElementsFromModule', importedElementsFromModule);
  // console.log('functions', functions);
  // console.log('exportedFunctions', exportedFunctions);

  exportedElements.forEach(exportedElement => {
    const exportedFunctionIndex = functions.findIndex(func => func.name === exportedElement);
    if(exportedFunctionIndex !== -1){
      const exportedFunction = functions[exportedFunctionIndex];
      return exportedFunctions.push(exportedFunction);
    }

    const importedElementIndex = importedElementsFromModule.findIndex(importedElement => importedElement.name === exportedElement);
    if(importedElementIndex !== -1){
      const importedElement = importedElementsFromModule[importedElementIndex];
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

module.exports = {
  listExportedFunctions,
}