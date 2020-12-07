import { formatDate, formatDateTime } from '../../utils/date'
import { trimSn } from '../../utils/sn'
import { showModal } from '../../utils/ui'

// miniprogram/pages/add-part/add-part.js
Page({

  data: {
    loading: true,
    readonly: false,
    id: '',
    sn: '',
    remark: '',
    warehousingDate: null,
    warehousingDateText: '',
    showSelectWarehousingDate: false,
    errorMessageSn: '',
    steps: [],
    showRecordSheet: false,
    actions: [
      {
        name: '维修',
        type: 3,
      },
      {
        name: '测试',
        type: 4,
      },
    ],
  },

  async onLoad({ id = '' }) {
    this.setData({
      id,
      readonly: !!id
    })
    this.loadData()
  },

  async loadData() {
    wx.showNavigationBarLoading()
    if (this.data.readonly) {
      const { result } = await wx.cloud.callFunction({
        name: 'part',
        data: {
          type: 'get',
          id: this.data.id
        }
      })
      if (!result) {
        wx.showToast({
          title: '数据不存在',
          duration: 1000,
          mask: true,
        })
        setTimeout(() => wx.redirectTo({ url: '/pages/index/index' }), 1000)
      }
      this.setData({
        ...result,
        warehouseOutAtText: formatDate(result.warehouseOutAt),
        steps: result.logs.map(x => {
          return {
            text: x.title,
            desc: formatDateTime(x.createAt),
          }
        })
      })
      wx.setNavigationBarTitle({ title: this.data.sn })
      this.setWarehousingDate(new Date(result.warehousingDate))
    } else {
      this.setWarehousingDate(new Date())
    }
    this.setData({
      loading: false,
    })
    wx.hideNavigationBarLoading()
  },

  async setWarehousingDate(day) {
    this.setData({
      warehousingDate: day,
      warehousingDateText: formatDate(day),
    })
  },

  async checkField() {
    this.setData({
      errorMessageSn: this.data.sn ? '' : '请输入SN'
    })
    if (!this.data.sn) {
      return false
    }
    return true
  },

  async onRecord() {
    this.setData({
      showRecordSheet: true,
    })
  },

  async onCloseRecrdSheet() {
    this.setData({
      showRecordSheet: false,
    })
  },

  async onSelectRecrdSheet({ detail }) {
    console.log(detail)
  },

  async onSetpTap({ detail }) {
    console.log(this.data.logs[detail])
  },

  async onWarehouseIn() {
    const checked = await this.checkField()
    if (!checked) {
      return;
    }
    const confirm = await showModal('确认入库?')
    if (!confirm) {
      return
    }
    wx.showLoading({
      title: '入库中',
    })
    wx.cloud.callFunction({
      name: 'part',
      data: {
        type: 'warehouseIn',
        data: {
          sn: this.data.sn,
          warehousingDate: this.data.warehousingDate,
          remark: this.data.remark,
        }
      }
    })
    wx.hideLoading()
    wx.showToast({
      title: '入库成功',
      icon: 'success',
      duration: 1000,
      mask: true
    })    
    setTimeout(() => wx.navigateBack({ delta: 0 }), 1000)
  },

  async onWarehouseOut() {
    const confirm = await showModal('确认出库?')
    if (!confirm) {
      return
    }
    wx.showLoading({
      title: '出库中',
    })
    wx.cloud.callFunction({
      name: 'part',
      data: {
        type: 'warehouseOut',
        id: this.data.id,
      }
    })
    wx.hideLoading()
    wx.showToast({
      title: '出库成功',
      icon: 'success',
      duration: 1000,
      mask: true
    })    
    setTimeout(() => wx.redirectTo({ url: '/pages/index/index' }), 1000)
  },

  async onSnChange({ detail }) {
    this.setData({
      sn: trimSn(detail),
    })
    await this.checkField()
  },

  onRemarkChange({ detail }) {
    this.setData({
      remark: detail,
    })
  },

  onSelectWarehousingDate() {
    if (this.data.readonly) {
      return
    }
    this.setData({
      showSelectWarehousingDate: true,
    })
  },

  onSelectWarehousingDateClose() {
    this.setData({
      showSelectWarehousingDate: false,
    })
  },

  onSelectWarehousingDateConfirm({ detail }) {
    this.setWarehousingDate(detail)
    this.setData({
      showSelectWarehousingDate: false,
    })
  },

})