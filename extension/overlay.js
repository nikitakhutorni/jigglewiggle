import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';

const POINTER_SIZE = 32;
const POINTER_HOTSPOT_X = 5;
const POINTER_HOTSPOT_Y = 3;
const RENDER_SCALE = 4;
const RENDER_SIZE = POINTER_SIZE * RENDER_SCALE;
const RENDER_HOTSPOT_X = POINTER_HOTSPOT_X * RENDER_SCALE;
const RENDER_HOTSPOT_Y = POINTER_HOTSPOT_Y * RENDER_SCALE;
const MIN_SCALE = 1 / RENDER_SCALE;
const DEFAULT_MIN_VISIBLE_MS = 250;

export class CursorOverlay {
    constructor(extensionPath = null, onHidden = null) {
        this.actor = new St.Widget({
            style_class: 'jigglewiggle-overlay',
            reactive: false,
            visible: false,
            opacity: 0,
            width: RENDER_SIZE,
            height: RENDER_SIZE,
            layout_manager: new Clutter.BinLayout(),
        });

        this.actor.set_pivot_point(
            RENDER_HOTSPOT_X / RENDER_SIZE,
            RENDER_HOTSPOT_Y / RENDER_SIZE);

        this._pointer = new St.Icon({
            style_class: 'jigglewiggle-pointer',
            gicon: loadPointerIcon(extensionPath),
            x_align: Clutter.ActorAlign.START,
            y_align: Clutter.ActorAlign.START,
        });

        this.actor.add_child(this._pointer);

        this._visible = false;
        this._config = null;
        this._hideTimeoutId = 0;
        this._shownAtMs = -Infinity;
        this._onHidden = onHidden;
    }

    configure(config) {
        this._config = config;
        this._pointer.visible = true;
        this._pointer.set_style([
            `icon-size: ${RENDER_SIZE}px;`,
        ].join(' '));
    }

    showAt(x, y, config) {
        this.configure(config);
        this._visible = true;
        this._moveActor(x, y);
        this._clearHideTimeout();
        this._shownAtMs = GLib.get_monotonic_time() / 1000;

        this.actor.remove_all_transitions();
        this.actor.visible = true;
        this.actor.opacity = Math.round(255 * config.pointerOpacity);

        if (config.reduceMotion) {
            const targetScale = this._toActorScale(config.maxScale);
            this.actor.scale_x = targetScale;
            this.actor.scale_y = targetScale;
            return;
        }

        const targetScale = this._toActorScale(config.maxScale);
        this.actor.scale_x = MIN_SCALE;
        this.actor.scale_y = MIN_SCALE;
        this.actor.ease({
            scaleX: targetScale,
            scaleY: targetScale,
            duration: config.growthSpeedMs,
            mode: Clutter.AnimationMode.EASE_OUT_QUAD,
        });
    }

    moveTo(x, y) {
        if (!this._visible)
            return;

        this._moveActor(x, y);
    }

    hideAt(x, y, config = this._config) {
        if (!this._visible || !config)
            return;

        this._visible = false;
        this._moveActor(x, y);
        this.actor.remove_all_transitions();
        this._clearHideTimeout();

        if (config.reduceMotion) {
            this.hideImmediate();
            return;
        }

        const elapsedMs = Math.max(
            GLib.get_monotonic_time() / 1000 - this._shownAtMs,
            0);
        const minimumVisibleMs = config.minimumVisibleMs ?? DEFAULT_MIN_VISIBLE_MS;
        const holdMs = Math.max(
            config.peakHoldMs ?? 0,
            minimumVisibleMs - elapsedMs,
            0);
        if (holdMs > 0) {
            const targetScale = this._toActorScale(config.maxScale);
            this.actor.scale_x = targetScale;
            this.actor.scale_y = targetScale;
            this.actor.opacity = Math.round(255 * config.pointerOpacity);
            this._hideTimeoutId = GLib.timeout_add(
                GLib.PRIORITY_DEFAULT,
                holdMs,
                () => {
                    this._hideTimeoutId = 0;
                    this._shrink(config);
                    return GLib.SOURCE_REMOVE;
                });
            return;
        }

        this._shrink(config);
    }

    _shrink(config) {
        this.actor.remove_all_transitions();
        this.actor.ease({
            opacity: 0,
            scaleX: MIN_SCALE,
            scaleY: MIN_SCALE,
            duration: config.shrinkSpeedMs,
            mode: Clutter.AnimationMode.EASE_IN_OUT_QUAD,
            onComplete: () => {
                if (!this._visible) {
                    this.actor.hide();
                    this._notifyHidden();
                }
            },
        });
    }

    hideImmediate() {
        this._visible = false;
        this._clearHideTimeout();
        this.actor.remove_all_transitions();
        this.actor.opacity = 0;
        this.actor.scale_x = MIN_SCALE;
        this.actor.scale_y = MIN_SCALE;
        this.actor.hide();
        this._notifyHidden();
    }

    destroy() {
        this.hideImmediate();
        this.actor.destroy();
    }

    _moveActor(x, y) {
        this.actor.set_position(
            Math.round(x - RENDER_HOTSPOT_X),
            Math.round(y - RENDER_HOTSPOT_Y));
    }

    _clearHideTimeout() {
        if (!this._hideTimeoutId)
            return;

        GLib.Source.remove(this._hideTimeoutId);
        this._hideTimeoutId = 0;
    }

    _toActorScale(pointerScale) {
        return Math.min(Math.max(pointerScale / RENDER_SCALE, MIN_SCALE), 1);
    }

    _notifyHidden() {
        this._onHidden?.();
    }
}

function loadPointerIcon(extensionPath) {
    if (!extensionPath)
        return null;

    return Gio.icon_new_for_string(
        GLib.build_filenamev([extensionPath, 'assets', 'pointer.svg']));
}
