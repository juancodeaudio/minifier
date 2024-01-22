const fs = require('fs');
const UglifyJS = require('uglify-js');

function extractFileListFromHTML(htmlFilePath) {
  const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');

  let match;
  const scriptRegex = /<script.*?src="(.*?)".*?>/g;
  let foundAppJs = false;
  const scriptFiles = [];

  while ((match = scriptRegex.exec(htmlContent)) !== null) {
    if (match[1].includes('app.js')) {
      foundAppJs = true;
    } else if (foundAppJs) {
      scriptFiles.push(match[1]);
    }
  }

  return scriptFiles;
}

function convertFileListToObject(fileList) {
  const fileObject = {};

  fileList.forEach((file) => {
    const fileContent = fs.readFileSync(file, 'utf8');
    fileObject[file] = fileContent;
  });

  return fileObject;
}

function minifyAndCombineChunks(fileChunks, outputFileName, outputMapFileName) {
  const combinedFileObject = {};

  fileChunks.forEach((chunk, index) => {
    const chunkObject = convertFileListToObject(chunk);
    const minifiedChunk = UglifyJS.minify(chunkObject, { compress: false, sourceMap: { filename: `${outputFileName}-${index}.min.js`, url: `${outputFileName}-${index}.js.map` } });

    combinedFileObject[`chunk-${index}`] = minifiedChunk.code;
  });

  const combinedMinified = UglifyJS.minify(combinedFileObject, { compress: false, sourceMap: { filename: outputFileName, url: outputMapFileName } });

  fs.writeFileSync(outputFileName, combinedMinified.code);
  fs.writeFileSync(outputMapFileName, combinedMinified.map);

  console.log(`Minification complete. Output file: ${outputFileName}, Source Map: ${outputMapFileName}`);
}

function minifyFilesFromHTML(htmlFilePath, outputPrefix) {
  const fileList = extractFileListFromHTML(htmlFilePath);

  if (fileList.length === 0) {
    console.log('No files found in the specified HTML document.');
    return;
  }

  console.log('Files to be minified:');
  console.log(fileList);
  console.log('Total files:', fileList.length);

  const chunkSize = 50; // Puedes ajustar el tamaño del bloque según tus necesidades
  const totalChunks = Math.ceil(fileList.length / chunkSize);
  const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  progressBar.start(totalChunks, 0);

  const fileChunks = [];

  for (let i = 0; i < totalChunks; i++) {
    const chunk = fileList.slice(i * chunkSize, (i + 1) * chunkSize);
    fileChunks.push(chunk);
    progressBar.update(i + 1);
  }

  progressBar.stop();

  const outputFileName = `${outputPrefix}.min.js`;
  const outputMapFileName = `${outputPrefix}.min.js.map`;

  console.log('Minifying files...');

  minifyAndCombineChunks(fileChunks, outputFileName, outputMapFileName);
}

// Ejemplo de uso
const htmlFilePath = '../swac.html';
const outputPrefix = 'app';
minifyFilesFromHTML(htmlFilePath, outputPrefix);
