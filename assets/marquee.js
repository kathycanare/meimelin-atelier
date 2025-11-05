import { Component } from '@theme/component';
import { debounce } from '@theme/utilities';

const ANIMATION_OPTIONS = {
  duration: 500,
};

/**
 * A custom element that displays a marquee.
 *
 * @typedef {object} Refs
 * @property {HTMLElement} wrapper - The wrapper element.
 * @property {HTMLElement} content - The content element.
 * @property {HTMLElement[]} marqueeItems - The marquee items collection.
 *
 * @extends Component<Refs>
 */
class MarqueeComponent extends Component {
  requiredRefs = ['wrapper', 'content', 'marqueeItems'];
  
  // Store the original first item to prevent it from being removed
  #originalItem = null;
  #isInitialized = false;

  connectedCallback() {
    super.connectedCallback();

    const { marqueeItems } = this.refs;
    if (marqueeItems.length === 0) return;

    // Store the original item before any cloning
    this.#originalItem = marqueeItems[0];

    // Wait for next frame to ensure elements are rendered
    requestAnimationFrame(() => {
      // Double-check dimensions are available
      if (this.offsetWidth === 0 || !marqueeItems[0]?.offsetWidth) {
        // Retry after a short delay
        setTimeout(() => this.#initialize(), 100);
      } else {
        this.#initialize();
      }
    });
  }

  #initialize() {
    if (this.#isInitialized) return;
    
    const { marqueeItems } = this.refs;
    
    // Final safety check
    if (marqueeItems.length === 0 || this.offsetWidth === 0) {
      console.warn('Marquee: Unable to initialize - no dimensions available');
      return;
    }

    this.#addRepeatedItems();
    this.#duplicateContent();
    this.#setSpeed();
    this.#isInitialized = true;

    window.addEventListener('resize', this.#handleResize);
    this.addEventListener('pointerenter', this.#slowDown);
    this.addEventListener('pointerleave', this.#speedUp);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('resize', this.#handleResize);
    this.removeEventListener('pointerenter', this.#slowDown);
    this.removeEventListener('pointerleave', this.#speedUp);
    this.#isInitialized = false;
  }

  /**
   * @type {{ cancel: () => void, current: number } | null}
   */
  #animation = null;

  #slowDown = debounce(() => {
    if (this.#animation) return;

    const animations = this.refs.wrapper.getAnimations?.();
    const animation = animations?.[0];

    if (!animation) return;

    this.#animation = animateValue({
      ...ANIMATION_OPTIONS,
      from: 1,
      to: 0,
      onUpdate: (value) => animation.updatePlaybackRate(value),
      onComplete: () => {
        this.#animation = null;
      },
    });
  }, ANIMATION_OPTIONS.duration);

  #speedUp() {
    this.#slowDown.cancel();

    const animations = this.refs.wrapper.getAnimations?.();
    const animation = animations?.[0];

    if (!animation || animation.playbackRate === 1) return;

    const from = this.#animation?.current ?? 0;
    this.#animation?.cancel();

    this.#animation = animateValue({
      ...ANIMATION_OPTIONS,
      from,
      to: 1,
      onUpdate: (value) => animation.updatePlaybackRate(value),
      onComplete: () => {
        this.#animation = null;
      },
    });
  }

  get clonedContent() {
    const { content, wrapper } = this.refs;
    const lastChild = wrapper.lastElementChild;

    return content !== lastChild ? lastChild : null;
  }

  #setSpeed(value = this.#calculateSpeed()) {
    this.style.setProperty('--marquee-speed', `${value}s`);
  }

  #calculateSpeed() {
    const speedFactor = Number(this.getAttribute('data-speed-factor')) || 25;
    const { marqueeItems } = this.refs;
    const marqueeWidth = this.offsetWidth;

    if (marqueeWidth === 0) {
      return 20; // Return sensible default
    }

    const marqueeRepeatedItemWidth = marqueeItems[0]?.offsetWidth ?? 0;
    
    if (marqueeRepeatedItemWidth === 0) {
      return 20; // Return sensible default
    }

    const count = Math.max(1, Math.ceil(marqueeWidth / marqueeRepeatedItemWidth));
    const speed = Math.sqrt(count) * speedFactor;
    
    return Math.max(5, speed); // Ensure minimum speed
  }

  #handleResize = debounce(() => {
    try {
      const { content } = this.refs;
      
      // Skip if no dimensions
      if (this.offsetWidth === 0 || !this.#originalItem?.offsetWidth) {
        return;
      }

      // Clear all cloned items but keep the original
      const children = Array.from(content.children);
      children.forEach((child, index) => {
        // Keep only the first (original) item
        if (index > 0) {
          child.remove();
        }
      });

      // Recalculate and add new items based on current width
      this.#addRepeatedItems();
      this.#duplicateContent();
      this.#setSpeed();
      this.#restartAnimation();
    } catch (error) {
      console.error('Marquee resize error:', error);
    }
  }, 250);

  #restartAnimation() {
    const animations = this.refs.wrapper.getAnimations?.();

    if (!animations || animations.length === 0) return;

    requestAnimationFrame(() => {
      for (const animation of animations) {
        animation.currentTime = 0;
      }
    });
  }

  #duplicateContent() {
    this.clonedContent?.remove();

    const clone = /** @type {HTMLElement} */ (this.refs.content.cloneNode(true));

    clone.setAttribute('aria-hidden', 'true');
    clone.removeAttribute('ref');

    this.refs.wrapper.appendChild(clone);
  }

  #addRepeatedItems(numberOfCopies = this.#calculateNumberOfCopies()) {
    const { content } = this.refs;

    if (!this.#originalItem) return;

    // Only clone from the original item, not from already cloned items
    for (let i = 0; i < numberOfCopies - 1; i++) {
      const clone = this.#originalItem.cloneNode(true);
      // Remove ref attribute from clones to avoid conflicts
      clone.removeAttribute('ref');
      content.appendChild(clone);
    }
  }

  #calculateNumberOfCopies() {
    const marqueeWidth = this.offsetWidth;
    const marqueeRepeatedItemWidth = this.#originalItem?.offsetWidth ?? 1;

    if (marqueeRepeatedItemWidth === 0 || marqueeWidth === 0) {
      return 1;
    }

    return Math.max(1, Math.ceil(marqueeWidth / marqueeRepeatedItemWidth));
  }
}

// Define the animateValue function
/**
 * Animate a numeric property smoothly.
 * @param {Object} params - The parameters for the animation.
 * @param {number} params.from - The starting value.
 * @param {number} params.to - The ending value.
 * @param {number} params.duration - The duration of the animation in milliseconds.
 * @param {function(number): void} params.onUpdate - The function to call on each update.
 * @param {function(number): number} [params.easing] - The easing function.
 * @param {function(): void} [params.onComplete] - The function to call when the animation completes.
 */
function animateValue({ from, to, duration, onUpdate, easing = (t) => t * t * (3 - 2 * t), onComplete }) {
  const startTime = performance.now();
  let cancelled = false;
  let currentValue = from;

  /**
   * @param {number} currentTime - The current time in milliseconds.
   */
  function animate(currentTime) {
    if (cancelled) return;

    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easing(progress);
    currentValue = from + (to - from) * easedProgress;

    onUpdate(currentValue);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else if (typeof onComplete === 'function') {
      onComplete();
    }
  }

  requestAnimationFrame(animate);

  return {
    get current() {
      return currentValue;
    },
    cancel() {
      cancelled = true;
    },
  };
}

if (!customElements.get('marquee-component')) {
  customElements.define('marquee-component', MarqueeComponent);
}