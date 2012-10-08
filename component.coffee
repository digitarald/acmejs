
require('./math')

# Base class for everything attached to a composite
class Component

	type: 'component'

	toString: ->
		return "Component #{@type}##{@uid} [#{@parent}]"

	alloc: (presets) ->
		components = @parent.components
		for type of components
			@[type] = component = components[type]
			component[@type] = @
		@parent[@type] = @
		@parent.components[@type] = @
		if @reset
			@reset(presets)
		@

	free: ->
		delete @parent.components[@type]
		components = @parent.components
		for type of components
			delete @[components[type].type]
			delete components[type][@type]
		@parent[@type] = null
		@pool.free(@)
		@

	enable: (state) ->
		@enabled = state ?= not @state
		@parent.pub('onComponent' + (if state then 'Enable' else 'Disable'), @)
		@

	sub: (scope = @, topic, method) ->
		@parent.sub(scope, topic, method)
		@

module.exports = Component
