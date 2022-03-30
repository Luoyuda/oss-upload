// 复制文件
const { join } = require('path')
const { source, target } = require('./conf')
const { findBySource, resolveFile } = require('./util')
const { cp, mkdir, rm } = require('shelljs')

const cb = ({ files }) => {
  return new Promise(async resolve => {
    files.map(async file => {
      let targetFile = join(target, file.replace(source, ''))
      resolveFile(file, () => {
        // 创建 ./data/文件夹
        mkdir(targetFile)
        findBySource(file).then(cb).then(() => {
          // rm('-rf', file)
        })
      }, () => {
        // 移动到目标文件夹
        rm('-rf', targetFile)
        cp('-R', file, targetFile)
      })
    })
    resolve()
  })
}

findBySource(source).then(cb)