const path = require('path');
const filePath = path.resolve(__dirname, './someFile.js');
const ts = require('typescript');
const fs = require('fs');

const listExportedFunctions = (filePath, processedFiles = new Set()) => {
  if (processedFiles.has(filePath)) {
    return [];
  }

  processedFiles.add(filePath);
  
  const exportedFunctions = [];
  const exportedElements = [];
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
        console.log('isFunctionDeclaration')
        analyzedFunction = {
          name: node.name.escapedText,
          numOfParams: node.parameters.length
        };
      }
      else if(isVariableStatement){
        console.log('isVariableStatement')
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
    if(isExported){
      debugger
      const maybeExportedFunction = getAnalyzedFunction();
      if(maybeExportedFunction){
        exportedFunctions.push(maybeExportedFunction);
      }

      return;
    } else if(isExportDeclaration){
      node.exportClause?.elements.forEach(element => {
        debugger
        const isIdentifier = ts.isIdentifier(element.name);
        if(isIdentifier){
          exportedElements.push(element.name.escapedText);
        }
      });

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

  return {exportedFunctions, exportedElements, functions};
}

console.time('listExportedFunctions');
console.log(listExportedFunctions('./empty2.js'));
console.timeEnd('listExportedFunctions');
