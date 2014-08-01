function setTransform(el, val) {
  el.style.WebkitTransform = el.style.transform = val;
}

function Swiper(containerEl) {
  this._el = containerEl;
  this._pannerEl = containerEl.querySelector('.column-panner');
  this._touchStartX = 0;
  this._touchStartY = 0;
  this._pannerX = 0;
  this._pannerStartX = 0;
  this._activeColumn = 0;
  this._touchEventLog = null;

  var firstTouchMove = true;

  this._onTouchStart = function(event) {
    if (event.touches.length > 1) {
      return;
    }

    // TODO: need to update these on resize and column add
    this._columnWidth = this._el.offsetWidth;
    this._scrollWidth = this._pannerEl.scrollWidth;

    this._touchEventLog = [];
    firstTouchMove = true;
    this._touchStartX = event.touches[0].clientX;
    this._touchStartY = event.touches[0].clientY;
    this._minX = -(this._scrollWidth - this._columnWidth);
    
    this._el.addEventListener('touchmove', this._onTouchMove);
  }.bind(this);

  this._onTouchEnd = function(event) {
    if (event.touches.length > 1 || !this._capturing) {
      return;
    }

    var previousX = this._touchEventLog[0].touches[0].clientX;
    var finalX = this._touchEventLog.slice(-1)[0].touches[0].clientX;
    var vel = (finalX - previousX) / (event.timeStamp - this._touchEventLog[0].timeStamp);
    var columnCount = this._scrollWidth / this._columnWidth;

    if (vel < -1.5 && this._activeColumn != columnCount - 1) { // 1.5 appears to be the magic number
      this.goToColumn(this._activeColumn + 1);
    }
    else if (vel > 1.5 && this._activeColumn !== 0) {
      this.goToColumn(this._activeColumn - 1);
    }
    else {
      this.goToColumn(this._activeColumn);
    }

    this._capturing = false;
    this._el.removeEventListener('touchmove', this._onTouchMove);
  }.bind(this);

  this._onTouchMove = function(event) {
    if (event.touches.length > 1) {
      return;
    }

    if (this._touchEventLog.length == 10) {
      this._touchEventLog.shift();
    }
    this._touchEventLog.push(event);

    if (firstTouchMove) {
      firstTouchMove = false;
      this._onFirstTouchMove(event);
    }
    else {
      this._onCapturedTouchMove(event);
    }
  }.bind(this);
}

var SwiperProto = Swiper.prototype;

SwiperProto.start = function() {
  this._el.style.overflowX = 'hidden';
  this._el.style.scrollLeft = 0;
  setTransform(this._pannerEl, 'translateZ(0)');
  this._el.addEventListener('touchstart', this._onTouchStart);
  this._el.addEventListener('touchend', this._onTouchEnd);
};

SwiperProto.stop = function() {
  this._el.style.overflowX = 'auto';
  setTransform(this._pannerEl, '');
  this._el.removeEventListener('touchstart', this._onTouchStart);
  this._el.removeEventListener('touchend', this._onTouchEnd);
};

SwiperProto._onFirstTouchMove = function(event) {
  var deltaX = event.touches[0].clientX - this._touchStartX;
  var deltaY = event.touches[0].clientY - this._touchStartY;
  var takeOver = (deltaY === 0) || (Math.abs(deltaX / deltaY) > 4);

  if (takeOver) {
    this._capturing = true;
    this._pannerStartX = this._pannerX;
    this._onCapturedTouchMove(event);
  }
  else {
    this._el.removeEventListener('touchmove', this._onTouchMove);
  }
};

SwiperProto._onCapturedTouchMove = function(event) {
  var deltaX = event.touches[0].clientX - this._touchStartX;
  this._pannerX = Math.max(
    Math.min(this._pannerStartX + deltaX, 0),
    this._minX
  );

  setTransform(this._pannerEl, 'translate3d(' + this._pannerX + 'px, 0, 0)');
  event.preventDefault();
};

SwiperProto.goToColumn = function(num) {
  this._activeColumn = num;
  this._pannerX = -(num * this._columnWidth);
  // TODO: animate
  setTransform(this._pannerEl, 'translate3d(' + this._pannerX + 'px, 0, 0)');
};

module.exports = Swiper;