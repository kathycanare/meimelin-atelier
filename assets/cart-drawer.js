import { DialogComponent } from '@theme/dialog';
import { CartAddEvent } from '@theme/events';

/**
 * A custom element that manages a cart drawer.
 *
 * @extends {DialogComponent}
 */
class CartDrawerComponent extends DialogComponent {
  connectedCallback() {
    super.connectedCallback();
    document.addEventListener(CartAddEvent.eventName, this.#handleCartAdd);
    
    // Initialize terms checkbox functionality
    this.#initTermsCheckbox();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener(CartAddEvent.eventName, this.#handleCartAdd);
    
    // Clean up terms checkbox event listeners
    this.#removeTermsCheckboxListeners();
  }

  #handleCartAdd = () => {
    if (this.hasAttribute('auto-open')) {
      this.showDialog();
    }
  };

  /**
   * Initialize the terms of service checkbox functionality
   */
  #initTermsCheckbox() {
    // Use MutationObserver to handle dynamic content loading
    const observer = new MutationObserver(() => {
      const checkbox = document.getElementById('cart-terms-checkbox');
      const checkoutButton = document.getElementById('checkout');
      
      if (checkbox && checkoutButton && !checkbox.dataset.initialized) {
        this.#setupTermsCheckbox(checkbox, checkoutButton);
        checkbox.dataset.initialized = 'true';
      }
    });

    // Observe the cart drawer for changes
    observer.observe(this, {
      childList: true,
      subtree: true
    });

    // Also try to initialize immediately if elements exist
    this.#setupTermsCheckboxIfExists();
  }

  /**
   * Set up the terms checkbox if elements already exist
   */
  #setupTermsCheckboxIfExists() {
    const checkbox = document.getElementById('cart-terms-checkbox');
    const checkoutButton = document.getElementById('checkout');
    
    if (checkbox && checkoutButton && !checkbox.dataset.initialized) {
      this.#setupTermsCheckbox(checkbox, checkoutButton);
      checkbox.dataset.initialized = 'true';
    }
  }

  /**
   * Set up event listeners for terms checkbox
   */
  #setupTermsCheckbox(checkbox, checkoutButton) {
    const handleCheckboxChange = () => {
      if (checkbox.checked) {
        checkoutButton.removeAttribute('disabled');
        checkoutButton.style.opacity = '1';
        checkoutButton.style.cursor = 'pointer';
      } else {
        checkoutButton.setAttribute('disabled', 'disabled');
        checkoutButton.style.opacity = '0.5';
        checkoutButton.style.cursor = 'not-allowed';
      }
    };

    // Add event listener
    checkbox.addEventListener('change', handleCheckboxChange);
    
    // Store reference for cleanup
    if (!this.termsCheckboxListeners) {
      this.termsCheckboxListeners = [];
    }
    this.termsCheckboxListeners.push({ checkbox, handler: handleCheckboxChange });

    // Set initial state
    handleCheckboxChange();
  }

  /**
   * Remove terms checkbox event listeners
   */
  #removeTermsCheckboxListeners() {
    if (this.termsCheckboxListeners) {
      this.termsCheckboxListeners.forEach(({ checkbox, handler }) => {
        checkbox.removeEventListener('change', handler);
      });
      this.termsCheckboxListeners = [];
    }
  }

  open() {
    this.showDialog();

    // Re-initialize checkbox when drawer opens
    setTimeout(() => {
      this.#setupTermsCheckboxIfExists();
    }, 100);

    /**
     * Close cart drawer when installments CTA is clicked to avoid overlapping dialogs
     */
    customElements.whenDefined('shopify-payment-terms').then(() => {
      const installmentsContent = document.querySelector('shopify-payment-terms')?.shadowRoot;
      const cta = installmentsContent?.querySelector('#shopify-installments-cta');
      cta?.addEventListener('click', this.closeDialog, { once: true });
    });
  }

  close() {
    this.closeDialog();
    
    // Reset checkbox when drawer closes
    const checkbox = document.getElementById('cart-terms-checkbox');
    if (checkbox) {
      checkbox.checked = false;
      checkbox.dispatchEvent(new Event('change'));
    }
  }
}

if (!customElements.get('cart-drawer-component')) {
  customElements.define('cart-drawer-component', CartDrawerComponent);
}