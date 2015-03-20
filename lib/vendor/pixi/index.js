import Component from '../../core/component'
import Context from '../../core/context'
import Registry from '../../core/registry'
import Color from '../../math/color'

export class PixiSprite extends Component {
	constructor() {
		Component.call(this);
		this.container = null;
		this.sprite = new PIXI.Sprite();
	}

	create() {
		this.container = Context.components.pixiSpriteSystem.camera;
	}

	free() {
		this.container.removeChild(this.sprite);
	}
}

Component.create(PixiSprite, 'pixiSprite');

export class PixiSpriteSystem extends Component {
	create() {
		PIXI.dontSayHello = true;
		let renderer = Context.renderer;
		this.stage = new PIXI.Stage(0xFFFFFF); // Color.toHex(renderer.color)
		this.camera = new PIXI.DisplayObjectContainer();
		this.stage.addChild(this.camera);
		this.renderer = new PIXI.WebGLRenderer(
			renderer.content[0],
			renderer.content[1],
			{
				view: renderer.canvas,
				resolution: renderer.ratio
			}
		);
		this.renderer.resize(
			renderer.content[0],
			renderer.content[1]
		);
	}

	onSpriteTweenCreate(event) {
		event.entity.createComponent('pixiSprite');
	}

	onSpriteTweenDestroy(event) {
		event.entity.components.pixiSprite.destroy();
	}

	render() {
		let pixiSprites = Registry.types.pixiSprite.instances;
		let added = false;
		for (let i = 0, l = pixiSprites.length; i < l; i++) {
			let pixiSprite = pixiSprites[i];
			if (!pixiSprite.enabled) {
				continue;
			}
			let tween = pixiSprite.components.spriteTween;
			let sprite = pixiSprite.sprite;
			if (tween != null) {
				if (!tween.enabled) {
					continue;
				}
				let asset = tween.asset;
				if (!asset.ready) {
					if (!asset.prepare()) {
						continue;
					}
					if (asset.frames != null) {
						let frames = asset.frames;
						for (let j = 0, k = frames.length; j < k; j++) {
							let frame = frames[j];
							frame.pixiTexture = new PIXI.Texture.fromCanvas(
								frame.sprite.buffer,
								PIXI.scaleModes.NEAREST
							);
							let {size, position} = frame;
							frame.pixiTexture.setFrame(new PIXI.Rectangle(
								position[0] | 0,
								position[1] | 0,
								size[0] | 0,
								size[1] | 0
							));
						}
					}
				}

				if (asset.frames != null) {
					let frame = asset.frames[tween.frame];
					if (sprite.texture != frame.pixiTexture) {
						Vec2.toObj(frame.anchor, sprite.anchor);
						sprite.setTexture(frame.pixiTexture);
					}
				} else if (sprite.texture != null) {
					sprite.setTexture(new PIXI.Texture.fromCanvas(
						asset.buffer,
						PIXI.scaleModes.NEAREST
					));
					Vec2.toObj(asset.defaultAnchor, sprite.anchor);
				}
			}
			if (!sprite.stage) {
				if (!sprite.texture) {
					throw new Error('PIXI.Sprite without texture');
				}
				this.camera.addChild(sprite);
				added = true;
			}
			let transform = pixiSprite.components.transform;
			Vec2.toObj(transform.position, sprite.position);
			sprite.rotation = transform.rotation;
			sprite.alpha = transform.alpha;
		}
		// if (added) {
		// 	debugger;
		// 	// this.stage.children.sort(depthCompare);
		// }
		Vec2.toObj(this.renderer.projection, Context.renderer.position);
		this.renderer.render(this.stage);
	}
};

// function depthCompare(a, b) {
// 	if (a.layer < b.layer) {
// 		return -1;
// 	}
// 	if (a.layer > b.layer) {
// 		return 1;
// 	}
// 	return 0;
// }

Component.create(PixiSpriteSystem, 'pixiSpriteSystem');
