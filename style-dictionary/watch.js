const { exec } = require('child_process');
const chokidar = require('chokidar');

const runStyleDictionary = (event, path) => {
  const dir = `./${path.split('/').slice(0, -1).join('/')}`;
  exec(`cd ${dir} && style-dictionary build`, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
};

chokidar.watch('style-dictionary/tokens').on('all', (event, path) => {
  if (['add', 'change'].includes(event) && path.includes('.json')) {
    runStyleDictionary(event, path);
  }
}); 