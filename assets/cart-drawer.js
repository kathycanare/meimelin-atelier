import { DialogComponent } from '@theme/dialog';
import { CartAddEvent } from '@theme/events';

class CartDrawerComponent extends DialogComponent {
  connectedCallback() {
    super.connectedCallback();
    document.addEventListener(CartAddEvent.eventName, this.#handleCartAdd);
    this.#initTermsCheckbox();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener(CartAddEvent.eventName, this.#handleCartAdd);
    this.#removeTermsCheckboxListeners();
  }

  #handleCartAdd = () => {
    if (this.hasAttribute('auto-open')) {
      this.showDialog();
    }
  };

  #initTermsCheckbox() {
    const observer = new MutationObserver(() => {
      const checkbox = document.getElementById('cart-terms-checkbox');
      const checkoutButton = document.getElementById('checkout');
      
      if (checkbox && checkoutButton && !checkbox.dataset.initialized) {
        this.#setupTermsCheckbox(checkbox, checkoutButton);
        checkbox.dataset.initialized = 'true';
      }
    });

    observer.observe(this, {
      childList: true,
      subtree: true
    });

    this.#setupTermsCheckboxIfExists();
  }

  #setupTermsCheckboxIfExists() {
    const checkbox = document.getElementById('cart-terms-checkbox');
    const checkoutButton = document.getElementById('checkout');
    
    if (checkbox && checkoutButton && !checkbox.dataset.initialized) {
      this.#setupTermsCheckbox(checkbox, checkoutButton);
      checkbox.dataset.initialized = 'true';
    }
  }

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

    checkbox.addEventListener('change', handleCheckboxChange);
    
    if (!this.termsCheckboxListeners) {
      this.termsCheckboxListeners = [];
    }
    this.termsCheckboxListeners.push({ checkbox, handler: handleCheckboxChange });

    handleCheckboxChange();
  }

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

    setTimeout(() => {
      this.#setupTermsCheckboxIfExists();
    }, 100);

    customElements.whenDefined('shopify-payment-terms').then(() => {
      const installmentsContent = document.querySelector('shopify-payment-terms')?.shadowRoot;
      const cta = installmentsContent?.querySelector('#shopify-installments-cta');
      cta?.addEventListener('click', this.closeDialog, { once: true });
    });
  }

  close() {
    this.closeDialog();
    
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