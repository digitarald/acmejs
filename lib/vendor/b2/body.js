'use strict';

var Component = require('./../../core/component');
var Pool = require('./../../core/pool');
var Vec2 = require('./../../core/math').Vec2;
var B2 = require('./b2');

function Body() {
  this.definition = new B2.BodyDef();
  this.fixture = new B2.FixtureDef();
}

Body.prototype = Object.create(Component.prototype);

Body.prototype.type = 'b2Body';

Body.prototype.attributes = {
  fixed: false,
  velocity: Vec2(),
  allowSleep: true,
  angularVelocity: 0,
  awake: true,
  bullet: false,
  fixedRotation: false,
  density: 1,
  friction: 0.5,
  restitution: 0.2
};

Body.definitionPresets = ['allowSleep', 'angularVelocity', 'awake', 'bullet', 'fixedRotation'];

Body.fixturePresets = ['density', 'friction', 'restitution'];

Body.prototype.create = function(attributes) {
  var world = this.root.b2World;
  if (!world) {
    var gravity = new B2.Vec2(this.root.gravity[0], this.root.gravity[1]);
    world = new B2.World(gravity);
    this.root.b2World = world;
    Body.b2World = world;
  }
  var definition = this.definition;
  var fixture = this.fixture;

  var definitions = Body.definitionPresets;
  for (var i = 0, l = definitions.length; i < l; i++) {
    var key = definitions[i];
    definition[key] = attributes[key];
  }

  definition.userData = this;
  Vec2.toObj(this.transform.position, definition.position);
  definition.angle = this.transform.rotation;
  Vec2.toObj(attributes.velocity, definition.linearVelocity);

  var fixed = this.fixed = attributes.fixed;
  definition.type = fixed ? B2.Body.b2_staticBody : B2.Body.b2_dynamicBody;

  this.b2body = world.CreateBody(definition);
  var fixtures = Body.fixturePresets;
  for (i = 0, l = fixtures.length; i < l; i++) {
    var key = fixtures[i];
    fixture[key] = attributes[key];
  }
  var bounds = this.bounds;
  switch (bounds.shape) {
    case 'circle':
      fixture.shape = new B2.CircleShape(bounds.radius);
      break;
    case 'poly':
      fixture.shape = new B2.PolygonShape(bounds.radius);
      fixture.shape.SetAsArray(bounds.points, bounds.points.length);
      break;
    case 'rect':
      fixture.shape = new B2.PolygonShape();
      fixture.shape.SetAsBox(bounds.size[0] / 2, bounds.size[1] / 2);
      break;
  }
  this.b2body.CreateFixture(fixture);
};

Body.prototype.onTransform = function() {
  this.b2body.SetPositionAndAngle(
    Vec2.toObj(this.transform.position),
    this.transform.rotation
  );
};

Body.prototype.onEnable = function() {
  this.b2body.SetActive(true);
};

Body.prototype.onDisable = function() {
  this.b2body.SetActive(false);
};

Body.prototype.dealloc = function() {
  Body.b2World.DestroyBody(this.b2body);
  this.b2body = null;
  Component.prototype.dealloc.call(this);
};

Body.prototype.applyContinuesForce = function(impulse) {
  this.b2body.ApplyImpulse(Vec2.toObj(impulse), this.b2body.GetWorldCenter());
};

var manifoldCache = new B2.WorldManifold();
var impulseCache = Vec2();
var pointCache = Vec2();

Body.PostSolve = function(contact, impulse) {
  var bodyA = contact.GetFixtureA().GetBody().GetUserData();
  var bodyB = contact.GetFixtureB().GetBody().GetUserData();
  Vec2.copy(impulseCache, impulse.tangentImpulses);
  contact.GetWorldManifold(manifoldCache);
  Vec2.fromObj(manifoldCache.m_points[0], pointCache);
  bodyA.entity.trigger('onCollide', bodyB.entity, impulseCache);
  bodyB.entity.trigger('onCollide', bodyA.entity, impulseCache);
  return null;
};

var empty = function(contact) {
  return null;
};
Body.BeginContact = empty;
Body.EndContact = empty;
Body.PreSolve = empty;

Body.fixedUpdate = function(dt) {
  Body.b2World.Step(dt * 2, 4, 2);
  var definitions = this.heap;
  for (var i = 0, l = definitions.length; i < l; i++) {
    var body = definitions[i];
    if (!(body.enabled && !body.fixed)) {
      continue;
    }
    var b2body = body.b2body;
    if (b2body.IsAwake()) {
      Vec2.fromObj(b2body.GetPosition(), body.transform.position);
      body.transform.rotation = b2body.GetAngle();
    }
  }
};

new Pool(Body);

module.exports = Body;
