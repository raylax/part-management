import { formatDate, formatDateTime } from '../../utils/date'
import { trimSn } from '../../utils/sn'
import { confirm, alert } from '../../utils/ui'
import drawQrcode from '../../utils/weapp.qrcode.esm'

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
    showWarehouseOutRemark: false,
    warehouseOutRemark: '',
    showQrcode: false,
    qrcodeUrl: '',
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
    showRepairRemark: false,
    repairRemark: '',
    showTest: false,
    testPassed: true,
    testNo: '',
    testTime: '',
    testMileage: '',
    testTemperature: '',
    testRemark: '',
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
      this.drawQrcode('qrcode')
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
          let text = `【${x.title}】`
          switch (x.type) {
            case 2:
            case 3:
              text += x.remark || ''
              break
            case 4:
              let texts = [`[${x.passed ? "通过" : "失败"}]`]
              console.log(x)
              if (x.no) texts = [...texts, `序号:${x.no}`] 
              if (x.time) texts = [...texts, `时间:${x.time}`]
              if (x.mileage) texts = [...texts, `里程:${x.mileage}`]
              if (x.temperature) texts = [...texts, `温度:${x.temperature}`]
              if (x.remark) texts = [...texts, `备注:${x.remark}`]
              text += texts.join(' ')
              break
          }
          return {
            text,
            desc: formatDateTime(x.createAt),
          }
        }).reverse()
      })
      const title = (result.status === 'WAREHOUSE_OUT' ? '【已出库】' : '【维修中】')
      wx.setNavigationBarTitle({ title })
      this.setWarehousingDate(new Date(result.warehousingDate))
    } else {
      this.setWarehousingDate(new Date())
    }
    this.setData({
      loading: false,
    })
    wx.hideNavigationBarLoading()
  },

  drawQrcode(canvasId) {
    return new Promise((resolve, reject) => {
      drawQrcode({
        width: 200,
        height: 200,
        canvasId: canvasId,
        text: `https://s.inurl.org/part.html?id=${this.data.id}&s=mpg`,
        callback: () => {
          wx.canvasToTempFilePath({
            canvasId: canvasId,
            success: ({ tempFilePath }) => {
              console.log(tempFilePath)
              this.setData({
                qrcodeUrl: tempFilePath,
              })  
            },
            fail: (res) => {
              console.log(res);
            },
            complete: (res) => {
              console.log(res);
            },
          })
        }
      })
    })
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

  async onSelectRecrdSheet({ detail: { type } }) {
    switch (type) {
      case 3:
        this.setData({
          showRepairRemark: true,
        })
        break
      case 4:
        this.setData({
          showTest: true,
        })
        break
      default:
        break;
    }
  },

  async onSetpTap({ detail }) {
    console.log(this.data.logs[detail])
  },

  async onWarehouseIn() {
    const checked = await this.checkField()
    if (!checked) {
      return;
    }
    if (!await confirm('确认入库?')) {
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

  async onWarehouseOutRemarkClose() {
    this.setData({
      showWarehouseOutRemark: false,
    })
  },

  onWarehouseOutRemarkChange({ detail: { value } }) {
    this.setData({
      warehouseOutRemark: value,
    })
  },

  async onWarehouseOut() {
    this.setData({
      showWarehouseOutRemark: true,
    })
  },

  async onConfirmWarehoseOut() {
    this.setData({
      showWarehouseOutRemark: false,
    })
    if (!await confirm('确认出库?')) {
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
        remark: this.data.warehouseOutRemark,
      }
    })
    wx.hideLoading()
    this.loadData()
    wx.showToast({
      title: '出库成功',
      icon: 'success',
      duration: 1000,
      mask: true
    })
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

  onQrcode() {
    this.setData({
      showQrcode: true,
    })
  },

  onQrcodeClose() {
    this.setData({
      showQrcode: false,
    })
  },

  async onPrintQrcode() {
    this.setData({
      showQrcode: false,
    })
    await showModal("该功能暂未实现")
  },

  onRepairRemarkChange({ detail: { value } }) {
    this.setData({
      repairRemark: value,
    })
  },

  onRepairRemarkClose() {
    this.setData({
      showRepairRemark: false,
    })
  },

  async onRepair() {
    this.onRepairRemarkClose()
    if (!this.data.repairRemark) {
      await alert("记录内容不能为空")
      return
    }
    if (!await confirm('确认添加维修记录?')) {
      return
    }
    await wx.cloud.callFunction({
      name: 'part',
      data: {
        type: 'log',
        id: this.data.id,
        data: {
          title: '维修',
          type: 3,
          remark: this.data.repairRemark,
        },
      }
    })
    this.loadData()
  },

  onTestClose() {
    this.setData({
      showTest: false,
    })
  },

  onTestOkChange({ detail }) {
    this.setData({
      testPassed: detail,
    })
  },

  async onConfirmTest() {
    this.onTestClose()
    if (!await confirm('确认添加测试结果?')) {
      return
    }
    await wx.cloud.callFunction({
      name: 'part',
      data: {
        type: 'log',
        id: this.data.id,
        data: {
          title: '测试',
          type: 4,
          passed: this.data.testPassed,
          no: this.data.testNo,
          time: this.data.testTime,
          mileage: this.data.testMileage,
          temperature: this.data.testTemperature,
          remark: this.data.testRemark,
        },
      }
    })
    this.loadData()
  }

})