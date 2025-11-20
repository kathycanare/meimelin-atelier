<style>
  .shop-the-look-section {
    position: relative;
    width: 100%;
    overflow: hidden;
  }

  .shop-the-look__container {
    position: relative;
    width: 100%;
    margin: 0 auto;
  }

  .shop-the-look__image-wrapper {
    position: relative;
    width: 100%;
    overflow: hidden;
  }

  .shop-the-look__image {
    width: 100%;
    height: auto;
    display: block;
  }

  .shop-the-look__image--desktop { display: block; }
  .shop-the-look__image--mobile { display: none; }

  @media (max-width: 768px) {
    .shop-the-look__image--desktop { display: none; }
    .shop-the-look__image--mobile { display: block; }
  }

  .shop-the-look__hotspots {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .shop-the-look__hotspot {
    position: absolute;
    pointer-events: all;
    z-index: 10;
    transform: translate(-50%, -50%);
  }

  .shop-the-look__hotspot-button {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.95);
    border: 2px solid rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 14px;
    font-weight: 600;
    color: #000;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }

  .shop-the-look__hotspot-button:hover {
    background: #000;
    color: #fff;
    border-color: #000;
    transform: scale(1.1);
  }

  .shop-the-look__hotspot-button--dot::after {
    content: '';
    width: 8px;
    height: 8px;
    background: #000;
    border-radius: 50%;
  }

  .shop-the-look__hotspot-button:hover.shop-the-look__hotspot-button--dot::after {
    background: #fff;
  }

  @media (max-width: 768px) {
    .shop-the-look__hotspot-button {
      width: 28px;
      height: 28px;
      font-size: 12px;
    }
  }
</style>

<div class="shop-the-look-section" style="padding-top: {{ section.settings.padding_top }}px; padding-bottom: {{ section.settings.padding_bottom }}px;">
  <div class="shop-the-look__container">

    <!-- Main Image -->
    <div class="shop-the-look__image-wrapper"
      style="{% if section.settings.image_height == 'custom' %}height: {{ section.settings.custom_height }}px;{% elsif section.settings.image_height == 'viewport' %}height: {{ section.settings.viewport_height }}vh;{% endif %}"
    >

      {% if section.settings.background_image %}
        <img 
          src="{{ section.settings.background_image | img_url: '2000x' }}"
          class="shop-the-look__image shop-the-look__image--desktop"
          alt="{{ section.settings.background_image.alt | escape }}"
          style="{% if section.settings.image_height != 'auto' %}object-fit: cover; height: 100%;{% endif %}"
        >
      {% endif %}

      {% if section.settings.mobile_background_image %}
        <img 
          src="{{ section.settings.mobile_background_image | img_url: '1000x' }}"
          class="shop-the-look__image shop-the-look__image--mobile"
          alt="{{ section.settings.mobile_background_image.alt | escape }}"
          style="{% if section.settings.image_height != 'auto' %}object-fit: cover; height: 100%;{% endif %}"
        >
      {% endif %}

      <!-- Hotspots -->
      <div class="shop-the-look__hotspots">
        {% for block in section.blocks %}
          {% if block.settings.product %}
            {% assign product = block.settings.product %}

            <div class="shop-the-look__hotspot"
              style="left: {{ block.settings.position_x }}%; top: {{ block.settings.position_y }}%;"
              data-hotspot-id="{{ block.id }}"
              data-hotspot-number="{{ forloop.index }}"
              {{ block.shopify_attributes }}
            >

              <!-- Hotspot button -->
              <button 
                class="shop-the-look__hotspot-button {% if block.settings.hotspot_style == 'dot' %}shop-the-look__hotspot-button--dot{% endif %}"
                aria-label="View {{ product.title }}"
                data-product-url="{{ product.url }}"
              >
                {% unless block.settings.hotspot_style == 'dot' %}
                  {{ forloop.index }}
                {% endunless %}
              </button>

            </div>
          {% endif %}
        {% endfor %}
      </div>

    </div>

  </div>
</div>

<script>
(function() {
  const hotspots = document.querySelectorAll('.shop-the-look__hotspot');

  hotspots.forEach(hotspot => {
    const button = hotspot.querySelector('.shop-the-look__hotspot-button');

    if (!button) return;

    /* TRIGGER QUICK-ADD MODAL ON HOTSPOT CLICK */
    const productUrl = button.getAttribute('data-product-url');
    
    const openQuickAdd = async () => {
      if (!productUrl) return;
      
      const quickAddDialog = document.getElementById('quick-add-dialog');
      if (!quickAddDialog) return;
      
      try {
        // Fetch product page
        const response = await fetch(productUrl);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const productGrid = doc.querySelector('[data-product-grid-content]');
        
        if (productGrid) {
          const modalContent = document.getElementById('quick-add-modal-content');
          if (modalContent) {
            modalContent.innerHTML = productGrid.innerHTML;
          }
          
          // Open the quick-add modal
          if (typeof quickAddDialog.showDialog === 'function') {
            quickAddDialog.showDialog();
          }
        }
      } catch (error) {
        console.error('Failed to load quick-add modal:', error);
      }
    };

    /* MOBILE & DESKTOP = click to open quick-add */
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openQuickAdd();
    });
  });
})();
</script>

