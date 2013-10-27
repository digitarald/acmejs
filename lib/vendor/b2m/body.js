'use strict';

var Component = require('./../../core/component');
var Pool = require('./../../core/pool');
var Vec2 = require('./../../core/math').Vec2;
var B2 = require('./b2');

var vec2Cache = new B2.Vec2(0, 0);

function Body() {
  this.definition = new B2.BodyDef();
  this.fixture = new B2.FixtureDef();
}

Body.prototype - Object.create(Component.prototype);

Body.prototype.type = 'b2Body';

Body.prototype.attributes = {
  fixed: false,
  velocity: Vec2(),
  allowSleep: true,
  angularVelocity: 0,
  bullet: false,
  fixedRotation: false,
  density: 1,
  friction: 0.5,
  restitution: 0.2
};

Body.definitionPresets = ['allowSleep', 'angularVelocity', 'awake', 'bullet', 'fixedRotation'];

Body.fixturePresets = ['density', 'friction', 'restitution'];


Body.prototype.create = function(attributes) {
  var body, bounds, definition, fixed, fixture, gravity, key, shape, world, _i, _j, _len, _len1, _ref, _ref1;
  if (!(world = this.root.b2World)) {
    gravity = new B2.Vec2(this.root.gravity[0], this.root.gravity[1]);
    world = new B2.World(gravity);
    this.root.b2World = world;
    Body.b2World = world;
  }
  definition = this.definition, fixture = this.fixture;
  _ref = Body.definitionPresets;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    key = _ref[_i];
    definition['set_' + key](attributes[key]);
  }
  this.fixed = fixed = attributes.fixed;
  definition.set_type(fixed ? B2.staticBody : B2.dynamicBody);
  this.b2body = body = world.CreateBody(definition);
  body.SetUserData(this.uid);
  _ref1 = Body.fixturePresets;
  for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
    key = _ref1[_j];
    fixture['set_' + key](attributes[key]);
  }
  bounds = this.bounds;
  switch (bounds.shape) {
    case 'poly':
      shape = new B2.PolygonShape();
      shape.SetAsArray(bounds.points, bounds.points.length);
      break;
    case 'rect':
      shape = new B2.PolygonShape();
      shape.SetAsBox(bounds.size[0] / 2, bounds.size[1] / 2);
      break;
    default:
      shape = new B2.CircleShape();
      shape.set_m_radius(bounds.radius);
      break;
  }
  fixture.set_shape(shape);
  body.CreateFixture(fixture);
  vec2Cache.Set(this.transform.position[0], this.transform.position[1]);
  body.SetTransform(vec2Cache, this.transform.angle);
  vec2Cache.Set(attributes.velocity[0], attributes.velocity[1]);
  body.SetLinearVelocity(vec2Cache);
  body.SetActive(1);
  return this;
};

Body.prototype.onTransform = function(pos, angle) {
  vec2Cache.Set(pos[0], pos[1]);
  this.b2body.SetTransform(vec2Cache, angle);
  return this;
};

Body.prototype.onEnable = function() {
  this.b2body.SetActive(true);
  return this;
};

Body.prototype.onDisable = function() {
  this.b2body.SetActive(false);
  return this;
};

Body.prototype.dealloc = function() {
  Body.b2World.DestroyBody(this.b2body);
  this.b2body = null;
  return Body.__super__.dealloc.call(this);
};

Body.prototype.applyContinuesForce = function(impulse) {
  vec2Cache.Set(impulse[0], impulse[1]);
  this.b2body.ApplyLinearImpulse(vec2Cache, this.b2body.GetWorldCenter());
  return this;
};

Body.listener = listener = new B2.ContactListener();

B2.customizeVTable(listener, [
  {
    original: B2.ContactListener.prototype.PostSolve,
    replacement: function(contactPtr, impulsePtr) {
      var bodyA, bodyB, contact;
      contact = B2.wrapPointer(contactPtr, B2.Contact);
      console.log(contact.GetFixtureA().GetBody());
      bodyA = contact.GetFixtureA().GetBody().userData;
      bodyB = contact.GetFixtureB().GetBody().userData;
      bodyA.entity.trigger('onCollide', bodyB.entity);
      bodyB.entity.trigger('onCollide', bodyA.entity);
      return null;
    }
  }
]);

Body.fixedUpdate = function(dt) {
  var b2body, body, pos, _i, _len, _ref;
  Body.b2World.Step(dt * 2, 3, 3);
  _ref = this.heap;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    body = _ref[_i];
    if (!(body.enabled && !body.fixed)) {
      continue;
    }
    b2body = body.b2body;
    if (b2body.IsAwake()) {
      pos = b2body.GetPosition();
      Vec2.set(body.transform.position, pos.get_x(), pos.get_y());
      body.transform.angle = b2body.GetAngle();
    }
  }
  return this;
};

new Pool(Body);

module.exports = Body;
