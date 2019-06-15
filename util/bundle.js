const fs = require('fs');
const path = require('path');

const cwd = process.cwd();

const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json')).toString());
const entry = path.join(cwd, pkg.entry);
const entryDir = path.basename(path.dirname(entry));

function clean(path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function (file) {
      const curPath = path + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        clean(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

const _ws = `\\n\\s\\r\\t`;
const ws = `[${_ws}]*`;
const _qt = `\\'\\"`;
const qt = `[${_qt}]{1}`;
const variables = `${ws}{([${_ws}\\,\\d\\w]+)}${ws}`;

const modulePattern = (type, from) => { return `${type}${variables}` + (from ? `from${ws}${qt}([\\.\\-\\_\\/\\S]+)${qt}` : '') + ';?' };

const expRgx = new RegExp(modulePattern('export'), 'g');
const expFrom = new RegExp(modulePattern('export', true), 'g');
const impRgx = new RegExp(modulePattern('import', true), 'g');

clean(path.join(cwd, 'dist'));
fs.mkdirSync(path.join(cwd, 'dist/es'), { recursive: true });

const exported = new Set();

var esm = fs.readFileSync(entry).toString().replace(expFrom, (m, p1, p2) => {
  p1.split(',').forEach(x => {
    const v = x.trim();
    if (v.length > 0 && !v.match(new RegExp(`\\^[${ws}]+$`, 'g'))) {
      exported.add(v);
    }
  });
  return fs.readFileSync(`${path.join(entryDir, p2)}.js`).toString().replace(impRgx, '').replace(expRgx, '');
}).concat((function() {
  let str = '';
  exported.forEach(x => { str += `  ${x},\n` });
  return `export {\n${str}}`;
})());
var cjs = esm.replace(expRgx, (m, p1) => {
  return `module.exports = {${p1}}`;
});

fs.writeFileSync(path.join(cwd, pkg.main), cjs);
fs.writeFileSync(path.join(cwd, pkg.module), esm);