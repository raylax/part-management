// miniprogram/pages/index.js

import { formatDate } from '../../utils/date'

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

  async fetchData(force = false) {
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
         }
      }
    })
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

  onSeach({ detail }) {
    console.log(detail, this.data.sn)
  },

  onAddPart() {
    wx.navigateTo({
      url: '../add-part/add-part',
    })
  },

})