{% schema %}
{
  "name": "Shop the Look",
  "tag": "section",
  "class": "shop-the-look",
  "settings": [
    {
      "type": "header",
      "content": "Background Image"
    },
    {
      "type": "image_picker",
      "id": "background_image",
      "label": "Desktop Background Image"
    },
    {
      "type": "image_picker",
      "id": "mobile_background_image",
      "label": "Mobile Background Image (Optional)"
    },
    {
      "type": "select",
      "id": "image_height",
      "label": "Image Height",
      "options": [
        { "value": "auto", "label": "Auto" },
        { "value": "custom", "label": "Custom Height (px)" },
        { "value": "viewport", "label": "Viewport Height (vh)" }
      ],
      "default": "auto"
    },
    {
      "type": "range",
      "id": "custom_height",
      "min": 300,
      "max": 1200,
      "step": 50,
      "label": "Custom Height",
      "unit": "px",
      "default": 600
    },
    {
      "type": "range",
      "id": "viewport_height",
      "min": 30,
      "max": 100,
      "step": 5,
      "label": "Viewport Height",
      "unit": "vh",
      "default": 80
    },
    {
      "type": "header",
      "content": "Mobile Settings"
    },
    {
      "type": "range",
      "id": "mobile_hotspot_scale",
      "min": 50,
      "max": 150,
      "step": 10,
      "unit": "%",
      "label": "Hotspot Size on Mobile",
      "default": 100
    },
    {
      "type": "header",
      "content": "Section Spacing"
    },
    {
      "type": "range",
      "id": "padding_top",
      "label": "Padding Top",
      "unit": "px",
      "min": 0,
      "max": 100,
      "step": 4,
      "default": 36
    },
    {
      "type": "range",
      "id": "padding_bottom",
      "label": "Padding Bottom",
      "unit": "px",
      "min": 0,
      "max": 100,
      "step": 4,
      "default": 36
    }
  ],

  "blocks": [
    {
      "type": "hotspot",
      "name": "Hotspot",
      "limit": 15,
      "settings": [
        {
          "type": "product",
          "id": "product",
          "label": "Product"
        },
        {
          "type": "header",
          "content": "Hotspot Position"
        },
        {
          "type": "range",
          "id": "position_x",
          "label": "Position X",
          "min": 0,
          "max": 100,
          "unit": "%",
          "default": 50
        },
        {
          "type": "range",
          "id": "position_y",
          "label": "Position Y",
          "min": 0,
          "max": 100,
          "unit": "%",
          "default": 50
        },
        {
          "type": "header",
          "content": "Hotspot Style"
        },
        {
          "type": "select",
          "id": "hotspot_style",
          "label": "Style",
          "options": [
            { "value": "number", "label": "Number" },
            { "value": "dot", "label": "Dot" }
          ],
          "default": "number"
        }
      ]
    }
  ],

  "presets": [
    {
      "name": "Shop the Look",
      "blocks": [
        { "type": "hotspot" },
        { "type": "hotspot" }
      ]
    }
  ]
}
{% endschema %}