---
title: oss 上传辅助工具
tags: 
 - Node
 - 提效工具
categories:
 - 技术
comments: true
date: 2020-06-13 19:23
---

# oss 上传辅助工具

解决问题：减少手动压缩上传oss

1. 将需要上传的图片内容放置在 `src` 文件夹中
2. 压缩后的文件会保存到 `.data` 文件夹中
3. `up`：单纯压缩上传，不处理 `src` 文件
4. `cp`：复制 `src` 到 `.data` 中
5. `rm`：删除 `src` 内容
6. `u`：`npm run up && npm run cp && npm run rm`

## conf.js

处理输入输出路径配置

```js
const dir = __dirname.replace('scripts', '')
const target = __dirname.replace('scripts', '.data') // 目标文件夹路径
const source = __dirname.replace('scripts', 'src') // 目标文件夹路径

module.exports = {
  source,
  target,
  dir
}
```

## util.js

定义函数访问文件和文件夹

```js
// 通用函数
const { readdir, statSync } = require('fs')
const { join } = require('path')

const noop = () => {}

const findBySource = path => {
  return new Promise(resolve => {
    readdir(path, async (err, files) => {
      resolve({
        files: files.map(file => join(path, file)), 
        path
      })
    })
  })
}

const resolveFile = (file, dirCb = noop, fileCb = noop) => {
  let stat = statSync(file)
  if(stat.isDirectory()){
    dirCb(file)
  }else if(stat.isFile()){
    fileCb(file)
  }
}

module.exports = {
  findBySource,
  resolveFile
}
```

## cp.js

用于复制文件到目标文件夹

```js
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
```

## rm.js

用于删除文件

```js
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
```

## up.js

用于压缩上传到 `oss`，具体 `oss` 配置需要自行配置

```js
// 上传代码
const fs = require('fs');
const { mkdir } = require('shelljs') // mkdir 创建文件夹方法
const { source, target, dir } = require('./conf')
const { findBySource, resolveFile } = require('./util') // findBySource 获取文件夹内容方法，resolveFile 判断是否文件夹方法
// 第三方插件
const sizeOf = require('image-size'); // 获取图片大小插件
const imagemin = require('imagemin'); // 压缩插件
const imageminJpegtran = require('imagemin-jpegtran'); // 压缩 jpg 插件
const imageminPngquant = require('imagemin-pngquant'); // 压缩 png 插件

const date = new Date()
// 归档文件名，防止重复，用时间来做文件名
const uploadFilePath = `${target}\\${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}.txt`
// oss 部分
// const OSS = require('ali-oss');
// const client = new OSS({
//     accessKeyId: '...',
//     accessKeySecret: '...',
//     region: '...',
//     bucket: '...'
// });
async function put (file) {
  try {
    //object-name可以自定义为文件名（例如file.txt）或目录（例如abc/test/file.txt）的形式，实现将文件上传至当前Bucket或Bucket下的指定目录。
    // const result = await client.put(file, file.replace(/.\//ig, ''));
    console.log('---- upload ----');
    console.log(file, file.replace(/.\//ig, ''));
  } catch (e) {
    console.log(e);
  }
}

// 创建文件夹
mkdir(target)
// 记录处理次数
let count = 0
// 所有文件个数
let all = 0
// 文件内容
let txt = ''
// 上传钩子函数：（输出图片信息文档）
const beforeUploadHook = file => {
  // 获取图片尺寸
  const size = sizeOf(file)
  count++
  txt +=  `path: ${file.replace(source, '')}; height: ${size.height}px; width: ${size.width}px;
`
  // 如果处理的文件个数等于所有的文件个数，则默认所有的文件已经处理完成
  if(all === count)fs.writeFileSync(`${uploadFilePath}`, txt)
}

const zipImage = async (src, dir) => {
  return await imagemin([`${src.replace(dir, '').replace('\\', '/')}/*.{jpg,png}`], {
    destination: src,
    plugins: [
      imageminJpegtran({ progressive:true }),
      imageminPngquant({
        quality: [0.8, 0.9]
      })
    ]
  });
}

// 读取文件夹回调
const cb = ({ files, path }) => {
  return new Promise(async resolve => {
    // 匹配到图片则进行压缩处理，生成新的图片
    zipImage(path, dir)
    // 记录文件数
    all += files.length
    files.map(async file => {
      resolveFile(file, () => {
        // 如果是文件夹 all -1
        all--
        findBySource(file).then(cb)
      }, async () => {
        // 调用钩子函数
        beforeUploadHook(file)
        // 上传
        put(file)
      })
    })
    resolve()
  })
}
// 读取目标文件夹
findBySource(source).then(cb)
```