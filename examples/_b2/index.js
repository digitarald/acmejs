'use strict';

var acmejs = require('acmejs');

Vec2 = require('../../lib/core/math').Vec2;
Context = require('../../lib/core/context');
Context.init(document.getElementById('game-1'));

Renderer = require('../../lib/core/renderer');

Context.renderer = new Renderer(Context.element.getElementsByClassName('game-canvas')[0], Vec2(480, 290));

Entity = require('../../lib/core/entity');

Component = require('../../lib/core/component');

Registry = require('../../lib/core/registry');

Color = require('../../lib/core/color');

require('../../lib/core/transform');

require('../../lib/core/border');

Body = require('../../lib/vendor/b2/body');

GameController = (function(_super) {

  __extends(GameController, _super);

  function GameController() {
    return GameController.__super__.constructor.apply(this, arguments);
  }

  GameController.prototype.type = 'gameController';

  GameController.prototype.create = function() {
    this.root.gravity = Vec2(0, 10);
    this.root.createChild({
      transform: {
        position: Vec2(240, 283)
      },
      bounds: {
        shape: 'rect',
        size: Vec2(480, 15)
      },
      b2Body: {
        fixed: true
      },
      boundsDebug: null
    });
    this.root.createChild({
      transform: {
        position: Vec2(240, 7)
      },
      bounds: {
        shape: 'rect',
        size: Vec2(480, 15)
      },
      b2Body: {
        fixed: true
      },
      boundsDebug: null
    });
    this.root.createChild({
      transform: {
        position: Vec2(7, 160)
      },
      bounds: {
        shape: 'rect',
        size: Vec2(15, 320)
      },
      b2Body: {
        fixed: true
      },
      boundsDebug: null
    });
    this.root.createChild({
      transform: {
        position: Vec2(473, 160)
      },
      bounds: {
        shape: 'rect',
        size: Vec2(15, 320)
      },
      b2Body: {
        fixed: true
      },
      boundsDebug: null
    });
    this.spawnBoxes();
  };

  GameController.prototype.spawnBox = function() {
    var size, sphere;
    size = Math.rand(5, 25);
    sphere = Math.chance(0.5);
    Box.Prefab.create(this.root, {
      transform: {
        position: Vec2(Math.rand(25, 450), Math.rand(25, 265))
      },
      bounds: {
        radius: size / 2,
        size: Vec2(size, size),
        shape: sphere ? 'circle' : 'rect'
      },
      b2Body: {
        awake: false
      }
    });
    return this;
  };

  GameController.prototype.spawnBoxes = function() {
    var i, _i;
    for (i = _i = 0; _i <= 10; i = ++_i) {
      this.spawnBox();
    }
    return this;
  };

  GameController.prototype.update = function() {
    var input;
    input = Context.input;
    if (input.touchState === 'began') {
      Explosion.Prefab.create(this.root, {
        transform: {
          position: input.position
        }
      });
    }
    if (input.keys.space === 'began') {
      this.spawnBoxes();
      return this;
    }
  };

  return GameController;

})(Component);

new Registry(GameController);

Box = (function(_super) {

  __extends(Box, _super);

  function Box() {
    return Box.__super__.constructor.apply(this, arguments);
  }

  Box.prototype.type = 'box';

  Box.prototype.onCollide = function(other, impulse) {
    return this;
  };

  return Box;

})(Component);

new Registry(Box);

Box.Prefab = new Entity.Prefab({
  transform: null,
  bounds: {
    shape: 'circle',
    radius: 10
  },
  box: null,
  b2Body: {
    restitution: 0.9,
    density: 0.5
  },
  border: {
    mirror: true
  },
  boundsDebug: null
});

