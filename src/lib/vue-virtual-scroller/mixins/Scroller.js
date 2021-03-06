import { ResizeObserver } from 'vue-resize'
import { ObserveVisibility } from 'vue-observe-visibility'
import ScrollParent from 'scrollparent'
import { supportsPassive } from '../utils'

// @vue/component
export default {
  components: {
    ResizeObserver,
  },

  directives: {
    ObserveVisibility,
  },

  props: {
    items: {
      type: Array,
      required: true,
    },

    itemHeight: {
      type: Number,
      default: null,
    },

    minItemHeight: {
      type: [Number, String],
      default: null,
    },

    heightField: {
      type: String,
      default: 'height',
    },

    typeField: {
      type: String,
      default: 'type',
    },

    keyField: {
      type: String,
      default: 'id',
    },

    buffer: {
      type: Number,
      default: 200,
    },

    pageMode: {
      type: Boolean,
      default: false,
    },

    prerender: {
      type: Number,
      default: 0,
    },

    emitUpdate: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    heights () {
      if (this.itemHeight === null) {
        const heights = {
          '-1': { accumulator: 0 },
        }
        const items = this.items
        const field = this.heightField
        const minItemHeight = this.minItemHeight
        let accumulator = 0
        let current
        for (let i = 0, l = items.length; i < l; i++) {
          current = items[i][field] || minItemHeight
          accumulator += current
          heights[i] = { accumulator, height: current }
        }
        return heights
      }
    },
  },

  beforeDestroy () {
    this.removeListeners()
  },

  methods: {
    getListenerTarget () {
      let target = ScrollParent(this.$el)
      // Fix global scroll target for Chrome and Safari
      if (target === window.document.documentElement || target === window.document.body) {
        target = window
      }
      return target
    },

    getScroll () {
      const el = this.$el
      // const wrapper = this.$refs.wrapper

      let scrollState

      if (this.pageMode) {
        const size = el.getBoundingClientRect()
        let top = -size.top
        let height = window.innerHeight
        if (top < 0) {
          height += top
          top = 0
        }
        if (top + height > size.height) {
          height = size.height - top
        }
        scrollState = {
          top,
          bottom: top + height,
        }
      } else {
        scrollState = {
          top: el.scrollTop,
          bottom: el.scrollTop + el.clientHeight,
        }
      }
      // if (!this.$root.$virtual) {
      //   this.$root.$virtual = scrollState;
      // };
      // return this.$root.$virtual
      return scrollState;
    },

    applyPageMode () {
      if (this.pageMode) {
        this.addListeners()
      } else {
        this.removeListeners()
      }
    },

    addListeners () {
      this.listenerTarget = this.getListenerTarget()
      this.listenerTarget.addEventListener('scroll', this.handleScroll, supportsPassive ? {
        passive: true,
      } : false)
      this.listenerTarget.addEventListener('resize', this.handleResize)
    },

    removeListeners () {
      if (!this.listenerTarget) {
        return
      }

      this.listenerTarget.removeEventListener('scroll', this.handleScroll)
      this.listenerTarget.removeEventListener('resize', this.handleResize)

      this.listenerTarget = null
    },

    scrollToItem (index) {
      let scrollTop
      if (this.itemHeight === null) {
        scrollTop = index > 0 ? this.heights[index - 1].accumulator : 0
      } else {
        scrollTop = index * this.itemHeight
      }
      this.scrollToPosition(scrollTop)
    },

    scrollToPosition (position) {
      this.$el.scrollTop = position
    },

    itemsLimitError () {
      setTimeout(() => {
        console.log(`It seems the scroller element isn't scrolling, so it tries to render all the items at once.`, 'Scroller:', this.$el)
        console.log(`Make sure the scroller has a fixed height and 'overflow-y' set to 'auto' so it can scroll correctly and only render the items visible in the scroll viewport.`)
      })
      throw new Error('Rendered items limit reached')
    },
  },
}
