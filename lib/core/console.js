'use strict';

var Component = require('./component');
var Vec2 = require('./math').Vec2;
var Engine = require('./engine');

function Console() {
	this.colors = ['#ddd', '#fff', '#ffc', '#fcc'];
	this.sections = ['#ffff33', '#ff8533', '#2babd6', '#9d2bd6'];
	// ['#fffa5b', '#ff945b', '#5bf4ff', '#bd5bff']
}

Console.prototype = {

	attributes: {
		css: '',
		container: null,
		width: 100,
		height: 56,
		cap: 50,
		resolution: 0.05,
		fancy: true
	},

	create: function(attributes) {
		this.css = attributes.css;
		this.container = attributes.container;
		this.width = attributes.width;
		this.height = attributes.height;
		this.cap = attributes.cap;
		this.resolution = attributes.resolution;
		this.fancy = attributes.fancy;

		var wrap = this.wrap = document.createElement('div');
		wrap.id = 'console';
		wrap.style.cssText = '' +
			'position: fixed;' +
			'left: 0;' +
			'top: 0;' +
			'user-select: none;' +
			'overflow: hidden;' +
			'padding: 0;' +
			'width: ' + this.width + 'px;' +
			'color: #ccc;' +
			'background-color: rgba(0, 0, 0, 1);' +
			'outline: 1px solid rgba(128, 128, 128, 0.5);' +
			'font: 400 9px/20px Helvetica,Arial,sans-serif;' +
			'transform: translateZ(0);' +
			'text-align: right;' +
			'text-shadow: 1px 1px 0 rgba(0, 0, 0, 1), 0 0 1px rgba(0, 0, 0, 1);' +
			'cursor: ns-resize;' + this.css;

		var spanCss = 'font-weight: bold;' +
			'font-size: 12px;' +
			'float: left;';

		this.fpsSpan = document.createElement('span');
		this.fpsSpan.style.cssText = spanCss;
		this.fpsSpan.title = 'FPS';
		this.fpsSpan2 = document.createElement('span');
		this.tickSpan = document.createElement('span');
		this.tickSpan.style.cssText = spanCss;
		this.tickSpan.title = 'MS per tick';
		this.tickSpan2 = document.createElement('span');
		this.fpsSpan2.title = this.tickSpan2.title = '± standard deviation';

		var panelCss = 'width: 50%;' +
			'padding: 0 5px;' +
			'overflow: hidden;' +
			'position: absolute;' +
			'top: 0;' +
			'left: 0;' +
			'-moz-box-sizing: border-box;' +
			'-webkit-box-sizing: border-box;' +
			'z-index: 2;';
		var panel = document.createElement('span');
		panel.style.cssText = panelCss;
		panel.appendChild(this.fpsSpan);
		panel.appendChild(this.fpsSpan2);
		wrap.appendChild(panel);

		panel = document.createElement('span');
		panel.style.cssText = panelCss + 'left: 50%;';
		panel.appendChild(this.tickSpan);
		panel.appendChild(this.tickSpan2);
		wrap.appendChild(panel);

		var rulerCss = 'position: absolute;' +
			'left: 0;' +
			'width: 100%;' +
			'height: 1px;' +
			'background-color: rgba(128, 128, 128, 0.5);';

		var ruler = document.createElement('span');
		ruler.style.cssText = rulerCss + ('bottom: ' + (this.height * 0.66) + 'px;');
		wrap.appendChild(ruler);
		ruler = document.createElement('span');
		ruler.style.cssText = rulerCss + ('bottom: ' + (this.height * 0.33) + 'px;');
		wrap.appendChild(ruler);

		this.graphSpan = document.createElement('div');
		this.graphSpan.style.cssText = '' +
			'height: ' + this.height + 'px;' +
			'z-index: 1;';
		this.graphSpan.title = 'Fixed Update + Update + Render + Lag';

		var barCss = 'width: 1px;' +
			'float: left;' +
			'margin-top: 0px;';
		var sectionCss = 'display: block;' +
			'height: 0px;';
		if (this.fancy) {
			sectionCss += 'background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.25));';
		}

		var i = this.width;
		while (i--) {
			var bar = document.createElement('span');
			bar.className = 'console-bar';
			bar.style.cssText = barCss;
			var sections = this.sections;
			for (var j = 0, l = sections.length; j < l; j++) {
				var section = document.createElement('span');
				section.className = 'console-section';
				section.style.cssText = sectionCss +
					'background-color: ' + sections[j] + ';';
				bar.appendChild(section);
			}
			this.graphSpan.appendChild(bar);
		}
		wrap.appendChild(this.graphSpan);

		(this.container || document.body).appendChild(wrap);
		this.nullify();

		this.lastClick = 0;
		wrap.addEventListener('click', this);

		this.maximized = !(~(document.cookie || '').indexOf('console_max'));
		this.toggle();
	},

	handleEvent: function(evt) {
		var time = evt.timeStamp;
		if (time - this.lastClick < 500) {
			this.destroy();
		}
		this.lastClick = time;

		this.toggle();
		return false;
	},

	toggle: function() {
		var margin = 0;
		var opacity = 0.8;
		this.maximized = !this.maximized;
		if (!this.maximized) {
			opacity = 0.5;
			margin = -this.height + 20;
			document.cookie = 'console_max=; expires=' + (new Date()).toGMTString();
		} else {
			document.cookie = 'console_max=1';
		}
		var style = this.graphSpan.style;
		style.marginTop = '' + margin + 'px';
		style.opacity = opacity;
	},

	dealloc: function() {
		(this.container || document.body).removeChild(this.wrap);
		this.wrap.removeEventListener('click', this);
		this.wrap = null;
		this.container = null;
		Component.prototype.dealloc.call(this);
	},

	onTimeEnd: function(samples) {
		var dt = samples.dt;
		this.dtSum += dt;
		if (!dt) {
			return;
		}

		var fps = 1 / dt;
		this.fpsSum += fps;
		this.fpsSq += fps * fps;
		var lag = samples.lag;
		this.lagSum += lag;
		this.lagSq += lag * lag;
		var tick = samples.tick;
		this.tickSum += tick;
		this.tickSq += tick * tick;
		this.updateSum += samples.update;
		this.fixedUpdateSum += samples.fixedUpdate;
		this.renderSum += samples.render;
		this.frames++;
		if (this.dtSum < this.resolution) {
			return;
		}

		var colors = this.colors;
		var tickMean = this.tickSum / this.frames;
		var tickSD = Math.sqrt((this.tickSq - (this.tickSum * this.tickSum / this.frames)) / (this.frames - 1));

		var color = colors[0];
		if (tickMean > 33) {
			color = colors[3];
		} else if (tickMean > 16) {
			color = colors[2];
		} else if (tickMean > 5) {
			color = colors[1];
		}

		this.tickSpan.textContent = tickMean < 10 ? Math.round(tickMean * 10) / 10 : Math.round(tickMean);
		this.tickSpan.style.color = color;
		this.tickSpan2.textContent = tickSD < 10 ? Math.round(tickSD * 10) / 10 : Math.round(tickSD);

		var bar = this.graphSpan.appendChild(this.graphSpan.firstChild);
		var overall = 0;

		var mag = Math.round(this.height * this.lagSum / this.frames / this.cap);
		bar.children[0].style.height = mag + 'px';
		overall += mag;

		mag = this.height * this.renderSum / this.frames / this.cap;
		bar.children[1].style.height = mag + 'px';
		overall += mag;

		mag = Math.round(this.height * this.updateSum / this.frames / this.cap);
		bar.children[2].style.height = mag + 'px';
		overall += mag;

		mag = Math.round(this.height * this.fixedUpdateSum / this.frames / this.cap);
		bar.children[3].style.height = mag + 'px';
		overall += mag;

		bar.style.marginTop = '' + (this.height - overall) + 'px';

		var fpsMean = this.fpsSum / this.frames;
		var fpsSD = Math.sqrt((this.fpsSq - (this.fpsSum * this.fpsSum / this.frames)) / (this.frames - 1));
		if (fpsMean < 30) {
			color = colors[3];
		} else if (fpsMean < 40) {
			color = colors[2];
		} else if (fpsMean < 55) {
			color = colors[1];
		} else {
			color = colors[0];
		}
		this.fpsSpan.textContent = Math.round(fpsMean || 0);
		this.fpsSpan.style.color = color;
		this.fpsSpan2.textContent = Math.round(fpsSD || 0);

		this.nullify();
	},

	nullify: function() {
		this.dtSum = 0;
		this.fpsSum = this.fpsSq = 0;
		this.tickSum = this.tickSq = 0;
		this.lagSum = this.lagSq = 0;
		this.fixedUpdateSum = 0;
		this.updateSum = 0;
		this.renderSum = 0;
		this.frames = 0;
	}

};

new Component('console', Console);

module.exports = Console;