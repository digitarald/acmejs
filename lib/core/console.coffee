
Component = require('./component')
Pool = require('./pool')
{Vec2} = require('./math')
Engine = require('./engine')

class Console extends Component

	tag: 'console'

	constructor: () ->
		@colors = [
			'#ddd'
			'#fff'
			'#ffc'
			'#fcc'
		]

		@sections = [
			'#f9f684'
			'#f9ad84'
			'#b778e2'
			'#78dbe2'
		]

	attributes:
		css: ''
		container: null,
		width: 100
		height: 56
		cap: 50
		resolution: 0.25

	instantiate: (attributes) ->
		{@css, @container, @width, @height, @cap, @resolution} = attributes

		@wrap = wrap = document.createElement('div')
		wrap.id = 'console'
		wrap.style.cssText = "
			position: absolute;
			left: 0;
			top: 0;
			user-select: none;
			overflow: hidden;
			padding: 0;
			width: #{@width}px;
			color: #ccc;
			background-color: rgba(0, 0, 0, 0.75);
			outline: 1px solid rgba(128, 128, 128, 0.5);
			font: 400 9px/20px Helvetica,Arial,sans-serif;
			transform: translateZ(0);
			text-align: right;
			text-shadow: 1px 1px 0 rgba(0, 0, 0, 1), 0 0 1px rgba(0, 0, 0, 1);
			cursor: ns-resize;" + @css

		@graphSpan = document.createElement('div')
		@graphSpan.style.cssText = "
			height: #{@height}px;
			z-index: 1;"
		@graphSpan.title = 'Fixed Update + Update + Render + Lag'

		barCss = "
			width: 1px;
			float: left;
			margin-top: 0px;"
		sectionCss = "
			display: block;
			height: 0px;"

		i = @width
		while i--
			bar = document.createElement('span')
			bar.className = 'console-bar'
			bar.style.cssText = barCss
			for color in @sections
				section = document.createElement('span')
				section.className = 'console-section'
				section.style.cssText = sectionCss + "background-color: #{color}"
				bar.appendChild(section)
			@graphSpan.appendChild(bar)

		spanCss = "
			font-weight: bold;
			font-size: 12px;
			float: left;"

		@fpsSpan = document.createElement('span')
		@fpsSpan.style.cssText = spanCss
		@fpsSpan.title = 'FPS'
		@fpsSpan2 = document.createElement('span')
		@tickSpan = document.createElement('span')
		@tickSpan.style.cssText = spanCss
		@tickSpan.title = 'MS per tick'
		@tickSpan2 = document.createElement('span')
		@fpsSpan2.title = @tickSpan2.title = '± standard deviation'

		panelCss = "
			width: 50%;
			padding: 0 5px;
			overflow: hidden;
			position: absolute;
			top: 0;
			left: 0;
			-moz-box-sizing: border-box;
			-webkit-box-sizing: border-box;
			z-index: 2;"
		panel = document.createElement('span')
		panel.style.cssText = panelCss
		panel.appendChild(@fpsSpan)
		panel.appendChild(@fpsSpan2)
		wrap.appendChild(panel)

		panel = document.createElement('span')
		panel.style.cssText = panelCss + "left: 50%;"
		panel.appendChild(@tickSpan)
		panel.appendChild(@tickSpan2)
		wrap.appendChild(panel)

		rulerCss = "
			position: absolute;
			left: 0;
			width: 100%;
			height: 1px;
			background-color: rgba(128, 128, 128, 0.5);"

		ruler = document.createElement('span')
		ruler.style.cssText = rulerCss + "bottom: #{@height * 0.66}px;"
		wrap.appendChild(ruler)
		ruler = document.createElement('span')
		ruler.style.cssText = rulerCss + "bottom: #{@height * 0.33}px;"
		wrap.appendChild(ruler)

		wrap.appendChild(@graphSpan)
		(@container or document.body).appendChild(wrap)
		@nullify()

		wrap.addEventListener('click', @)
		@toggle()
		@

	handleEvent: (evt) ->
		@toggle()
		return false

	toggle: ->
		margin = 0
		opacity = 0.8
		if (@minimized = not @minimized)
			opacity = 0.5
			margin = -@height + 20
		@graphSpan.style.marginTop = "#{margin}px"
		@graphSpan.style.opacity = opacity
		@

	free: ->
		(@container or document.body).removeChild(@wrap)
		wrap.removEventListener('click', @)
		@wrap = null
		@container = null
		super()

	onTimeEnd: (samples) ->
		@dtSum += (dt = samples.dt)
		if not dt
			return
		@fpsSum += (fps = 1 / dt)
		@fpsSq += fps * fps
		@lagSum += (lag = samples.lag)
		@lagSq += lag * lag
		@tickSum += (tick = samples.tick)
		@tickSq += tick * tick
		@updateSum += samples.update
		@fixedUpdateSum += samples.fixedUpdate
		@renderSum += samples.render
		@frames++
		if @dtSum < @resolution
			return

		colors = @colors

		tickMean = @tickSum / @frames
		tickSD = Math.sqrt((@tickSq - (@tickSum * @tickSum / @frames)) / (@frames - 1))
		if tickMean > 33
			color = colors[3]
		else if tickMean > 16
			color = colors[2]
		else if tickMean > 5
			color = colors[1]
		else
			color = colors[0]
		@tickSpan.textContent = if tickMean < 10 then Math.round(tickMean * 10) / 10 else Math.round(tickMean)
		@tickSpan.style.color = color
		@tickSpan2.textContent = if tickSD < 10 then Math.round(tickSD * 10) / 10 else Math.round(tickSD)

		bar = @graphSpan.appendChild(@graphSpan.firstChild)
		overall = 0

		mag = Math.round(@height * @lagSum / @frames / @cap)
		bar.children[0].style.height = "#{mag}px"
		overall += mag

		mag = (@height * @renderSum / @frames / @cap)
		bar.children[1].style.height = "#{mag}px"
		overall += mag

		mag = Math.round(@height * @updateSum / @frames / @cap)
		bar.children[2].style.height = "#{mag}px"
		overall += mag

		mag = Math.round(@height * @fixedUpdateSum / @frames / @cap)
		bar.children[3].style.height = "#{mag}px"
		overall += mag

		bar.style.marginTop = "#{@height - overall}px"

		fpsMean = @fpsSum / @frames
		fpsSD = Math.sqrt((@fpsSq - (@fpsSum * @fpsSum / @frames)) / (@frames - 1))
		if fpsMean < 30
			color = colors[3]
		else if fpsMean < 40
			color = colors[2]
		else if fpsMean < 55
			color = colors[1]
		else
			color = colors[0]
		@fpsSpan.textContent = Math.round(fpsMean or 0)
		@fpsSpan.style.color = color
		@fpsSpan2.textContent = Math.round(fpsSD or 0)

		@nullify()
		@

	nullify: ->
		@dtSum = 0
		@fpsSum = @fpsSq = 0
		@tickSum = @tickSq = 0
		@lagSum = @lagSq = 0
		@fixedUpdateSum = 0
		@updateSum = 0
		@renderSum = 0
		@frames = 0
		@



new Pool(Console)

module.exports = Console