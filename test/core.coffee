core = require('../lib/core')

core.cloud = require('./client')

for key of core
	if not window[key]
		window[key] = core[key]
	window['m' + key] = core[key]
