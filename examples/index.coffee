
Engine = require('./lib/engine')

Engine.init(document.getElementById('game-1'))

Renderer = require('./renderer')
Engine.renderer = new Renderer(Engine.element.getElementsByClassName('game-canvas')[0], Vec2(960, 640))

Scene = require('./lib/scene')
Engine.scene = new Scene()
Engine.start()
