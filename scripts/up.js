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