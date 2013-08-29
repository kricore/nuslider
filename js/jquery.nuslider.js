/**
 * @version		$Id: jquery.nuslider.js 3003 2013-05-17 12:03:54Z lefteris.kavadas $
 * @author		Nuevvo - http://nuevvo.com
 * @copyright	Copyright (c) 2010 - 2013 Nuevvo Webware Ltd. All rights reserved.
 * @license		http://nuevvo.com/license
 */

var $nuSlider = jQuery.noConflict();
(function($) {
	$.nuSlider = function(element, options) {
		var plugin = this;
		var $element = $(element);
		plugin.init = function(options) {
			plugin.settings = $.extend({
				step : 1,
				viewport : 1,
				transitionTime : 1000,
				interval : 0,
				minItemWidth : 0,
				aspectRatio : false,
				scrollbar : false,
				orientation : 'vertical',
				itemsWrapperClass : '.itemsWrapper',
				itemsContainerClass : '.items',
				itemClass : '.item',
				scrollbarClass : '.scrollbar',
				scrollbarHandlerClass : '.handler',
				scrollbarProgressClass : '.progress',
				navigationScrolling : false,
				navigationStep : 3,
				navigationItemWidth : 100
			}, options);
			plugin.settings.InitViewport = plugin.settings.viewport;
			plugin.settings.InitStep = plugin.settings.step;
			plugin.items = $element.find(plugin.settings.itemClass);
			plugin.itemsContainer = $element.find(plugin.settings.itemsContainerClass);
			plugin.itemsWrapper = $element.find(plugin.settings.itemsWrapperClass);
			plugin.nextButton = $element.find('.nextButton');
			plugin.previousButton = $element.find('.previousButton');
			plugin.navWrapper = $element.find('.navigationWrapper');
			plugin.nav = $element.find('.navigation');
			plugin.navNextButton = $element.find('.navigationNextButton');
			plugin.navPreviousButton = $element.find('.navigationPreviousButton');
			plugin.navigationButtons = $element.find('.navigationButton');
			plugin.scrollbar = $element.find(plugin.settings.scrollbarClass);
			plugin.scrollbarHandler = plugin.scrollbar.find(plugin.settings.scrollbarHandlerClass);
			plugin.scrollbarProgress = plugin.scrollbar.find(plugin.settings.scrollbarProgressClass);
			plugin.index = 0;
			plugin.applyStyles();
			plugin.addEvents();
			if (plugin.settings.scrollbar) {
				plugin.settings.interval = false;
				plugin.settings.viewport = parseInt(plugin.itemsWrapper.width() / $(plugin.items[0]).width());
			}
			if (plugin.settings.interval) {
				plugin.loop = setInterval(function() {
					plugin.setNextItem();
					plugin.navigate(plugin.index);
				}, plugin.settings.interval);
			}
		}, plugin.applyStyles = function() {
			plugin.itemsWrapper.css('position', 'relative');
			plugin.itemsWrapper.css('overflow', 'hidden');
			if (plugin.settings.aspectRatio) {
				var numbers = plugin.settings.aspectRatio.split('/');
				plugin.itemsWrapper.css('padding-bottom', 100 * (numbers[1] / numbers[0]) + '%');
			}
			plugin.itemsContainer.css('position', 'absolute');
			plugin.itemsContainer.css('display', 'block');
			if (plugin.settings.orientation == 'horizontal') {
				plugin.itemWidth = plugin.itemsWrapper.width() / plugin.settings.viewport;
				if (plugin.settings.minItemWidth) {
					// Reinitialize the step and viewport variables in case they have been modified by our script for responsive reasons
					plugin.settings.viewport = plugin.settings.InitViewport;
					plugin.settings.step = plugin.settings.InitStep;

					plugin.itemWidth = plugin.itemsWrapper.width() / plugin.settings.viewport;
					while (plugin.itemWidth < plugin.settings.minItemWidth) {
						if (plugin.settings.viewport === 1) {
							break;
						}
						plugin.settings.viewport--;
						plugin.settings.step = plugin.settings.viewport;
						plugin.itemWidth = plugin.itemsWrapper.width() / plugin.settings.viewport;
					}

					// Fix hidden instances
					if (plugin.itemWidth === 0) {
						plugin.itemWidth = plugin.settings.minItemWidth;
					}
				}

				plugin.items.each(function(index) {
					$(this).css({
						'width' : plugin.itemWidth + 'px',
						'position' : 'absolute',
						'top' : '0',
						'left' : index * plugin.itemWidth + 'px',
						'overflow' : 'hidden'
					});
				});
				plugin.itemsContainer.css({
					'width' : plugin.items.length * plugin.itemWidth + 'px'
				});
			} else {
				plugin.itemsWrapperHeight = plugin.itemsWrapper.height() / plugin.settings.viewport;
				plugin.items.each(function(index) {
					$(this).css({
						'width' : plugin.itemsWrapper.width(),
						'height' : plugin.itemsWrapperHeight + 'px',
						'position' : 'absolute',
						'left' : '0',
						'top' : index * plugin.itemsWrapperHeight + 'px',
						'overflow' : 'hidden'
					});
				});
				plugin.itemsContainer.css({
					'height' : plugin.items.length * plugin.itemsWrapperHeight + 'px'
				});
			}
			if (plugin.settings.scrollbar) {
				plugin.nextButton.css('display', 'none');
				plugin.previousButton.css('display', 'none');
				plugin.navigationButtons.parents('ul:first').css('display', 'none');
				plugin.scrollbar.css('position', 'relative');
				plugin.scrollbarHandler.css('position', 'absolute');
			} else {
				plugin.scrollbar.css('display', 'none');
				plugin.navigationButtons.parents('ul:first').css('display', 'block');
				plugin.navigationButtons.each(function(index) {
					$(this).parent().css({
						'display' : 'inline-block'
					});
					if (index > 0 && (index) % plugin.settings.step !== 0) {
						$(this).parent().css({
							'display' : 'none'
						});
					}
				});
			}

			if (plugin.settings.navigationScrolling) {
				plugin.navWrapper.css('position', 'relative');
				plugin.navWrapper.css('overflow', 'hidden');
				plugin.nav.css('position', 'absolute');
				plugin.nav.css('padding', '0');
				plugin.nav.css('margin', '0');
				plugin.nav.css('width', plugin.navigationButtons.length * plugin.settings.navigationItemWidth + 'px');
			}

		}, plugin.addEvents = function() {

			plugin.nextButton.click(function(event) {
				event.preventDefault();
				plugin.setNextItem();
				plugin.navigate(plugin.index);
			});
			plugin.previousButton.click(function(event) {
				event.preventDefault();
				plugin.setPreviousItem();
				plugin.navigate(plugin.index);
			});
			plugin.navigationButtons.click(function(event) {
				event.preventDefault();
				plugin.index = plugin.navigationButtons.index($(this));
				plugin.navigate(plugin.index);
			});
			var items = plugin.items.hammer();
			items.on('swipeleft', function(event) {
				event.preventDefault();
				plugin.setNextItem();
				plugin.navigate(plugin.index);
				plugin.moveScrollbar();
			}).on('swiperight', function(event) {
				event.preventDefault();
				plugin.setPreviousItem();
				plugin.navigate(plugin.index);
				plugin.moveScrollbar();
			});
			var resizeTimer;
			$(window).resize(function() {
				clearTimeout(resizeTimer);
				resizeTimer = setTimeout(function() {
					var currentWidth = plugin.itemsWrapper.width();
					if (plugin.settings.orientation == 'horizontal') {
						currentWidth = currentWidth / plugin.settings.viewport;
					}
					if (plugin.itemWidth !== currentWidth) {
						plugin.applyStyles();
					}
				}, 100);
			});
			if (plugin.settings.scrollbar) {

				plugin.scrollbarHandler.css('left', '0');

				var handler = plugin.scrollbarHandler.hammer({
					drag_block_horizontal : true
				});

				handler.on('dragstart', function() {
					$(this).data('nuOffset', parseInt($(this).css('left')));
				});

				handler.on('drag', function(e) {
					var range = plugin.scrollbar.outerWidth() - $(this).outerWidth();
					var nuOffset = $(this).data('nuOffset');
					var offset = nuOffset + e.gesture.deltaX;
					if (offset < 0) {
						offset = 0;
					}
					if (offset > range) {
						offset = range;
					}
					plugin.scrollbarHandler.css({
						left : offset
					});
					plugin.scrollbarProgress.css('width', offset);
					var percentage = offset / range;
					var viewportRange = plugin.itemsContainer.outerWidth() - (plugin.itemWidth * plugin.settings.viewport);
					plugin.itemsContainer.css('left', -viewportRange * percentage);

				});

			}

			if (plugin.settings.navigationScrolling) {
				plugin.navNextButton.click(function(event) {
					plugin.nav.stop(true, true);
					event.preventDefault();
					var width = plugin.nav.width();
					var increment = plugin.settings.navigationItemWidth * plugin.settings.navigationStep;
					var offset = Math.abs(plugin.nav.position().left - increment);
					if (width >= offset) {
						plugin.nav.animate({
							left : '-=' + increment + 'px'
						});
					}
				});
				plugin.navPreviousButton.click(function(event) {
					plugin.nav.stop(true, true);
					event.preventDefault();
					var increment = plugin.settings.navigationItemWidth * plugin.settings.navigationStep;
					var offset = plugin.nav.position().left + increment;
					if (offset <= 0) {
						plugin.nav.animate({
							left : '+=' + increment + 'px'
						});
					}
				});
			}

		}, plugin.navigate = function(index) {
			if ( typeof (plugin.loop) != 'undefined') {
				clearInterval(plugin.loop);
			}
			plugin.itemsContainer.stop(true, false);
			plugin.navigationButtons.removeClass('navigationButtonActive');
			$(plugin.navigationButtons[plugin.index]).addClass('navigationButtonActive');
			$element.addClass('nuSliderAnimating');
			var position = $(plugin.items[plugin.index]).position();
			plugin.itemsContainer.animate({
				'top' : -position.top,
				'left' : -position.left
			}, plugin.settings.transitionTime, function() {
				$element.removeClass('nuSliderAnimating');
			});
			if (plugin.settings.interval) {
				plugin.loop = setInterval(function() {
					plugin.setNextItem();
					plugin.navigate(plugin.index);
				}, plugin.settings.interval);
			}
		}, plugin.setNextItem = function() {
			if (plugin.index < (plugin.items.length - plugin.settings.step)) {
				plugin.index += plugin.settings.step;
				if (plugin.items.length < plugin.index + plugin.settings.step) {
					plugin.index = plugin.items.length - plugin.settings.step;
				}
			} else {
				plugin.index = 0;
			}
		}, plugin.setPreviousItem = function() {
			if (plugin.index > 0) {
				plugin.index -= plugin.settings.step;
			} else {
				plugin.index = plugin.items.length - plugin.settings.step;
			}
			if (plugin.index < 0) {
				plugin.index = 0;
			}
		}, plugin.moveScrollbar = function() {
			if (plugin.settings.scrollbar) {
				var percentage = plugin.index / (plugin.items.length - plugin.settings.step);
				var range = plugin.scrollbar.outerWidth() - plugin.scrollbarHandler.outerWidth();
				var offset = range * percentage;
				plugin.scrollbarProgress.css('width', offset);
				plugin.scrollbarHandler.css('left', offset);
			}
		}
		plugin.init(options);
	}
	$.fn.nuSlider = function(options) {
		return this.each(function() {
			if (undefined == $(this).data('nuSlider')) {
				var plugin = new $.nuSlider(this, options);
				$(this).data('nuSlider', plugin);
			}
		});
	}
})(jQuery);
