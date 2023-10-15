const path = require('path');
const ts = require('typescript');
const fs = require('fs');

const listExportedFunctions = (filePath, processedFiles = new Set()) => {
  if (processedFiles.has(filePath)) {
    return [];
  }

  processedFiles.add(filePath);
  
  const exportedFunctions = [];
  const exportedElements = [];
  const exportedElementsFromModule = [];
  const functions = [];

  const fileContent = fs.readFileSync(filePath, 'utf8');
  console.time('parse')
  const sourceFile = ts.createSourceFile(filePath, fileContent, ts.ScriptTarget.ESNext, true);
  console.timeEnd('parse')

  ts.forEachChild(sourceFile, node => {
    debugger
    const combinedModifierFlags = ts.getCombinedModifierFlags(node);
    const isExported = (combinedModifierFlags & ts.ModifierFlags.Export) !== 0;
    const isFunctionDeclaration = ts.isFunctionDeclaration(node);
    // const isExportedFunctionDeclaration = isFunctionDeclaration && isExported;
    const isVariableStatement = ts.isVariableStatement(node);
    // const isExportedVariableStatement = isVariableStatement && isExported;
    const isExportDeclaration = ts.isExportDeclaration(node);
    // const isExportedExportDeclaration = isExportDeclaration && isNamedExports;
    // if(node.exportClause){
    //   const isNamedExports = ts.isNamedExports(node.exportClause);
    // }
    // if(node.name){
    //   const isIdentifier = ts.isIdentifier(node.name);
    // }
    // if(node.moduleSpecifier){
    //   const isStringLiteral = ts.isStringLiteral(node.moduleSpecifier);
    //   const isModuleSpecifier = ts.isModuleSpecifier(node.moduleSpecifier);
    //   const isExportedModuleSpecifier = isModuleSpecifier && isStringLiteral;
    // }
    // const isExportedModuleSpecifierPath = path.resolve(path.dirname(filePath), node.moduleSpecifier.text);

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
          debugger
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

    if(isExported){
      // named export
      debugger
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
        debugger
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

  exportedElements.forEach(exportedElement => {
    const exportedFunctionIndex = functions.findIndex(func => func.name === exportedElement);
    if(exportedFunctionIndex !== -1){
      const exportedFunction = functions[exportedFunctionIndex];
      return exportedFunctions.push(exportedFunction);
    }
  });

  return exportedFunctions;
}

module.exports = {
  listExportedFunctions,
}