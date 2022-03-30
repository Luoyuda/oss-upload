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