Explosion = (function(_super) {

  __extends(Explosion, _super);

  Explosion.prototype.type = 'explosion';

  Explosion.prototype.attributes = {
    lifetime: 0.25,
    maxSize: 100,
    color: Color.white
  };

  function Explosion() {
    this.color = Color();
  }

  Explosion.prototype.create = function(attributes) {
    Color.copy(this.color, attributes.color);
    this.lifetime = attributes.lifetime;
    this.maxSize = attributes.maxSize;
    this.impulse = 50000;
    this.position = this.transform.position;
    this.age = 0;
    return this;
  };

  Explosion.prototype.update = function(dt) {
    var age;
    if (!this.age) {
      this.explode();
    }
    age = (this.age += dt);
    if (age >= this.lifetime) {
      this.entity.destroy();
    } else {
      this.factor = Math.quadOut(age / this.lifetime);
      this.size = this.factor * this.maxSize;
    }
    return this;
  };

  Explosion.prototype.explode = function() {
    var body, distSq, factor, i, impulse, maxSize, maxSizeSq, pos, pos2, _i, _j, _len, _ref;
    maxSize = this.maxSize, impulse = this.impulse;
    pos = this.transform.position;
    maxSizeSq = maxSize * maxSize;
    _ref = Body.pool.instances;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      body = _ref[_i];
      if (!(body.enabled && !body.fixed)) {
        continue;
      }
      pos2 = body.transform.position;
      distSq = Vec2.distSq(pos, pos2);
      if (distSq < maxSizeSq) {
        factor = 1 - Math.sqrt(distSq) / maxSize;
        body.applyForce(Vec2.norm(Vec2.sub(pos2, pos, Vec2.cache[0]), null, Math.quadIn(factor) * impulse));
      }
    }
    return this;
    for (i = _j = 0; _j <= 10; i = ++_j) {
      Spark.Prefab.create(this.root, {
        transform: {
          position: pos
        },
        b2Body: {
          velocity: Vec2(Math.rand(-100, 100), Math.rand(-100, 100))
        }
      });
    }
    return this;
  };

  Explosion.prototype.render = function(ctx) {
    var circles, factor, i, pos, _i;
    ctx.save();
    pos = this.position;
    circles = 10;
    for (i = _i = 1; _i <= circles; i = _i += 1) {
      factor = Math.quadOut(i / circles);
      ctx.beginPath();
      ctx.arc(pos[0] | 0, pos[1] | 0, this.size * factor | 0, 0, Math.TAU, true);
      ctx.closePath();
      this.color[3] = factor * (1 - this.factor);
      ctx.lineWidth = 10 * factor;
      ctx.strokeStyle = Color.rgba(this.color);
      ctx.stroke();
    }
    ctx.restore();
    return this;
  };

  return Explosion;

})(Component);

new Registry(Explosion);

Explosion.Prefab = new Entity.Prefab({
  transform: null,
  explosion: null
});

Spark = (function(_super) {

  __extends(Spark, _super);

  Spark.prototype.type = 'spark';

  function Spark() {
    this.lastPos = Vec2();
  }

  Spark.prototype.create = function() {
    Vec2.copy(this.lastPos, this.transform.position);
    this.lifetime = 2.5;
    this.age = 0;
    return this;
  };

  Spark.prototype.update = function(dt) {
    var age;
    age = (this.age += dt);
    if (age >= this.lifetime) {
      this.entity.destroy();
    }
    return this;
  };

  Spark.prototype.render = function(ctx) {
    var pos;
    pos = this.transform.position;
    ctx.save();
    ctx.strokeStyle = Color.rgba(Color.white);
    ctx.beginPath();
    ctx.moveTo(this.lastPos[0] | 0, this.lastPos[1] | 0);
    ctx.lineTo(pos[0] | 0, pos[1] | 0);
    ctx.stroke();
    ctx.restore();
    Vec2.copy(this.lastPos, pos);
    return this;
  };

  return Spark;

})(Component);

new Registry(Spark);

Spark.Prefab = new Entity.Prefab({
  transform: null,
  bounds: {
    shape: 'circle',
    radius: 0.1
  },
  spark: null,
  b2Body: {
    restitution: 1,
    density: 0.1,
    friction: 0
  },
  border: {
    kill: true
  }
});

Context.gameScene = Entity.create(null, {
  gameController: null
});

Context.debug.stats = true;

Context.play(Context.gameScene);
