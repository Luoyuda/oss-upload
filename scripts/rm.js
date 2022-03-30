// 删除文件
const { findBySource, resolveFile } = require('./util')
const { source } = require('./conf')
const { rm } = require('shelljs')

const rmCb = file => rm('-rf', file)

const cb = ({ files }) => {
  return new Promise(async resolve => {
    files.map(async file => resolveFile(file, rmCb, rmCb))
    resolve()
  })
}

findBySource(source).then(cb)