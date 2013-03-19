
require('./math')

# Base class for everything attached to a entity
class Component

	tag: 'component'

	toString: ->
		return "Component #{@tag}##{@uid} [^ #{@entity}]"

	alloc: (attributes) ->
		@entity = entity = @parent
		entity.components[@tag] = @
		entity[@tag] = @
		components = entity.components
		for tag of components when tag isnt @tag
			@[tag] = component = components[tag]
			component[@tag] = @
		if @instantiate
			@instantiate(attributes)
		@

	destroy: ->
		@pool.destroy(@)
		@

	free: ->
		delete @entity.components[@tag]
		@entity[@tag] = null
		components = @entity.components
		for tag of components when tag isnt @tag
			@[components[tag].tag] = null
			components[tag][@tag] = null
		@entity = null
		@pool.free(@)
		@

	enable: (state, silent) ->
		@enabled = (state ?= not @state)
		if silent
			@entity.pub('onComponent' + (if state then 'Enable' else 'Disable'), @)
		@

	sub: (scope = @, topic, method) ->
		@entity.sub(scope, topic, method)
		@

module.exports = Component
