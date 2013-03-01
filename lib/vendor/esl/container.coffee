
Component = require('./../../core/component')
Pool = require('./../../core/pool')
{Vec2} = require('./../../core/math')
Esl = require('./esl')

Engine = require('./../../core/engine')

class EslContainer extends Component

	type: 'eslContainer'

	constructor: ->

	reset: (presets) ->
		if not (stage = @root.eslStage)
			stage = new Esl.Stage(Engine.renderer.buf)
			stage.autoClear = false
			EslContainer.eslStage = stage
			@root.eslStage = stage

		child = presets.child
		if typeof child is 'function'
			child = child.call(@, presets)

		stage.addChild(child)
		@child = child
		@

	onTransform: ->

		@

	onEnable: ->
		@child.visible = true
		@

	onDisable: ->
		@child.visible = false
		@

	free: ->
		@root.eslStage.removeChild(@child)
		@child = null
		super()

EslContainer.render = (dt) ->
	for container in @roster when container.enabled
		{child, transform} = container
		Vec2.toObj(transform.pos, child)
		child.rotation = transform.angle

	EslContainer.eslStage.update()
	@

new Pool(EslContainer)

module.exports = EslContainer