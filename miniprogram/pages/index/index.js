// miniprogram/pages/index.js

import { formatDate } from '../../utils/date'
import { trimSn } from '../../utils/sn'

Page({

  data: {
    offset: 0,
    limit: 15,
    hasMore: true,
    list: [],
    sn: '',
    formatDate(day) {
      return formatDate(day)
    }
  },

  async onScan() {
    wx.scanCode({
      onlyFromCamera: false,
      success ({ scanType, result }) {
        let [path, qs = ''] = result.split('?')
        if (path !== 'https://s.inurl.org/part.html' || !qs) {
          return
        }
        wx.navigateTo({
          url: '/pages/add-part/add-part?' + qs,
        })
      }
    })
  },

  async onPullDownRefresh() {
    await this.fetchData(true)
    wx.stopPullDownRefresh()
  },
  
  async onReachBottom() {
    if (!this.data.hasMore) {
      return
    }
    this.setData({
      offset: this.data.offset + this.data.limit
    })
    await this.fetchData()
  },
  
  async onShow() {
    await this.fetchData(true)
  },

  async fetchData(force = false, search = false) {
    if (!force && !this.data.hasMore) {
      return
    }
    if (force) {
      this.setData({
        offset: 0,
      })
    }
    wx.showNavigationBarLoading()
    let { result } = await wx.cloud.callFunction({
      name: 'part',
      data: {
        type: 'list',
        data: { 
          offset: this.data.offset,
          limit: this.data.limit,
          sn: this.data.sn,
         }
      }
    })


    if (search && this.data.offset === 0 && result.length == 1) {
      wx.navigateTo({
        url: '/pages/add-part/add-part?id=' + result[0]._id,
      })
    }
    result = result.map(x => {
      return {
        ...x, 
        warehousingDate: formatDate(x.warehousingDate),
        warehouseOutAt: formatDate(x.warehouseOutAt)
      }
    })
    const origin = this.data.offset === 0 ? [] : this.data.list
    this.setData({
      list: [...origin, ...result],
      hasMore: result.length === this.data.limit,
    })
    wx.hideNavigationBarLoading()
  },

  async onSnChange({ detail }) {
    this.setData({
      sn: trimSn(detail)
    })
  },

  async onSnSearch({ detail }) {
    await this.fetchData(true, true)
  },

  async onSnClear() {
    this.setData({
      sn: ''
    })
    await this.fetchData(true)
  },

  onAddPart() {
    wx.navigateTo({
      url: '/pages/add-part/add-part',
    })
  },

})