
const dir = __dirname.replace('scripts', '')
const target = __dirname.replace('scripts', '.data') // 目标文件夹路径
const source = __dirname.replace('scripts', 'src') // 目标文件夹路径

module.exports = {
  source,
  target,
  dir
}