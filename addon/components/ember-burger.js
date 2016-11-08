import Ember from 'ember';
import layout from '../templates/components/ember-burger';
import burgerMenu from 'ember-burger-menu';
import cssStringify from 'ember-burger-menu/utils/css-stringify';

const {
  $,
  on,
  run,
  assert,
  isEmpty,
  observer,
  computed,
  canInvoke
} = Ember;

export default Ember.Component.extend({
  classNames: ['ember-burger-menu'],
  classNameBindings: ['menuId', 'open:is-open', 'translucentOverlay', 'animationClass', 'position'],
  attributeBindings: ['style'],
  layout,

  open: computed.alias('state.open'),
  animation: computed.alias('state.animation'),
  position: computed.alias('state.position'),
  width: computed.alias('state.width'),
  styles: computed.alias('state.styles'),

  translucentOverlay: true,
  dismissOnClick: true,
  dismissOnEsc: true,
  menuId: 'main',

  animationClass: computed('animation', function() {
    return `bm--${this.get('animation')}`;
  }).readOnly(),

  state: computed(function() {
    return burgerMenu(this.get('menuId'));
  }).readOnly(),

  style: computed('state.{styles,open,width,isRight}', function() {
    let state = this.get('state');
    let { styles, open, width, isRight } = state.getProperties(['styles', 'open', 'width', 'isRight']);

    if (canInvoke(styles, 'container')) {
      return cssStringify(styles.container(open, width, isRight));
    }
  }).readOnly(),

  setupEvents: on('didInsertElement', observer('open', function() {
    let method = this.get('open') ? '_setupEvents' : '_teardownEvents';
    this._setupEventsTimer = run.scheduleOnce('afterRender', this, method);
  })),

  init() {
    this._super(...arguments);

    assert('An animation type must be specified.', !isEmpty(this.get('animation')));
    assert('Width must be a number', typeof this.get('width') === 'number');
  },

  willDestroyElement() {
    this._super(...arguments);
    run.cancel(this._setupEventsTimer);
    this._teardownEvents();
  },

  _setupEvents() {
    let postfix = `burger-menu-${this.get('elementId')}`;
    let onClick = this.send.bind(this, 'onClick');
    let onKeyUp =  this.send.bind(this, 'onKeyUp');
    let $body = $('body');

    if (this.get('dismissOnClick')) {
      $body.on(`click.${postfix}`, onClick);
      $body.on(`touchstart.${postfix}`, onClick);
    }

    if (this.get('dismissOnEsc')) {
      $body.on(`keyup.${postfix}`, onKeyUp);
    }
  },

  _teardownEvents() {
    let postfix = `burger-menu-${this.get('elementId')}`;
    let $body = $('body');

    $body.off(`click.${postfix}`);
    $body.off(`touchstart.${postfix}`);
    $body.off(`keyup.${postfix}`);
  },

  actions: {
    onClick(e) {
      if ($(e.target).closest('.bm-menu').length === 0) {
        e.stopPropagation();
        e.preventDefault();

        this.set('open', false);
      }
    },

    onKeyUp(e) {
      if (e.keyCode === 27) {
        this.set('open', false);
      }
    }
  }
});