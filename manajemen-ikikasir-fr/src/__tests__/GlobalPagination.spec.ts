// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import GlobalPagination from '../components/common/GlobalPagination.vue'

describe('GlobalPagination', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('keeps the scroll position when changing pages', async () => {
    const scrollContainer = document.createElement('div')
    scrollContainer.style.overflowY = 'auto'
    Object.defineProperties(scrollContainer, {
      clientHeight: { configurable: true, value: 100 },
      scrollHeight: { configurable: true, value: 600 },
    })
    document.body.appendChild(scrollContainer)

    const wrapper = mount(GlobalPagination, {
      attachTo: scrollContainer,
      props: {
        currentPage: 1,
        totalItems: 20,
        pageSize: 10,
      },
    })

    scrollContainer.scrollTop = 320
    scrollContainer.addEventListener('click', () => {
      scrollContainer.scrollTop = 0
    })
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0)
      return 1
    })

    const buttons = wrapper.findAll('button')
    const nextButton = buttons[buttons.length - 1]
    expect(nextButton).toBeDefined()
    if (!nextButton) throw new Error('Tombol halaman berikutnya tidak ditemukan.')
    await nextButton.trigger('click')
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(wrapper.emitted('update:currentPage')).toEqual([[2]])
    expect(scrollContainer.scrollTop).toBe(320)

    wrapper.unmount()
    scrollContainer.remove()
  })

  it('uses non-submit buttons for pagination controls', () => {
    const wrapper = mount(GlobalPagination, {
      props: {
        currentPage: 1,
        totalItems: 20,
        pageSize: 10,
      },
    })

    expect(wrapper.findAll('button').every((button) => button.attributes('type') === 'button')).toBe(true)
    wrapper.unmount()
  })
})
