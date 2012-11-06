
require('./math')

# Base class for everything attached to a composite
class Component

	type: 'component'

	toString: ->
		return "Component #{@type}##{@uid} [#{@parent}]"

	alloc: (presets) ->
		@parent.components[@type] = @
		@parent[@type] = @
		components = @parent.components
		for type of components
			@[type] = component = components[type]
			component[@type] = @
		if @reset
			@reset(presets)
		@

	free: ->
		delete @parent.components[@type]
		@parent[@type] = null
		components = @parent.components
		for type of components
			@[components[type].type] = null
			components[type][@type] = null
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
