'use strict';

import Entity from '../core/entity';
import Component from '../core/component';
import Registry from '../core/registry';
import Context from '../core/context';
import {TAU, clamp} from '../math/mathf';
import Vec2 from '../math/vec2';
import {random} from '../math/random';
import Tweens from '../math/tweens';
import Color from '../math/color';
import {SpriteAsset, SpriteSheet} from '../core/sprite';

export default class Particle extends Component {
	constructor() {
		Component.call(this);
		this.lifetime = 0.0;
		this.lifetimeVariant = 0.0;
		this.radius = 0.0;
		this.radiusVariant = 0.0;
		this.alphaVariant = 0.0;
		this.shrink = Tweens.linear;
		this.fade = Tweens.linear;
		this.age = 0.0;
	}

	get attributes() {
		return {
			lifetime: 1,
			lifetimeVariant: 1,
			radius: 1,
			radiusVariant: 0,
			alphaVariant: 0,
			shrink: Tweens.quintIn,
			fade: Tweens.quintIn
		}
	}

	create(attributes) {
		let variant = this.lifetimeVariant;
		if (variant > 0) {
			this.lifetime += random(-variant, variant);
		}
		variant = this.radiusVariant;
		if (variant > 0) {
			this.radius += random(-variant, variant);
		}
		variant = this.alphaVariant;
		if (variant > 0) {
			let transform = this.components.transform;
			transform.alpha = clamp(
				transform.alpha + random(-variant, variant), 0, 1
			);
		}
		this.age = 0;
	}

	update(dt) {
		this.age += dt;
		let age = this.age;
		let lifetime = this.lifetime;
		if (age > lifetime) {
			this.entity.destroy();
			return;
		}
		if (this.shrink) {
			this.radius *= 1 - this.shrink(age / lifetime);
			if (this.radius < 1) {
				this.entity.destroy();
				return;
			}
		}
		if (this.fade) {
			let transform = this.components.transform;
			transform.alpha *= 1 - this.fade(age / lifetime);
			if (transform.alpha <= 0.02) {
				this.entity.destroy();
				return;
			}
		}
		this.components.spriteTween.frame = this.radius - 1 | 0;
	}

	static generateSpriteAsset(attributes) {
		attributes = attributes || {};
		let color = Color(attributes.color || Color.gray);
		let alpha = attributes.alpha || 1;
		let max = attributes.max = attributes.max || 25;
		let size = max * 2;
		let center = attributes.center || 0.5;
		let shape = attributes.shape || 'circle';

		return new SpriteAsset(function(ctx) {
			for (let radius = 1; radius <= max; radius++) {
				let top = max + size * (radius - 1);

				if (center < 1) {
					let grad = ctx.createRadialGradient(max, top, 0, max, top, radius);
					color[3] = alpha;
					grad.addColorStop(0, Color.rgba(color));
					if (center != 0.5) {
						color[3] = alpha / 2;
						grad.addColorStop(center, Color.rgba(color));
					}
					color[3] = 0;
					grad.addColorStop(1, Color.rgba(color));
					ctx.fillStyle = grad;
				} else {
					ctx.fillStyle = Color.rgba(color);
				}

				if (shape == 'rect') {
					ctx.fillRect(max - radius / 2 | 0, top - radius / 2, radius, radius);
				} else {
					ctx.beginPath();
					ctx.arc(max, top, radius, 0, TAU, true);
					ctx.closePath();
					ctx.fill();
				}
			}
		}, Vec2(size, size * max));
	}

	static generateSpriteSheet(attributes) {
		attributes = attributes || {};
		let sprite = Particle.generateSpriteAsset(attributes);
		let size = attributes.max * 2;
		return new SpriteSheet({
			size: Vec2(size, size),
			sprites: sprite
		});
	}
};

Particle.defaultSpriteSheet = Particle.generateSpriteSheet();

Entity.createPrefab('particle', {
	transform: null,
	body: {
		mass: 0.1,
		fast: true
	},
	particle: null,
	spriteTween: {
		asset: Particle.defaultSpriteSheet
	}
})

Component.create(Particle, 'particle');
