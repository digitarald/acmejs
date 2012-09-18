# Base class for everything attached to a composite
class Component

	name: 'component'

	constructor: ->
		@uid = Math.uid()
		@parent = null

	toString: ->
		return "Component #{@name}##{@uid} [#{@parent}]"

	alloc: (@parent) ->
		@scene = parent.scene or parent
		parent[@name] = parent.components[@uid] = @
		@enabled = true
		@

	free: ->
		@enabled = @allocd = false
		delete @parent.components[@uid]
		@scene = @parent = @parent[@name] = null
		@

	enable: ->
		@enabled = true

	disable: ->
		@enabled = false