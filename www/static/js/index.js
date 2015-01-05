'use strict';
// 'polyfills'
require('6to5/polyfill');
require('fetch');


const utils = require('./lib/utils');

/**
 * UI
 */

const React = require('react');
const DOM = React.DOM;
const LoginView = require('./component/login');
const ColumnsView = require('./component/columns');
const HeaderView = require('./component/header');
const Swiper = require('./lib/swiper.js');

const RootView = React.createFactory(require('./component/root'));

window.DOM = DOM;

// UI setup
React.initializeTouchEvents(true);

utils.domReady.then(function () {
  React.render(RootView({}), document.querySelector('.content'));
});
